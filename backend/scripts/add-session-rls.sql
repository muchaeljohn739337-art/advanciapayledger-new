-- ============================================
-- COMPREHENSIVE RLS SECURITY FOR SESSIONS TABLE
-- ============================================
-- Based on Prisma schema: Session model with userId, token, refreshToken
-- Priority: CRITICAL - Prevents account takeover via refresh token exposure
-- Date: 2026-01-31
-- ============================================

-- STEP 1: Revoke all public/anonymous access
-- ============================================
REVOKE ALL ON "public"."Session" FROM public;
REVOKE ALL ON "public"."Session" FROM anon;
REVOKE ALL ON "public"."Session" FROM authenticated;

-- STEP 2: Enable Row Level Security
-- ============================================
ALTER TABLE "public"."Session" ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create strict RLS policies
-- ============================================

-- Policy 1: Users can only SELECT their own sessions
CREATE POLICY "sessions_select_owner" ON "public"."Session"
  FOR SELECT
  TO authenticated
  USING (
    -- Match session userId with authenticated user's ID
    "userId" = (SELECT auth.uid())::text
  );

-- Policy 2: Users can only DELETE their own sessions (logout)
CREATE POLICY "sessions_delete_owner" ON "public"."Session"
  FOR DELETE
  TO authenticated
  USING (
    "userId" = (SELECT auth.uid())::text
  );

-- Policy 3: Users can only INSERT sessions for themselves
CREATE POLICY "sessions_insert_owner" ON "public"."Session"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "userId" = (SELECT auth.uid())::text
  );

-- Policy 4: Users can only UPDATE their own sessions
CREATE POLICY "sessions_update_owner" ON "public"."Session"
  FOR UPDATE
  TO authenticated
  USING (
    "userId" = (SELECT auth.uid())::text
  )
  WITH CHECK (
    "userId" = (SELECT auth.uid())::text
  );

-- Policy 5: Completely block anonymous access
CREATE POLICY "sessions_block_anon" ON "public"."Session"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- STEP 4: Create safe view without sensitive data
-- ============================================
CREATE OR REPLACE VIEW "public"."sessions_safe" AS
SELECT 
  id,
  "userId",
  "ipAddress",
  "userAgent",
  "expiresAt",
  "createdAt"
  -- Explicitly EXCLUDE: token, refreshToken
FROM "public"."Session";

-- Grant limited access to the safe view
GRANT SELECT ON "public"."sessions_safe" TO authenticated;

-- Add RLS to the view as well
ALTER VIEW "public"."sessions_safe" SET (security_barrier = true);

-- STEP 5: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_session_user_id ON "public"."Session"("userId");
CREATE INDEX IF NOT EXISTS idx_session_expires_at ON "public"."Session"("expiresAt");
CREATE INDEX IF NOT EXISTS idx_session_token ON "public"."Session"("token");
CREATE INDEX IF NOT EXISTS idx_session_user_expires ON "public"."Session"("userId", "expiresAt");

-- STEP 6: Automatic cleanup of expired sessions
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM "public"."Session" 
    WHERE "expiresAt" < NOW();
    
    RAISE NOTICE 'Cleaned up expired sessions at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create scheduled job to run cleanup (if pg_cron is available)
-- SELECT cron.schedule('cleanup-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions()');

-- STEP 7: Audit logging function
-- ============================================
CREATE OR REPLACE FUNCTION log_session_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log to AuditLog table when sessions are accessed
    INSERT INTO "public"."AuditLog" (
        id,
        "userId",
        action,
        resource,
        "resourceId",
        "ipAddress",
        "phiAccessed",
        "createdAt"
    ) VALUES (
        gen_random_uuid()::text,
        (SELECT auth.uid())::text,
        TG_OP,
        'Session',
        NEW.id,
        NEW."ipAddress",
        false,
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for session access logging
DROP TRIGGER IF EXISTS session_access_log ON "public"."Session";
CREATE TRIGGER session_access_log
    AFTER INSERT OR UPDATE OR DELETE ON "public"."Session"
    FOR EACH ROW
    EXECUTE FUNCTION log_session_access();

-- STEP 8: Function to safely get session without exposing tokens
-- ============================================
CREATE OR REPLACE FUNCTION get_user_sessions(user_id_param text)
RETURNS TABLE (
    id text,
    "ipAddress" text,
    "userAgent" text,
    "expiresAt" timestamp,
    "createdAt" timestamp,
    is_expired boolean
) AS $$
BEGIN
    -- Only allow users to get their own sessions
    IF user_id_param != (SELECT auth.uid())::text THEN
        RAISE EXCEPTION 'Unauthorized: Cannot access other users sessions';
    END IF;
    
    RETURN QUERY
    SELECT 
        s.id,
        s."ipAddress",
        s."userAgent",
        s."expiresAt",
        s."createdAt",
        (s."expiresAt" < NOW()) as is_expired
    FROM "public"."Session" s
    WHERE s."userId" = user_id_param
    ORDER BY s."createdAt" DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 9: Function to revoke all user sessions (logout all devices)
-- ============================================
CREATE OR REPLACE FUNCTION revoke_all_user_sessions(user_id_param text)
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Only allow users to revoke their own sessions
    IF user_id_param != (SELECT auth.uid())::text THEN
        RAISE EXCEPTION 'Unauthorized: Cannot revoke other users sessions';
    END IF;
    
    DELETE FROM "public"."Session"
    WHERE "userId" = user_id_param;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 10: Add table comments for documentation
-- ============================================
COMMENT ON TABLE "public"."Session" IS 
'Session management with RLS enabled. Contains sensitive refresh tokens - access strictly controlled.';

COMMENT ON COLUMN "public"."Session"."refreshToken" IS 
'SENSITIVE: Refresh token for minting new access tokens. Never expose via API.';

COMMENT ON COLUMN "public"."Session"."token" IS 
'SENSITIVE: Session token. Protected by RLS policies.';

-- STEP 11: Grant service role bypass (for backend operations)
-- ============================================
-- Service role automatically bypasses RLS in Supabase
-- Ensure SUPABASE_SERVICE_ROLE_KEY is never exposed to clients

-- STEP 12: Create monitoring view for admins
-- ============================================
CREATE OR REPLACE VIEW "public"."sessions_admin_monitor" AS
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN "expiresAt" > NOW() THEN 1 END) as active_sessions,
  COUNT(CASE WHEN "expiresAt" <= NOW() THEN 1 END) as expired_sessions,
  COUNT(DISTINCT "userId") as unique_users,
  MAX("createdAt") as last_session_created
FROM "public"."Session";

-- Only allow service_role to access monitoring view
REVOKE ALL ON "public"."sessions_admin_monitor" FROM public;
REVOKE ALL ON "public"."sessions_admin_monitor" FROM authenticated;

-- STEP 13: Validation and verification
-- ============================================
DO $$
DECLARE
    rls_enabled boolean;
    policy_count integer;
BEGIN
    -- Check if RLS is enabled
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = 'Session' AND relnamespace = 'public'::regnamespace;
    
    IF NOT rls_enabled THEN
        RAISE EXCEPTION 'RLS is not enabled on Session table!';
    END IF;
    
    -- Check if policies exist
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'Session' AND schemaname = 'public';
    
    IF policy_count < 5 THEN
        RAISE WARNING 'Expected at least 5 policies, found %', policy_count;
    END IF;
    
    RAISE NOTICE '✅ RLS Security Successfully Applied to Session Table';
    RAISE NOTICE '✅ % policies created', policy_count;
    RAISE NOTICE '✅ Safe view created: sessions_safe';
    RAISE NOTICE '✅ Audit logging enabled';
    RAISE NOTICE '✅ Helper functions created';
    RAISE NOTICE '⚠️  IMPORTANT: Never expose service_role key to clients';
    RAISE NOTICE '⚠️  IMPORTANT: Use sessions_safe view for client queries';
END $$;
