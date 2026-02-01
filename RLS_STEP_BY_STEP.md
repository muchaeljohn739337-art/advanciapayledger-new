# 🔒 RLS Implementation - Step by Step Guide

## 🎯 Safe Approach to Enable RLS

This guide ensures you don't get errors when applying RLS policies.

---

## 📋 Step 1: Verify Your Database State

### **Run Verification Queries First**

Open Supabase SQL Editor and run:

```sql
-- Check which tables exist
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name NOT LIKE '_prisma%'
ORDER BY table_name;
```

**Expected:** You should see 26 tables listed

**If you see fewer tables:** Run Prisma migrations first (see Step 2)

---

## 📋 Step 2: Create Missing Tables (If Needed)

If Step 1 showed missing tables:

```bash
cd backend
npx prisma migrate dev --name add_security_tables
npx prisma generate
```

This creates all 26 tables from your Prisma schema.

---

## 📋 Step 3: Check Auth Function Exists

Run in Supabase SQL Editor:

```sql
-- Verify auth.uid() function exists
SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'uid' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
) as auth_uid_exists;
```

**Expected:** `auth_uid_exists = true`

**If false:** Enable Authentication in Supabase Dashboard → Authentication

---

## 📋 Step 4: Use Safe RLS Script

Instead of running the full script immediately, use the safe version:

**File:** `RLS_VERIFICATION_AND_FIX.sql`

This script:
- ✅ Checks if each table exists before enabling RLS
- ✅ Skips missing tables instead of erroring
- ✅ Shows progress with notices
- ✅ Creates policies only for existing tables

### **Run Option C from the file:**

```sql
-- Copy and paste OPTION C section from RLS_VERIFICATION_AND_FIX.sql
-- This enables RLS safely on all existing tables
```

---

## 📋 Step 5: Verify RLS is Enabled

```sql
-- Check RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE '_prisma%'
AND rowsecurity = true
ORDER BY tablename;
```

**Expected:** All 26 tables with `rls_enabled = true`

---

## 📋 Step 6: Apply Full Policies

Now that RLS is enabled, apply all policies:

**Option A: Run full script**
```sql
-- Copy entire ENABLE_RLS_COMPLETE_26_TABLES.sql
-- Paste into Supabase SQL Editor
-- Click Run
```

**Option B: Run section by section**
1. Enable RLS (lines 1-50) ✅ Already done in Step 4
2. Drop old policies (lines 51-66)
3. Create policies (lines 67-501)
4. Create indexes (lines 502-552)
5. Verify (lines 553-583)

---

## 📋 Step 7: Final Verification

```sql
-- 1. Count tables with RLS
SELECT COUNT(*) as tables_with_rls
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
-- Expected: 26

-- 2. Count total policies
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
-- Expected: 60+

-- 3. Check policy distribution
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;
-- Expected: Each table has 2-4 policies
```

---

## 🚨 Common Errors & Fixes

### **Error: "relation does not exist"**

**Cause:** Table hasn't been created yet

**Fix:**
```bash
cd backend
npx prisma migrate dev
```

### **Error: "function auth.uid() does not exist"**

**Cause:** Supabase Auth not enabled

**Fix:**
1. Go to Supabase Dashboard
2. Click Authentication
3. Enable Authentication
4. Wait 30 seconds
5. Try again

### **Error: "column user_id does not exist"**

**Cause:** Schema mismatch - your table structure is different

**Fix:** Check actual column names:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND table_schema = 'public';
```

Then update policies to use correct column names.

### **Error: "permission denied for schema public"**

**Cause:** Not using service role key

**Fix:**
1. In Supabase Dashboard → Settings → API
2. Copy "service_role" key (not anon key)
3. Use service role for running SQL scripts

---

## 🎯 Quick Decision Tree

```
Do all 26 tables exist?
├─ YES → Run ENABLE_RLS_COMPLETE_26_TABLES.sql directly
└─ NO  → Follow this guide step by step

Is auth.uid() available?
├─ YES → Proceed with RLS
└─ NO  → Enable Authentication first

Do you get errors?
├─ YES → Use RLS_VERIFICATION_AND_FIX.sql (Option C)
└─ NO  → You're done! ✅
```

---

## ✅ Success Checklist

- [ ] All 26 tables exist in database
- [ ] RLS enabled on all 26 tables
- [ ] 60+ policies created
- [ ] No errors in SQL Editor
- [ ] Verification queries return expected results
- [ ] Test query works:
  ```sql
  -- This should return only your own data
  SELECT * FROM wallets WHERE user_id = auth.uid()::text;
  ```

---

## 📊 What Each Option Does

### **Option A: Verification Queries**
- Shows current database state
- Lists existing tables
- Shows RLS status
- Lists existing policies
- **Use when:** You want to see what you have before making changes

### **Option B: Targeted Error Checks**
- Tests for missing tables
- Identifies specific problems
- Shows helpful error messages
- **Use when:** You're getting errors and need to diagnose

### **Option C: Safe RLS Script**
- Enables RLS only on existing tables
- Skips missing tables gracefully
- Creates basic policies safely
- Shows progress notifications
- **Use when:** You want to enable RLS without errors

---

## 🚀 Recommended Workflow

1. **First time setup:**
   - Run Prisma migrations
   - Run Option A (verification)
   - Run Option C (safe RLS)
   - Run full script for remaining policies

2. **Already have tables:**
   - Run Option A (verification)
   - Run full ENABLE_RLS_COMPLETE_26_TABLES.sql

3. **Getting errors:**
   - Run Option B (error checks)
   - Fix identified issues
   - Run Option C (safe RLS)
   - Run verification

---

## 📞 Still Having Issues?

### **Check these:**
1. Prisma schema matches database
2. All migrations applied
3. Using service_role key (not anon)
4. Authentication enabled in Supabase
5. No typos in table/column names

### **Debug query:**
```sql
-- Shows exactly what's in your database
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    pg.rowsecurity as has_rls,
    (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.table_name) as policy_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN pg_tables pg ON t.table_name = pg.tablename
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;
```

---

**Follow this guide and you'll have RLS enabled without errors!** 🔒✅
