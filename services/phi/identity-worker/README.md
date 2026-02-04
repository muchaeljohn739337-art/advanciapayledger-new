# Identity Worker (PHI/PII)

## Overview

The **Identity Worker** consumes messages from the `identity-verification-queue` and performs document verification for identity/benefits documents uploaded via the identity-service.

## Responsibilities

1. Poll SQS queue for new document verification requests
2. Validate document metadata and extracted fields
3. Apply verification rules based on document type
4. Update document status in Aurora
5. Emit PHI-safe `IdentityDocumentVerified` event

## Verification Logic

| Document Type         | Validation Rules                                  |
| --------------------- | ------------------------------------------------- |
| `drivers_license`     | Expiration date, document number, issuing state   |
| `state_id`            | Expiration date, document number, issuing state   |
| `passport`            | Expiration date, passport number, issuing country |
| `ebt_card_front/back` | Card/account number, issuer                       |
| `medicaid_card`       | Member ID, effective date                         |

## Verification Statuses

| Status         | Meaning                                       |
| -------------- | --------------------------------------------- |
| `verified`     | Document passed validation (confidence ≥ 80%) |
| `needs_review` | Manual review required (confidence 50-79%)    |
| `rejected`     | Document failed validation (confidence < 50%) |
| `expired`      | Document expiration date has passed           |

## Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@aurora-endpoint:5432/advancia?sslmode=require
IDENTITY_VERIFICATION_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/identity-verification-queue
EVENT_BUS_NAME=health-events-bus
AWS_REGION=us-east-1
```

## IAM Permissions Required

- **SQS:** Receive/Delete from `identity-verification-queue`
- **Aurora:** Read/write `health_identity_documents`, read `health_patients`
- **EventBridge:** Publish to `health-events-bus`
- **KMS:** Decrypt with `phi-data-key`
- **Secrets Manager:** Read `advancia/prod/identity-worker`

## Data Flow

```
1. identity-service uploads document → S3 + Aurora
2. identity-service publishes to SQS:
   {
     "document_id": "uuid",
     "document_type": "drivers_license",
     "tenant_id": "tenant-uuid"
   }

3. identity-worker receives message
4. identity-worker verifies document:
   - Fetch metadata from Aurora
   - Apply validation rules
   - Calculate confidence score
5. identity-worker updates Aurora:
   - verification_status
   - verification_confidence
   - verification_issues
   - verified_at
6. identity-worker emits EventBridge event:
   {
     "document_id": "uuid",
     "patient_ref_id": "patient_ref_xxx",
     "document_type": "drivers_license",
     "verification_status": "verified"
   }
7. identity-worker deletes SQS message
```

## Local Development

```bash
cd services/phi/identity-worker
npm install
npm run dev
```

## Deployment

```bash
# Build and push
docker build -t identity-worker:latest .
docker tag identity-worker:latest $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/identity-worker:latest
docker push $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/identity-worker:latest
```

## Monitoring

- **CloudWatch Logs:** `/aws/ecs/identity-worker` or `/aws/eks/identity-worker`
- **SQS Metrics:** `ApproximateNumberOfMessagesVisible`, `NumberOfMessagesReceived`
- **EventBridge:** `IdentityDocumentVerified` event count

## Error Handling

- Failed messages return to queue after 5-minute visibility timeout
- DLQ captures messages that fail 3 times
- All errors logged (no PHI in logs)

## Security

- Runs in private VPC (no internet egress)
- IRSA least-privilege IAM role
- RLS enforced via `app.tenant_id` session variable
- No PHI in logs or events
