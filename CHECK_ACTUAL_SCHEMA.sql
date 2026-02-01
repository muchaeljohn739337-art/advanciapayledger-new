-- ============================================================================
-- CHECK YOUR ACTUAL DATABASE SCHEMA
-- Run this in Supabase SQL Editor to see what tables you have
-- ============================================================================

-- 1. List all tables with column counts
SELECT 
    table_name, 
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE columns.table_name = tables.table_name 
     AND columns.table_schema = 'public') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name NOT LIKE '_prisma%'
ORDER BY table_name;

-- 2. Check if key tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN '✅ users' 
        ELSE '❌ users' 
    END as users_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') 
        THEN '✅ patients' 
        ELSE '❌ patients' 
    END as patients_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'providers') 
        THEN '✅ providers' 
        ELSE '❌ providers' 
    END as providers_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets') 
        THEN '✅ wallets' 
        ELSE '❌ wallets' 
    END as wallets_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Session') 
        THEN '✅ Session' 
        ELSE '❌ Session' 
    END as session_table;

-- 3. Check patients table structure (if it exists)
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if patients has both 'id' and 'user_id' columns
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'patients' 
            AND column_name = 'id'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'patients' 
            AND column_name = 'user_id'
        )
        THEN '✅ Prisma Schema (has both id and user_id)'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'patients' 
            AND column_name = 'id'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'patients' 
            AND column_name = 'user_id'
        )
        THEN '⚠️ Simplified Schema (only has id)'
        ELSE '❌ No patients table found'
    END as schema_type;

-- 5. Count total tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name NOT LIKE '_prisma%';

-- 6. List all tables with user_id column
SELECT table_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'user_id'
ORDER BY table_name;

-- 7. Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE '_prisma%'
ORDER BY tablename;
