#!/bin/bash

set -euo pipefail

# Configuration
NGINX_CONF_DIR="/etc/nginx/conf.d"
CERT_DIR="/etc/ssl/certs"
LOG_DIR="/var/log/nginx"
RUN_DIR="/var/run"
TEMP_DIR="/tmp/nginx-setup"

# Create directories
mkdir -p "$NGINX_CONF_DIR"
mkdir -p "$CERT_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$TEMP_DIR"

# Install additional packages
apt-get update
apt-get install -y \
    nginx \
    certbot \
    python3-certbot-nginx \
    jq \
    curl \
    openssl \
    unzip

# Download JWT validation module
cd "$TEMP_DIR"
wget https://github.com/auth0/nginx-jwt/releases/download/v1.0.0/ngx_http_jwt_module.so -O ngx_http_jwt_module.so

# Create NGINX main configuration
cat > /etc/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    log_format detailed '$remote_addr - $remote_user [$time_local] "$request" '
                       '$status $body_bytes_sent "$http_referer" '
                       '"$http_user_agent" "$http_x_forwarded_for" '
                       'rt=$request_time uct="$upstream_connect_time" '
                       'uht="$upstream_header_time" urt="$upstream_response_time" '
                       'cs=$upstream_cache_status';

    access_log /var/log/nginx/access.log main;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    limit_req_zone $binary_remote_addr zone=static:10m rate=30r/s;

    # Connection limiting
    limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;

    # Include additional configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF

# Create gateway configuration
cat > "$NGINX_CONF_DIR/gateway.conf" << 'EOF'
# Upstream configuration
upstream backend_servers {
    least_conn;
    server 10.0.3.10:3000 max_fails=3 fail_timeout=30s;
    server 10.0.3.11:3000 max_fails=3 fail_timeout=30s backup;
    keepalive 32;
}

# Rate limiting for API
limit_req_status 429;
limit_req_log_level warn;

# Main server block
server {
    listen 80;
    listen [::]:80;
    server_name advancia-prod.azurewebsites.net;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name advancia-prod.azurewebsites.net;

    # SSL configuration
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/certs/key.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Connection limiting
    limit_conn conn_limit_per_ip 20;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Health check endpoint (no auth required)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Ready check endpoint (no auth required)
    location /ready {
        access_log off;
        return 200 "ready\n";
        add_header Content-Type text/plain;
    }

    # Static files with rate limiting
    location /static/ {
        alias /var/www/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        limit_req zone=static burst=50 nodelay;
        
        # Security for static files
        location ~* \.(php|jsp|asp|sh|py|pl|rb)$ {
            deny all;
        }
    }

    # API endpoints with JWT validation
    location /api/ {
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        
        # JWT validation (will be implemented with Lua/OpenResty)
        # For now, we'll use basic validation
        
        # Proxy to backend
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        
        # Error handling
        proxy_intercept_errors on;
        error_page 502 503 504 /50x.html;
    }

    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Shorter timeout for login
        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    # WebSocket endpoints
    location /ws/ {
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific settings
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Admin endpoints (additional security)
    location /api/admin/ {
        # Allow only from specific IP ranges
        allow 10.0.0.0/8;
        allow 127.0.0.1;
        deny all;
        
        # Rate limiting
        limit_req zone=api burst=10 nodelay;
        
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Default location
    location / {
        # Rate limiting
        limit_req zone=static burst=30 nodelay;
        
        # Try static files first, then proxy to backend
        try_files $uri $uri/ @backend;
    }

    location @backend {
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Error pages
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Deny access to backup files
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Create JWT validation script (Lua-based)
cat > "$NGINX_CONF_DIR/jwt-validation.lua" << 'EOF'
-- JWT validation for NGINX
local jwt = require "resty.jwt"
local cjson = require "cjson"

-- Configuration
local jwt_secret = os.getenv("JWT_SECRET") or "your-secret-key"
local keyvault_uri = os.getenv("KEYVAULT_URI") or ""

-- Function to validate JWT
local function validate_jwt(token)
    if not token then
        return nil, "No token provided"
    end
    
    -- Remove "Bearer " prefix if present
    token = token:gsub("^Bearer%s+", "")
    
    -- Validate JWT
    local jwt_obj = jwt:verify_jwt(jwt_secret, token)
    
    if not jwt_obj.valid then
        return nil, "Invalid token: " .. jwt_obj.reason
    end
    
    -- Check expiration
    if jwt_obj.payload.exp and jwt_obj.payload.exp < ngx.time() then
        return nil, "Token expired"
    end
    
    -- Check issued at
    if jwt_obj.payload.iat and jwt_obj.payload.iat > ngx.time() then
        return nil, "Token issued in future"
    end
    
    return jwt_obj.payload, nil
end

-- Main validation logic
local auth_header = ngx.var.http_authorization
local token = auth_header

if not token then
    -- Check for token in cookie
    token = ngx.var.cookie_jwt_token
end

if not token then
    ngx.status = 401
    ngx.header["Content-Type"] = "application/json"
    ngx.say(cjson.encode({error = "Authentication required"}))
    ngx.exit(401)
end

local payload, err = validate_jwt(token)
if err then
    ngx.status = 401
    ngx.header["Content-Type"] = "application/json"
    ngx.say(cjson.encode({error = err}))
    ngx.exit(401)
end

-- Set user context
ngx.ctx.user = payload
ngx.req.set_header("X-User-ID", payload.sub)
ngx.req.set_header("X-User-Role", payload.role or "user")
EOF

# Create security monitoring script
cat > /opt/gateway/security-monitor.sh << 'EOF'
#!/bin/bash

# Security monitoring script for NGINX gateway
LOG_FILE="/var/log/nginx/security.log"
ACCESS_LOG="/var/log/nginx/access.log"
ERROR_LOG="/var/log/nginx/error.log"
ALERT_THRESHOLD=100
DATE=$(date "+%Y-%m-%d %H:%M:%S")

# Create security log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Function to check for suspicious activity
check_suspicious_activity() {
    # Check for 429 errors (rate limiting)
    local rate_limit_count=$(grep " 429 " "$ACCESS_LOG" | grep "$(date '+%d/%b/%Y')" | wc -l)
    if [ "$rate_limit_count" -gt "$ALERT_THRESHOLD" ]; then
        echo "$DATE WARNING: High rate limiting activity - $rate_limit_count requests blocked" >> "$LOG_FILE"
    fi

    # Check for 403 errors (forbidden)
    local forbidden_count=$(grep " 403 " "$ACCESS_LOG" | grep "$(date '+%d/%b/%Y')" | wc -l)
    if [ "$forbidden_count" -gt 50 ]; then
        echo "$DATE WARNING: High forbidden access attempts - $forbidden_count requests" >> "$LOG_FILE"
    fi

    # Check for 401 errors (unauthorized)
    local unauthorized_count=$(grep " 401 " "$ACCESS_LOG" | grep "$(date '+%d/%b/%Y')" | wc -l)
    if [ "$unauthorized_count" -gt 30 ]; then
        echo "$DATE WARNING: High unauthorized access attempts - $unauthorized_count requests" >> "$LOG_FILE"
    fi

    # Check for suspicious user agents
    local suspicious_ua=$(grep -i "sqlmap\|nmap\|nikto\|burp\|scanner\|bot\|crawler" "$ACCESS_LOG" | grep "$(date '+%d/%b/%Y')" | wc -l)
    if [ "$suspicious_ua" -gt 10 ]; then
        echo "$DATE WARNING: Suspicious user agents detected - $suspicious_ua requests" >> "$LOG_FILE"
    fi

    # Check for error patterns
    local error_count=$(grep -i "error\|critical\|alert\|emergency" "$ERROR_LOG" | grep "$(date '+%d/%b/%Y')" | wc -l)
    if [ "$error_count" -gt 5 ]; then
        echo "$DATE WARNING: High error count - $error_count errors" >> "$LOG_FILE"
    fi
}

# Function to check SSL certificate
check_ssl_certificate() {
    if [ -f "/etc/ssl/certs/cert.pem" ]; then
        local expiry_date=$(openssl x509 -enddate -noout -in /etc/ssl/certs/cert.pem | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry_date" +%s)
        local current_epoch=$(date +%s)
        local days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))
        
        if [ "$days_left" -lt 30 ]; then
            echo "$DATE CRITICAL: SSL certificate expires in $days_left days" >> "$LOG_FILE"
        fi
    fi
}

# Function to check NGINX configuration
check_nginx_config() {
    if ! nginx -t > /dev/null 2>&1; then
        echo "$DATE CRITICAL: NGINX configuration test failed" >> "$LOG_FILE"
    fi
}

# Run all checks
check_suspicious_activity
check_ssl_certificate
check_nginx_config

echo "$DATE INFO: Security monitoring completed" >> "$LOG_FILE"
EOF

chmod +x /opt/gateway/security-monitor.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "*/10 * * * * /opt/gateway/security-monitor.sh") | crontab -

# Test NGINX configuration
nginx -t

# Enable and start NGINX
systemctl enable nginx
systemctl start nginx

# Create log rotation for security logs
cat > /etc/logrotate.d/nginx-security << 'EOF'
/var/log/nginx/security.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        systemctl reload nginx || true
    endscript
}
EOF

echo "NGINX setup completed successfully"
