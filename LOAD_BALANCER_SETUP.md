# Load Balancer Setup Guide for BigDataClaw NERVE

## Architecture Overview

```
                    ┌─────────────────┐
                    │   CloudFlare    │  ← CDN + DDoS Protection (Optional)
                    │     or          │
                    │  AWS CloudFront │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  LOAD BALANCER  │  ← Choose one below
                    │                 │
                    │  NGINX / HAProxy│
                    │  AWS ALB / Traefik
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼──────┐┌─────▼──────┐┌──────▼──────┐
       │  NERVE      ││   NERVE    ││   NERVE     │  ← Multiple Instances
       │  Server 1   ││  Server 2  ││  Server 3   │     (Port 3001)
       │             ││            ││             │
       └──────┬──────┘└─────┬──────┘└──────┬──────┘
              │             │              │
              └─────────────┼──────────────┘
                            │
                    ┌───────▼────────┐
                    │     REDIS      │  ← Your Existing Redis
                    │   (Session     │     Session Store + Cache
                    │    Store)      │
                    └────────────────┘
                            │
                    ┌───────▼────────┐
                    │   PostgreSQL   │  ← Database (Optional, for persistence)
                    │   or SQLite    │
                    │   (IndexedDB   │
                    │    in browser) │
                    └────────────────┘
```

---

## Recommended Load Balancer Options

### Option 1: NGINX (Recommended for Self-Hosted)

**Pros:**
- Free and open-source
- Excellent for static content + API proxying
- Built-in caching
- SSL termination
- Rate limiting

**Setup:**

```nginx
# /etc/nginx/nginx.conf
upstream nerve_backend {
    least_conn;  # Load balancing method
    server localhost:3001 weight=5;
    server 10.0.1.10:3001 weight=5;  # Additional servers
    server 10.0.1.11:3001 weight=5;
    keepalive 32;
}

server {
    listen 80;
    server_name bigdataclaw.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bigdataclaw.com;
    
    # SSL Certificates
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # Static Files (Cache aggressively)
    location /assets/ {
        root /var/www/bigdataclaw/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API and Frontend
    location / {
        proxy_pass http://nerve_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if using)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health Check Endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**Start NERVE on multiple ports:**
```bash
# Terminal 1
PORT=3001 npm run preview

# Terminal 2
PORT=3002 npm run preview

# Terminal 3
PORT=3003 npm run preview
```

---

### Option 2: HAProxy (Best for High Availability)

**Pros:**
- Extremely fast and reliable
- Advanced health checks
- Session stickiness
- SSL termination
- Statistics page

**Setup:**

```haproxy
# /etc/haproxy/haproxy.cfg
global
    log /dev/log local0
    maxconn 4096
    user haproxy
    group haproxy

defaults
    mode http
    timeout connect 5s
    timeout client 50s
    timeout server 50s
    option httpchk GET /health

frontend http_front
    bind *:80
    bind *:443 ssl crt /etc/haproxy/certs/bigdataclaw.pem
    redirect scheme https if !{ ssl_fc }
    
    # Rate limiting
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny if { sc_http_req_rate(0) gt 100 }
    
    default_backend nerve_servers

backend nerve_servers
    balance roundrobin
    
    # Health checks
    option httpchk GET /health
    http-check expect status 200
    
    # Cookie-based session persistence
    cookie SERVERID insert indirect nocache
    
    server nerve1 localhost:3001 check cookie s1
    server nerve2 localhost:3002 check cookie s2
    server nerve3 localhost:3003 check cookie s3 backup
    
    # Sticky sessions (for WebSocket compatibility)
    stick-table type ip size 200k expire 30m
    stick on src
```

---

### Option 3: AWS Application Load Balancer (Cloud)

**Pros:**
- Managed service (no maintenance)
- Auto-scaling integration
- Health checks
- SSL termination
- WebSocket support

**Terraform Setup:**

```hcl
# main.tf
resource "aws_lb" "nerve" {
  name               = "bigdataclaw-nerve-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
}

resource "aws_lb_target_group" "nerve" {
  name     = "nerve-tg"
  port     = 3001
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.nerve.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.bigdataclaw.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nerve.arn
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "nerve" {
  name                = "nerve-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.nerve.arn]
  health_check_type   = "ELB"
  min_size            = 2
  max_size            = 10
  desired_capacity    = 3

  launch_template {
    id      = aws_launch_template.nerve.id
    version = "$Latest"
  }
}
```

---

### Option 4: Traefik (Modern, Docker-Native)

**Pros:**
- Auto-discovery (Docker/Kubernetes)
- Built-in Let's Encrypt
- WebSocket support
- Dashboard
- Middleware support

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@bigdataclaw.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--ping=true"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # Dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - nerve-network

  nerve-1:
    build: ./nerve
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.nerve.rule=Host(`bigdataclaw.com`)"
      - "traefik.http.routers.nerve.entrypoints=websecure"
      - "traefik.http.routers.nerve.tls.certresolver=letsencrypt"
      - "traefik.http.services.nerve.loadbalancer.server.port=3001"
      - "traefik.http.services.nerve.loadbalancer.healthcheck.path=/health"
    environment:
      - REDIS_URL=redis://redis:6379
    networks:
      - nerve-network

  nerve-2:
    build: ./nerve
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.nerve.rule=Host(`bigdataclaw.com`)"
      - "traefik.http.services.nerve.loadbalancer.server.port=3001"
    environment:
      - REDIS_URL=redis://redis:6379
    networks:
      - nerve-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    networks:
      - nerve-network

networks:
  nerve-network:
    driver: bridge

volumes:
  redis-data:
```

---

## Redis Integration (Session Store)

Since you already have Redis, use it for:

### 1. Session Management
```javascript
// server.js or api_server.py
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const redis = require('redis')

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
})

app.use(session({
  store: new RedisStore({ client }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,  // HTTPS only
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24  // 24 hours
  }
}))
```

### 2. API Response Caching
```python
# Flask with Redis caching
from flask import Flask
from flask_caching import Cache

app = Flask(__name__)
cache = Cache(config={
    'CACHE_TYPE': 'RedisCache',
    'CACHE_REDIS_URL': 'redis://localhost:6379/0'
})
cache.init_app(app)

@app.route('/api/agents')
@cache.cached(timeout=300)  # Cache for 5 minutes
def get_agents():
    return jsonify(agent_list)
```

### 3. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit')
const RedisStore = require('rate-limit-redis')

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:'
  }),
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // 100 requests per window
})

app.use('/api/', limiter)
```

---

## Health Check Endpoint

Add this to your NERVE app:

```javascript
// health.js
app.get('/health', (req, res) => {
  // Check Redis connection
  redis.ping((err) => {
    if (err) {
      return res.status(503).json({ 
        status: 'unhealthy',
        redis: 'disconnected'
      })
    }
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      redis: 'connected'
    })
  })
})
```

---

## Quick Start Commands

### NGINX Setup (Ubuntu/Debian)
```bash
# Install
sudo apt update
sudo apt install nginx

# Configure
sudo cp nginx.conf /etc/nginx/sites-available/bigdataclaw
sudo ln -s /etc/nginx/sites-available/bigdataclaw /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Start multiple NERVE instances
PORT=3001 npm run preview &
PORT=3002 npm run preview &
PORT=3003 npm run preview &
```

### Docker Compose (Recommended)
```bash
# Start everything
docker-compose up -d

# Scale NERVE instances
docker-compose up -d --scale nerve=5

# View logs
docker-compose logs -f traefik
```

---

## Monitoring

### Prometheus + Grafana
```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
```

### Key Metrics to Track:
- Request rate (req/s)
- Response time (p50, p95, p99)
- Error rate (%)
- Active connections
- Redis cache hit rate

---

## Summary

| Load Balancer | Best For | Complexity | Cost |
|--------------|----------|------------|------|
| **NGINX** | Self-hosted, full control | Medium | Free |
| **HAProxy** | High availability, enterprise | Medium | Free |
| **AWS ALB** | AWS cloud, auto-scaling | Low | $ |
| **Traefik** | Docker/K8s, modern stack | Low | Free |

**Recommendation:** 
- **Self-hosted:** NGINX + Redis
- **Cloud:** AWS ALB + ElastiCache (Redis)
- **Docker:** Traefik + Redis container
