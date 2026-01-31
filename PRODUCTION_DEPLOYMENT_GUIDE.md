# Advancia PayLedger - Production Deployment Guide

**Version:** 2.0  
**Last Updated:** January 30, 2026  
**Server:** 157.245.8.131 (DigitalOcean)

---

## 🎯 What You're Deploying

A complete, production-ready healthcare payment platform with:
- ✅ Full authentication system (JWT, 2FA, session management)
- ✅ Payment processing (Crypto, ACH, Debit Cards, HSA/FSA)
- ✅ Real-time notifications (WebSocket)
- ✅ Blockchain integration (Ethereum, Polygon, Solana, Base)
- ✅ AI-powered financial insights (Google Gemini)
- ✅ Automated reconciliation agent
- ✅ Audit logging and security features
- ✅ Receipt generation and management
- ✅ HIPAA-compliant architecture

---

## 📋 Pre-Deployment Checklist

### Infrastructure Ready
- [ ] DigitalOcean Droplet: 157.245.8.131
- [ ] Node.js 20+ installed
- [ ] PM2 installed globally
- [ ] PostgreSQL 15+ configured
- [ ] Redis installed and running
- [ ] Nginx configured (if using)
- [ ] SSL certificates ready
- [ ] Domain DNS configured

### Credentials Ready
- [ ] Database connection string
- [ ] JWT secrets generated (2 different secrets)
- [ ] Stripe API keys (live mode)
- [ ] Payment processor credentials (NOWPayments, Dwolla)
- [ ] Google Gemini API key
- [ ] Email service credentials (SendGrid/Mailgun)
- [ ] Blockchain RPC URLs (Infura, Alchemy, or Cloudflare)
- [ ] Supabase credentials (if using)

### Code Ready
- [ ] All TypeScript errors fixed
- [ ] Tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Git repository up to date

---

## 🚀 Deployment Steps

### STEP 1: Prepare Backend (10 minutes)

#### 1.1 Update Dependencies

```bash
cd backend

# Install all dependencies
npm install

# Verify no vulnerabilities
npm audit fix
```

#### 1.2 Build Backend

```bash
# Build TypeScript
npm run build

# Verify build succeeded
ls -la dist/
```

#### 1.3 Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify schema
npx prisma db push --accept-data-loss
```

---

### STEP 2: Configure Environment Variables (15 minutes)

Create `.env` file on server with **production values**:

```bash
# SSH to server
ssh root@157.245.8.131

# Create environment file
nano /var/www/advancia-payledger/.env
```

**Complete Environment Configuration:**

```bash
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://app.advanciapayledger.com

# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://user:password@localhost:5432/advancia_payledger?schema=public"
REDIS_URL="redis://localhost:6379"

# ============================================
# AUTHENTICATION & SECURITY
# ============================================
JWT_SECRET="your-super-secure-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-min-32-chars"
SESSION_SECRET="your-super-secure-session-secret-min-32-chars"
ENCRYPTION_KEY="64-character-hex-encryption-key-here"

# ============================================
# PAYMENT PROCESSORS
# ============================================
# Stripe
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# NOWPayments (Crypto)
NOWPAYMENTS_API_KEY="your_nowpayments_api_key"
NOWPAYMENTS_IPN_SECRET="your_ipn_secret"

# Dwolla (ACH)
DWOLLA_KEY="your_dwolla_key"
DWOLLA_SECRET="your_dwolla_secret"
DWOLLA_ENVIRONMENT="production"

# ============================================
# BLOCKCHAIN RPC ENDPOINTS
# ============================================
# Ethereum
ETH_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY"
ETH_WEBSOCKET_URL="wss://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY"

# Polygon
POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/YOUR-API-KEY"

# Solana
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

# Base
BASE_RPC_URL="https://mainnet.base.org"

# Cloudflare (Fallback)
CLOUDFLARE_ETH_GATEWAY="https://cloudflare-eth.com"

# ============================================
# AI & ANALYTICS
# ============================================
GOOGLE_GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-pro"

# ============================================
# EMAIL SERVICE
# ============================================
# SendGrid
SENDGRID_API_KEY="SG.your_sendgrid_api_key"
SENDGRID_FROM_EMAIL="noreply@advanciapayledger.com"
SENDGRID_FROM_NAME="Advancia PayLedger"

# Or Mailgun
MAILGUN_API_KEY="your_mailgun_api_key"
MAILGUN_DOMAIN="mg.advanciapayledger.com"

# ============================================
# STORAGE (Optional)
# ============================================
# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
SUPABASE_ANON_KEY="your_anon_key"

# DigitalOcean Spaces
DO_SPACES_ENDPOINT="https://nyc3.digitaloceanspaces.com"
DO_SPACES_KEY="your_spaces_key"
DO_SPACES_SECRET="your_spaces_secret"
DO_SPACES_BUCKET="advancia-payledger"

# ============================================
# MONITORING & LOGGING
# ============================================
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
LOG_LEVEL="info"

# ============================================
# SECURITY
# ============================================
CORS_ORIGIN="https://app.advanciapayledger.com,https://www.advanciapayledger.com"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# FEATURES FLAGS
# ============================================
ENABLE_2FA=true
ENABLE_WEBSOCKETS=true
ENABLE_RECONCILIATION_AGENT=true
ENABLE_AI_INSIGHTS=true
```

**Generate Secure Secrets:**

```bash
# Generate JWT secrets (run on your local machine)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### STEP 3: Deploy Backend to Server (20 minutes)

#### 3.1 Upload Code to Server

```bash
# From your local machine
cd backend

# Create deployment package
npm run build
tar -czf backend-deploy.tar.gz dist/ package.json package-lock.json prisma/

# Upload to server
scp backend-deploy.tar.gz root@157.245.8.131:/tmp/

# SSH to server
ssh root@157.245.8.131

# Extract and deploy
cd /var/www/advancia-payledger
tar -xzf /tmp/backend-deploy.tar.gz
npm install --production
```

#### 3.2 Start Backend with PM2

```bash
# First time deployment
pm2 start dist/index.js --name advancia-backend \
  --max-memory-restart 500M \
  --log /var/log/advancia/backend.log \
  --error /var/log/advancia/backend-error.log

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 3.3 Verify Backend is Running

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs advancia-backend --lines 50

# Test health endpoint
curl http://localhost:3001/health

# Test API
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-30T19:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "websocket": "active"
  }
}
```

---

### STEP 4: Deploy Frontend to Vercel (10 minutes)

#### 4.1 Configure Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
NEXT_PUBLIC_WS_URL=wss://api.advanciapayledger.com

# App Configuration
NEXT_PUBLIC_APP_NAME=Advancia PayLedger
NEXT_PUBLIC_APP_URL=https://app.advanciapayledger.com

# Payment Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key

# Feature Flags
NEXT_PUBLIC_ENABLE_CRYPTO_PAYMENTS=true
NEXT_PUBLIC_ENABLE_ACH_PAYMENTS=true
NEXT_PUBLIC_ENABLE_2FA=true

# Analytics (Optional)
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

#### 4.2 Deploy to Vercel

```bash
cd frontend

# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Or push to GitHub (auto-deploy)
git add .
git commit -m "Production deployment"
git push origin main
```

#### 4.3 Configure Custom Domain

In Vercel Dashboard:
1. Go to Settings → Domains
2. Add domain: `app.advanciapayledger.com`
3. Configure DNS records as instructed
4. Wait for SSL certificate (automatic)

---

### STEP 5: Configure Nginx Reverse Proxy (15 minutes)

#### 5.1 Create Nginx Configuration

```bash
ssh root@157.245.8.131

# Create Nginx config
nano /etc/nginx/sites-available/advancia-payledger
```

**Nginx Configuration:**

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name api.advanciapayledger.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name api.advanciapayledger.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.advanciapayledger.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.advanciapayledger.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Logging
    access_log /var/log/nginx/advancia-access.log;
    error_log /var/log/nginx/advancia-error.log;
}
```

#### 5.2 Enable and Test Nginx

```bash
# Enable site
ln -s /etc/nginx/sites-available/advancia-payledger /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Check status
systemctl status nginx
```

#### 5.3 Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d api.advanciapayledger.com

# Auto-renewal is configured automatically
# Test renewal
certbot renew --dry-run
```

---

### STEP 6: Configure Firewall (5 minutes)

```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow backend port (only from localhost)
# Backend should only be accessed through Nginx

# Enable firewall
ufw enable

# Check status
ufw status
```

---

### STEP 7: Setup Monitoring & Logging (10 minutes)

#### 7.1 Configure Log Rotation

```bash
# Create logrotate config
nano /etc/logrotate.d/advancia-payledger
```

```
/var/log/advancia/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### 7.2 Setup Health Check Monitoring

```bash
# Create health check script
nano /usr/local/bin/advancia-health-check.sh
```

```bash
#!/bin/bash

HEALTH_URL="http://localhost:3001/health"
SLACK_WEBHOOK="your-slack-webhook-url"

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response != "200" ]; then
    echo "Health check failed with status: $response"
    # Send alert to Slack
    curl -X POST $SLACK_WEBHOOK \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"🚨 Advancia Backend Health Check Failed: $response\"}"
fi
```

```bash
# Make executable
chmod +x /usr/local/bin/advancia-health-check.sh

# Add to crontab (check every 5 minutes)
crontab -e
```

Add line:
```
*/5 * * * * /usr/local/bin/advancia-health-check.sh
```

---

## 🧪 Post-Deployment Testing

### Test 1: Backend Health Check
```bash
curl https://api.advanciapayledger.com/health
```

### Test 2: Frontend Loading
```bash
curl https://app.advanciapayledger.com
```

### Test 3: User Registration
```bash
curl -X POST https://api.advanciapayledger.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Test 4: WebSocket Connection
Open browser console on frontend:
```javascript
const ws = new WebSocket('wss://api.advanciapayledger.com');
ws.onopen = () => console.log('WebSocket connected');
ws.onmessage = (msg) => console.log('Message:', msg.data);
```

### Test 5: Payment Processing
Test each payment method through the UI:
- [ ] Credit/Debit card payment
- [ ] ACH transfer
- [ ] Cryptocurrency payment (BTC, ETH, USDC)
- [ ] HSA/FSA card

---

## 🔄 Update & Rollback Procedures

### Deploy Update

```bash
# On local machine
cd backend
npm run build
git add .
git commit -m "Update: [description]"
git push

# On server
ssh root@157.245.8.131
cd /var/www/advancia-payledger
git pull
npm install
npm run build
pm2 restart advancia-backend
pm2 logs advancia-backend --lines 50
```

### Rollback to Previous Version

```bash
# On server
ssh root@157.245.8.131
cd /var/www/advancia-payledger

# View commit history
git log --oneline -10

# Rollback to specific commit
git checkout [commit-hash]
npm install
npm run build
pm2 restart advancia-backend
```

---

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check PM2 logs
pm2 logs advancia-backend --lines 100

# Check for port conflicts
lsof -i :3001

# Verify environment variables
pm2 env 0

# Check database connection
psql -U user -d advancia_payledger -c "SELECT 1;"
```

### Database Connection Errors

```bash
# Test PostgreSQL
systemctl status postgresql
psql -U user -d advancia_payledger

# Check connection string
cat /var/www/advancia-payledger/.env | grep DATABASE_URL

# Run migrations
cd /var/www/advancia-payledger
npx prisma migrate deploy
```

### WebSocket Not Connecting

```bash
# Check Nginx WebSocket config
nginx -t
tail -f /var/log/nginx/advancia-error.log

# Verify backend WebSocket server
pm2 logs advancia-backend | grep -i websocket
```

### High Memory Usage

```bash
# Check memory
free -h
pm2 monit

# Restart with memory limit
pm2 restart advancia-backend --max-memory-restart 500M
```

---

## 📊 Performance Optimization

### Enable Caching

```bash
# Install Redis (if not already)
apt install redis-server
systemctl enable redis-server
systemctl start redis-server

# Verify Redis
redis-cli ping
```

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_transactions_hash ON crypto_payments(transaction_hash);

-- Analyze tables
ANALYZE payments;
ANALYZE crypto_payments;
ANALYZE users;
```

### Enable Compression

Already configured in Nginx with `gzip on;`

---

## 🔒 Security Hardening

### Disable Root Login

```bash
nano /etc/ssh/sshd_config
```

Set: `PermitRootLogin no`

```bash
systemctl restart sshd
```

### Setup Fail2Ban

```bash
apt install fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### Regular Security Updates

```bash
# Setup unattended upgrades
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## 📞 Support & Resources

**Documentation:**
- [Main Documentation Index](DOCUMENTATION_INDEX.md)
- [Incident Response Playbook](INCIDENT_RESPONSE_PLAYBOOK.md)
- [Disaster Recovery Plan](DISASTER_RECOVERY_PLAN.md)

**Monitoring:**
- PM2: `pm2 monit`
- Logs: `/var/log/advancia/`
- Nginx: `/var/log/nginx/`

**Emergency Contacts:**
- DevOps: devops@advanciapayledger.com
- On-Call: [PagerDuty]
- Emergency Hotline: [Phone]

---

**Deployment Completed:** ✅  
**Server:** 157.245.8.131  
**Backend:** https://api.advanciapayledger.com  
**Frontend:** https://app.advanciapayledger.com  
**Status:** Production Ready 🚀
