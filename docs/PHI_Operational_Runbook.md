# Advancia PHI/PII Operational Runbook

**Version:** 1.0  
**Effective Date:** February 4, 2026  
**Last Reviewed:** February 4, 2026  
**Document Owner:** Engineering & Security  
**Classification:** Internal - Confidential

---

## Purpose

This runbook provides step-by-step operational procedures for handling Protected Health Information (PHI) and Personally Identifiable Information (PII) within the Advancia platform. All personnel must follow these procedures to maintain HIPAA compliance and protect sensitive data.

---

## Table of Contents

1. [Document Intake Procedure](#1-document-intake-procedure)
2. [Patient/Member Linking Procedure](#2-patientmember-linking-procedure)
3. [Document Processing Procedure](#3-document-processing-procedure)
4. [Access Control Procedure](#4-access-control-procedure)
5. [Logging Procedure](#5-logging-procedure)
6. [Incident Response Procedure](#6-incident-response-procedure)
7. [Backup & Recovery Procedure](#7-backup--recovery-procedure)
8. [Data Retention & Destruction Procedure](#8-data-retention--destruction-procedure)
9. [Tenant Support Procedure](#9-tenant-support-procedure)
10. [Compliance Review Procedure](#10-compliance-review-procedure)
11. [On-Call Escalation Procedure](#11-on-call-escalation-procedure)
12. [Change Management Procedure](#12-change-management-procedure)

---

## 1. Document Intake Procedure

### Overview

When a sensitive document enters the system (uploaded by a tenant or internal process), it must be immediately classified, encrypted, and stored in the regulated environment.

### Document Types Handled

| Document Type                     | Classification   | Storage Location  | Metadata Table              |
| --------------------------------- | ---------------- | ----------------- | --------------------------- |
| Insurance cards                   | PHI              | S3 `/intake/*`    | `health_insurance_cards`    |
| Identity documents (DL, passport) | PII              | S3 `/identity/*`  | `health_identity_documents` |
| Benefits cards (EBT, Medicaid)    | PII/PHI-adjacent | S3 `/identity/*`  | `health_identity_documents` |
| Claims forms                      | PHI              | S3 `/claims/*`    | `health_claims_intake`      |
| EOB/Statements                    | PHI              | S3 `/documents/*` | `health_documents`          |
| Government correspondence         | PII              | S3 `/identity/*`  | `health_identity_documents` |

### Step-by-Step Procedure

#### Step 1: Classification

```
When document arrives at API endpoint:
  1. Check document_type parameter
  2. Classify as PHI, PII, or PHI-adjacent
  3. Route to appropriate service:
     - Insurance cards → claims-intake-service
     - Identity documents → identity-service
     - Claims forms → claims-intake-service
     - EOB requests → phi-docs-service
```

#### Step 2: Validation

```
Before storage:
  1. Validate file type (JPEG, PNG, PDF only)
  2. Check file size (max 10MB)
  3. Verify tenant_id header present
  4. Validate patient_ref_id (if provided)
  5. Reject if validation fails (return 400 error)
```

#### Step 3: Encryption & Storage

```
Storage process:
  1. Generate UUID for document_id
  2. Construct S3 key: {type}/{tenant_id}/{document_id}.{ext}
  3. Upload to S3 with:
     - ServerSideEncryption: aws:kms
     - KMSKeyId: phi-docs-key ARN
  4. Verify upload success (check ETag)
```

#### Step 4: Metadata Persistence

```
After S3 upload succeeds:
  1. Begin Aurora transaction
  2. Set app.tenant_id for RLS
  3. INSERT into appropriate health.* table
  4. COMMIT transaction
  5. Log success (document_id only, no PHI)
```

#### Step 5: Event Emission

```
After persistence:
  1. Construct PHI-safe event:
     {
       "document_id": "uuid",
       "document_type": "string",
       "status": "stored",
       "timestamp": "ISO8601"
     }
  2. Publish to EventBridge health-events-bus
  3. (Optional) Publish to SQS for async processing
```

### Failure Handling

| Failure Point             | Action                                     |
| ------------------------- | ------------------------------------------ |
| S3 upload fails           | Return 500, log error (no PHI), retry once |
| Aurora insert fails       | Delete S3 object, return 500, log error    |
| EventBridge publish fails | Log warning (non-critical), continue       |
| SQS publish fails         | Log warning, retry via DLQ mechanism       |

### Verification Checklist

- [ ] Document stored in correct S3 path
- [ ] Metadata written to correct Aurora table
- [ ] Encryption verified (KMS key used)
- [ ] Event emitted (check EventBridge logs)
- [ ] No PHI in application logs

---

## 2. Patient/Member Linking Procedure

### Overview

Every document containing PHI/PII must be linked to a patient record. This ensures tenant isolation and enables proper access control.

### Linking Flow

```
1. Receive patient_ref_id from tenant
2. Query health.patients by patient_ref_id
3. If found:
   - Use existing patient_id
4. If not found:
   - Create new patient record
   - Generate new patient_ref_id
   - Return patient_ref_id to tenant
5. Link document to patient_id
```

### Step-by-Step Procedure

#### Step 1: Resolve Patient

```sql
-- Set tenant context for RLS
SET app.tenant_id = 'tenant-uuid';

-- Attempt to find existing patient
SELECT id, patient_ref_id
FROM health.patients
WHERE patient_ref_id = 'provided-ref-id';
```

#### Step 2: Create Patient (if not found)

```sql
-- Generate new patient record
INSERT INTO health.patients (
  id, tenant_id, patient_ref_id,
  first_name, last_name, date_of_birth, ssn_hash,
  created_at
) VALUES (
  gen_random_uuid(), 'tenant-uuid', 'new-patient-ref-id',
  'encrypted-first', 'encrypted-last', 'encrypted-dob', 'hashed-ssn',
  NOW()
)
RETURNING id, patient_ref_id;
```

#### Step 3: Link Document

```sql
-- Link document to patient
INSERT INTO health.identity_documents (
  id, patient_id, document_type, s3_key, created_at
) VALUES (
  'document-uuid', 'patient-uuid', 'drivers_license',
  'identity/tenant-id/doc-uuid.jpg', NOW()
);
```

### Cross-Boundary Communication

**PHI-side services receive:**

- `patient_id` (internal UUID)
- Full patient record (encrypted fields)

**Non-PHI services receive:**

- `patient_ref_id` (opaque reference)
- Status codes
- Timestamps

**Never send to non-PHI systems:**

- Patient names
- Dates of birth
- SSNs (even hashed)
- Addresses
- Phone numbers
- Email addresses

---

## 3. Document Processing Procedure

### Overview

All document processing (OCR, validation, classification, extraction) must occur inside the regulated VPC with no outbound internet access.

### Processing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PHI VPC (Private Subnets)                │
│                                                             │
│  ┌───────────────┐    ┌───────────────┐    ┌─────────────┐ │
│  │    SQS        │───▶│   Worker      │───▶│   Aurora    │ │
│  │  (encrypted)  │    │  (no egress)  │    │   (KMS)     │ │
│  └───────────────┘    └───────────────┘    └─────────────┘ │
│         ▲                    │                              │
│         │                    ▼                              │
│  ┌───────────────┐    ┌───────────────┐                    │
│  │  EventBridge  │◀───│     S3        │                    │
│  │  (PHI-safe)   │    │    (KMS)      │                    │
│  └───────────────┘    └───────────────┘                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              VPC Endpoints (no internet)             │   │
│  │   S3 | SQS | Secrets Manager | KMS | EventBridge    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Processing Types

#### OCR Processing

```
1. Worker receives SQS message with document_id
2. Fetch document from S3 (via VPC endpoint)
3. Run OCR (internal library, no external API calls)
4. Extract text fields
5. Update Aurora record with extracted_fields (JSONB)
6. Delete SQS message
7. Emit PHI-safe event
```

#### Validation Processing

```
1. Load extracted fields from Aurora
2. Validate:
   - Document not expired
   - Required fields present
   - Format matches expected pattern
3. Update status: validated | invalid | needs_review
4. Emit PHI-safe event
```

#### Classification Processing

```
1. Analyze document structure
2. Classify as: drivers_license | passport | insurance_card | etc.
3. Update document_type if auto-detected
4. Emit PHI-safe event
```

### Security Requirements

| Requirement          | Implementation                                        |
| -------------------- | ----------------------------------------------------- |
| No outbound internet | Security group egress rules block all non-VPC traffic |
| Encrypted at rest    | KMS keys for S3, Aurora, SQS                          |
| Encrypted in transit | TLS 1.2+ for all internal connections                 |
| Audit logging        | CloudTrail captures all S3/Aurora/SQS operations      |
| Tenant isolation     | RLS policies on all PHI tables                        |

### Prohibited Actions

- ❌ Calling external APIs (OCR services, validation APIs)
- ❌ Writing PHI to logs
- ❌ Storing PHI in temporary files outside encrypted volumes
- ❌ Sending PHI in EventBridge events
- ❌ Caching PHI in non-encrypted Redis

---

## 4. Access Control Procedure

### Overview

Access to PHI/PII is strictly controlled. No human directly accesses regulated data except in documented emergency scenarios.

### Access Matrix

| Role             | Aurora PHI Tables | S3 PHI Bucket   | CloudTrail Logs | Break-Glass |
| ---------------- | ----------------- | --------------- | --------------- | ----------- |
| PHI Services     | ✅ (table-level)  | ✅ (path-level) | ❌              | N/A         |
| Non-PHI Services | ❌                | ❌              | ❌              | N/A         |
| DevOps           | ❌                | ❌              | ✅ (read)       | Requestable |
| Security         | ❌                | ❌              | ✅ (read)       | Requestable |
| Developers       | ❌                | ❌              | ❌              | ❌          |
| Support          | ❌                | ❌              | ❌              | ❌          |
| Executives       | ❌                | ❌              | ❌              | ❌          |

### IRSA Role Assignment

Each PHI service has a dedicated IRSA role:

| Service                | IRSA Role                        | Permissions                   |
| ---------------------- | -------------------------------- | ----------------------------- |
| health-billing-service | `advancia-health-billing-irsa`   | Secrets, SQS, EventBridge     |
| patient-link-service   | `advancia-patient-link-irsa`     | Secrets, SQS                  |
| phi-docs-service       | `advancia-phi-docs-irsa`         | Secrets, S3, SQS              |
| claims-intake-service  | `advancia-claims-intake-irsa`    | Secrets, S3, SQS              |
| identity-service       | `advancia-identity-service-irsa` | Secrets, S3, SQS, EventBridge |

### Access Verification

**Daily automated checks:**

```bash
# Verify no unexpected IAM roles have PHI access
aws iam list-role-policies --role-name $ROLE_NAME
aws iam list-attached-role-policies --role-name $ROLE_NAME

# Verify S3 bucket policy denies public access
aws s3api get-bucket-policy --bucket advancia-phi-docs-prod
aws s3api get-public-access-block --bucket advancia-phi-docs-prod

# Verify Aurora RLS is enabled
psql $DATABASE_URL -c "SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'health'::regnamespace;"
```

### Granting New Access

**Procedure:**

1. Submit access request ticket
2. Security review (required)
3. Architecture review (if new resource type)
4. Terraform PR with least-privilege policy
5. Code review by security team
6. Merge and apply
7. Document in IAM Access Matrix

**Never approved:**

- Console access to Aurora
- Direct S3 bucket listing
- SSH to PHI services
- CloudWatch Logs Insights on PHI logs (unless redacted)

---

## 5. Logging Procedure

### Overview

All PHI services use centralized logging with automatic PHI redaction.

### Log Requirements

#### MUST Include:

| Field        | Example                | Purpose                |
| ------------ | ---------------------- | ---------------------- |
| timestamp    | `2026-02-04T12:00:00Z` | Audit trail            |
| service_name | `identity-service`     | Source identification  |
| request_id   | `uuid`                 | Request tracing        |
| tenant_id    | `tenant-uuid`          | Tenant context         |
| document_id  | `doc-uuid`             | Resource reference     |
| status_code  | `201`                  | Operation result       |
| latency_ms   | `45`                   | Performance monitoring |

#### MUST NOT Include:

| Field                | Why     |
| -------------------- | ------- |
| Patient names        | PHI     |
| SSNs                 | PHI/PII |
| Dates of birth       | PHI     |
| Addresses            | PII     |
| Phone numbers        | PII     |
| Email addresses      | PII     |
| Document contents    | PHI/PII |
| Extracted OCR text   | PHI/PII |
| Insurance member IDs | PHI     |
| Account numbers      | PII     |

### PHI Redaction Middleware

**Location:** `services/phi/shared/middleware/phiRedaction.ts`

**Patterns redacted:**

```javascript
const PHI_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b[A-Z]{3}\d{9}\b/gi, // Member ID
  /\b\d{2}\/\d{2}\/\d{4}\b/g, // DOB
  /\b\d{4}-\d{2}-\d{2}\b/g, // DOB ISO
  /\b[\w.-]+@[\w.-]+\.\w+\b/g, // Email
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone
];
```

**Redaction output:**

```
Before: "Patient John Doe SSN 123-45-6789 DOB 01/15/1980"
After:  "Patient [REDACTED] SSN [REDACTED] DOB [REDACTED]"
```

### Log Destinations

| Log Type         | Destination                        | Retention |
| ---------------- | ---------------------------------- | --------- |
| Application logs | CloudWatch Logs                    | 1 year    |
| Audit logs       | CloudTrail → S3 (security account) | 7 years   |
| Access logs      | S3 access logs                     | 1 year    |
| VPC flow logs    | CloudWatch Logs                    | 90 days   |

### Log Review Procedure

**Weekly:**

- Review error rates in CloudWatch
- Check for unusual access patterns
- Verify PHI redaction working (spot check)

**Monthly:**

- Export log summary for compliance review
- Analyze latency trends
- Review 4xx/5xx error spikes

---

## 6. Incident Response Procedure

### Overview

Security incidents involving PHI/PII require immediate response per HIPAA Breach Notification Rule.

### Incident Severity Levels

| Level         | Description             | Response Time | Notification   |
| ------------- | ----------------------- | ------------- | -------------- |
| P0 - Critical | Confirmed PHI breach    | 15 minutes    | Immediate page |
| P1 - High     | Suspected PHI exposure  | 1 hour        | Page + Slack   |
| P2 - Medium   | Potential vulnerability | 4 hours       | Slack          |
| P3 - Low      | Policy violation        | 24 hours      | Ticket         |

### Incident Response Steps

#### Step 1: Detection (0-5 minutes)

**Automated detection:**

- GuardDuty alerts
- CloudWatch alarms
- Security Hub findings

**Manual detection:**

- Engineer notices anomaly
- Support receives report
- External notification

#### Step 2: Containment (5-15 minutes)

```bash
# Immediately revoke compromised credentials
aws iam update-access-key --access-key-id $KEY_ID --status Inactive --user-name $USER

# Block compromised IAM role
aws iam put-role-policy --role-name $ROLE --policy-name DenyAll --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Deny","Action":"*","Resource":"*"}]}'

# Block S3 public access (if bucket exposed)
aws s3api put-public-access-block --bucket $BUCKET --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Isolate compromised service
kubectl -n platform-core scale deployment $SERVICE --replicas=0
```

#### Step 3: Investigation (15 min - 4 hours)

```bash
# Review CloudTrail logs
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventSource,AttributeValue=s3.amazonaws.com \
  --start-time 2026-02-04T00:00:00Z \
  --end-time 2026-02-04T23:59:59Z

# Check S3 access logs
aws s3 cp s3://advancia-phi-docs-prod-logs/ ./logs/ --recursive

# Analyze Aurora audit logs
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE query LIKE '%health.%';"
```

#### Step 4: Notification (within 24 hours)

**Internal notification:**

- Security team
- Engineering leadership
- Legal counsel
- Compliance officer

**External notification (if breach confirmed):**

- Affected patients (HIPAA requires notification)
- HHS (if >500 individuals affected, within 60 days)
- State regulators (per state law requirements)
- Media (if >500 individuals affected)

#### Step 5: Remediation (1-7 days)

- Patch vulnerability
- Rotate all potentially compromised credentials
- Update IAM policies
- Enhance monitoring
- Document lessons learned
- Conduct post-incident review

#### Step 6: Documentation

**Incident report must include:**

- Date/time of detection
- Date/time of containment
- Scope of exposure (number of records, patient IDs)
- Root cause analysis
- Remediation actions taken
- Preventive measures implemented

**Retain for:** 6 years (HIPAA requirement)

### Incident Response Contacts

| Role             | Contact    | Escalation Time   |
| ---------------- | ---------- | ----------------- |
| On-call engineer | PagerDuty  | Immediate         |
| Security lead    | [Redacted] | 15 minutes        |
| Engineering VP   | [Redacted] | 30 minutes        |
| Legal counsel    | [Redacted] | 1 hour            |
| CEO              | [Redacted] | 2 hours (P0 only) |

---

## 7. Backup & Recovery Procedure

### Overview

All PHI/PII is backed up automatically with encryption. Recovery procedures ensure data integrity.

### Backup Configuration

#### Aurora PostgreSQL

| Setting                | Value              |
| ---------------------- | ------------------ |
| Backup retention       | 35 days            |
| Backup window          | 02:00-03:00 UTC    |
| Multi-AZ               | Enabled            |
| Encryption             | KMS `phi-data-key` |
| Point-in-time recovery | Enabled            |

**Automated backup:**

```bash
# Verify backup status
aws rds describe-db-cluster-snapshots \
  --db-cluster-identifier advancia-postgres-prod \
  --snapshot-type automated
```

#### S3 PHI Bucket

| Setting                  | Value                        |
| ------------------------ | ---------------------------- |
| Versioning               | Enabled                      |
| Lifecycle rules          | 90-day transition to Glacier |
| Cross-region replication | Optional (DR region)         |
| Encryption               | KMS `phi-docs-key`           |

**Verify versioning:**

```bash
aws s3api get-bucket-versioning --bucket advancia-phi-docs-prod
```

#### Secrets Manager

| Setting         | Value              |
| --------------- | ------------------ |
| Rotation        | 90 days            |
| Encryption      | KMS `phi-data-key` |
| Version history | 10 versions        |

### Recovery Procedures

#### Scenario: Aurora Point-in-Time Recovery

```bash
# Restore to specific point in time
aws rds restore-db-cluster-to-point-in-time \
  --db-cluster-identifier advancia-postgres-prod-recovery \
  --source-db-cluster-identifier advancia-postgres-prod \
  --restore-to-time 2026-02-04T10:00:00Z \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name advancia-db-subnet-group

# Create new instance in recovered cluster
aws rds create-db-instance \
  --db-instance-identifier advancia-postgres-prod-recovery-instance \
  --db-cluster-identifier advancia-postgres-prod-recovery \
  --db-instance-class db.r5.large \
  --engine aurora-postgresql
```

#### Scenario: S3 Object Recovery

```bash
# List object versions
aws s3api list-object-versions \
  --bucket advancia-phi-docs-prod \
  --prefix identity/tenant123/doc-uuid.jpg

# Restore specific version
aws s3api copy-object \
  --bucket advancia-phi-docs-prod \
  --copy-source advancia-phi-docs-prod/identity/tenant123/doc-uuid.jpg?versionId=abc123 \
  --key identity/tenant123/doc-uuid.jpg
```

#### Scenario: Full Disaster Recovery

1. **Activate DR region** (if configured)
2. **Restore Aurora from snapshot** to DR region
3. **Sync S3 bucket** from cross-region replica
4. **Update DNS** to point to DR region
5. **Verify service health**
6. **Notify stakeholders**

### Recovery Testing

**Quarterly:**

- [ ] Test Aurora point-in-time recovery (to isolated environment)
- [ ] Test S3 version restore
- [ ] Validate data integrity after recovery
- [ ] Measure RTO/RPO against targets

**RTO/RPO Targets:**

- RTO (Recovery Time Objective): < 15 minutes (Aurora failover)
- RPO (Recovery Point Objective): < 5 minutes (continuous backup)

---

## 8. Data Retention & Destruction Procedure

### Overview

PHI/PII must be retained according to regulatory requirements and destroyed securely when no longer needed.

### Retention Schedule

| Data Type          | Minimum Retention                  | Maximum Retention | Legal Basis      |
| ------------------ | ---------------------------------- | ----------------- | ---------------- |
| Medical claims     | 6 years                            | 10 years          | HIPAA, State law |
| Insurance cards    | Duration of coverage + 6 years     | -                 | HIPAA            |
| Identity documents | Duration of relationship + 2 years | 7 years           | State law        |
| Benefits cards     | Duration of benefits + 2 years     | 5 years           | Program rules    |
| Audit logs         | 6 years                            | 7 years           | HIPAA            |
| Backups            | 35 days                            | 90 days           | Operational      |

### Destruction Procedures

#### Aurora Data Deletion

```sql
-- Mark records for deletion (soft delete)
UPDATE health.identity_documents
SET deleted_at = NOW()
WHERE patient_id IN (
  SELECT id FROM health.patients
  WHERE created_at < NOW() - INTERVAL '7 years'
  AND status = 'inactive'
);

-- Hard delete after review period (30 days)
DELETE FROM health.identity_documents
WHERE deleted_at < NOW() - INTERVAL '30 days';

-- Log deletion
INSERT INTO audit.data_deletions (
  table_name, record_count, deleted_at, deleted_by
) VALUES (
  'health.identity_documents', $COUNT, NOW(), 'retention-job'
);
```

#### S3 Object Deletion

```bash
# Lifecycle rule handles automatic deletion
# Verify lifecycle configuration
aws s3api get-bucket-lifecycle-configuration --bucket advancia-phi-docs-prod

# For manual deletion (after retention period):
aws s3 rm s3://advancia-phi-docs-prod/identity/tenant123/ --recursive

# Permanently delete all versions (CAUTION)
aws s3api delete-objects \
  --bucket advancia-phi-docs-prod \
  --delete "$(aws s3api list-object-versions --bucket advancia-phi-docs-prod --prefix identity/tenant123/ --output json | jq '{Objects: [.Versions[], .DeleteMarkers[] | {Key:.Key, VersionId:.VersionId}]}')"
```

#### Backup Deletion

```bash
# Automated: Backups expire after retention period
# Manual snapshot deletion (if needed)
aws rds delete-db-cluster-snapshot \
  --db-cluster-snapshot-identifier manual-snapshot-name
```

### Deletion Verification

**After any deletion:**

1. Query Aurora to confirm records removed
2. Query S3 to confirm objects removed
3. Log deletion in audit table
4. Generate deletion certificate (for compliance)

**Deletion certificate includes:**

- Date of deletion
- Data type deleted
- Record count
- Method of destruction
- Verification signature

---

## 9. Tenant Support Procedure

### Overview

Support staff must handle tenant inquiries without accessing or requesting PHI/PII.

### Golden Rules

1. ✅ **DO** use opaque IDs (`patient_ref_id`, `document_id`) in all communications
2. ✅ **DO** direct tenants to secure upload endpoints for documents
3. ✅ **DO** escalate to engineering if PHI access is suspected
4. ❌ **DO NOT** request PHI/PII via email, chat, or phone
5. ❌ **DO NOT** accept PHI/PII attachments in support tickets
6. ❌ **DO NOT** screenshot or copy PHI/PII from any system
7. ❌ **DO NOT** discuss PHI/PII details with tenants verbally

### Support Ticket Templates

#### Tenant reports missing document:

```
Thank you for contacting Advancia Support.

To help locate your document, please provide:
- Document Reference ID (starts with "doc_" or shown in your dashboard)
- Approximate upload date

Please do NOT include any personal information (SSN, names, addresses)
in this ticket. Our system will automatically reject such content.

We will investigate and respond within 24 hours.
```

#### Tenant reports data issue:

```
We understand there may be an issue with your data.

To investigate, please provide:
- Your organization ID (shown in Settings)
- The affected record reference ID
- A description of the expected vs. actual behavior

Our engineering team will review and respond.

Note: Support staff do not have access to view personal data.
All investigations are conducted by authorized personnel with audit logging.
```

### Escalation Path

| Issue Type       | First Responder | Escalation                   |
| ---------------- | --------------- | ---------------------------- |
| Missing document | Support         | Engineering (PHI team)       |
| Data discrepancy | Support         | Engineering (PHI team)       |
| Suspected breach | Support         | Security (immediate)         |
| Access request   | Support         | Compliance (deny by default) |

### Prohibited Support Actions

| Action                                  | Why Prohibited           |
| --------------------------------------- | ------------------------ |
| Viewing patient records                 | No human access to PHI   |
| Downloading documents                   | No local storage of PHI  |
| Emailing PHI                            | Unencrypted transmission |
| Sharing screen with PHI visible         | Exposure risk            |
| Copying reference IDs to external tools | Data leakage             |

---

## 10. Compliance Review Procedure

### Overview

Regular compliance reviews ensure the platform maintains HIPAA, SOC 2, and other regulatory requirements.

### Quarterly Reviews

#### IAM Access Review

**Objective:** Verify least-privilege access

**Procedure:**

1. Export all IAM roles with PHI access
2. Review each policy for excessive permissions
3. Identify unused permissions (IAM Access Analyzer)
4. Submit Terraform PRs to remove unnecessary access
5. Document review findings

**Checklist:**

- [ ] All IRSA roles have minimum necessary permissions
- [ ] No unused IAM policies
- [ ] No cross-account access to PHI resources
- [ ] No console access to PHI (except break-glass)
- [ ] All humans have zero PHI access

#### S3 Bucket Policy Audit

**Objective:** Verify PHI bucket is not publicly accessible

**Procedure:**

```bash
# Check public access block
aws s3api get-public-access-block --bucket advancia-phi-docs-prod

# Check bucket policy
aws s3api get-bucket-policy --bucket advancia-phi-docs-prod

# Check bucket ACL
aws s3api get-bucket-acl --bucket advancia-phi-docs-prod
```

**Expected results:**

- PublicAccessBlock: All settings TRUE
- Bucket policy: Deny all non-VPC access
- ACL: No public grants

#### Aurora Schema Access Audit

**Objective:** Verify RLS policies are active

**Procedure:**

```sql
-- Check RLS enabled on all PHI tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'health';

-- Verify policies exist
SELECT * FROM pg_policies WHERE schemaname = 'health';

-- Test RLS enforcement
SET app.tenant_id = 'test-tenant';
SELECT COUNT(*) FROM health.patients; -- Should only return test-tenant rows
```

#### CloudTrail Log Review

**Objective:** Verify audit logging is complete

**Procedure:**

1. Verify CloudTrail enabled for all data events
2. Check S3 bucket for log delivery
3. Spot-check logs for PHI access patterns
4. Identify any gaps in logging

**Sample query (CloudTrail Insights):**

```sql
SELECT eventTime, eventSource, eventName, userIdentity.arn
FROM cloudtrail_logs
WHERE eventSource = 's3.amazonaws.com'
AND requestParameters.bucketName = 'advancia-phi-docs-prod'
ORDER BY eventTime DESC
LIMIT 100;
```

#### Security Hub Findings Review

**Objective:** Address all security findings

**Procedure:**

1. Export Security Hub findings
2. Prioritize by severity (Critical > High > Medium)
3. Create tickets for remediation
4. Track resolution

### Annual Reviews

#### HIPAA Technical Safeguards Review

**Reference:** [HIPAA_Compliance_Mapping.md](HIPAA_Compliance_Mapping.md)

**Procedure:**

1. Review each §164.312 requirement
2. Verify implementation still matches documentation
3. Update compliance mapping if architecture changed
4. Identify gaps and remediation plan

#### Penetration Testing

**Scope:**

- External network testing
- API security testing
- PHI boundary testing
- Privilege escalation testing

**Requirements:**

- Third-party security firm
- Signed NDA and BAA
- No actual PHI used in testing
- Report within 30 days

#### Architecture Validation

**Procedure:**

1. Review current architecture against threat model
2. Identify new attack vectors
3. Update threat model documentation
4. Prioritize security improvements

---

## 11. On-Call Escalation Procedure

### Overview

PHI-related incidents require immediate escalation to appropriate personnel.

### On-Call Rotation

| Week | Primary    | Secondary  |
| ---- | ---------- | ---------- |
| 1    | Engineer A | Engineer B |
| 2    | Engineer B | Engineer C |
| 3    | Engineer C | Engineer A |
| 4    | Engineer A | Engineer B |

### Escalation Triggers

**Page immediately (P0):**

- GuardDuty finding: "UnauthorizedAccess"
- CloudWatch alarm: "PHI bucket public access"
- Security Hub: Critical finding on PHI resources
- External report: Data breach notification

**Alert within 1 hour (P1):**

- Unusual access patterns (>100 requests/minute to PHI endpoint)
- Failed authentication spike (>50 failures in 10 minutes)
- S3 access denied errors from authorized services

**Notify next business day (P2/P3):**

- IAM policy drift detected
- Minor compliance finding
- Performance degradation on PHI services

### Escalation Commands

```bash
# Page primary on-call
pagerduty trigger --service phi-platform --severity critical --message "PHI incident detected"

# Slack alert
slack send --channel #security-alerts --message "@security PHI incident - check PagerDuty"

# Emergency phone tree (P0 only)
# Call list maintained in secure wiki
```

---

## 12. Change Management Procedure

### Overview

All changes to PHI-related systems require security review and approval.

### Change Categories

| Category               | Review Required                      | Approval         |
| ---------------------- | ------------------------------------ | ---------------- |
| PHI schema changes     | Security + Architecture              | VP Engineering   |
| IAM policy changes     | Security                             | Security Lead    |
| New PHI service        | Security + Architecture + Compliance | VP Engineering   |
| Infrastructure changes | Architecture                         | Engineering Lead |
| Configuration changes  | Engineering                          | Engineering Lead |

### Change Procedure

#### Step 1: Proposal

```markdown
## Change Request

**Title:** Add new identity document type
**Requester:** [Name]
**Date:** [Date]

### Description

Add support for utility bills as identity verification documents.

### Impact

- New document_type enum value
- New S3 path prefix: /identity/utility/
- No schema changes required

### Security Considerations

- Same encryption as existing identity documents
- Same RLS policies apply
- No new IAM permissions needed

### Rollback Plan

- Remove document_type from application code
- Existing documents unaffected
```

#### Step 2: Review

**Security review checklist:**

- [ ] No new PHI exposure vectors
- [ ] IAM follows least privilege
- [ ] Encryption maintained
- [ ] Audit logging covers new paths
- [ ] RLS policies apply

**Architecture review checklist:**

- [ ] Follows existing patterns
- [ ] No performance impact
- [ ] Scales appropriately
- [ ] Disaster recovery unchanged

#### Step 3: Approval

- All reviewers sign off in PR
- Approval recorded in ticket
- Change window scheduled (if needed)

#### Step 4: Implementation

- Terraform apply (infrastructure)
- Database migration (if schema change)
- Application deployment
- Smoke tests

#### Step 5: Verification

- Verify new functionality works
- Verify audit logs capture changes
- Verify no PHI leakage
- Close change ticket

---

## Appendix A: Emergency Contacts

| Role               | Name        | Phone      | Email              |
| ------------------ | ----------- | ---------- | ------------------ |
| On-call Primary    | [PagerDuty] | -          | pagerduty@advancia |
| Security Lead      | [Redacted]  | [Redacted] | [Redacted]         |
| Engineering VP     | [Redacted]  | [Redacted] | [Redacted]         |
| Compliance Officer | [Redacted]  | [Redacted] | [Redacted]         |
| Legal Counsel      | [Redacted]  | [Redacted] | [Redacted]         |

---

## Appendix B: Related Documentation

- [HIPAA Compliance Mapping](HIPAA_Compliance_Mapping.md)
- [IAM Access Matrix](IAM_Access_Matrix.md)
- [PHI Threat Model](PHI_Threat_Model.md)
- [PHI Data Flow](PHI_Data_Flow.md)
- [PHI Data Classification Policy](PHI_Data_Classification_Policy.md)
- [Enterprise Security Overview](Enterprise_Security_Overview.md)
- [PHI Deployment Guide](PHI_Deployment_Guide.md)

---

## Document Control

| Version | Date       | Author      | Changes         |
| ------- | ---------- | ----------- | --------------- |
| 1.0     | 2026-02-04 | Engineering | Initial release |

**Next Review:** May 4, 2026 (Quarterly)
