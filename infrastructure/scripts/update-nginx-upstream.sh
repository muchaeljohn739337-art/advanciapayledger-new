#!/bin/bash

# NGINX Upstream Configuration Update Script
# Updates NGINX gateway configuration with backend and frontend upstream servers

set -euo pipefail

# Configuration
BACKEND_URL=${1:-""}
FRONTEND_URL=${2:-""}
DOMAIN=${3:-""}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}"
}

# Show usage
show_usage() {
    cat << EOF
NGINX Upstream Configuration Script

Usage: $0 <backend_url> <frontend_url> <domain>

Parameters:
  backend_url   - Backend service URL (e.g., backend-app.azurewebsites.net)
  frontend_url  - Frontend service URL (e.g., frontend-app.azurewebsites.net)
  domain        - Production domain (e.g., advanciapayledger.com)

Example:
  $0 backend-prod.azurewebsites.net frontend-prod.azurewebsites.net advanciapayledger.com

This script will:
1. Backup existing NGINX configuration
2. Update upstream server definitions
3. Configure SSL/TLS settings
4. Set up rate limiting and security headers
5. Test and reload NGINX
EOF
}

# Validate parameters
if [[ -z "$BACKEND_URL" ]] || [[ -z "$FRONTEND_URL" ]] || [[ -z "$DOMAIN" ]]; then
    show_usage
    exit 1
fi

log "INFO" "Updating NGINX configuration for production deployment"
log "INFO" "Backend: $BACKEND_URL"
log "INFO" "Frontend: $FRONTEND_URL"
log "INFO" "Domain: $DOMAIN"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log "ERROR" "This script must be run as root"
   exit 1
fi

# Backup existing configuration
NGINX_CONF="/etc/nginx/conf.d/gateway.conf"
BACKUP_DIR="/etc/nginx/backups"
mkdir -p "$BACKUP_DIR"

if [[ -f "$NGINX_CONF" ]]; then
    BACKUP_FILE="$BACKUP_DIR/gateway.conf.backup.$(date +%Y%m%d-%H%M%S)"
    cp "$NGINX_CONF" "$BACKUP_FILE"
    log "INFO" "Backed up existing configuration to $BACKUP_FILE"
fi

# Create new NGINX configuration
log "INFO" "Creating new NGINX configuration..."

cat > "$NGINX_CONF" << EOF
# Advancia Pay Ledger - Production Gateway Configuration
# Generated: $(date '+%Y-%m-%d %H:%M:%S')

# Rate limiting zones
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone \$binary_remote_addr zone=login_limit:10m rate=5r/m;
limit_conn_zone \$binary_remote_addr zone=conn_limit:10m;

# Upstream backend servers
upstream backend_servers {
    least_conn;
    server $BACKEND_URL:443 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# Upstream frontend servers
upstream frontend_servers {
    least_conn;
    server $FRONTEND_URL:443 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN api.$DOMAIN app.$DOMAIN;
    
    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# Main domain - Frontend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https: wss:;" always;
    
    # Rate limiting
    limit_req zone=api_limit burst=20 nodelay;
    limit_conn conn_limit 10;
    
    # Logging
    access_log /var/log/nginx/frontend_access.log combined;
    error_log /var/log/nginx/frontend_error.log warn;
    
    # Proxy settings
    location / {
        proxy_pass https://frontend_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# API subdomain - Backend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Rate limiting
    limit_req zone=api_limit burst=50 nodelay;
    limit_conn conn_limit 20;
    
    # Logging
    access_log /var/log/nginx/api_access.log combined;
    error_log /var/log/nginx/api_error.log warn;
    
    # API endpoints
    location /api/ {
        proxy_pass https://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://$DOMAIN' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # Stricter rate limiting for authentication endpoints
    location /api/v1/auth/ {
        limit_req zone=login_limit burst=3 nodelay;
        
        proxy_pass https://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# App subdomain - Frontend (alternative)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Proxy to frontend
    location / {
        proxy_pass https://frontend_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

log "SUCCESS" "NGINX configuration created"

# Test NGINX configuration
log "INFO" "Testing NGINX configuration..."
if nginx -t; then
    log "SUCCESS" "NGINX configuration is valid"
else
    log "ERROR" "NGINX configuration test failed"
    log "INFO" "Restoring backup configuration..."
    if [[ -f "$BACKUP_FILE" ]]; then
        cp "$BACKUP_FILE" "$NGINX_CONF"
        log "INFO" "Backup restored"
    fi
    exit 1
fi

# Reload NGINX
log "INFO" "Reloading NGINX..."
if systemctl reload nginx; then
    log "SUCCESS" "NGINX reloaded successfully"
else
    log "ERROR" "Failed to reload NGINX"
    exit 1
fi

# Verify NGINX is running
if systemctl is-active --quiet nginx; then
    log "SUCCESS" "NGINX is running"
else
    log "ERROR" "NGINX is not running"
    exit 1
fi

# Test endpoints
log "INFO" "Testing endpoints..."
sleep 3

# Test frontend
if curl -sSf "https://$DOMAIN" > /dev/null 2>&1; then
    log "SUCCESS" "Frontend is accessible"
else
    log "WARN" "Frontend test failed - check DNS and SSL"
fi

# Test API
if curl -sSf "https://api.$DOMAIN/api/health" > /dev/null 2>&1; then
    log "SUCCESS" "API is accessible"
else
    log "WARN" "API test failed - check DNS and SSL"
fi

# Summary
log "SUCCESS" "NGINX upstream configuration complete!"
echo ""
echo -e "${GREEN}=== Configuration Summary ===${NC}"
echo -e "${BLUE}Domain:${NC} $DOMAIN"
echo -e "${BLUE}Backend:${NC} $BACKEND_URL -> https://api.$DOMAIN"
echo -e "${BLUE}Frontend:${NC} $FRONTEND_URL -> https://$DOMAIN"
echo ""
echo -e "${YELLOW}Endpoints:${NC}"
echo "  https://$DOMAIN (Frontend)"
echo "  https://www.$DOMAIN (Frontend)"
echo "  https://api.$DOMAIN (Backend API)"
echo "  https://app.$DOMAIN (Frontend Alt)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test all endpoints: curl -I https://$DOMAIN"
echo "2. Monitor logs: tail -f /var/log/nginx/access.log"
echo "3. Check SSL: openssl s_client -connect $DOMAIN:443"
echo "4. Run integration tests"
echo ""
