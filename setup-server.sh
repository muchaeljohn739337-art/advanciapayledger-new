#!/bin/bash
# Advancia PayLedger - Server Setup Script
# Run this on your DigitalOcean server (147.182.193.11)

set -e

echo "🚀 Setting up Advancia PayLedger Backend Server..."
echo "=================================================="

# Update system
echo ""
echo "📦 Step 1: Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Node.js 18.x
echo ""
echo "📦 Step 2: Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 globally
echo ""
echo "📦 Step 3: Installing PM2..."
npm install -g pm2

# Install Redis (for caching and sessions)
echo ""
echo "📦 Step 4: Installing Redis..."
apt-get install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Install Nginx (optional, for reverse proxy)
echo ""
echo "📦 Step 5: Installing Nginx..."
apt-get install -y nginx

# Create application directory
echo ""
echo "📦 Step 6: Creating application directory..."
mkdir -p /var/www/advancia-payledger/backend
cd /var/www/advancia-payledger/backend

# Create .env file
echo ""
echo "📦 Step 7: Creating environment configuration..."
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres.jwabwrcykdtpwdhwhmqq:F3vR2UQT49NK8ifI@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET="advancia-super-secret-jwt-key-change-in-production-2026"
JWT_REFRESH_SECRET="advancia-super-secret-refresh-key-change-in-production-2026"

# Redis
REDIS_URL="redis://localhost:6379"

# Frontend URL (Update with your Vercel URL)
FRONTEND_URL="https://your-vercel-app.vercel.app"

# Environment
NODE_ENV="production"
PORT=3001

# Blockchain RPC URLs (Optional - for wallet features)
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
SOLANA_RPC_FALLBACK="https://solana-api.projectserum.com"
ETH_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/your-api-key"
POLYGON_RPC_URL="https://polygon-rpc.com"
EOF

echo ""
echo "⚠️  IMPORTANT: Update the following in /var/www/advancia-payledger/backend/.env:"
echo "   - JWT_SECRET (generate a strong random string)"
echo "   - JWT_REFRESH_SECRET (generate a strong random string)"
echo "   - FRONTEND_URL (your Vercel deployment URL)"

# Configure Nginx
echo ""
echo "📦 Step 8: Configuring Nginx..."
cat > /etc/nginx/sites-available/advancia-backend << 'EOF'
server {
    listen 80;
    server_name 147.182.193.11;

    # Increase timeouts for long-running requests
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;

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
        
        # CORS headers (if needed)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/advancia-backend /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Configure firewall
echo ""
echo "📦 Step 9: Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3001/tcp  # Backend API (direct access)
ufw --force enable

# Create log directory
echo ""
echo "📦 Step 10: Creating log directory..."
mkdir -p /var/log/advancia
chmod 755 /var/log/advancia

echo ""
echo "=================================================="
echo "✅ Server setup complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Upload your backend files to: /var/www/advancia-payledger/backend/"
echo "   2. Update .env file with your Vercel URL"
echo "   3. Run deployment commands:"
echo ""
echo "      cd /var/www/advancia-payledger/backend"
echo "      npm install --production"
echo "      npm run build"
echo "      npx prisma migrate deploy"
echo "      npx prisma generate"
echo "      pm2 start dist/index.js --name advancia-backend"
echo "      pm2 save"
echo "      pm2 startup"
echo ""
echo "🌐 Your backend will be accessible at:"
echo "   - Direct: http://147.182.193.11:3001"
echo "   - Via Nginx: http://147.182.193.11"
echo ""
echo "📊 Useful commands:"
echo "   - Check status: pm2 status"
echo "   - View logs: pm2 logs advancia-backend"
echo "   - Restart: pm2 restart advancia-backend"
echo "   - Monitor: pm2 monit"
echo ""
