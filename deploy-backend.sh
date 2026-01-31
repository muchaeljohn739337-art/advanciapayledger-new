#!/bin/bash

# Advancia PayLedger - Backend Deployment Script
# Target: DigitalOcean Server 157.245.8.131

set -e  # Exit on any error

echo "🚀 Starting Advancia PayLedger Backend Deployment..."
echo "=================================================="

# Configuration
SERVER_IP="157.245.8.131"
SERVER_USER="root"
APP_DIR="/var/www/advancia-payledger"
BACKEND_DIR="$APP_DIR/backend"

echo ""
echo "📦 Step 1: Building Backend Locally..."
cd backend

# Install dependencies
echo "Installing dependencies..."
npm install

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "✅ Local build complete!"

echo ""
echo "📤 Step 2: Deploying to Server..."

# Create directory structure on server
ssh $SERVER_USER@$SERVER_IP "mkdir -p $BACKEND_DIR"

# Copy built files to server
echo "Copying files to server..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude '.git' \
  --exclude 'src' \
  --exclude 'tests' \
  . $SERVER_USER@$SERVER_IP:$BACKEND_DIR/

echo "✅ Files copied to server!"

echo ""
echo "🔧 Step 3: Setting Up on Server..."

ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /var/www/advancia-payledger/backend

echo "Installing production dependencies..."
npm install --production

echo "Running database migrations..."
npx prisma migrate deploy

echo "Stopping existing PM2 process..."
pm2 stop advancia-backend || true
pm2 delete advancia-backend || true

echo "Starting backend with PM2..."
pm2 start dist/index.js --name advancia-backend \
  --time \
  --log /var/log/advancia-backend.log \
  --error /var/log/advancia-backend-error.log

echo "Saving PM2 configuration..."
pm2 save
pm2 startup

echo "✅ Backend deployed and running!"

echo ""
echo "📊 Current Status:"
pm2 status
pm2 logs advancia-backend --lines 20

ENDSSH

echo ""
echo "=================================================="
echo "✅ Deployment Complete!"
echo ""
echo "Backend is now running on: http://$SERVER_IP:3001"
echo ""
echo "Useful commands:"
echo "  - Check status: ssh $SERVER_USER@$SERVER_IP 'pm2 status'"
echo "  - View logs: ssh $SERVER_USER@$SERVER_IP 'pm2 logs advancia-backend'"
echo "  - Restart: ssh $SERVER_USER@$SERVER_IP 'pm2 restart advancia-backend'"
echo ""
