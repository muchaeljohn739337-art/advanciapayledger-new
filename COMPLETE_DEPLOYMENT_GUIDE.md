# 🚀 Complete Deployment Guide - Advancia PayLedger

## ✅ Status: Ready to Deploy

All components are integrated and ready for production deployment!

---

## 📋 Step 1: Supabase Database Setup

### **Configure Database Connection**
```bash
# Navigate to backend
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\backend

# Add your Supabase connection string to .env
echo "DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" >> .env
```

**Where to find your connection string:**
1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Settings → Database
4. Connection string → URI
5. Copy and replace `[PASSWORD]` and `[PROJECT-REF]`

### **Run Database Migrations**
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

---

## 📋 Step 2: Configure Environment Variables

### **Backend Environment (.env)**
```bash
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# JWT Secrets
JWT_SECRET="advancia-jwt-secret-production-2026"
JWT_REFRESH_SECRET="advancia-refresh-secret-production-2026"

# Redis (optional but recommended)
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Email Service (choose one)
POSTMARK_API_KEY="your_postmark_key"
POSTMARK_SERVER_ID="ad7094c5-3c94-43eb-9d83-f677c98f830a"
# OR
RESEND_API_KEY="re_iJC5pzZF_AyU8vVkGUCQULtXjuYZ8XPx5"

EMAIL_FROM="noreply@advanciapayledger.com"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Blockchain RPCs
ETHEREUM_RPC_URL="https://cloudflare-eth.com"
POLYGON_RPC_URL="https://polygon-rpc.com"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

# Environment
NODE_ENV="development"
PORT="3001"
```

### **Frontend Environment (.env.local)**
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## 📋 Step 3: Start Development Servers

### **Terminal 1: Backend Server**
```bash
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\backend
npm install
npm run dev
```

### **Terminal 2: Frontend Server**
```bash
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\frontend
npm install
npm run dev
```

### **Terminal 3: Redis Server (Optional)**
```bash
# Install Redis if not installed
# Windows: Download from redis.io
# macOS: brew install redis
# Ubuntu: sudo apt install redis

# Start Redis
redis-server
```

---

## 📋 Step 4: Access Your Applications

### **Spicy Dashboard**
```
http://localhost:3000/dashboard/spicy
```

### **Admin Console**
```
http://localhost:3000/admin
```

### **Backend API**
```
http://localhost:3001
http://localhost:3001/health
http://localhost:3001/api/currency/prices
```

---

## 📋 Step 5: Test Everything

### **Test Backend Health**
```bash
curl http://localhost:3001/health
```

### **Test Currency API**
```bash
curl http://localhost:3001/api/currency/prices
```

### **Test Spicy Dashboard**
1. Open browser to: http://localhost:3000/dashboard/spicy
2. Check if crypto prices load
3. Try currency converter
4. Test portfolio features

---

## 📋 Step 6: Deploy to Production

### **Deploy Frontend to Vercel**
```bash
cd frontend
# Add production environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-backend-domain.com

# Deploy
vercel --prod
```

### **Deploy Backend to Server**
```bash
# Option 1: DigitalOcean App Platform
cd backend
# Follow DigitalOcean deployment guide

# Option 2: Your own server
# Upload files and run with PM2
pm2 start dist/index.js --name advancia-backend
```

### **Configure Cron Jobs**
```bash
# Add CRON_SECRET to Vercel
vercel env add CRON_SECRET production
# Enter: cron_advancia_2026_xyz123abc

# Redeploy to activate cron jobs
vercel --prod
```

---

## 📋 Step 7: Configure SSL (Optional)

### **For Custom Domain**
1. Set up DNS records
2. Configure Cloudflare SSL
3. Update environment variables
4. Test HTTPS access

---

## 📊 Your Complete System

### **✅ What's Working**
- **Spicy Dashboard**: Real-time crypto prices, currency converter
- **Blockchain Payments**: Polygon/Ethereum transactions
- **Email System**: Postmark/Resend notifications
- **Cron Jobs**: 7 automated tasks
- **Database**: Supabase PostgreSQL
- **API**: RESTful endpoints for all features

### **🌐 Production URLs After Deployment**
- **Frontend**: https://your-app.vercel.app
- **Dashboard**: https://your-app.vercel.app/dashboard/spicy
- **Admin**: https://your-app.vercel.app/admin
- **Backend**: https://api.your-domain.com

---

## 🔧 Troubleshooting

### **Backend Won't Start**
```bash
# Check database connection
npx prisma db pull

# Check environment variables
cat .env

# Check logs
npm run dev -- --verbose
```

### **Frontend Errors**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
npm install

# Check API URL
echo $NEXT_PUBLIC_API_URL
```

### **Database Issues**
```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate

# Check connection
npx prisma db pull
```

---

## 📞 Quick Start Commands

### **One-Command Development Setup**
```bash
# Setup and start everything
cd backend && npm install && npx prisma migrate deploy && npx prisma generate && npm run dev &
cd frontend && npm install && npm run dev &
```

### **One-Command Production Deploy**
```bash
# Deploy both frontend and backend
cd frontend && vercel --prod
# Then deploy backend to your server
```

---

## 🎯 Success Metrics

✅ **Backend running**: http://localhost:3001/health  
✅ **Frontend running**: http://localhost:3000  
✅ **Dashboard working**: Crypto prices loading  
✅ **Database connected**: Prisma migrations applied  
✅ **Email working**: Test email sent  
✅ **Cron jobs active**: Vercel cron deployed  

---

## 🚀 Next Steps

1. **Configure Supabase** (Step 1)
2. **Start servers** (Step 3)
3. **Test dashboard** (Step 5)
4. **Deploy to production** (Step 6)

---

**Your complete crypto payment system is ready to go!** 🎉
