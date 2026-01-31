# 🚀 DEPLOY NOW - Execute These Commands

## ✅ Server Status: ONLINE (147.182.193.11)

---

## 📋 STEP 1: Connect to Your Server

```powershell
ssh root@147.182.193.11
```

If prompted for password, enter it. If you need SSH key setup, let me know.

---

## 📋 STEP 2: Run This Complete Setup Script (Copy-Paste All)

Once connected to the server, copy and paste this entire block:

```bash
# ============================================
# ADVANCIA PAYLEDGER - COMPLETE DEPLOYMENT
# ============================================

echo "🚀 Starting Advancia PayLedger Deployment..."

# Install Node.js 18
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Redis
echo "📦 Installing Redis..."
apt-get install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Create directory
echo "📦 Creating application directory..."
mkdir -p /var/www/advancia-payledger/backend
cd /var/www/advancia-payledger/backend

# Create .env file
echo "📦 Creating environment configuration..."
cat > .env << 'ENVEOF'
DATABASE_URL="postgresql://postgres.jwabwrcykdtpwdhwhmqq:F3vR2UQT49NK8ifI@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="advancia-jwt-secret-production-2026-CHANGE-THIS"
JWT_REFRESH_SECRET="advancia-refresh-secret-production-2026-CHANGE-THIS"
REDIS_URL="redis://localhost:6379"
FRONTEND_URL="https://your-vercel-app.vercel.app"
NODE_ENV="production"
PORT=3001
ENVEOF

echo "✅ Server setup complete!"
echo ""
echo "📤 Next: Upload your backend files to /var/www/advancia-payledger/backend/"
echo "   Then run the deployment commands below."
```

---

## 📋 STEP 3: Upload Backend Files

**Open a NEW PowerShell window** on your local machine and run:

```powershell
# Navigate to project
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\backend

# Upload files to server
scp -r src package.json package-lock.json tsconfig.json prisma root@147.182.193.11:/var/www/advancia-payledger/backend/
```

---

## 📋 STEP 4: Build and Start Backend

**Back on the server**, run these commands:

```bash
cd /var/www/advancia-payledger/backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build TypeScript
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "⚙️ Generating Prisma client..."
npx prisma generate

# Start with PM2
echo "🚀 Starting backend..."
pm2 start dist/index.js --name advancia-backend --time

# Save PM2 configuration
pm2 save

# Enable PM2 on system startup
pm2 startup

# Show status
echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
pm2 status
pm2 logs advancia-backend --lines 20
```

---

## 📋 STEP 5: Test Backend

**From your local machine:**

```powershell
# Test health endpoint
curl http://147.182.193.11:3001/health

# Test chambers API
curl http://147.182.193.11:3001/api/chambers
```

**Expected response:**
```json
{"status":"ok","timestamp":"2026-01-30T..."}
```

---

## 📋 STEP 6: Update Frontend

**From your local machine:**

```powershell
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\frontend

# Get your Vercel URL first
vercel ls

# Add backend URL to Vercel
vercel env add NEXT_PUBLIC_API_URL production
# When prompted, enter: http://147.182.193.11:3001

# Redeploy frontend
vercel --prod
```

---

## 📋 STEP 7: Update Backend CORS

**On the server:**

```bash
ssh root@147.182.193.11
cd /var/www/advancia-payledger/backend
nano .env

# Update this line with your actual Vercel URL:
# FRONTEND_URL="https://your-actual-vercel-app.vercel.app"

# Save (Ctrl+X, Y, Enter)

# Restart backend
pm2 restart advancia-backend
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] Server setup complete (Node.js, PM2, Redis installed)
- [ ] Backend files uploaded
- [ ] Backend built successfully
- [ ] Prisma migrations applied
- [ ] PM2 running backend
- [ ] Health endpoint responds: http://147.182.193.11:3001/health
- [ ] Frontend environment variable added
- [ ] Frontend redeployed
- [ ] CORS configured with Vercel URL
- [ ] End-to-end test successful

---

## 🔧 TROUBLESHOOTING

### If backend won't start:
```bash
ssh root@147.182.193.11
pm2 logs advancia-backend --lines 100
```

### If port 3001 is blocked:
```bash
ssh root@147.182.193.11
ufw allow 3001/tcp
```

### If database connection fails:
```bash
ssh root@147.182.193.11
cd /var/www/advancia-payledger/backend
cat .env | grep DATABASE_URL
npx prisma db pull
```

### Restart everything:
```bash
ssh root@147.182.193.11
pm2 restart advancia-backend
systemctl restart redis-server
```

---

## 📊 MONITORING COMMANDS

```bash
# Check status
ssh root@147.182.193.11 "pm2 status"

# View logs
ssh root@147.182.193.11 "pm2 logs advancia-backend"

# Monitor in real-time
ssh root@147.182.193.11 "pm2 monit"

# Restart backend
ssh root@147.182.193.11 "pm2 restart advancia-backend"
```

---

## 🎯 YOUR PRODUCTION URLS

After deployment:

- **Backend API**: http://147.182.193.11:3001
- **Health Check**: http://147.182.193.11:3001/health
- **Frontend**: https://your-vercel-app.vercel.app
- **Admin Console**: https://your-vercel-app.vercel.app/admin
- **Booking System**: https://your-vercel-app.vercel.app/bookings

---

## 🚀 START HERE

1. Open PowerShell
2. Run: `ssh root@147.182.193.11`
3. Copy-paste the setup script from STEP 2
4. Follow steps 3-7

**You're ready to deploy! Start with STEP 1 above.** 🎉
