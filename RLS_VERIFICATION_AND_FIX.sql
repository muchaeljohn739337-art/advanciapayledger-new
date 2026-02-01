-- ============================================================================
-- RLS VERIFICATION AND DIAGNOSTIC SCRIPT
-- Run this FIRST to check your database state before applying RLS
-- ============================================================================

-- ============================================================================
-- OPTION A: VERIFICATION QUERIES
-- ============================================================================

-- 1. Check which tables exist in your database
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE columns.table_name = tables.table_name 
     AND columns.table_schema = 'public') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name NOT LIKE '_prisma%'
ORDER BY table_name;

-- 2. Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE '_prisma%'
ORDER BY tablename;

-- 3. Check existing policies (if any)
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Check if auth.uid() function exists (Supabase Auth)
SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'uid' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
) as auth_uid_exists;

-- 5. Check critical columns exist
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'patients', 'providers', 'wallets', 'Session')
AND column_name IN ('id', 'user_id', 'userId', 'created_by')
ORDER BY table_name, column_name;

-- ============================================================================
-- OPTION B: TARGETED ERROR CHECKS
-- ============================================================================

-- Test if specific tables exist before enabling RLS
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    required_tables TEXT[] := ARRAY[
        'users', 'patients', 'providers', 'facilities', 'medical_records',
        'chambers', 'bookings', 'chamber_schedules', 'chamber_maintenance',
        'payments', 'crypto_payments', 'refunds', 'invoices',
        'wallets', 'transactions', 'crypto_withdrawals',
        'Session', 'verification_tokens', 'audit_logs', 'api_keys',
        'system_config', 'alerts', 'monitoring_rules',
        'notifications', 'ai_command_logs', 'vector_memory'
    ];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = tbl
        ) THEN
            missing_tables := array_append(missing_tables, tbl);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'Missing tables: %', array_to_string(missing_tables, ', ');
        RAISE NOTICE 'Run Prisma migrations first: npx prisma migrate dev';
    ELSE
        RAISE NOTICE 'All 26 required tables exist!';
    END IF;
END $$;

-- ============================================================================
-- OPTION C: SAFE RLS SCRIPT (Only enables RLS on existing tables)
-- ============================================================================

-- This version checks if each table exists before enabling RLS
DO $$
DECLARE
    tables_to_secure TEXT[] := ARRAY[
        'users', 'patients', 'providers', 'facilities', 'medical_records',
        'chambers', 'bookings', 'chamber_schedules', 'chamber_maintenance',
        'payments', 'crypto_payments', 'refunds', 'invoices',
        'wallets', 'transactions', 'crypto_withdrawals',
        'Session', 'verification_tokens', 'audit_logs', 'api_keys',
        'system_config', 'alerts', 'monitoring_rules',
        'notifications', 'ai_command_logs', 'vector_memory'
    ];
    tbl TEXT;
    enabled_count INT := 0;
    skipped_count INT := 0;
BEGIN
    FOREACH tbl IN ARRAY tables_to_secure
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = tbl
        ) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
            enabled_count := enabled_count + 1;
            RAISE NOTICE 'Enabled RLS on: %', tbl;
        ELSE
            skipped_count := skipped_count + 1;
            RAISE NOTICE 'Skipped (table not found): %', tbl;
        END IF;
    END LOOP;
    
    RAISE NOTICE '================================';
    RAISE NOTICE 'RLS enabled on % tables', enabled_count;
    RAISE NOTICE 'Skipped % missing tables', skipped_count;
    RAISE NOTICE '================================';
END $$;

-- ============================================================================
-- SAFE POLICY CREATION (Only creates policies for existing tables)
-- ============================================================================

-- Drop all existing policies safely
DO $$ 
DECLARE
    r RECORD;
    dropped_count INT := 0;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
        dropped_count := dropped_count + 1;
    END LOOP;
    RAISE NOTICE 'Dropped % existing policies', dropped_count;
END $$;

-- Create policies only if table exists
DO $$
BEGIN
    -- USERS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        EXECUTE 'CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid()::text = id)';
        EXECUTE 'CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid()::text = id)';
        RAISE NOTICE 'Created policies for: users';
    END IF;

    -- PATIENTS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') THEN
        EXECUTE 'CREATE POLICY "patients_select_own" ON patients FOR SELECT USING (auth.uid()::text = user_id)';
        EXECUTE 'CREATE POLICY "patients_update_own" ON patients FOR UPDATE USING (auth.uid()::text = user_id)';
        EXECUTE 'CREATE POLICY "patients_insert_own" ON patients FOR INSERT WITH CHECK (auth.uid()::text = user_id)';
        RAISE NOTICE 'Created policies for: patients';
    END IF;

    -- PROVIDERS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'providers') THEN
        EXECUTE 'CREATE POLICY "providers_select_own" ON providers FOR SELECT USING (auth.uid()::text = user_id)';
        EXECUTE 'CREATE POLICY "providers_update_own" ON providers FOR UPDATE USING (auth.uid()::text = user_id)';
        EXECUTE 'CREATE POLICY "providers_insert_own" ON providers FOR INSERT WITH CHECK (auth.uid()::text = user_id)';
        EXECUTE 'CREATE POLICY "providers_public_select" ON providers FOR SELECT USING (true)';
        RAISE NOTICE 'Created policies for: providers';
    END IF;

    -- WALLETS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets') THEN
        EXECUTE 'CREATE POLICY "wallets_select_own" ON wallets FOR SELECT USING (auth.uid()::text = user_id)';
        EXECUTE 'CREATE POLICY "wallets_insert_own" ON wallets FOR INSERT WITH CHECK (auth.uid()::text = user_id)';
        EXECUTE 'CREATE POLICY "wallets_update_own" ON wallets FOR UPDATE USING (auth.uid()::text = user_id)';
        EXECUTE 'CREATE POLICY "wallets_delete_own" ON wallets FOR DELETE USING (auth.uid()::text = user_id)';
        RAISE NOTICE 'Created policies for: wallets';
    END IF;

    -- TRANSACTIONS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
        EXECUTE 'CREATE POLICY "transactions_select_own" ON transactions FOR SELECT USING (auth.uid()::text = user_id)';
        EXECUTE 'CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT WITH CHECK (auth.uid()::text = user_id)';
        EXECUTE 'CREATE POLICY "transactions_no_update" ON transactions FOR UPDATE USING (false)';
        EXECUTE 'CREATE POLICY "transactions_no_delete" ON transactions FOR DELETE USING (false)';
        RAISE NOTICE 'Created policies for: transactions';
    END IF;

    -- NOTIFICATIONS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        EXECUTE 'CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid()::text = user_id)';
        EXECUTE 'CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid()::text = user_id)';
        EXECUTE 'CREATE POLICY "notifications_no_delete" ON notifications FOR DELETE USING (false)';
        RAISE NOTICE 'Created policies for: notifications';
    END IF;

    -- Add more tables as needed...
    RAISE NOTICE '================================';
    RAISE NOTICE 'Policy creation complete!';
    RAISE NOTICE 'Run verification queries to confirm';
    RAISE NOTICE '================================';
END $$;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Check RLS status after applying
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE '_prisma%'
ORDER BY tablename;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

/*
STEP 1: Run OPTION A queries first
- This shows you what tables exist
- Shows current RLS status
- Shows existing policies

STEP 2: If tables are missing
- Run: npx prisma migrate dev --name add_security_tables
- Then come back and run OPTION C

STEP 3: Run OPTION C (Safe RLS Script)
- Only enables RLS on tables that exist
- Creates policies safely
- Shows progress with RAISE NOTICE

STEP 4: Run FINAL VERIFICATION
- Confirms RLS is enabled
- Shows policy count per table

STEP 5: If everything looks good
- Run the full ENABLE_RLS_COMPLETE_26_TABLES.sql script
- This adds all remaining policies and indexes
*/
