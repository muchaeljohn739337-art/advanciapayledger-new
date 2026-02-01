-- ============================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) POLICIES
-- Advancia PayLedger - Production Security
-- ============================================
-- Date: January 31, 2026
-- Purpose: Secure all tables with proper RLS policies
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- ============================================
-- Users can only access their own data
-- Backend service role can override (automatic with service key)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own row
CREATE POLICY "Users: select own"
ON users
FOR SELECT
USING (auth.uid()::text = id);

-- Users can UPDATE their own row
CREATE POLICY "Users: update own"
ON users
FOR UPDATE
USING (auth.uid()::text = id);

-- Users can INSERT their own row (during registration)
CREATE POLICY "Users: insert own"
ON users
FOR INSERT
WITH CHECK (auth.uid()::text = supabase_id);

-- ============================================
-- 2. TRANSACTIONS TABLE
-- ============================================
-- Users can only see their own transactions

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own transactions
CREATE POLICY "Transactions: select own"
ON transactions
FOR SELECT
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = transactions.user_id));

-- Users cannot directly INSERT transactions (backend only)
CREATE POLICY "Transactions: no direct insert"
ON transactions
FOR INSERT
WITH CHECK (false);

-- Users cannot UPDATE transactions
CREATE POLICY "Transactions: no update"
ON transactions
FOR UPDATE
USING (false);

-- Users cannot DELETE transactions
CREATE POLICY "Transactions: no delete"
ON transactions
FOR DELETE
USING (false);

-- ============================================
-- 3. WALLETS TABLE
-- ============================================
-- Users can only access their own wallets

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own wallets
CREATE POLICY "Wallets: select own"
ON wallets
FOR SELECT
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = wallets.user_id));

-- Users cannot INSERT wallets (backend only)
CREATE POLICY "Wallets: no direct insert"
ON wallets
FOR INSERT
WITH CHECK (false);

-- Users cannot UPDATE wallets
CREATE POLICY "Wallets: no update"
ON wallets
FOR UPDATE
USING (false);

-- Users cannot DELETE wallets
CREATE POLICY "Wallets: no delete"
ON wallets
FOR DELETE
USING (false);

-- ============================================
-- 4. PAYMENTS TABLE
-- ============================================
-- Users can only see their own payments

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own payments
CREATE POLICY "Payments: select own"
ON payments
FOR SELECT
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = payments.user_id));

-- Users can INSERT payment requests
CREATE POLICY "Payments: insert own"
ON payments
FOR INSERT
WITH CHECK (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = user_id));

-- Users cannot UPDATE payments (backend only)
CREATE POLICY "Payments: no update"
ON payments
FOR UPDATE
USING (false);

-- Users cannot DELETE payments
CREATE POLICY "Payments: no delete"
ON payments
FOR DELETE
USING (false);

-- ============================================
-- 5. CRYPTO_PAYMENTS TABLE
-- ============================================
-- Users can only see their own crypto payments

ALTER TABLE crypto_payments ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own crypto payments
CREATE POLICY "Crypto Payments: select own"
ON crypto_payments
FOR SELECT
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = crypto_payments.user_id));

-- Users can INSERT crypto payment requests
CREATE POLICY "Crypto Payments: insert own"
ON crypto_payments
FOR INSERT
WITH CHECK (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = user_id));

-- Users cannot UPDATE crypto payments (backend only)
CREATE POLICY "Crypto Payments: no update"
ON crypto_payments
FOR UPDATE
USING (false);

-- Users cannot DELETE crypto payments
CREATE POLICY "Crypto Payments: no delete"
ON crypto_payments
FOR DELETE
USING (false);

-- ============================================
-- 6. FACILITIES TABLE
-- ============================================
-- Public read, admin write

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- Anyone can SELECT facilities (public info)
CREATE POLICY "Facilities: public read"
ON facilities
FOR SELECT
USING (true);

-- Only admins can INSERT facilities (backend only)
CREATE POLICY "Facilities: admin only insert"
ON facilities
FOR INSERT
WITH CHECK (false);

-- Only admins can UPDATE facilities (backend only)
CREATE POLICY "Facilities: admin only update"
ON facilities
FOR UPDATE
USING (false);

-- Only admins can DELETE facilities (backend only)
CREATE POLICY "Facilities: admin only delete"
ON facilities
FOR DELETE
USING (false);

-- ============================================
-- 7. PATIENTS TABLE
-- ============================================
-- Users can only see their own patient records

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own patient records
CREATE POLICY "Patients: select own"
ON patients
FOR SELECT
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = patients.user_id));

-- Users can INSERT their own patient records
CREATE POLICY "Patients: insert own"
ON patients
FOR INSERT
WITH CHECK (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = user_id));

-- Users can UPDATE their own patient records
CREATE POLICY "Patients: update own"
ON patients
FOR UPDATE
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = patients.user_id));

-- Users cannot DELETE patient records
CREATE POLICY "Patients: no delete"
ON patients
FOR DELETE
USING (false);

-- ============================================
-- 8. PROVIDERS TABLE
-- ============================================
-- Providers can manage their own records

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Providers can SELECT their own records
CREATE POLICY "Providers: select own"
ON providers
FOR SELECT
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = providers.user_id));

-- Providers can INSERT their own records
CREATE POLICY "Providers: insert own"
ON providers
FOR INSERT
WITH CHECK (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = user_id));

-- Providers can UPDATE their own records
CREATE POLICY "Providers: update own"
ON providers
FOR UPDATE
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = providers.user_id));

-- Providers cannot DELETE their records
CREATE POLICY "Providers: no delete"
ON providers
FOR DELETE
USING (false);

-- ============================================
-- 9. INVOICES TABLE
-- ============================================
-- Users can only see their own invoices

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own invoices
CREATE POLICY "Invoices: select own"
ON invoices
FOR SELECT
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = invoices.user_id));

-- Users cannot INSERT invoices (backend only)
CREATE POLICY "Invoices: no direct insert"
ON invoices
FOR INSERT
WITH CHECK (false);

-- Users cannot UPDATE invoices
CREATE POLICY "Invoices: no update"
ON invoices
FOR UPDATE
USING (false);

-- Users cannot DELETE invoices
CREATE POLICY "Invoices: no delete"
ON invoices
FOR DELETE
USING (false);

-- ============================================
-- 10. AUDIT_LOGS TABLE
-- ============================================
-- Users can only see their own audit logs
-- No modifications allowed

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own audit logs
CREATE POLICY "Audit Logs: select own"
ON audit_logs
FOR SELECT
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = audit_logs.user_id));

-- Users cannot INSERT audit logs (backend only)
CREATE POLICY "Audit Logs: no direct insert"
ON audit_logs
FOR INSERT
WITH CHECK (false);

-- Users cannot UPDATE audit logs
CREATE POLICY "Audit Logs: no update"
ON audit_logs
FOR UPDATE
USING (false);

-- Users cannot DELETE audit logs
CREATE POLICY "Audit Logs: no delete"
ON audit_logs
FOR DELETE
USING (false);

-- ============================================
-- 11. ALERTS TABLE
-- ============================================
-- Users can only see their own alerts

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own alerts
CREATE POLICY "Alerts: select own"
ON alerts
FOR SELECT
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = alerts.user_id));

-- Users cannot INSERT alerts (backend only)
CREATE POLICY "Alerts: no direct insert"
ON alerts
FOR INSERT
WITH CHECK (false);

-- Users can UPDATE their own alerts (mark as read)
CREATE POLICY "Alerts: update own"
ON alerts
FOR UPDATE
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = alerts.user_id));

-- Users cannot DELETE alerts
CREATE POLICY "Alerts: no delete"
ON alerts
FOR DELETE
USING (false);

-- ============================================
-- 12. SESSIONS TABLE
-- ============================================
-- Users can only see their own sessions

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own sessions
CREATE POLICY "Sessions: select own"
ON sessions
FOR SELECT
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = sessions.user_id));

-- Users cannot INSERT sessions (backend only)
CREATE POLICY "Sessions: no direct insert"
ON sessions
FOR INSERT
WITH CHECK (false);

-- Users cannot UPDATE sessions
CREATE POLICY "Sessions: no update"
ON sessions
FOR UPDATE
USING (false);

-- Users can DELETE their own sessions (logout)
CREATE POLICY "Sessions: delete own"
ON sessions
FOR DELETE
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = sessions.user_id));

-- ============================================
-- 13. BOOKINGS TABLE (if exists)
-- ============================================
-- Users can manage their own bookings

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own bookings
CREATE POLICY "Bookings: select own"
ON bookings
FOR SELECT
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = bookings.user_id));

-- Users can INSERT their own bookings
CREATE POLICY "Bookings: insert own"
ON bookings
FOR INSERT
WITH CHECK (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = user_id));

-- Users can UPDATE their own bookings
CREATE POLICY "Bookings: update own"
ON bookings
FOR UPDATE
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = bookings.user_id));

-- Users can DELETE their own bookings
CREATE POLICY "Bookings: delete own"
ON bookings
FOR DELETE
USING (auth.uid()::text = (SELECT supabase_id FROM users WHERE users.id = bookings.user_id));

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify RLS is enabled

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- NOTES
-- ============================================
-- 1. Backend service role key bypasses ALL RLS policies
-- 2. Frontend anon key is restricted by these policies
-- 3. auth.uid() returns the Supabase user ID from JWT
-- 4. All policies default to DENY unless explicitly allowed
-- 5. Sensitive operations (INSERT/UPDATE/DELETE) restricted to backend
-- 6. Users can only see their own data
-- 7. Audit logs and transactions are immutable by users
-- 8. Public tables (facilities) have read-only access for users

-- ============================================
-- DEPLOYMENT
-- ============================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify with verification queries above
-- 3. Test with frontend (anon key)
-- 4. Test with backend (service role key)
-- 5. Monitor for any access denied errors
-- ============================================
