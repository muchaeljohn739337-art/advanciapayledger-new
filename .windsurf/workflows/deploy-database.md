---
description: Deploy database schema and apply RLS policies to Supabase
---

# Deploy Database Workflow

## Prerequisites
- Supabase project active and accessible
- Correct DATABASE_URL in backend/.env
- Prisma CLI installed

## Steps

### 1. Verify Supabase Connection
Check that your Supabase project is active:
- Go to: https://supabase.com/dashboard/project/fvceynqcxfwtbpbugtqr
- Ensure status shows "Active"

### 2. Get Connection String
- Navigate to Settings → Database
- Copy "Connection pooling" string
- Format: `postgresql://postgres.fvceynqcxfwtbpbugtqr:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

### 3. Update Environment
Update `backend/.env` with correct DATABASE_URL

// turbo
### 4. Run Prisma Migrations
```bash
cd backend
npx prisma migrate deploy
```

// turbo
### 5. Generate Prisma Client
```bash
npx prisma generate
```

### 6. Apply RLS Policies
- Go to: https://supabase.com/dashboard/project/fvceynqcxfwtbpbugtqr/sql
- Copy contents of `ENABLE_RLS_COMPLETE_26_TABLES.sql`
- Paste and click "Run"

### 7. Verify Tables
Check that all 26 tables are created with RLS enabled

## Success Criteria
- ✅ All 26 tables created
- ✅ Prisma Client generated
- ✅ RLS policies applied
- ✅ No connection errors
