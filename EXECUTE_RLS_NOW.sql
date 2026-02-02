-- ============================================================================
-- SAFE RLS DEPLOYMENT SCRIPT - OPTION C
-- Execute this in Supabase SQL Editor
-- ============================================================================
-- This script:
-- 1. Enables RLS only on existing tables
-- 2. Drops old policies to avoid conflicts
-- 3. Creates basic per-table policies
-- 4. Verifies the results
-- ============================================================================

-- ============================================================================
-- STEP 1: ENABLE RLS ON EXISTING TABLES
-- ============================================================================

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
-- STEP 2: DROP ALL EXISTING POLICIES (Clean slate)
-- ============================================================================

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

-- ============================================================================
-- STEP 3: CREATE BASIC POLICIES FOR EACH TABLE
-- ============================================================================

DO $$
BEGIN
    -- USERS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        EXECUTE 'CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid()::text = supabase_id)';
        EXECUTE 'CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid()::text = supabase_id)';
        RAISE NOTICE 'Created policies for: users';
    END IF;

    -- PATIENTS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') THEN
        EXECUTE 'CREATE POLICY "patients_select_facility" ON patients FOR SELECT USING (
            facility_id IN (
                SELECT facility_id FROM user_facilities 
                WHERE user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
            )
        )';
        EXECUTE 'CREATE POLICY "patients_insert_facility" ON patients FOR INSERT WITH CHECK (
            facility_id IN (
                SELECT facility_id FROM user_facilities 
                WHERE user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
            )
        )';
        RAISE NOTICE 'Created policies for: patients';
    END IF;

    -- PROVIDERS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'providers') THEN
        EXECUTE 'CREATE POLICY "providers_select_own" ON providers FOR SELECT USING (
            user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
        )';
        EXECUTE 'CREATE POLICY "providers_public_select" ON providers FOR SELECT USING (true)';
        RAISE NOTICE 'Created policies for: providers';
    END IF;

    -- FACILITIES TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'facilities') THEN
        EXECUTE 'CREATE POLICY "facilities_select_associated" ON facilities FOR SELECT USING (
            id IN (
                SELECT facility_id FROM user_facilities 
                WHERE user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
            )
        )';
        RAISE NOTICE 'Created policies for: facilities';
    END IF;

    -- WALLETS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets') THEN
        EXECUTE 'CREATE POLICY "wallets_select_own" ON wallets FOR SELECT USING (
            user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
        )';
        EXECUTE 'CREATE POLICY "wallets_insert_own" ON wallets FOR INSERT WITH CHECK (
            user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
        )';
        EXECUTE 'CREATE POLICY "wallets_update_own" ON wallets FOR UPDATE USING (
            user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
        )';
        RAISE NOTICE 'Created policies for: wallets';
    END IF;

    -- TRANSACTIONS TABLE (Read-only after creation)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
        EXECUTE 'CREATE POLICY "transactions_select_own" ON transactions FOR SELECT USING (
            user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
        )';
        EXECUTE 'CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT WITH CHECK (
            user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
        )';
        EXECUTE 'CREATE POLICY "transactions_no_update" ON transactions FOR UPDATE USING (false)';
        EXECUTE 'CREATE POLICY "transactions_no_delete" ON transactions FOR DELETE USING (false)';
        RAISE NOTICE 'Created policies for: transactions';
    END IF;

    -- PAYMENTS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        EXECUTE 'CREATE POLICY "payments_select_facility" ON payments FOR SELECT USING (
            facility_id IN (
                SELECT facility_id FROM user_facilities 
                WHERE user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
            )
        )';
        EXECUTE 'CREATE POLICY "payments_insert_facility" ON payments FOR INSERT WITH CHECK (
            facility_id IN (
                SELECT facility_id FROM user_facilities 
                WHERE user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
            )
        )';
        RAISE NOTICE 'Created policies for: payments';
    END IF;

    -- CRYPTO_PAYMENTS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crypto_payments') THEN
        EXECUTE 'CREATE POLICY "crypto_payments_select_own" ON crypto_payments FOR SELECT USING (
            user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
        )';
        EXECUTE 'CREATE POLICY "crypto_payments_insert_own" ON crypto_payments FOR INSERT WITH CHECK (
            user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
        )';
        RAISE NOTICE 'Created policies for: crypto_payments';
    END IF;

    -- NOTIFICATIONS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        EXECUTE 'CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (
            user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
        )';
        EXECUTE 'CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (
            user_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
        )';
        RAISE NOTICE 'Created policies for: notifications';
    END IF;

    -- AUDIT_LOGS TABLE (Admin only)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        EXECUTE 'CREATE POLICY "audit_logs_admin_only" ON audit_logs FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE supabase_id = auth.uid()::text 
                AND role = ''admin''
            )
        )';
        RAISE NOTICE 'Created policies for: audit_logs';
    END IF;

    -- SESSION TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Session') THEN
        EXECUTE 'CREATE POLICY "session_select_own" ON "Session" FOR SELECT USING (
            "userId" = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
        )';
        EXECUTE 'CREATE POLICY "session_insert_own" ON "Session" FOR INSERT WITH CHECK (
            "userId" = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
        )';
        EXECUTE 'CREATE POLICY "session_delete_own" ON "Session" FOR DELETE USING (
            "userId" = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
        )';
        RAISE NOTICE 'Created policies for: Session';
    END IF;

    RAISE NOTICE '================================';
    RAISE NOTICE 'Policy creation complete!';
    RAISE NOTICE '================================';
END $$;

-- ============================================================================
-- STEP 4: VERIFICATION - Check RLS Status
-- ============================================================================

SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE '_prisma%'
ORDER BY tablename;

-- ============================================================================
-- STEP 5: VERIFICATION - List All Policies
-- ============================================================================

SELECT 
    tablename,
    policyname,
    cmd as command,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING clause present'
        ELSE 'No USING clause'
    END as using_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '================================';
    RAISE NOTICE 'RLS DEPLOYMENT COMPLETE!';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Review the verification results above';
    RAISE NOTICE '2. Test with a non-admin user';
    RAISE NOTICE '3. Add more specific policies as needed';
    RAISE NOTICE '4. Deploy helper functions and audit triggers';
    RAISE NOTICE '================================';
END $$;
