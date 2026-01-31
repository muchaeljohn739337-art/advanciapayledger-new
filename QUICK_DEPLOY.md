# 🚀 Quick Production Deployment Guide

## Current Status
- ✅ **Frontend**: Deployed to Vercel
- ✅ **Database**: Supabase (EU Central) - Migrated
- ⏳ **Backend**: Ready to deploy to 147.182.193.11

---

## 🎯 3-Step Deployment Process

### Step 1: Set Up Server (One-Time Setup)

**Connect to your server:**
```powershell
ssh root@147.182.193.11
```

**Run the setup script:**
```bash
# Download and run setup script
curl -o setup.sh https://raw.githubusercontent.com/YOUR_REPO/main/setup-server.sh
chmod +x setup.sh
./setup.sh

# Or manually copy the setup-server.sh file and run it
```

**Or do it manually:**
```bash
# Install Node.js
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

---

### Step 2: Deploy Backend

**From your local machine (PowerShell):**

```powershell
# Navigate to project
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution

# Run deployment script
.\deploy-backend.ps1
```

**Or deploy manually:**

```powershell
# 1. Build locally (skip if Prisma generate fails - will build on server)
cd backend
npm install
npm run build

# 2. Upload files to server
scp -r dist package.json package-lock.json prisma .env.example root@147.182.193.11:/var/www/advancia-payledger/backend/

# 3. Set up on server
ssh root@147.182.193.11
cd /var/www/advancia-payledger/backend

# Create .env file
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres.jwabwrcykdtpwdhwhmqq:F3vR2UQT49NK8ifI@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="advancia-jwt-secret-2026-change-this"
JWT_REFRESH_SECRET="advancia-refresh-secret-2026-change-this"
REDIS_URL="redis://localhost:6379"
FRONTEND_URL="https://your-vercel-app.vercel.app"
NODE_ENV="production"
PORT=3001
EOF

# Install and start
npm install --production
npm run build
npx prisma migrate deploy
npx prisma generate
pm2 start dist/index.js --name advancia-backend
pm2 save
pm2 startup
```

---

### Step 3: Connect Frontend to Backend

**Update Vercel environment variables:**

```powershell
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\frontend

# Add backend API URL
vercel env add NEXT_PUBLIC_API_URL production
# When prompted, enter: http://147.182.193.11:3001

# Redeploy frontend
vercel --prod
```

**Update backend CORS:**

```bash
# On server, update .env
ssh root@147.182.193.11
cd /var/www/advancia-payledger/backend
nano .env

# Update FRONTEND_URL to your actual Vercel URL:
# FRONTEND_URL="https://your-actual-app.vercel.app"

# Restart backend
pm2 restart advancia-backend
```

---

## ✅ Verification

**Test backend:**
```powershell
# Health check
curl http://147.182.193.11:3001/health

# Test API
curl http://147.182.193.11:3001/api/chambers
```

**Test frontend:**
1. Open your Vercel URL
2. Navigate to `/bookings` - should load
3. Navigate to `/admin` - should load
4. Check browser console for errors

---

## 🔧 Troubleshooting

### Backend won't start
```bash
ssh root@147.182.193.11
pm2 logs advancia-backend
pm2 restart advancia-backend
```

### Can't connect to database
```bash
# Test connection
cd /var/www/advancia-payledger/backend
npx prisma db pull
```

### CORS errors
Update `backend/src/app.ts` and add your Vercel domain to the CORS whitelist, then redeploy.

### Port 3001 blocked
```bash
# Check firewall
ufw status
ufw allow 3001/tcp
```

---

## 📊 Monitoring Commands

```bash
# Check status
ssh root@147.182.193.11 "pm2 status"

# View logs
ssh root@147.182.193.11 "pm2 logs advancia-backend"

# Monitor resources
ssh root@147.182.193.11 "pm2 monit"

# Restart backend
ssh root@147.182.193.11 "pm2 restart advancia-backend"
```

---

## 🎯 Production URLs

**After deployment:**
- Backend API: `http://147.182.193.11:3001`
- Health Check: `http://147.182.193.11:3001/health`
- Frontend: `https://your-app.vercel.app`

**API Endpoints:**
- Chambers: `http://147.182.193.11:3001/api/chambers`
- Bookings: `http://147.182.193.11:3001/api/bookings`
- Schedule: `http://147.182.193.11:3001/api/schedule`
- Admin: `http://147.182.193.11:3001/api/admin/*`

---

## 🔐 Security Checklist

Before going live:
- [ ] Change JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Configure proper CORS origins
- [ ] Enable firewall rules
- [ ] Set up database backups
- [ ] Configure monitoring (PM2 Plus, Sentry)
- [ ] Review and update all API keys
- [ ] Test all critical endpoints

---

## 📞 Need Help?

**Common Issues:**
- SSH connection failed → Check SSH keys or use password
- Prisma generate fails → Run on server, not locally
- CORS errors → Update FRONTEND_URL in backend .env
- Port blocked → Check firewall: `ufw allow 3001`

**Quick Commands:**
```bash
# Restart everything
ssh root@147.182.193.11 "pm2 restart all"

# Check logs
ssh root@147.182.193.11 "pm2 logs --lines 50"

# Server resources
ssh root@147.182.193.11 "htop"
```

---

**Your deployment is ready! Follow the 3 steps above to get your backend live.** 🚀
