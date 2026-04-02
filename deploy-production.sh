#!/bin/bash

# BigDataClaw NERVE - Production Deployment Script
# Usage: ./deploy-production.sh [domain] [email]

set -e

DOMAIN=${1:-bigdataclaw.com}
EMAIL=${2:-admin@bigdataclaw.com}

echo "🚀 BigDataClaw NERVE Production Deployment"
echo "=========================================="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Installing..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Docker and Docker Compose are installed"

# Create directories
echo "📁 Creating directories..."
mkdir -p letsencrypt
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p redis
mkdir -p logs

# Set environment variables
export DOMAIN=$DOMAIN
export ACME_EMAIL=$EMAIL

# Create Prometheus config
echo "📊 Creating monitoring configuration..."
cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'traefik'
    static_configs:
      - targets: ['traefik:8080']

  - job_name: 'nerve'
    static_configs:
      - targets: ['nerve-1:3001', 'nerve-2:3001', 'nerve-3:3001']
    metrics_path: '/metrics'

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF

# Create Grafana datasource
cat > monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

# Create Redis config
echo "🔧 Creating Redis configuration..."
cat > redis/redis.conf << EOF
# Redis Configuration
maxmemory 512mb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
save 900 1
save 300 10
save 60 10000
tcp-backlog 65535
EOF

# Create health check endpoint
echo "🏥 Creating health check endpoint..."
mkdir -p nerve/public
cat > nerve/public/health.json << EOF
{"status":"healthy","timestamp":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
EOF

# Build and start
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🏥 Checking service health..."

# Check Traefik
if curl -s http://localhost:8080/ping > /dev/null; then
    echo "✅ Traefik is healthy"
else
    echo "⚠️ Traefik may still be starting..."
fi

# Check NERVE instances
for i in 1 2 3; do
    if docker-compose ps | grep -q "nerve-$i.*Up"; then
        echo "✅ NERVE instance $i is running"
    else
        echo "⚠️ NERVE instance $i may still be starting..."
    fi
done

# Check Redis
if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is responding"
else
    echo "⚠️ Redis may still be starting..."
fi

echo ""
echo "=========================================="
echo "🎉 Deployment Complete!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - NERVE Frontend: https://$DOMAIN"
echo "  - Traefik Dashboard: http://localhost:8080"
echo "  - Redis Commander: http://localhost:8081 (debug profile)"
echo "  - Prometheus: http://localhost:9090 (monitoring profile)"
echo "  - Grafana: http://localhost:3000 (monitoring profile)"
echo ""
echo "Commands:"
echo "  View logs:         docker-compose logs -f"
echo "  Scale NERVE:       docker-compose up -d --scale nerve=5"
echo "  Stop services:     docker-compose down"
echo "  Full stop:         docker-compose down -v (removes volumes)"
echo ""
echo "Logs:"
echo "  Traefik:  docker-compose logs -f traefik"
echo "  NERVE:    docker-compose logs -f nerve-1"
echo "  Redis:    docker-compose logs -f redis"
echo ""

# Show current status
echo "Current status:"
docker-compose ps
