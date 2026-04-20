# BigDataClaw NERVE - Production Dockerfile

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install Node.js for serving the app (nginx + node hybrid)
RUN apk add --no-cache nodejs npm

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create health check endpoint
RUN echo '{"status":"healthy","service":"nerve"}' > /usr/share/nginx/html/health

# Create startup script
RUN cat > /start.sh << 'EOF'
#!/bin/sh
# Start nginx in background
nginx &

# Health check loop
while true; do
    sleep 30
    # Update health check timestamp
    echo "{\"status\":\"healthy\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > /usr/share/nginx/html/health
done
EOF

RUN chmod +x /start.sh

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start
CMD ["/start.sh"]
