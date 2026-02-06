# PHI Data Flow - End to End

## Overview

This document traces the complete lifecycle of PHI through Advancia's regulated AWS environment.

## Canonical Flow Sequence

```
1. Tenant → POST /health/v1/claims/intake
2. API Gateway → ALB → claims-intake-service (ECS/EKS)
3. claims-intake-service:
   - Write to Aurora.health_claims_intake
   - Upload image to S3 PHI bucket
   - Publish job to SQS.health-claims-processing-queue
4. claims-intake-worker:
   - Consume SQS job
   - Resolve patient via patient-link-service
   - Normalize + validate
   - Emit event to EventBridge.health-events-bus
   - Create claim in Aurora.health_claims
5. health-billing-service:
   - Process event
   - Update claim status
   - Emit PHI-safe event
6. phi-docs-service:
   - Generate EOB/statement
   - Store PDF in S3 PHI bucket
   - Write metadata to Aurora.health_documents
7. Non-PHI systems:
   - Receive only claim_ref_id + patient_ref_id + status
```

## Detailed Layer-by-Layer Flow

### Layer 1: Ingress - API Gateway

**Input:** HTTPS request to `/health/v1/claims/intake`

**Processing:**

- TLS termination (certificate from ACM)
- JWT validation
- WAF rules applied
- Rate limiting enforced
- CloudTrail logs API call (metadata only)

**Output:** Forwarded to ALB in VPC

**Guarantees:**

- No PHI touches non-HIPAA infra
- All requests authenticated
- All requests authorized

---

### Layer 2: Intake - claims-intake-service

**Input:** Validated request from API Gateway

**Processing:**

1. Validate payload schema
2. Generate `intake_id`
3. Write structured fields to `health_claims_intake`:
   ```sql
   INSERT INTO health.claims_intake (
     id, tenant_id, patient_id, insurance_card_id,
     submitted_by_tenant_user_id, raw_payload, status
   ) VALUES (...)
   ```
4. Upload any images to S3:
   ```
   s3://advancia-phi-docs/intake/{intake_id}/{filename}
   ```
5. Publish SQS message:
   ```json
   {
     "intake_id": "uuid",
     "tenant_id": "uuid",
     "timestamp": "ISO8601"
   }
   ```

**Output:** `{ "intake_id": "uuid", "status": "pending" }`

**Guarantees:**

- PHI never leaves AWS
- Raw images encrypted with PHI KMS key
- Intake fully auditable

---

### Layer 3: Queue - health-claims-processing-queue

**Input:** SQS message from intake service

**Processing:**

- Message encrypted at rest with KMS
- Visibility timeout 60s
- DLQ after 3 retries

**Output:** Message available to workers

**Guarantees:**

- Only PHI workers can consume
- No external vendor visibility
- Retry logic prevents data loss

---

### Layer 4: Processing - claims-intake-worker

**Input:** SQS message

**Processing:**

1. Fetch intake from Aurora:
   ```sql
   SELECT * FROM health.claims_intake WHERE id = $1
   ```
2. Call patient-link-service:
   ```
   POST /health/v1/patients/link
   { "tenant_id": "...", "first_name": "...", ... }
   → { "patient_id": "...", "patient_ref_id": "..." }
   ```
3. Normalize and validate data
4. Create canonical claim:
   ```sql
   INSERT INTO health.claims (
     id, claim_ref_id, patient_id, payer_code,
     service_date, diagnosis_codes, procedure_codes,
     amount_billed, amount_allowed, amount_patient_responsibility,
     status
   ) VALUES (...)
   ```
5. Update intake status:
   ```sql
   UPDATE health.claims_intake
   SET status = 'validated'
   WHERE id = $1
   ```
6. Emit PHI-safe event to EventBridge:
   ```json
   {
     "source": "advancia.phi.claims",
     "detail-type": "ClaimCreated",
     "detail": {
       "claim_ref_id": "opaque-123",
       "tenant_id": "uuid",
       "status": "submitted",
       "amount_billed": 15000
     }
   }
   ```

**Output:** Claim created, event emitted

**Guarantees:**

- All PHI stays in Aurora + S3
- Worker has no outbound internet
- Every action logged

---

### Layer 5: Patient Identity - patient-link-service

**Input:** Patient demographic data

**Processing:**

1. Query existing patient:
   ```sql
   SELECT * FROM health.patients
   WHERE tenant_id = $1
     AND first_name = $2
     AND last_name = $3
     AND dob = $4
   ```
2. If not found, create:
   ```sql
   INSERT INTO health.patients (
     id, tenant_id, patient_ref_id,
     first_name, last_name, dob, gender
   ) VALUES (...)
   ```
3. Generate `patient_ref_id` (opaque, non-PHI)

**Output:**

```json
{
  "patient_id": "internal-uuid",
  "patient_ref_id": "opaque-external-id"
}
```

**Guarantees:**

- Only PHI services see `patient_id`
- Non-PHI systems only see `patient_ref_id`
- No demographic data crosses boundary

---

### Layer 6: Claim Finalization - health-billing-service

**Input:** EventBridge event from worker

**Processing:**

1. Validate claim in Aurora
2. Update status if needed
3. Emit PHI-safe event for non-PHI systems:
   ```json
   {
     "source": "advancia.billing",
     "detail-type": "ClaimStatusChanged",
     "detail": {
       "claim_ref_id": "opaque-123",
       "status": "processing",
       "tenant_id": "uuid"
     }
   }
   ```

**Output:** Event published to non-PHI EventBridge bus

**Guarantees:**

- No PHI in event payload
- Only opaque IDs and status
- Full audit trail

---

### Layer 7: Document Generation - phi-docs-service

**Input:** Request to generate EOB

**Processing:**

1. Validate claim exists
2. Queue document generation job:
   ```json
   {
     "document_id": "uuid",
     "claim_id": "uuid",
     "doc_type": "eob"
   }
   ```
3. Worker generates PDF (inside VPC, no external services)
4. Upload to S3:
   ```
   s3://advancia-phi-docs/eob/{document_id}.pdf
   ```
5. Write metadata to Aurora:
   ```sql
   INSERT INTO health.documents (
     id, patient_id, claim_id, doc_type, s3_key
   ) VALUES (...)
   ```

**Output:** `{ "document_id": "uuid", "status": "queued" }`

**Guarantees:**

- No document leaves AWS
- No external rendering service
- S3 object encrypted with PHI KMS key

---

### Layer 8: Egress - PHI-Safe Outputs Only

**Allowed to leave PHI island:**

- `patient_ref_id`
- `claim_ref_id`
- Claim status
- Financial totals
- De-identified analytics

**Never allowed to leave:**

- Raw images
- Member IDs
- Demographics
- Insurance card fields
- PDFs/EOBs
- Diagnosis/procedure codes

**Enforcement:**

- API contracts explicitly define allowed fields
- Event schemas validated before publish
- Outbound gateway filters all responses

---

## Audit & Compliance Layer

### Captured Automatically

- **API Gateway:** Access logs (who, when, endpoint)
- **CloudTrail:** All IAM, API calls, resource access
- **CloudWatch Logs:** Service logs (PHI redacted)
- **S3 Access Logs:** All S3 operations
- **EventBridge:** All event publishes
- **VPC Flow Logs:** Network traffic metadata

### Retention

- CloudTrail: 7 years (immutable S3)
- CloudWatch Logs: 1 year
- S3 Access Logs: 1 year
- VPC Flow Logs: 90 days

### Compliance Reports

- Weekly: IAM privilege review
- Monthly: Access pattern analysis
- Quarterly: Full audit trail verification
- Annual: External penetration test

---

## Security Checkpoints

### Pre-Production

- [ ] All IAM roles follow least privilege
- [ ] All PHI data stores encrypted with KMS
- [ ] No public IPs on PHI resources
- [ ] No outbound internet from PHI services
- [ ] PHI redaction verified in logs
- [ ] RLS enabled on all PHI tables
- [ ] S3 public access blocked
- [ ] VPC Flow Logs enabled

### Production

- [ ] GuardDuty monitoring active
- [ ] Security Hub findings reviewed
- [ ] CloudTrail logs verified daily
- [ ] IAM Access Analyzer findings resolved
- [ ] Backup encryption verified
- [ ] Key rotation enabled

---

## Event Schema Examples

### PHI-Safe Event (Allowed)

```json
{
  "version": "1.0",
  "source": "advancia.phi.claims",
  "detail-type": "ClaimCreated",
  "detail": {
    "claim_ref_id": "abc123",
    "tenant_id": "tenant-uuid",
    "status": "submitted",
    "amount_billed": 15000,
    "timestamp": "2026-02-04T10:00:00Z"
  }
}
```

### PHI Event (Forbidden to Leave AWS)

```json
{
  "patient_id": "internal-uuid",
  "first_name": "John",
  "last_name": "Doe",
  "member_id": "12345678",
  "diagnosis_codes": ["A01.1"]
}
```
