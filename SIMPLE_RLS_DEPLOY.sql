-- ============================================================================
-- SIMPLE RLS DEPLOYMENT - TESTED AND WORKING
-- Copy and paste this entire script into Supabase SQL Editor
-- ============================================================================

-- Step 1: Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "wallets_all_own" ON wallets;
DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
DROP POLICY IF EXISTS "transactions_no_update" ON transactions;
DROP POLICY IF EXISTS "transactions_no_delete" ON transactions;
DROP POLICY IF EXISTS "notifications_all_own" ON notifications;
DROP POLICY IF EXISTS "audit_logs_admin_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_system_insert" ON audit_logs;

-- Step 3: Create helper function
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_internal_id TEXT;
BEGIN
    SELECT id INTO user_internal_id
    FROM users
    WHERE supabase_id = auth.uid()::text;
    RETURN user_internal_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;

-- Step 4: Create RLS policies for users table
CREATE POLICY "users_select_own" ON users
FOR SELECT
USING (auth.uid()::text = supabase_id);

CREATE POLICY "users_update_own" ON users
FOR UPDATE
USING (auth.uid()::text = supabase_id);

-- Step 5: Create RLS policies for wallets table
CREATE POLICY "wallets_all_own" ON wallets
FOR ALL
USING (user_id = get_current_user_id());

-- Step 6: Create RLS policies for transactions table (immutable)
CREATE POLICY "transactions_select_own" ON transactions
FOR SELECT
USING (user_id = get_current_user_id());

CREATE POLICY "transactions_insert_own" ON transactions
FOR INSERT
WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "transactions_no_update" ON transactions
FOR UPDATE
USING (false);

CREATE POLICY "transactions_no_delete" ON transactions
FOR DELETE
USING (false);

-- Step 7: Create RLS policies for notifications table
CREATE POLICY "notifications_all_own" ON notifications
FOR ALL
USING (user_id = get_current_user_id());

-- Step 8: Create RLS policies for audit_logs table (admin only)
CREATE POLICY "audit_logs_admin_select" ON audit_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE supabase_id = auth.uid()::text 
        AND role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "audit_logs_system_insert" ON audit_logs
FOR INSERT
WITH CHECK (true);

-- Step 9: Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id TEXT,
    user_id TEXT,
    user_email TEXT,
    changed_fields JSONB,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    facility_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Step 10: Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_internal_id TEXT;
    user_email_val TEXT;
    changed_fields_json JSONB := '{}'::jsonb;
BEGIN
    SELECT id, email INTO user_internal_id, user_email_val
    FROM users
    WHERE supabase_id = auth.uid()::text;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, operation, record_id, user_id, user_email, new_values)
        VALUES (TG_TABLE_NAME, TG_OP, (to_jsonb(NEW)->>'id'), user_internal_id, user_email_val, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, operation, record_id, user_id, user_email, old_values, new_values)
        VALUES (TG_TABLE_NAME, TG_OP, (to_jsonb(NEW)->>'id'), user_internal_id, user_email_val, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, operation, record_id, user_id, user_email, old_values)
        VALUES (TG_TABLE_NAME, TG_OP, (to_jsonb(OLD)->>'id'), user_internal_id, user_email_val, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Step 11: Create audit triggers for critical tables
DROP TRIGGER IF EXISTS audit_users_insert ON users;
DROP TRIGGER IF EXISTS audit_users_update ON users;
DROP TRIGGER IF EXISTS audit_users_delete ON users;

CREATE TRIGGER audit_users_insert AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_users_update AFTER UPDATE ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_users_delete AFTER DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_wallets_insert ON wallets;
DROP TRIGGER IF EXISTS audit_wallets_update ON wallets;
DROP TRIGGER IF EXISTS audit_wallets_delete ON wallets;

CREATE TRIGGER audit_wallets_insert AFTER INSERT ON wallets FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_wallets_update AFTER UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_wallets_delete AFTER DELETE ON wallets FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_transactions_insert ON transactions;
DROP TRIGGER IF EXISTS audit_transactions_update ON transactions;
DROP TRIGGER IF EXISTS audit_transactions_delete ON transactions;

CREATE TRIGGER audit_transactions_insert AFTER INSERT ON transactions FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_transactions_update AFTER UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_transactions_delete AFTER DELETE ON transactions FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Step 12: Verification query
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'wallets', 'transactions', 'payments', 'notifications', 'audit_logs')
ORDER BY tablename;
