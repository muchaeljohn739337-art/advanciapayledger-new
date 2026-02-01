-- ============================================================================
-- Supabase Connection Test Script
-- Project: fvceynqcxfwtbpbugtqr
-- URL: https://fvceynqcxfwtbpbugtqr.supabase.co
-- ============================================================================

-- Run these queries in Supabase SQL Editor to verify setup

-- ============================================================================
-- TEST 1: Check Database Connection
-- ============================================================================

SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgres_version,
    now() as current_time;

-- Expected: Should return database info without errors

-- ============================================================================
-- TEST 2: Check if auth.uid() Function Exists
-- ============================================================================

SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'uid' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
) as auth_uid_available;

-- Expected: auth_uid_available = true

-- ============================================================================
-- TEST 3: List All Tables (Should be empty initially)
-- ============================================================================

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name NOT LIKE '_prisma%'
ORDER BY table_name;

-- Expected: Empty result (no tables yet) or list of existing tables

-- ============================================================================
-- TEST 4: Check RLS Status (After tables are created)
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE '_prisma%'
ORDER BY tablename;

-- Expected: After migration, should show 26 tables

-- ============================================================================
-- TEST 5: Check Existing Policies
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: Empty initially, 60+ policies after RLS script

-- ============================================================================
-- TEST 6: Check Database Size
-- ============================================================================

SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Expected: Small size initially (< 10 MB)

-- ============================================================================
-- TEST 7: Check Connection Limits
-- ============================================================================

SELECT 
    max_conn,
    used,
    res_for_super,
    max_conn - used - res_for_super as available
FROM 
    (SELECT count(*) used FROM pg_stat_activity) t1,
    (SELECT setting::int res_for_super FROM pg_settings WHERE name = 'superuser_reserved_connections') t2,
    (SELECT setting::int max_conn FROM pg_settings WHERE name = 'max_connections') t3;

-- Expected: Should show available connections

-- ============================================================================
-- TEST 8: Check Extensions
-- ============================================================================

SELECT 
    extname as extension_name,
    extversion as version
FROM pg_extension
ORDER BY extname;

-- Expected: Should include pgcrypto, uuid-ossp, etc.

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

/*
After running these tests:

1. If all tests pass:
   ✅ Database connection is working
   ✅ Auth functions are available
   ✅ Ready for Prisma migrations

2. Run Prisma migrations:
   cd backend
   export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.fvceynqcxfwtbpbugtqr.supabase.co:5432/postgres"
   npx prisma migrate deploy

3. Run TEST 3 again to verify 26 tables created

4. Apply RLS policies:
   - Copy ENABLE_RLS_COMPLETE_26_TABLES.sql
   - Paste in SQL Editor
   - Click Run

5. Run TEST 4 and TEST 5 to verify RLS enabled

6. Your database is ready! 🚀
*/
