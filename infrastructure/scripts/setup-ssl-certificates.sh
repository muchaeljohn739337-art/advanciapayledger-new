#!/bin/bash

# SSL Certificate Setup Script
# This script sets up Let's Encrypt SSL certificates for the gateway

set -euo pipefail

# Configuration
DOMAIN=${1:-""}
EMAIL=${2:-""}
STAGING=${3:-"false"}

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
SSL Certificate Setup Script

Usage: $0 <domain> <email> [staging]

Parameters:
  domain    - Your domain name (e.g., api.yourdomain.com)
  email     - Email for Let's Encrypt notifications
  staging   - Use Let's Encrypt staging (true/false, default: false)

Examples:
  $0 api.advanciapayledger.com admin@advanciapayledger.com
  $0 api.advanciapayledger.com admin@advanciapayledger.com true

This script will:
1. Install Certbot if not already installed
2. Obtain SSL certificates from Let's Encrypt
3. Configure NGINX to use the certificates
4. Set up automatic renewal
EOF
}

# Validate parameters
if [[ -z "$DOMAIN" ]] || [[ -z "$EMAIL" ]]; then
    show_usage
    exit 1
fi

log "INFO" "Setting up SSL certificates for: $DOMAIN"
log "INFO" "Email: $EMAIL"
log "INFO" "Staging mode: $STAGING"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log "ERROR" "This script must be run as root"
   exit 1
fi

# Install Certbot
log "INFO" "Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
    log "SUCCESS" "Certbot installed"
else
    log "INFO" "Certbot already installed"
fi

# Stop NGINX temporarily
log "INFO" "Stopping NGINX..."
systemctl stop nginx

# Obtain certificate
log "INFO" "Obtaining SSL certificate..."

if [[ "$STAGING" == "true" ]]; then
    STAGING_FLAG="--staging"
    log "WARN" "Using Let's Encrypt staging environment"
else
    STAGING_FLAG=""
fi

certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --domains "$DOMAIN" \
    $STAGING_FLAG

if [[ $? -eq 0 ]]; then
    log "SUCCESS" "SSL certificate obtained successfully"
else
    log "ERROR" "Failed to obtain SSL certificate"
    systemctl start nginx
    exit 1
fi

# Certificate paths
CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
KEY_PATH="/etc/letsencrypt/live/$DOMAIN/privkey.pem"

log "INFO" "Certificate: $CERT_PATH"
log "INFO" "Private Key: $KEY_PATH"

# Update NGINX configuration
log "INFO" "Updating NGINX configuration..."

NGINX_CONF="/etc/nginx/conf.d/gateway.conf"

# Backup existing configuration
if [[ -f "$NGINX_CONF" ]]; then
    cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d-%H%M%S)"
    log "INFO" "Backed up existing NGINX configuration"
fi

# Update SSL certificate paths in NGINX config
sed -i "s|ssl_certificate .*|ssl_certificate $CERT_PATH;|g" "$NGINX_CONF"
sed -i "s|ssl_certificate_key .*|ssl_certificate_key $KEY_PATH;|g" "$NGINX_CONF"

# Test NGINX configuration
log "INFO" "Testing NGINX configuration..."
if nginx -t; then
    log "SUCCESS" "NGINX configuration is valid"
else
    log "ERROR" "NGINX configuration test failed"
    # Restore backup
    if [[ -f "${NGINX_CONF}.backup."* ]]; then
        cp "${NGINX_CONF}.backup."* "$NGINX_CONF"
        log "INFO" "Restored backup configuration"
    fi
    exit 1
fi

# Start NGINX
log "INFO" "Starting NGINX..."
systemctl start nginx
systemctl enable nginx

if systemctl is-active --quiet nginx; then
    log "SUCCESS" "NGINX started successfully"
else
    log "ERROR" "Failed to start NGINX"
    exit 1
fi

# Set up automatic renewal
log "INFO" "Setting up automatic certificate renewal..."

# Create renewal hook script
cat > /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh << 'EOF'
#!/bin/bash
# Reload NGINX after certificate renewal
systemctl reload nginx
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh

# Test renewal process
log "INFO" "Testing certificate renewal..."
certbot renew --dry-run

if [[ $? -eq 0 ]]; then
    log "SUCCESS" "Certificate renewal test passed"
else
    log "WARN" "Certificate renewal test failed - check configuration"
fi

# Add cron job for renewal (Certbot usually adds this automatically)
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
    log "INFO" "Added cron job for certificate renewal"
fi

# Verify SSL configuration
log "INFO" "Verifying SSL configuration..."
sleep 5

if curl -sSf "https://$DOMAIN" > /dev/null 2>&1; then
    log "SUCCESS" "SSL is working correctly"
else
    log "WARN" "Could not verify SSL - check DNS and firewall settings"
fi

# Display certificate information
log "INFO" "Certificate information:"
certbot certificates

# Summary
log "SUCCESS" "SSL certificate setup complete!"
echo ""
echo -e "${GREEN}=== SSL Certificate Setup Summary ===${NC}"
echo -e "${BLUE}Domain:${NC} $DOMAIN"
echo -e "${BLUE}Certificate:${NC} $CERT_PATH"
echo -e "${BLUE}Private Key:${NC} $KEY_PATH"
echo -e "${BLUE}Expiration:${NC} $(openssl x509 -enddate -noout -in $CERT_PATH | cut -d= -f2)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Verify HTTPS is working: https://$DOMAIN"
echo "2. Test certificate renewal: certbot renew --dry-run"
echo "3. Monitor certificate expiration"
echo "4. Certificates will auto-renew via cron"
echo ""
echo -e "${GREEN}Certificate will automatically renew before expiration${NC}"
