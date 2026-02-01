# 🧪 LOCAL TESTING GUIDE - No Docker Required

**Date:** February 1, 2026
**Status:** Ready for local testing

---

## ✅ **TESTING WITHOUT DOCKER**

Since Docker was uninstalled, we'll test the backend directly with Node.js.

---

## 📋 **PREREQUISITES**

1. ✅ Node.js installed
2. ✅ Backend code complete
3. ✅ Supabase credentials configured
4. ⏳ Database connection (Supabase PostgreSQL)

---

## 🔧 **SETUP STEPS**

### **Step 1: Install Backend Dependencies (5 min)**

```bash
cd backend
npm install
```

### **Step 2: Configure Environment Variables (5 min)**

Your `.env` file should have:
```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres.jwabwrcykdtpwdhwhmqq:Good_mother1!?@aws-1-eu-central-1.pooler.supabase.com:5432/postgres

# Supabase Auth
SUPABASE_URL=https://jwabwrcykdtpwdhwhmqq.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_...
SUPABASE_JWT_SECRET=154fb428-003c-44e5-a8b1-42cf8729d0e5

# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# JWT (fallback)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
```

### **Step 3: Run Prisma Migrations (5 min)**

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### **Step 4: Start Backend Server (1 min)**

```bash
npm run dev
```

Server should start on: `http://localhost:3001`

---

## 🧪 **TESTING CHECKLIST**

### **1. Health Check**
```bash
curl http://localhost:3001/health
```
Expected: `{"status":"ok"}`

### **2. Test Authentication**
```bash
# This will fail without valid token (expected)
curl http://localhost:3001/api/users/me
```
Expected: `{"error":"Access token required"}`

### **3. Test Public Routes**
```bash
# List providers (public route)
curl http://localhost:3001/api/providers
```
Expected: JSON array of providers

### **4. Test Protected Routes (Need Supabase Token)**

**Get token from Supabase:**
1. Go to Supabase dashboard
2. Authentication → Users
3. Create test user or use existing
4. Get JWT token

**Test with token:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/users/me
```

---

## 🎯 **CRITICAL ROUTES TO TEST**

### **Healthcare Routes:**
- ✅ `GET /api/patients/:id` - Patient profile
- ✅ `GET /api/providers` - Provider list
- ✅ `GET /api/appointments` - User appointments
- ✅ `GET /api/medical-records` - Medical records
- ✅ `GET /api/prescriptions` - Prescriptions

### **User Routes:**
- ✅ `GET /api/users/me` - Current user
- ✅ `GET /api/notifications` - Notifications

### **Wallet Routes:**
- ✅ `GET /api/wallets` - User wallets

---

## ⚠️ **EXPECTED ISSUES & FIXES**

### **Issue 1: Database Connection**
If you see: `Can't reach database server`

**Fix:** Verify Supabase DATABASE_URL is correct in `.env`

### **Issue 2: Prisma Client Not Generated**
If you see: `Cannot find module '@prisma/client'`

**Fix:**
```bash
cd backend
npx prisma generate
```

### **Issue 3: Missing Environment Variables**
If you see: `JWT_SECRET environment variable is not set`

**Fix:** Add missing variables to `.env`

### **Issue 4: Port Already in Use**
If you see: `Port 3001 is already in use`

**Fix:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process or change PORT in .env
```

---

## 🚀 **NEXT STEPS AFTER LOCAL TESTING**

Once local testing confirms everything works:

### **Option 1: Deploy to AWS (Recommended)**
- Follow `COMPLETE_STACK_ROADMAP.md`
- Deploy infrastructure
- Deploy backend to ECS
- Go live

### **Option 2: Add Optional Routes**
- Build remaining 5 routes
- Test locally
- Then deploy

---

## 📝 **TESTING SCRIPT**

Save this as `test-backend.ps1`:

```powershell
# Test Backend Routes

Write-Host "Testing Backend..." -ForegroundColor Green

# Health check
Write-Host "`n1. Testing health endpoint..." -ForegroundColor Yellow
curl http://localhost:3001/health

# Public routes
Write-Host "`n2. Testing public providers endpoint..." -ForegroundColor Yellow
curl http://localhost:3001/api/providers

# Protected routes (will fail without token - expected)
Write-Host "`n3. Testing protected endpoint (should fail)..." -ForegroundColor Yellow
curl http://localhost:3001/api/users/me

Write-Host "`n✅ Basic tests complete!" -ForegroundColor Green
Write-Host "For full testing, get a Supabase JWT token and test protected routes." -ForegroundColor Cyan
```

Run with: `.\test-backend.ps1`

---

## ✅ **SUCCESS CRITERIA**

Your backend is working if:
- ✅ Health endpoint returns OK
- ✅ Public routes return data
- ✅ Protected routes require authentication
- ✅ No server errors in console
- ✅ Database connection successful

---

**Ready to test! Start with Step 1: Install dependencies**
