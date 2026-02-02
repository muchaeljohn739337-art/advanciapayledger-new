# 🚀 Quick Start Guide - Advancia PayLedger

## ✅ What's Already Done

1. ✅ Environment files copied (`.env` created)
2. ✅ Backend dependencies installed (1212 packages)
3. ✅ All API keys configured
4. ✅ Sentry error tracking ready

---

## 🎯 Next Steps

### **Option 1: Start Backend (Without Database)** ⚡

If you want to test API endpoints and AI integration without database:

```bash
cd backend
npm run dev
```

**What will work:**
- ✅ Health check endpoints
- ✅ Sentry debug endpoint (`/debug-sentry`)
- ✅ AI integration endpoints (if implemented)
- ❌ Database operations (need Prisma migration first)

---

### **Option 2: Full Setup (With Database)** 🗄️

For complete functionality with database:

#### **1. Connect to Supabase Database:**

Your database is already configured in `.env`:
```bash
DATABASE_URL="postgresql://postgres:ov0Zq3qP8wXhVlzq@db.fvceynqcxfwtbpbugtqr.supabase.co:5432/postgres"
```

#### **2. Run Prisma Migrations:**
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

#### **3. Apply RLS Policies:**

Go to Supabase SQL Editor:
https://supabase.com/dashboard/project/fvceynqcxfwtbpbugtqr/sql

Run the SQL from:
- `ENABLE_RLS_COMPLETE_26_TABLES.sql`

#### **4. Start Backend:**
```bash
npm run dev
```

---

## 🧪 Testing

### **Test Backend Health:**
```bash
curl http://localhost:3001/api/health
```

### **Test Sentry Error Tracking:**
```bash
curl http://localhost:3001/debug-sentry
# Check: https://sentry.io/organizations/advanciapayledger/
```

### **Test AI Integration (if endpoint exists):**
```bash
# Test Gemini
curl -X POST http://localhost:3001/api/ai/gemini \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"Hello from Gemini!\"}"

# Test OpenAI
curl -X POST http://localhost:3001/api/ai/openai \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"Hello from GPT!\"}"

# Test Claude
curl -X POST http://localhost:3001/api/ai/claude \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"Hello from Claude!\"}"
```

---

## 🌐 Frontend Setup

### **Install Dependencies:**
```bash
cd frontend
npm install
```

### **Start Development Server:**
```bash
npm run dev
```

**Access at:** http://localhost:3000

---

## 📊 What's Available

### **Backend Endpoints:**
- `GET /api/health` - Health check
- `GET /debug-sentry` - Test Sentry error tracking
- `POST /api/auth/*` - Authentication
- `POST /api/payments/*` - Payment processing
- `GET /api/analytics/*` - Analytics
- `POST /api/crypto/*` - Crypto operations

### **Frontend Pages:**
- `/` - Homepage
- `/dashboard` - Main dashboard
- `/ledger` - Transaction ledger
- `/payroll` - Payroll management
- `/vault` - Crypto vault
- `/security` - Security center

---

## 🔍 Troubleshooting

### **Backend won't start:**

**Issue:** Database connection error

**Solution:**
```bash
# Check if Supabase database is accessible
npx prisma db pull

# If fails, verify DATABASE_URL in .env
```

**Issue:** Port 3001 already in use

**Solution:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process or change PORT in .env
```

### **Frontend won't start:**

**Issue:** Port 3000 already in use

**Solution:**
```bash
# Change port
$env:PORT=3002; npm run dev
```

---

## 🎯 Recommended Workflow

### **For Testing (No Database):**
1. Start backend: `cd backend && npm run dev`
2. Test health: `curl http://localhost:3001/api/health`
3. Test Sentry: `curl http://localhost:3001/debug-sentry`

### **For Development (With Database):**
1. Run migrations: `npx prisma migrate deploy`
2. Start backend: `npm run dev`
3. Start frontend: `cd ../frontend && npm run dev`
4. Access: http://localhost:3000

### **For Production:**
1. Apply RLS policies in Supabase
2. Deploy backend to AWS/Railway
3. Deploy frontend to Vercel
4. Configure environment variables

---

## 📚 Available Commands

### **Backend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma generate  # Generate Prisma Client
```

### **Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run lint         # Run ESLint
```

---

## 🔐 Security Checklist

Before deploying:
- [ ] All secrets in `.env` (not committed)
- [ ] RLS policies applied to all tables
- [ ] Sentry error tracking verified
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] Environment variables in GitHub Secrets

---

## 📞 Support Resources

- **Supabase Dashboard:** https://supabase.com/dashboard/project/fvceynqcxfwtbpbugtqr
- **Sentry Dashboard:** https://sentry.io/organizations/advanciapayledger/
- **GitHub Repo:** https://github.com/muchaeljohn739337-art/advanciapayledger-new
- **Documentation:** All `*.md` files in project root

---

**Your development environment is ready! Start with `npm run dev` in the backend folder.** 🚀
