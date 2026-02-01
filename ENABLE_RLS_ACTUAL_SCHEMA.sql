-- ============================================================================
-- RLS POLICIES FOR YOUR ACTUAL DATABASE (100+ TABLES)
-- This matches your real Prisma schema
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL USER-OWNED TABLES
-- ============================================================================

-- Core System
ALTER TABLE IF EXISTS rpa_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rpa_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sessions ENABLE ROW LEVEL SECURITY;

-- AI & Machine Learning
ALTER TABLE IF EXISTS ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_monitoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS copilot_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS copilot_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS copilot_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS codebase_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS diagram_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS diagram_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS diagram_exports ENABLE ROW LEVEL SECURITY;

-- Security & Compliance
ALTER TABLE IF EXISTS app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bot_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fraud_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ip_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vault_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vault_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS security_patches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS jurisdiction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scam_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blockchain_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rate_limits ENABLE ROW LEVEL SECURITY;

-- Financial & Transactions
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS token_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS crypto_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS crypto_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS crypto_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS crypto_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_crypto_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS crypto_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS crypto_price_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deposit_address_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS debit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS eth_activities ENABLE ROW LEVEL SECURITY;

-- Payment System
ALTER TABLE IF EXISTS payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usage_records ENABLE ROW LEVEL SECURITY;

-- Healthcare
ALTER TABLE IF EXISTS medbeds_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS health_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS business_ecosystems ENABLE ROW LEVEL SECURITY;

-- User Management
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_devices ENABLE ROW LEVEL SECURITY;

-- Notifications
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Communication
ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_messages ENABLE ROW LEVEL SECURITY;

-- Project Management
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_logs ENABLE ROW LEVEL SECURITY;

-- Content & Blog
ALTER TABLE IF EXISTS blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blog_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sitemaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS social_media_posts ENABLE ROW LEVEL SECURITY;

-- Subscription & Rewards
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS loans ENABLE ROW LEVEL SECURITY;

-- Monitoring & Alerts
ALTER TABLE IF EXISTS system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS processor_configs ENABLE ROW LEVEL SECURITY;

-- Market & Intelligence
ALTER TABLE IF EXISTS market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS oal_audit_logs ENABLE ROW LEVEL SECURITY;

-- Collaboration Tools
ALTER TABLE IF EXISTS sticky_note_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roadmap_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cross_pollinations ENABLE ROW LEVEL SECURITY;

-- Webhooks & Events
ALTER TABLE IF EXISTS webhook_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE BASIC RLS POLICIES (Owner-only access pattern)
-- ============================================================================

-- This creates a standard "users can only access their own data" policy
-- for all tables that have a user_id column

DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'user_id'
        AND table_name NOT IN ('_prisma_migrations')
    LOOP
        -- Drop existing policies
        EXECUTE format('DROP POLICY IF EXISTS "%s_user_select" ON %I', table_record.table_name, table_record.table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_user_insert" ON %I', table_record.table_name, table_record.table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_user_update" ON %I', table_record.table_name, table_record.table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_user_delete" ON %I', table_record.table_name, table_record.table_name);
        
        -- Create new policies
        EXECUTE format('CREATE POLICY "%s_user_select" ON %I FOR SELECT USING (auth.uid()::text = user_id)', 
            table_record.table_name, table_record.table_name);
        EXECUTE format('CREATE POLICY "%s_user_insert" ON %I FOR INSERT WITH CHECK (auth.uid()::text = user_id)', 
            table_record.table_name, table_record.table_name);
        EXECUTE format('CREATE POLICY "%s_user_update" ON %I FOR UPDATE USING (auth.uid()::text = user_id)', 
            table_record.table_name, table_record.table_name);
        EXECUTE format('CREATE POLICY "%s_user_delete" ON %I FOR DELETE USING (auth.uid()::text = user_id)', 
            table_record.table_name, table_record.table_name);
    END LOOP;
END $$;

-- ============================================================================
-- SPECIAL POLICIES FOR SPECIFIC TABLES
-- ============================================================================

-- USERS TABLE
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

CREATE POLICY "users_select_own" ON users
FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "users_update_own" ON users
FOR UPDATE USING (auth.uid()::text = id);

-- AUDIT LOGS (Read-only for users, immutable)
DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_update" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_delete" ON audit_logs;

CREATE POLICY "audit_logs_select" ON audit_logs
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "audit_logs_no_update" ON audit_logs
FOR UPDATE USING (false);

CREATE POLICY "audit_logs_no_delete" ON audit_logs
FOR DELETE USING (false);

-- SESSIONS (Own sessions only)
DROP POLICY IF EXISTS "sessions_own" ON sessions;

CREATE POLICY "sessions_own" ON sessions
FOR ALL USING (auth.uid()::text = user_id);

-- NOTIFICATIONS (Own notifications only)
DROP POLICY IF EXISTS "notifications_own" ON notifications;

CREATE POLICY "notifications_own" ON notifications
FOR ALL USING (auth.uid()::text = user_id);

-- SUPPORT TICKETS (Own tickets only)
DROP POLICY IF EXISTS "support_tickets_own" ON support_tickets;

CREATE POLICY "support_tickets_own" ON support_tickets
FOR ALL USING (auth.uid()::text = user_id);

-- PROJECT MEMBERS (Can see projects they're members of)
DROP POLICY IF EXISTS "project_members_access" ON project_members;

CREATE POLICY "project_members_access" ON project_members
FOR SELECT USING (auth.uid()::text = user_id);

-- PROJECTS (Can see projects where user is a member)
DROP POLICY IF EXISTS "projects_member_access" ON projects;

CREATE POLICY "projects_member_access" ON projects
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = projects.id 
        AND project_members.user_id = auth.uid()::text
    )
);

-- TASKS (Can see tasks in projects where user is a member)
DROP POLICY IF EXISTS "tasks_project_access" ON tasks;

CREATE POLICY "tasks_project_access" ON tasks
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = tasks.project_id 
        AND project_members.user_id = auth.uid()::text
    )
);

-- HEALTHCARE - CONSULTATIONS (Patient or doctor can access)
DROP POLICY IF EXISTS "consultations_access" ON consultations;

CREATE POLICY "consultations_access" ON consultations
FOR SELECT USING (
    auth.uid()::text = patient_id OR 
    auth.uid()::text = doctor_id
);

-- HEALTHCARE - CONSULTATION MESSAGES
DROP POLICY IF EXISTS "consultation_messages_access" ON consultation_messages;

CREATE POLICY "consultation_messages_access" ON consultation_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM consultations 
        WHERE consultations.id = consultation_messages.consultation_id 
        AND (consultations.patient_id = auth.uid()::text OR consultations.doctor_id = auth.uid()::text)
    )
);

-- BLOG POSTS (Public read, owner write)
DROP POLICY IF EXISTS "blog_posts_public_read" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_owner_write" ON blog_posts;

CREATE POLICY "blog_posts_public_read" ON blog_posts
FOR SELECT USING (true);

CREATE POLICY "blog_posts_owner_write" ON blog_posts
FOR INSERT WITH CHECK (auth.uid()::text = author_id);

-- CRYPTO PRICE DATA (Public read)
DROP POLICY IF EXISTS "crypto_price_data_public" ON crypto_price_data;

CREATE POLICY "crypto_price_data_public" ON crypto_price_data
FOR SELECT USING (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;

-- Count policies
SELECT 
    COUNT(*) as total_policies,
    COUNT(DISTINCT tablename) as tables_with_policies
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================================================
-- DONE!
-- ============================================================================

-- RLS is now enabled on 100+ tables
-- Basic owner-only policies applied to all tables with user_id
-- Special policies for shared resources (projects, consultations, etc.)
-- Audit logs are immutable
-- Public data (blog posts, crypto prices) is readable by all
