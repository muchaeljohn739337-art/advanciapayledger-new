# Identity Service (PHI/PII)

## Overview

The **Identity Service** manages identity and benefits documents (driver's licenses, passports, state IDs, EBT cards, etc.) within the PHI/PII regulated environment.

**Responsibilities:**

- Upload identity/benefits documents to S3 PHI/PII bucket
- Store document metadata in `health_identity_documents` table
- Link documents to patients via `patient_ref_id`
- Generate presigned URLs for secure document downloads
- Emit PHI-safe events to EventBridge

---

## API Endpoints

### POST /health/v1/identity/upload

Upload an identity or benefits document.

**Headers:**

- `x-tenant-id` (required)

**Request:**

```json
{
  "patient_ref_id": "string",
  "document_type": "drivers_license" | "passport" | "state_id" | "ebt_card_front" | "ebt_card_back",
  "image_base64": "string",
  "extracted_fields": {
    "issuer": "string",
    "expiration_date": "string",
    "document_number": "string"
  }
}
```

**Response:**

```json
{
  "document_id": "uuid",
  "status": "stored"
}
```

---

### GET /health/v1/identity/:document_id

Retrieve identity document metadata (never the raw image).

**Headers:**

- `x-tenant-id` (required)

**Response:**

```json
{
  "document_id": "uuid",
  "document_type": "ebt_card_back",
  "patient_ref_id": "string",
  "s3_key": "identity/tenant123/doc-uuid.jpg",
  "extracted_fields": {},
  "created_at": "2026-02-04T12:00:00Z"
}
```

---

### GET /health/v1/identity/:document_id/download

Generate presigned URL for document download (internal use only, 5-minute expiry).

**Headers:**

- `x-tenant-id` (required)

**Response:**

```json
{
  "download_url": "https://s3.amazonaws.com/presigned-url"
}
```

---

### GET /health/v1/patients/:patient_ref_id/identity-documents

List all identity documents for a patient.

**Headers:**

- `x-tenant-id` (required)

**Response:**

```json
{
  "documents": [
    {
      "document_id": "uuid",
      "document_type": "drivers_license",
      "extracted_fields": {},
      "created_at": "2026-02-04T12:00:00Z"
    }
  ]
}
```

---

## Environment Variables

```bash
PORT=3006
DATABASE_URL=postgresql://user:pass@aurora-endpoint:5432/advancia?sslmode=require
JWT_ACCESS_SECRET=your-secret-key
AWS_REGION=us-east-1
PHI_BUCKET_NAME=advancia-phi-docs-prod
IDENTITY_VERIFICATION_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/identity-verification-queue
EVENT_BUS_NAME=health-events-bus
```

---

## IAM Permissions Required

- **Aurora:** Read/write `health_identity_documents`, read `health_patients`
- **S3:** Upload to `s3://advancia-phi-docs-prod/identity/*`
- **SQS:** Publish to `identity-verification-queue`
- **EventBridge:** Publish to `health-events-bus`
- **KMS:** Decrypt/encrypt with `phi-data-key`, `phi-docs-key`
- **Secrets Manager:** Read `advancia/prod/identity-service`

See [IAM Access Matrix](../../docs/IAM_Access_Matrix.md) for full policy.

---

## Data Flow

```
1. Tenant → POST /health/identity/upload
2. API Gateway → ALB → identity-service
3. identity-service:
   - Resolves patient_ref_id to patient_id
   - Uploads image to S3 /identity/* path
   - Writes metadata to health_identity_documents
   - (Optional) Publishes to SQS for async verification
   - Emits IdentityDocumentUploaded event
4. Response: { document_id, status: "stored" }
```

---

## Security

- **PHI/PII isolation:** All identity documents stored in regulated S3 bucket with KMS encryption
- **No outbound internet:** Service runs in private VPC subnet
- **Table-level permissions:** Cannot access claims or insurance data
- **Audit logging:** All operations logged to CloudTrail
- **Tenant isolation:** Row-Level Security (RLS) enforced at Aurora level

---

## Local Development

```bash
cd services/phi/identity-service
npm install
npm run dev
```

**Test upload:**

```bash
curl -X POST http://localhost:3006/health/v1/identity/upload \
  -H "x-tenant-id: test-tenant" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_ref_id": "patient_ref_12345",
    "document_type": "ebt_card_back",
    "image_base64": "base64-encoded-image-here",
    "extracted_fields": {
      "issuer": "State Benefits",
      "phone": "1-800-XXX-XXXX"
    }
  }'
```

---

## Deployment

See [PHI Deployment Guide](../../docs/PHI_Deployment_Guide.md) for full deployment instructions.

**Quick deploy:**

```bash
# Build and push image
docker build -t identity-service:latest .
docker tag identity-service:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/identity-service:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/identity-service:latest

# Deploy via ArgoCD
kubectl apply -f infra/k8s/overlays/identity-service/
argocd app sync identity-service
```

---

## Compliance

- **HIPAA §164.312:** Access control, encryption, audit controls
- **HIPAA §164.308:** Workforce security, access management
- **HIPAA §164.310:** Device and media controls

See [HIPAA Compliance Mapping](../../docs/HIPAA_Compliance_Mapping.md).

---

## Related Services

- [patient-link-service](../patient-link-service/) - Patient identity resolution
- [claims-intake-service](../claims-intake-service/) - Insurance card handling
- [phi-docs-service](../phi-docs-service/) - Document generation

---

## Support

For questions or issues, contact the PHI platform team.

**Do NOT post PHI/PII in support tickets.**
