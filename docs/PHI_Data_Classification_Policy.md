# Advancia Regulated Data Classification & Handling Policy

**Effective Date:** February 4, 2026  
**Last Reviewed:** February 4, 2026  
**Policy Owner:** Engineering & Security  
**Applies To:** All Advancia systems, services, and personnel

---

## Overview

This policy establishes the classification framework for all data processed by the Advancia platform. It defines handling requirements, storage rules, processing boundaries, and prohibited practices for each data class.

**Purpose:**

- Ensure HIPAA compliance for protected health information (PHI)
- Protect personally identifiable information (PII) per applicable regulations
- Define clear boundaries between regulated and non-regulated data
- Provide operational guidance for developers, DevOps, and support teams

---

## Data Classifications

### Class 1: PHI (Protected Health Information)

**Definition:** Any information about health status, provision of health care, or payment for health care that can be linked to a specific individual (HIPAA §160.103).

**Examples:**

- Insurance card data (member ID, group number, payer information)
- Claim information (diagnosis codes, procedure codes, claim amounts)
- Medical identifiers (patient ID, medical record number)
- Patient demographics **when linked to health care** (name, DOB, address with care context)
- Clinical notes, lab results, prescriptions
- Explanation of Benefits (EOB) documents

**Storage Requirements:**

- **S3:** `advancia-phi-docs-prod` bucket (KMS `phi-docs-key`)
- **Aurora:** `health.*` schemas (KMS `phi-data-key`, Multi-AZ, encrypted)
- **SQS:** PHI-specific queues with KMS encryption
- **ElastiCache:** PHI Redis cluster (encrypted at rest/transit)

**Processing Requirements:**

- **Services:** PHI-side microservices only (health-billing, patient-link, phi-docs, claims-intake, identity-service)
- **Network:** VPC-internal only, no outbound internet
- **Authentication:** IRSA with least-privilege IAM roles
- **Logging:** PHI redacted automatically via middleware

**Access Control:**

- **Humans:** No direct access (break-glass only with approval)
- **Services:** IRSA role-based with table/bucket-level restrictions
- **Audit:** All access logged to CloudTrail (7-year retention)

**Prohibited:**

- Non-HIPAA vendors (Slack, Jira, Notion, external support tools)
- Developer devices (laptops, desktops, mobile)
- Logs, metrics, traces (must be redacted)
- Screenshots, exports, copy/paste
- Email, messaging platforms
- Public storage, public endpoints

**Regulatory Basis:** HIPAA §164.312, §164.502, §164.514

---

### Class 2: PII (Personally Identifiable Information)

**Definition:** Information that can identify an individual, not necessarily linked to health care but still requiring protection.

**Examples:**

- Government-issued IDs (driver's license, passport, state ID)
- Benefits cards (EBT, SNAP, Medicaid cards without health info)
- Social Security Numbers (SSN)
- Address information (street, city, state, ZIP)
- Birthdates (when not part of PHI)
- Phone numbers, email addresses (when not part of PHI)
- Identity document images

**Storage Requirements:**

- **S3:** `advancia-phi-docs-prod` bucket (same as PHI, path: `/identity/*`)
- **Aurora:** `health_identity_documents` table (KMS `phi-data-key`)
- **No caching:** PII not stored in Redis

**Processing Requirements:**

- **Services:** `identity-service`, `patient-link-service`, `claims-intake-service`
- **Network:** VPC-internal only, no outbound internet
- **Authentication:** IRSA with least-privilege IAM roles
- **Logging:** PII redacted automatically (SSN, phone, email patterns)

**Access Control:**

- **Humans:** No direct access
- **Services:** PHI-side services only with explicit IAM permissions
- **Audit:** All access logged to CloudTrail

**Prohibited:**

- Non-regulated SaaS tools
- Public storage, public S3 buckets
- Any non-regulated AWS account
- Unencrypted transmission
- Developer devices

**Regulatory Basis:** State privacy laws, CCPA, GDPR (where applicable)

---

### Class 3: De-Identified Data

**Definition:** Data that has been stripped of all identifiers per HIPAA Safe Harbor (§164.514(b)) or Expert Determination (§164.514(c)) standards, or aggregate data that cannot be traced to individuals.

**Examples:**

- Aggregated analytics (e.g., "100 claims processed today")
- Statistical outputs (e.g., "Average claim amount: $250")
- Non-traceable summaries (e.g., "Top 5 diagnosis codes this month")
- Heatmaps, trend analyses
- Opaque IDs when used in aggregate (e.g., "patient_ref_12345 completed intake" without other context)

**De-Identification Requirements:**

- Remove all 18 HIPAA identifiers (name, address, dates, phone, email, SSN, etc.)
- Ensure data cannot be re-identified with other publicly available information
- Document de-identification method (Safe Harbor or Expert Determination)

**Storage Requirements:**

- **S3:** Core (non-PHI) S3 bucket
- **Aurora:** Core schemas (non-health)
- **Data warehouse:** Allowed (e.g., Snowflake, Redshift)

**Processing Requirements:**

- **Services:** Non-PHI services allowed
- **Analytics pipelines:** Allowed
- **BI tools:** Allowed (Looker, Tableau, etc.)

**Access Control:**

- **Humans:** Analytics team, executives (read-only)
- **Services:** Analytics services, reporting APIs
- **External use:** Dashboards, reports, exports (with tenant isolation)

**Allowed External Use:**

- Tenant-facing dashboards (aggregated data only)
- Public reports (anonymized, aggregated)
- Third-party analytics (if BAA in place)

**Regulatory Basis:** HIPAA §164.514(b), §164.514(c)

---

### Class 4: Operational Metadata

**Definition:** Non-sensitive data about system operations, status, and references that cannot identify individuals or reveal PHI/PII.

**Examples:**

- Timestamps (created_at, updated_at)
- Status codes (intake_pending, claim_finalized)
- Opaque IDs (`patient_ref_id`, `claim_ref_id`, `document_ref_id`)
- Service names, versions
- HTTP status codes, latency metrics
- Event types (ClaimCreated, DocumentGenerated)

**Storage Requirements:**

- **S3:** Core bucket, CloudWatch Logs
- **Aurora:** Core schemas, health schemas (metadata columns only)
- **Logging systems:** CloudWatch Logs, EventBridge

**Processing Requirements:**

- **Services:** Any service (PHI or non-PHI)
- **Observability:** Metrics, traces, logs allowed

**Access Control:**

- **Humans:** DevOps, engineering (read-only logs)
- **Services:** All services
- **External use:** Tenant dashboards, status pages, notifications

**Allowed External Use:**

- Tenant dashboards (e.g., "Your claim is processing")
- Status notifications (e.g., "Document ready for download")
- Support tickets (reference IDs only, never PHI/PII)
- Monitoring dashboards (SRE, DevOps)

**Prohibited:**

- Using opaque IDs to reverse-engineer PHI/PII
- Combining metadata with other data sources to re-identify individuals

---

## Handling Rules

### Rule 1: PHI and PII never leave the regulated AWS account

- All PHI/PII must remain in the dedicated PHI AWS account
- No cross-account access to PHI/PII resources
- No replication to non-regulated accounts

### Rule 2: Only PHI-side services may access PHI/PII buckets or schemas

- IAM policies enforce service-level access
- S3 bucket policies deny all non-PHI roles by default
- Aurora table-level permissions restrict access

### Rule 3: No PHI or PII in logs, traces, metrics, or events

- Automated PHI redaction middleware on all services
- EventBridge events contain only opaque IDs
- CloudWatch Logs have PHI redaction patterns
- Metrics use counts/durations, never actual data

### Rule 4: All PHI/PII must be encrypted at rest and in transit

- KMS encryption for Aurora, S3, SQS, ElastiCache
- TLS 1.2+ for all API endpoints
- Certificate-based TLS for Aurora connections
- HTTPS-only S3 access

### Rule 5: No human (developer, support, admin) may access PHI/PII

- Break-glass access requires incident commander approval
- All human access logged and reviewed
- Post-incident review mandatory within 24 hours
- Support uses opaque IDs only

### Rule 6: All identity documents must be stored in `health_identity_documents`

- Driver's licenses, passports, state IDs, benefits cards
- Metadata in Aurora, raw images in S3 `/identity/*` path
- Linked to `health_patients` when applicable

### Rule 7: All raw images must be stored in S3 PHI/PII bucket only

- No local storage on developer devices
- No temporary files in non-regulated storage
- S3 versioning enabled for audit trail

### Rule 8: Non-PHI services only receive opaque IDs

- `patient_ref_id`, `claim_ref_id`, `document_ref_id`
- No patient names, SSNs, addresses, DOBs
- EventBridge events transformed to remove PHI

---

## Enforcement Mechanisms

### Technical Controls

1. **IAM Least-Privilege Roles**
   - Each service has dedicated IRSA role
   - Resource-level permissions (table, bucket, queue)
   - [IAM Access Matrix](IAM_Access_Matrix.md)

2. **S3 Bucket Policies**
   - Deny all non-PHI roles by default
   - Require KMS encryption for all objects
   - VPC endpoint-only access

3. **Aurora Table-Level Permissions**
   - No service has full schema access
   - Row-Level Security (RLS) for tenant isolation
   - [RLS Policies](../infra/db/aurora/phi_rls_policies.sql)

4. **No Outbound Internet from PHI Services**
   - Security groups block egress
   - VPC endpoints for AWS services (S3, SQS, Secrets Manager)

5. **CloudTrail Audit Logging**
   - Org-wide, immutable, 7-year retention
   - All data events captured
   - Stored in security account S3 bucket

6. **GuardDuty Monitoring**
   - Real-time threat detection
   - Anomalous access pattern alerts

7. **Security Hub Findings**
   - Daily compliance checks
   - Automated remediation for critical findings

8. **Automated PHI Redaction Middleware**
   - [phiRedaction.ts](../services/phi/shared/middleware/phiRedaction.ts)
   - Regex patterns for SSN, phone, email, DOB, member IDs
   - Applied to all Express routes

---

## Required Developer Practices

### DO:

- ✅ Use opaque IDs (`patient_ref_id`, `claim_ref_id`) in all non-PHI code
- ✅ Follow [PHI Threat Model](PHI_Threat_Model.md) boundary rules
- ✅ Test PHI redaction in local environments
- ✅ Review [IAM Access Matrix](IAM_Access_Matrix.md) before adding permissions
- ✅ Use [shared utilities](../services/phi/shared/) for Aurora, S3, SQS, EventBridge access
- ✅ Log security events (authentication failures, unauthorized access attempts)

### DO NOT:

- ❌ Store PHI/PII locally (no downloads, exports, screenshots)
- ❌ Paste PHI/PII into logs, tickets, Slack, or documentation
- ❌ Send PHI/PII to non-HIPAA tools (Jira, GitHub Issues, external APIs)
- ❌ Hardcode credentials or connection strings
- ❌ Create new PHI tables without security review
- ❌ Add outbound internet access to PHI services
- ❌ Disable PHI redaction middleware "temporarily"

---

## Required Tenant Practices

### DO:

- ✅ Upload PHI/PII only through `/health/*` API endpoints
- ✅ Use secure tenant authentication (JWT tokens)
- ✅ Report suspected data breaches immediately
- ✅ Review access logs periodically (via tenant dashboard)

### DO NOT:

- ❌ Email PHI/PII (attachments, body text)
- ❌ Send PHI/PII to support channels (chat, email, phone)
- ❌ Share credentials or tokens
- ❌ Screenshot or export PHI/PII from dashboards

---

## Incident Response

### Data Breach Scenarios

**If PHI/PII is exposed (S3 public, logs leaked, unauthorized access):**

1. **Immediate actions** (within 15 minutes):
   - Revoke IAM permissions
   - Block S3 public access
   - Isolate affected service
   - Page security team

2. **Investigation** (within 1 hour):
   - Identify scope (how much data, which patients)
   - Review CloudTrail logs
   - Determine root cause

3. **Notification** (within 24 hours):
   - Notify affected patients (if breach affects >500 individuals, notify HHS within 60 days per HIPAA Breach Notification Rule)
   - Notify leadership
   - Notify legal counsel

4. **Remediation** (within 1 week):
   - Implement technical fixes
   - Update policies/procedures
   - Conduct post-incident review

**Evidence:** [Incident Response Playbook](INCIDENT_RESPONSE_PLAYBOOK.md) (if exists)

---

## Access Reviews

### Quarterly IAM Review

- [ ] Verify all IRSA roles have minimum necessary permissions
- [ ] Remove unused IAM policies
- [ ] Audit CloudTrail logs for anomalous access
- [ ] Review break-glass access (should be zero)
- [ ] Confirm all humans have zero PHI access

### Annual Penetration Test

- [ ] External security assessment
- [ ] Test PHI boundary enforcement
- [ ] Attempt privilege escalation
- [ ] Verify encryption at rest/transit
- [ ] Review audit log integrity

---

## Audit & Compliance

### HIPAA Compliance

- **Status:** Architecture compliant with §164.312, §164.308, §164.310
- **Evidence:** [HIPAA Compliance Mapping](HIPAA_Compliance_Mapping.md)
- **Last Audit:** February 4, 2026
- **Next Audit:** May 4, 2026 (Quarterly)

### SOC 2 Type II Readiness

- **Status:** Technical controls in place
- **Timeline:** 6-9 months (requires 3-month observation period)

### AWS Business Associate Agreement (BAA)

- **Status:** Required before production launch
- **Coverage:** S3, Aurora, SQS, EventBridge, KMS, Secrets Manager, CloudTrail, CloudWatch

---

## Training Requirements

### Required Training (All Engineers)

- [ ] HIPAA overview and Advancia's obligations
- [ ] PHI/PII identification and handling
- [ ] Incident response procedures
- [ ] PHI redaction best practices
- [ ] [PHI Threat Model](PHI_Threat_Model.md) walkthrough

### Required Training (DevOps/SRE)

- [ ] Break-glass procedures
- [ ] CloudTrail log analysis
- [ ] GuardDuty alert response
- [ ] Backup/restore procedures

### Required Training (Support)

- [ ] Never request PHI/PII from customers
- [ ] Use opaque IDs only in tickets
- [ ] Escalation procedures for suspected breaches

---

## Policy Exceptions

**No exceptions to this policy are permitted without written approval from:**

- Chief Security Officer (CSO)
- Chief Technology Officer (CTO)
- Legal Counsel

**All exceptions must:**

- Be documented with business justification
- Include compensating controls
- Have expiration date (max 90 days)
- Be reviewed monthly

---

## Policy Review Schedule

- **Quarterly:** Review IAM permissions, access logs, incident reports
- **Annually:** Full policy review, external audit, penetration test
- **Ad-hoc:** After any security incident or regulatory change

---

## Attestation

This policy reflects the Advancia platform architecture as of February 4, 2026.

**Policy Owner:** Michael, Advancia Engineering  
**Approved By:** [CSO, CTO, Legal Counsel]  
**Effective Date:** February 4, 2026  
**Last Reviewed:** February 4, 2026  
**Next Review:** May 4, 2026 (Quarterly)

---

## Related Documentation

- [HIPAA Compliance Mapping](HIPAA_Compliance_Mapping.md)
- [PHI Threat Model](PHI_Threat_Model.md)
- [IAM Access Matrix](IAM_Access_Matrix.md)
- [PHI Data Flow](PHI_Data_Flow.md)
- [Enterprise Security Overview](Enterprise_Security_Overview.md)
- [PHI Deployment Guide](PHI_Deployment_Guide.md)
