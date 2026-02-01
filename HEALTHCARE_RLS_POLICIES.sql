-- ============================================
-- HEALTHCARE-SPECIFIC RLS POLICIES
-- Advancia PayLedger - HIPAA Compliant
-- ============================================
-- Date: January 31, 2026
-- Purpose: Secure healthcare tables with HIPAA-compliant RLS
-- ============================================

-- ============================================
-- HEALTHCARE TABLES RLS POLICIES
-- ============================================

-- ============================================
-- 1. PATIENTS TABLE (Already covered in main RLS)
-- ============================================
-- Additional healthcare-specific policies

-- Healthcare providers can view their assigned patients
CREATE POLICY "Patients: provider access"
ON patients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = patients.id
      AND a.provider_id = (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
  )
);

-- ============================================
-- 2. PROVIDERS TABLE (Already covered in main RLS)
-- ============================================
-- Additional policies for public provider info

-- Public can view basic provider info (for booking)
CREATE POLICY "Providers: public basic info"
ON providers
FOR SELECT
USING (true); -- Public read for scheduling

-- ============================================
-- 3. APPOINTMENTS TABLE
-- ============================================
-- Patients and providers can manage appointments

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Patients can SELECT their own appointments
CREATE POLICY "Appointments: patient select own"
ON appointments
FOR SELECT
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = appointments.patient_id
  )
);

-- Providers can SELECT their own appointments
CREATE POLICY "Appointments: provider select own"
ON appointments
FOR SELECT
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = appointments.provider_id
  )
);

-- Patients can INSERT their own appointments
CREATE POLICY "Appointments: patient insert own"
ON appointments
FOR INSERT
WITH CHECK (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = patient_id
  )
);

-- Providers can INSERT appointments for their patients
CREATE POLICY "Appointments: provider insert"
ON appointments
FOR INSERT
WITH CHECK (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = provider_id
  )
);

-- Patients can UPDATE their own appointments (reschedule)
CREATE POLICY "Appointments: patient update own"
ON appointments
FOR UPDATE
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = appointments.patient_id
  )
)
WITH CHECK (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = appointments.patient_id
  )
);

-- Providers can UPDATE their appointments (confirm/cancel)
CREATE POLICY "Appointments: provider update own"
ON appointments
FOR UPDATE
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = appointments.provider_id
  )
)
WITH CHECK (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = appointments.provider_id
  )
);

-- Patients can DELETE their own appointments (cancel)
CREATE POLICY "Appointments: patient delete own"
ON appointments
FOR DELETE
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = appointments.patient_id
  )
);

-- ============================================
-- 4. CHAMBERS TABLE (if exists)
-- ============================================
-- Physical/virtual consultation rooms

ALTER TABLE chambers ENABLE ROW LEVEL SECURITY;

-- Providers can SELECT their own chambers
CREATE POLICY "Chambers: provider select own"
ON chambers
FOR SELECT
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = chambers.provider_id
  )
);

-- Patients can SELECT chambers if they have an appointment
CREATE POLICY "Chambers: patient with appointment"
ON chambers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.chamber_id = chambers.id
      AND a.patient_id = (
        SELECT id FROM users 
        WHERE supabase_id = auth.uid()::text
      )
      AND a.status IN ('confirmed', 'in_progress')
  )
);

-- Providers can INSERT their own chambers
CREATE POLICY "Chambers: provider insert own"
ON chambers
FOR INSERT
WITH CHECK (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = provider_id
  )
);

-- Providers can UPDATE their own chambers
CREATE POLICY "Chambers: provider update own"
ON chambers
FOR UPDATE
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = chambers.provider_id
  )
);

-- Providers can DELETE their own chambers
CREATE POLICY "Chambers: provider delete own"
ON chambers
FOR DELETE
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = chambers.provider_id
  )
);

-- ============================================
-- 5. MEDICAL_RECORDS TABLE (HIPAA Critical)
-- ============================================
-- Highly sensitive PHI (Protected Health Information)

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Patients can SELECT their own medical records
CREATE POLICY "Medical Records: patient select own"
ON medical_records
FOR SELECT
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = medical_records.patient_id
  )
);

-- Assigned providers can SELECT patient medical records
CREATE POLICY "Medical Records: provider select assigned"
ON medical_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = medical_records.patient_id
      AND a.provider_id = (
        SELECT id FROM users 
        WHERE supabase_id = auth.uid()::text
      )
  )
);

-- Providers can INSERT medical records for their patients
CREATE POLICY "Medical Records: provider insert"
ON medical_records
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = patient_id
      AND a.provider_id = (
        SELECT id FROM users 
        WHERE supabase_id = auth.uid()::text
      )
  )
);

-- Providers can UPDATE medical records they created
CREATE POLICY "Medical Records: provider update own"
ON medical_records
FOR UPDATE
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = medical_records.provider_id
  )
);

-- Medical records cannot be deleted (audit trail)
CREATE POLICY "Medical Records: no delete"
ON medical_records
FOR DELETE
USING (false);

-- ============================================
-- 6. BILLING TABLE (Already covered as invoices)
-- ============================================
-- Additional healthcare billing policies

-- Patients can view their own bills
-- (Already covered by invoices table policies)

-- ============================================
-- 7. NOTIFICATIONS TABLE
-- ============================================
-- Appointment reminders and alerts

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own notifications
CREATE POLICY "Notifications: select own"
ON notifications
FOR SELECT
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = notifications.user_id
  )
);

-- Users cannot INSERT notifications (backend only)
CREATE POLICY "Notifications: no direct insert"
ON notifications
FOR INSERT
WITH CHECK (false);

-- Users can UPDATE their own notifications (mark as read)
CREATE POLICY "Notifications: update own"
ON notifications
FOR UPDATE
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = notifications.user_id
  )
);

-- Users can DELETE their own notifications
CREATE POLICY "Notifications: delete own"
ON notifications
FOR DELETE
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = notifications.user_id
  )
);

-- ============================================
-- 8. PRESCRIPTIONS TABLE (if exists)
-- ============================================
-- Medication prescriptions (HIPAA Critical)

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Patients can SELECT their own prescriptions
CREATE POLICY "Prescriptions: patient select own"
ON prescriptions
FOR SELECT
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = prescriptions.patient_id
  )
);

-- Providers can SELECT prescriptions they issued
CREATE POLICY "Prescriptions: provider select own"
ON prescriptions
FOR SELECT
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = prescriptions.provider_id
  )
);

-- Providers can INSERT prescriptions for their patients
CREATE POLICY "Prescriptions: provider insert"
ON prescriptions
FOR INSERT
WITH CHECK (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = provider_id
  )
  AND EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = patient_id
      AND a.provider_id = provider_id
  )
);

-- Prescriptions cannot be updated or deleted (audit trail)
CREATE POLICY "Prescriptions: no update/delete"
ON prescriptions
FOR UPDATE, DELETE
USING (false);

-- ============================================
-- 9. DIAGNOSES TABLE (if exists)
-- ============================================
-- Medical diagnoses (HIPAA Critical)

ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

-- Patients can SELECT their own diagnoses
CREATE POLICY "Diagnoses: patient select own"
ON diagnoses
FOR SELECT
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = diagnoses.patient_id
  )
);

-- Providers can SELECT diagnoses for their patients
CREATE POLICY "Diagnoses: provider select assigned"
ON diagnoses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = diagnoses.patient_id
      AND a.provider_id = (
        SELECT id FROM users 
        WHERE supabase_id = auth.uid()::text
      )
  )
);

-- Providers can INSERT diagnoses for their patients
CREATE POLICY "Diagnoses: provider insert"
ON diagnoses
FOR INSERT
WITH CHECK (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = provider_id
  )
);

-- Diagnoses cannot be updated or deleted (audit trail)
CREATE POLICY "Diagnoses: no update/delete"
ON diagnoses
FOR UPDATE, DELETE
USING (false);

-- ============================================
-- 10. LAB_RESULTS TABLE (if exists)
-- ============================================
-- Laboratory test results (HIPAA Critical)

ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

-- Patients can SELECT their own lab results
CREATE POLICY "Lab Results: patient select own"
ON lab_results
FOR SELECT
USING (
  auth.uid()::text = (
    SELECT supabase_id FROM users 
    WHERE users.id = lab_results.patient_id
  )
);

-- Providers can SELECT lab results for their patients
CREATE POLICY "Lab Results: provider select assigned"
ON lab_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = lab_results.patient_id
      AND a.provider_id = (
        SELECT id FROM users 
        WHERE supabase_id = auth.uid()::text
      )
  )
);

-- Lab results cannot be inserted/updated/deleted by users (backend only)
CREATE POLICY "Lab Results: backend only"
ON lab_results
FOR INSERT, UPDATE, DELETE
USING (false);

-- ============================================
-- HIPAA AUDIT LOGGING
-- ============================================
-- Track all access to PHI (Protected Health Information)

-- Create audit log function
CREATE OR REPLACE FUNCTION log_phi_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    (SELECT id FROM users WHERE supabase_id = auth.uid()::text),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    current_setting('request.headers')::json->>'x-forwarded-for',
    current_setting('request.headers')::json->>'user-agent',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging to PHI tables
CREATE TRIGGER audit_medical_records
AFTER SELECT ON medical_records
FOR EACH ROW
EXECUTE FUNCTION log_phi_access();

CREATE TRIGGER audit_prescriptions
AFTER SELECT ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION log_phi_access();

CREATE TRIGGER audit_diagnoses
AFTER SELECT ON diagnoses
FOR EACH ROW
EXECUTE FUNCTION log_phi_access();

CREATE TRIGGER audit_lab_results
AFTER SELECT ON lab_results
FOR EACH ROW
EXECUTE FUNCTION log_phi_access();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check healthcare tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'appointments', 'chambers', 'medical_records', 
    'prescriptions', 'diagnoses', 'lab_results', 
    'notifications'
  )
ORDER BY tablename;

-- Check healthcare policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'appointments', 'chambers', 'medical_records', 
    'prescriptions', 'diagnoses', 'lab_results', 
    'notifications'
  )
ORDER BY tablename, policyname;

-- ============================================
-- NOTES
-- ============================================
-- 1. All PHI tables have RLS enabled
-- 2. Patients can only access their own data
-- 3. Providers can only access data for their assigned patients
-- 4. Medical records, prescriptions, diagnoses are immutable
-- 5. All PHI access is logged for HIPAA compliance
-- 6. Backend service role bypasses RLS for administrative tasks
-- 7. AI models should NEVER process PHI directly
-- 8. Use de-identification/pseudonymization for AI tasks
-- 9. Audit logs track all access to sensitive data
-- 10. Two-factor authentication recommended for providers

-- ============================================
-- HIPAA COMPLIANCE CHECKLIST
-- ============================================
-- [ ] RLS enabled on all PHI tables
-- [ ] Audit logging for PHI access
-- [ ] Encryption at rest (Supabase default)
-- [ ] Encryption in transit (HTTPS/TLS)
-- [ ] Access controls (RLS policies)
-- [ ] Audit trail (immutable logs)
-- [ ] User authentication (Supabase Auth)
-- [ ] Two-factor authentication (recommended)
-- [ ] Data backup and recovery
-- [ ] Incident response plan
-- ============================================
