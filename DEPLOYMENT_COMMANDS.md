# 🚀 Copy-Paste Deployment Commands

## Server: 147.182.193.11

---

## 🔧 Option 1: Automated Deployment (Recommended)

### From Your Local Machine (PowerShell):

```powershell
# Navigate to project
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution

# Run deployment script (will prompt for file upload confirmation)
.\deploy-backend.ps1
```

---

## 🔧 Option 2: Manual Deployment

### Step 1: Connect to Server
```powershell
ssh root@147.182.193.11
```

### Step 2: Initial Server Setup (One-Time)
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install Redis
apt-get install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Create directory
mkdir -p /var/www/advancia-payledger/backend
cd /var/www/advancia-payledger/backend
```

### Step 3: Upload Files (From Local Machine)
```powershell
# Upload backend files
scp -r c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\backend\* root@147.182.193.11:/var/www/advancia-payledger/backend/
```

### Step 4: Configure Backend (On Server)
```bash
# Create .env file
cat > /var/www/advancia-payledger/backend/.env << 'EOF'
DATABASE_URL="postgresql://postgres.jwabwrcykdtpwdhwhmqq:F3vR2UQT49NK8ifI@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="advancia-jwt-secret-production-2026-change-this"
JWT_REFRESH_SECRET="advancia-refresh-secret-production-2026-change-this"
REDIS_URL="redis://localhost:6379"
FRONTEND_URL="https://your-vercel-app.vercel.app"
NODE_ENV="production"
PORT=3001
EOF
```

### Step 5: Build and Start
```bash
cd /var/www/advancia-payledger/backend

# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Start with PM2
pm2 start dist/index.js --name advancia-backend

# Save PM2 config
pm2 save

# Enable PM2 on startup
pm2 startup
```

### Step 6: Verify Backend
```bash
# Check status
pm2 status

# View logs
pm2 logs advancia-backend --lines 20

# Test health endpoint (from local machine)
curl http://147.182.193.11:3001/health
```

---

## 🌐 Update Frontend (From Local Machine)

```powershell
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\frontend

# Add backend URL to Vercel
vercel env add NEXT_PUBLIC_API_URL production
# When prompted, enter: http://147.182.193.11:3001

# Redeploy frontend
vercel --prod
```

---

## ✅ Quick Test Commands

```powershell
# Test backend health
curl http://147.182.193.11:3001/health

# Test chambers API
curl http://147.182.193.11:3001/api/chambers

# Test bookings API
curl http://147.182.193.11:3001/api/bookings

# Check backend status
ssh root@147.182.193.11 "pm2 status"

# View backend logs
ssh root@147.182.193.11 "pm2 logs advancia-backend --lines 50"
```

---

## 🔄 Update Backend (After Changes)

```bash
# On server
ssh root@147.182.193.11
cd /var/www/advancia-payledger/backend

# Pull changes (if using Git)
git pull

# Or upload new files via SCP from local machine:
# scp -r c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\backend\dist root@147.182.193.11:/var/www/advancia-payledger/backend/

# Restart
pm2 restart advancia-backend

# View logs
pm2 logs advancia-backend
```

---

## 🛠️ Useful Management Commands

```bash
# Check PM2 status
ssh root@147.182.193.11 "pm2 status"

# Restart backend
ssh root@147.182.193.11 "pm2 restart advancia-backend"

# Stop backend
ssh root@147.182.193.11 "pm2 stop advancia-backend"

# View logs (last 50 lines)
ssh root@147.182.193.11 "pm2 logs advancia-backend --lines 50"

# Monitor in real-time
ssh root@147.182.193.11 "pm2 monit"

# Check server resources
ssh root@147.182.193.11 "free -h && df -h"
```

---

## 🔥 Troubleshooting

### Backend won't start
```bash
ssh root@147.182.193.11
cd /var/www/advancia-payledger/backend
pm2 logs advancia-backend --lines 100
```

### Port 3001 blocked
```bash
ssh root@147.182.193.11
ufw allow 3001/tcp
ufw status
```

### Database connection failed
```bash
ssh root@147.182.193.11
cd /var/www/advancia-payledger/backend
npx prisma db pull
```

### Restart everything
```bash
ssh root@147.182.193.11
pm2 restart all
systemctl restart redis-server
```

---

## 📋 Production Checklist

- [ ] Backend deployed to 147.182.193.11
- [ ] Backend responding at http://147.182.193.11:3001/health
- [ ] Frontend environment variable updated (NEXT_PUBLIC_API_URL)
- [ ] Frontend redeployed to Vercel
- [ ] CORS configured (FRONTEND_URL in backend .env)
- [ ] JWT secrets changed from defaults
- [ ] Redis running
- [ ] PM2 configured for auto-restart
- [ ] Firewall rules configured
- [ ] All API endpoints tested

---

**Ready to deploy? Start with Option 1 (Automated) or follow Option 2 (Manual) step by step!** 🚀
