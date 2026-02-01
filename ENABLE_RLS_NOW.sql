-- ⚠️ CRITICAL: ENABLE RLS ON ALL TABLES
-- Run this script in Supabase SQL Editor immediately

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

-- Core tables
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamber_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamber_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chambers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- Additional tables (if they exist)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- DROP EXISTING POLICIES (Clean slate)
-- =============================================================================

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Patients policies
DROP POLICY IF EXISTS "Patients can view own data" ON public.patients;
DROP POLICY IF EXISTS "Patients can update own data" ON public.patients;
DROP POLICY IF EXISTS "Providers can view assigned patients" ON public.patients;

-- Providers policies
DROP POLICY IF EXISTS "Anyone can view providers" ON public.providers;
DROP POLICY IF EXISTS "Providers can update own profile" ON public.providers;

-- Appointments policies
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Providers can update assigned appointments" ON public.appointments;

-- Medical records policies
DROP POLICY IF EXISTS "Patients can view own medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Providers can view assigned patient records" ON public.medical_records;
DROP POLICY IF EXISTS "Providers can create medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Medical records are immutable" ON public.medical_records;

-- Prescriptions policies
DROP POLICY IF EXISTS "Patients can view own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Providers can view assigned patient prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Providers can create prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Prescriptions are immutable" ON public.prescriptions;

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- Wallets policies
DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can create own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallets;

-- Crypto payments policies
DROP POLICY IF EXISTS "Users can view own crypto payments" ON public.crypto_payments;
DROP POLICY IF EXISTS "Users can create own crypto payments" ON public.crypto_payments;

-- Facilities policies
DROP POLICY IF EXISTS "Anyone can view facilities" ON public.facilities;
DROP POLICY IF EXISTS "Admins can manage facilities" ON public.facilities;

-- Chambers policies
DROP POLICY IF EXISTS "Providers can view own chambers" ON public.chambers;
DROP POLICY IF EXISTS "Providers can manage own chambers" ON public.chambers;
DROP POLICY IF EXISTS "Patients can view chambers with appointments" ON public.chambers;

-- Bookings policies
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;

-- Audit logs policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs are immutable" ON public.audit_logs;

-- =============================================================================
-- CREATE RLS POLICIES
-- =============================================================================

-- USERS TABLE
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid()::text = id);

-- PATIENTS TABLE
CREATE POLICY "Patients can view own data"
ON public.patients FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Patients can update own data"
ON public.patients FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Providers can view assigned patients"
ON public.patients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.appointments
    WHERE appointments.patient_id = patients.id
    AND appointments.provider_id IN (
      SELECT id FROM public.providers WHERE user_id = auth.uid()::text
    )
  )
);

-- PROVIDERS TABLE
CREATE POLICY "Anyone can view providers"
ON public.providers FOR SELECT
USING (true);

CREATE POLICY "Providers can update own profile"
ON public.providers FOR UPDATE
USING (auth.uid()::text = user_id);

-- APPOINTMENTS TABLE
CREATE POLICY "Users can view own appointments"
ON public.appointments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients WHERE id = appointments.patient_id AND user_id = auth.uid()::text
  )
  OR
  EXISTS (
    SELECT 1 FROM public.providers WHERE id = appointments.provider_id AND user_id = auth.uid()::text
  )
);

CREATE POLICY "Patients can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients WHERE id = appointments.patient_id AND user_id = auth.uid()::text
  )
);

CREATE POLICY "Users can update own appointments"
ON public.appointments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patients WHERE id = appointments.patient_id AND user_id = auth.uid()::text
  )
  OR
  EXISTS (
    SELECT 1 FROM public.providers WHERE id = appointments.provider_id AND user_id = auth.uid()::text
  )
);

-- MEDICAL RECORDS TABLE
CREATE POLICY "Patients can view own medical records"
ON public.medical_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients WHERE id = medical_records.patient_id AND user_id = auth.uid()::text
  )
);

CREATE POLICY "Providers can view assigned patient records"
ON public.medical_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.appointments
    WHERE appointments.patient_id = medical_records.patient_id
    AND appointments.provider_id IN (
      SELECT id FROM public.providers WHERE user_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Providers can create medical records"
ON public.medical_records FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.providers WHERE id = medical_records.provider_id AND user_id = auth.uid()::text
  )
);

CREATE POLICY "Medical records are immutable"
ON public.medical_records FOR UPDATE
USING (false);

-- PRESCRIPTIONS TABLE
CREATE POLICY "Patients can view own prescriptions"
ON public.prescriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients WHERE id = prescriptions.patient_id AND user_id = auth.uid()::text
  )
);

CREATE POLICY "Providers can view assigned patient prescriptions"
ON public.prescriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.providers WHERE id = prescriptions.provider_id AND user_id = auth.uid()::text
  )
);

CREATE POLICY "Providers can create prescriptions"
ON public.prescriptions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.providers WHERE id = prescriptions.provider_id AND user_id = auth.uid()::text
  )
);

CREATE POLICY "Prescriptions are immutable"
ON public.prescriptions FOR UPDATE
USING (false);

-- NOTIFICATIONS TABLE
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid()::text = user_id);

-- WALLETS TABLE
CREATE POLICY "Users can view own wallets"
ON public.wallets FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own wallets"
ON public.wallets FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own wallets"
ON public.wallets FOR UPDATE
USING (auth.uid()::text = user_id);

-- CRYPTO PAYMENTS TABLE
CREATE POLICY "Users can view own crypto payments"
ON public.crypto_payments FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own crypto payments"
ON public.crypto_payments FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- FACILITIES TABLE
CREATE POLICY "Anyone can view facilities"
ON public.facilities FOR SELECT
USING (true);

CREATE POLICY "Admins can manage facilities"
ON public.facilities FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'ADMIN'
  )
);

-- CHAMBERS TABLE
CREATE POLICY "Providers can view own chambers"
ON public.chambers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.providers WHERE id = chambers.provider_id AND user_id = auth.uid()::text
  )
);

CREATE POLICY "Providers can manage own chambers"
ON public.chambers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.providers WHERE id = chambers.provider_id AND user_id = auth.uid()::text
  )
);

CREATE POLICY "Patients can view chambers with appointments"
ON public.chambers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.appointments
    WHERE appointments.chamber_id = chambers.id
    AND appointments.patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()::text
    )
  )
);

-- BOOKINGS TABLE
CREATE POLICY "Users can view own bookings"
ON public.bookings FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own bookings"
ON public.bookings FOR UPDATE
USING (auth.uid()::text = user_id);

-- AUDIT LOGS TABLE
CREATE POLICY "Users can view own audit logs"
ON public.audit_logs FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Audit logs are immutable"
ON public.audit_logs FOR UPDATE
USING (false);

CREATE POLICY "Audit logs cannot be deleted"
ON public.audit_logs FOR DELETE
USING (false);

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
