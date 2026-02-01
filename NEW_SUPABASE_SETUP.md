# 🚀 Fresh Supabase Setup - Complete Deployment Guide

## 📋 Overview

This guide walks you through setting up a **brand new Supabase project** with all security features, RLS policies, and production configurations.

---

## 🎯 Step 1: Create New Supabase Project

### **1.1 Create Project**
1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in details:
   - **Name:** `advancia-payledger-prod`
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Pro (recommended for production)

4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

### **1.2 Save Credentials**
Once created, go to **Settings → API**

Save these values:
```bash
PROJECT_URL=https://xxxxx.supabase.co
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

---

## 🗄️ Step 2: Initialize Database Schema

### **2.1 Run Prisma Migration**

On your local machine:

```bash
# Navigate to backend
cd backend

# Set new database URL
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Or on Windows PowerShell:
$env:DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Run migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

This creates all 26 tables in your new Supabase database.

### **2.2 Verify Tables Created**

In Supabase Dashboard → **SQL Editor**, run:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected:** 26 tables listed

---

## 🔒 Step 3: Enable Row Level Security

### **3.1 Copy RLS Script**

Open file: `ENABLE_RLS_COMPLETE_26_TABLES.sql`

### **3.2 Run in Supabase**

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **"New query"**
3. Copy **entire contents** of `ENABLE_RLS_COMPLETE_26_TABLES.sql`
4. Paste into editor
5. Click **"Run"** (or Ctrl/Cmd + Enter)
6. Wait ~30 seconds

### **3.3 Verify RLS Enabled**

Run verification query:

```sql
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE '_prisma%'
ORDER BY tablename;
```

**Expected:**
- 26 tables with `rls_enabled = true`
- Each table has 2-4 policies

---

## 🔑 Step 4: Configure Authentication

### **4.1 Enable Email Auth**

1. Go to **Authentication → Providers**
2. Enable **Email** provider
3. Configure:
   - ✅ Enable email confirmations
   - ✅ Secure email change
   - ✅ Secure password change

### **4.2 Configure Email Templates**

Go to **Authentication → Email Templates**

Customize:
- Confirmation email
- Password reset
- Magic link

### **4.3 Set Auth Settings**

Go to **Authentication → Settings**

Configure:
- **JWT expiry:** 3600 seconds (1 hour)
- **Refresh token rotation:** Enabled
- **Session timeout:** 604800 seconds (7 days)
- **Password requirements:** 
  - Minimum 8 characters
  - Require uppercase
  - Require numbers
  - Require special characters

---

## 🌐 Step 5: Configure API Settings

### **5.1 Set CORS Origins**

Go to **Settings → API → CORS**

Add your domains:
```
https://yourdomain.com
https://www.yourdomain.com
http://localhost:3000
```

### **5.2 Enable Realtime (Optional)**

If using realtime features:
1. Go to **Database → Replication**
2. Enable replication for tables:
   - notifications
   - alerts
   - bookings

---

## 🔐 Step 6: Configure Backend Environment

### **6.1 Update Backend .env**

Create/update `backend/.env`:

```bash
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Redis (for locks and rate limiting)
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Security
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here

# CoinGecko (for crypto prices)
COINGECKO_API_KEY=your-api-key-here

# Server
PORT=3000
```

### **6.2 Update Frontend .env**

Create/update `frontend/.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Environment
NEXT_PUBLIC_ENV=production
```

---

## 🧪 Step 7: Test Database Connection

### **7.1 Test from Backend**

```bash
cd backend

# Test Prisma connection
npx prisma db pull

# Should show: "Introspected 26 tables"
```

### **7.2 Test RLS Policies**

In Supabase SQL Editor:

```sql
-- This should work (returns empty if no data)
SELECT * FROM users WHERE id = auth.uid()::text;

-- This should fail with permission denied
SELECT * FROM users;
```

---

## 📊 Step 8: Seed Initial Data (Optional)

### **8.1 Create Admin User**

In Supabase Dashboard → **Authentication → Users**:

1. Click **"Add user"**
2. Enter email and password
3. Click **"Create user"**
4. Copy the user ID

### **8.2 Set Admin Role**

In SQL Editor:

```sql
-- Replace 'USER_ID_HERE' with actual user ID
UPDATE users 
SET role = 'ADMIN' 
WHERE supabase_id = 'USER_ID_HERE';
```

### **8.3 Create Test Facility**

```sql
INSERT INTO facilities (id, name, address, city, state, zip_code, phone, email, type)
VALUES (
  gen_random_uuid(),
  'Main Medical Center',
  '123 Healthcare Ave',
  'New York',
  'NY',
  '10001',
  '555-0100',
  'contact@medical.com',
  'HOSPITAL'
);
```

---

## 🔍 Step 9: Configure Monitoring

### **9.1 Enable Database Logs**

Go to **Settings → Database → Logs**

Enable:
- ✅ Query logs
- ✅ Error logs
- ✅ Connection logs

### **9.2 Set Up Alerts**

Go to **Settings → Alerts**

Configure alerts for:
- Database CPU > 80%
- Database memory > 80%
- Connection pool exhausted
- Slow queries (> 1s)

### **9.3 Enable Backups**

Go to **Settings → Database → Backups**

Configure:
- **Daily backups:** Enabled
- **Retention:** 7 days (or more for Pro)
- **Point-in-time recovery:** Enabled

---

## 🚀 Step 10: Deploy Backend

### **10.1 Update Backend Code**

Ensure services are initialized:

```typescript
// backend/src/index.ts
import { getPrismaClient } from './config/services';

const prisma = getPrismaClient();

// Test connection
prisma.$connect()
  .then(() => console.log('✅ Database connected'))
  .catch((err) => console.error('❌ Database connection failed:', err));
```

### **10.2 Start Backend**

```bash
cd backend

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Start server
npm run start
```

### **10.3 Verify Backend**

```bash
# Health check
curl http://localhost:3000/health

# Expected: {"status":"healthy","database":"connected"}
```

---

## 🌐 Step 11: Deploy Frontend

### **11.1 Update Frontend Code**

Ensure Supabase client is configured:

```typescript
// frontend/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### **11.2 Build and Deploy**

```bash
cd frontend

# Install dependencies
npm install

# Build
npm run build

# Start (or deploy to Vercel/Netlify)
npm run start
```

---

## ✅ Step 12: Final Verification

### **12.1 Database Checklist**
- [ ] All 26 tables created
- [ ] RLS enabled on all tables
- [ ] 60+ policies created
- [ ] Indexes created
- [ ] Admin user created

### **12.2 Security Checklist**
- [ ] Authentication enabled
- [ ] Email confirmations enabled
- [ ] Strong password requirements
- [ ] CORS configured
- [ ] Service role key secured
- [ ] RLS policies tested

### **12.3 Backend Checklist**
- [ ] Database connection working
- [ ] Redis connection working
- [ ] Stripe configured
- [ ] Environment variables set
- [ ] Health endpoint responding

### **12.4 Monitoring Checklist**
- [ ] Database logs enabled
- [ ] Alerts configured
- [ ] Backups enabled
- [ ] Performance monitoring active

---

## 🔧 Step 13: Production Optimizations

### **13.1 Database Connection Pooling**

In `backend/src/config/services.ts`:

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
  // Connection pool settings
  __internal: {
    engine: {
      connection_limit: 10,
    },
  },
});
```

### **13.2 Enable Query Caching**

In Supabase Dashboard → **Settings → Database**:

Enable:
- ✅ Statement timeout: 60s
- ✅ Idle in transaction timeout: 60s

### **13.3 Optimize Indexes**

Run in SQL Editor:

```sql
-- Analyze tables for query optimization
ANALYZE users;
ANALYZE patients;
ANALYZE wallets;
ANALYZE transactions;
ANALYZE bookings;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## 🆘 Troubleshooting

### **Issue: "relation does not exist"**
**Fix:** Run Prisma migrations
```bash
npx prisma migrate deploy
```

### **Issue: "permission denied for table"**
**Fix:** RLS not enabled or policies missing
```sql
-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

### **Issue: "connection refused"**
**Fix:** Check database URL and firewall
```bash
# Test connection
psql "postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
```

### **Issue: "too many connections"**
**Fix:** Increase connection pool or use connection pooler
- Go to Settings → Database → Connection pooling
- Enable Supavisor (connection pooler)

---

## 📊 Performance Benchmarks

After setup, verify performance:

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check query performance
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 🎉 Success!

Your new Supabase instance is now:
- ✅ Fully configured with 26 tables
- ✅ Protected with RLS policies
- ✅ Secured with authentication
- ✅ Monitored and backed up
- ✅ Production-ready

**Next steps:**
1. Deploy backend to production server
2. Deploy frontend to Vercel/Netlify
3. Configure custom domain
4. Set up CI/CD pipeline
5. Run load tests

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Your Security Guide:** `SECURITY_IMPLEMENTATION_GUIDE.md`
- **Quick Start:** `QUICK_START_SECURITY.md`

**Your production database is ready! 🚀**
