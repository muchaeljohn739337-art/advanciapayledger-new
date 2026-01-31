-- ============================================
-- RLS VERIFICATION SCRIPT
-- ============================================
-- Run this after applying add-session-rls.sql
-- All checks should pass for proper security
-- ============================================

\echo '🔍 Starting RLS Verification...'
\echo ''

-- CHECK 1: Verify RLS is enabled
\echo '✓ CHECK 1: RLS Enabled on Session table'
SELECT 
    CASE 
        WHEN relrowsecurity = true THEN '✅ PASS: RLS is enabled'
        ELSE '❌ FAIL: RLS is NOT enabled'
    END as status
FROM pg_class
WHERE relname = 'Session' AND relnamespace = 'public'::regnamespace;

\echo ''

-- CHECK 2: Count RLS policies
\echo '✓ CHECK 2: RLS Policies exist'
SELECT 
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ PASS: ' || COUNT(*) || ' policies found (expected 5+)'
        ELSE '❌ FAIL: Only ' || COUNT(*) || ' policies found (expected 5+)'
    END as status
FROM pg_policies
WHERE tablename = 'Session' AND schemaname = 'public';

\echo ''

-- CHECK 3: List all policies
\echo '✓ CHECK 3: Policy Details'
SELECT 
    policyname as policy_name,
    cmd as command,
    roles::text as applies_to
FROM pg_policies
WHERE tablename = 'Session' AND schemaname = 'public'
ORDER BY policyname;

\echo ''

-- CHECK 4: Verify safe view exists
\echo '✓ CHECK 4: Safe View exists'
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS: sessions_safe view exists'
        ELSE '❌ FAIL: sessions_safe view not found'
    END as status
FROM pg_views
WHERE viewname = 'sessions_safe' AND schemaname = 'public';

\echo ''

-- CHECK 5: Verify helper functions exist
\echo '✓ CHECK 5: Helper Functions exist'
SELECT 
    proname as function_name,
    '✅ EXISTS' as status
FROM pg_proc
WHERE proname IN ('get_user_sessions', 'revoke_all_user_sessions', 'cleanup_expired_sessions')
ORDER BY proname;

\echo ''

-- CHECK 6: Verify indexes exist
\echo '✓ CHECK 6: Performance Indexes'
SELECT 
    indexname as index_name,
    '✅ EXISTS' as status
FROM pg_indexes
WHERE tablename = 'Session' AND schemaname = 'public'
ORDER BY indexname;

\echo ''

-- CHECK 7: Verify audit trigger exists
\echo '✓ CHECK 7: Audit Logging Trigger'
SELECT 
    tgname as trigger_name,
    '✅ EXISTS' as status
FROM pg_trigger
WHERE tgrelid = 'public.Session'::regclass
AND tgname = 'session_access_log';

\echo ''

-- CHECK 8: Verify no public grants
\echo '✓ CHECK 8: No Public Access Grants'
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS: No public grants found'
        ELSE '❌ WARNING: ' || COUNT(*) || ' public grants found'
    END as status
FROM information_schema.table_privileges
WHERE table_name = 'Session' 
AND table_schema = 'public'
AND grantee IN ('public', 'anon');

\echo ''

-- CHECK 9: Test safe view columns
\echo '✓ CHECK 9: Safe View excludes sensitive columns'
SELECT 
    column_name,
    CASE 
        WHEN column_name IN ('token', 'refreshToken') THEN '❌ FAIL: Sensitive column exposed'
        ELSE '✅ PASS: Safe column'
    END as status
FROM information_schema.columns
WHERE table_name = 'sessions_safe' AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''

-- CHECK 10: Session statistics
\echo '✓ CHECK 10: Current Session Statistics'
SELECT 
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN "expiresAt" > NOW() THEN 1 END) as active_sessions,
    COUNT(CASE WHEN "expiresAt" <= NOW() THEN 1 END) as expired_sessions,
    COUNT(DISTINCT "userId") as unique_users
FROM "public"."Session";

\echo ''
\echo '============================================'
\echo '📊 VERIFICATION COMPLETE'
\echo '============================================'
\echo ''
\echo 'If all checks show ✅ PASS, your RLS is properly configured!'
\echo 'If any checks show ❌ FAIL, review the add-session-rls.sql script.'
\echo ''
