# IAM Access Matrix - PHI Services

This matrix defines which AWS resources each PHI service can access.

**Principle**: Each service gets a **single IAM role** with **only the permissions it absolutely needs**. No service ever gets full-schema access.

---

## Quick Reference Matrix

### Services → Aurora Access

| Service                  | Read                                             | Write                                            | Notes                                 |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------ | ------------------------------------- |
| `claims-intake-service`  | `health_claims_intake`, `health_insurance_cards` | `health_claims_intake`, `health_insurance_cards` | No access to patients or claims       |
| `claims-intake-worker`   | `health_claims_intake`, `health_patients`        | `health_claims`, `health_patients`               | Can finalize claims                   |
| `patient-link-service`   | `health_patients`                                | `health_patients`                                | Full patient record control           |
| `health-billing-service` | `health_claims`, `health_patients`               | `health_claims`                                  | Cannot modify intake or identity docs |
| `phi-docs-service`       | `health_claims`, `health_documents`              | `health_documents`                               | No access to patient demographics     |
| `identity-service`       | `health_identity_documents`, `health_patients`   | `health_identity_documents`                      | No access to claims                   |

**Rule**: No service ever gets full-schema access. Every table is permissioned individually.

### Services → S3 Access (PHI/PII Bucket)

| Service                  | Allowed                             | Denied                          |
| ------------------------ | ----------------------------------- | ------------------------------- |
| `claims-intake-service`  | Upload raw images to `/intake/*`    | List bucket, read other objects |
| `claims-intake-worker`   | Read intake images from `/intake/*` | Write new images                |
| `phi-docs-service`       | Write PDFs/EOBs to `/documents/*`   | Read identity documents         |
| `identity-service`       | Upload ID images to `/identity/*`   | Read claim documents            |
| `health-billing-service` | None                                | All                             |
| `patient-link-service`   | None                                | All                             |
| Non-PHI services         | None                                | All                             |

**Rule**: Every object is encrypted with the PHI KMS key. Bucket policy denies all non-PHI roles by default.

### Services → SQS Access

| Queue                            | Producer                 | Consumer               |
| -------------------------------- | ------------------------ | ---------------------- |
| `health-claims-processing-queue` | `claims-intake-service`  | `claims-intake-worker` |
| `health-doc-generation-queue`    | `health-billing-service` | `phi-docs-service`     |
| `identity-verification-queue`    | `identity-service`       | `identity-worker`      |

**Rule**: No service can consume a queue it didn't create.

### Services → EventBridge Access

| Service                  | Publish | Subscribe                  |
| ------------------------ | ------- | -------------------------- |
| `claims-intake-worker`   | Yes     | No                         |
| `health-billing-service` | Yes     | Yes (PHI-safe events only) |
| `phi-docs-service`       | Yes     | Yes                        |
| `identity-service`       | Yes     | No                         |
| `identity-worker`        | Yes     | No                         |
| Non-PHI services         | No      | Only PHI-safe events       |

**Rule**: PHI never appears in event payloads. Only opaque IDs and statuses.

### Services → KMS Access

| KMS Key         | Services Allowed                                                | Purpose                  |
| --------------- | --------------------------------------------------------------- | ------------------------ |
| `phi-data-key`  | All PHI services                                                | Aurora, SQS, ElastiCache |
| `phi-docs-key`  | `phi-docs-service`, `identity-service`, `claims-intake-service` | S3 object encryption     |
| `core-data-key` | None in PHI island                                              | Non-PHI systems only     |

**Rule**: No PHI service can decrypt non-PHI data, and vice-versa.

### Services → Network Access

| Service          | Inbound                 | Outbound                                                           |
| ---------------- | ----------------------- | ------------------------------------------------------------------ |
| All PHI services | ALB only (VPC-internal) | VPC-internal only (Aurora, S3, SQS, EventBridge via VPC endpoints) |
| Workers          | SQS only                | Aurora, S3, EventBridge                                            |
| Non-PHI services | None                    | None                                                               |

**Rule**: PHI services have **zero outbound internet**. No exceptions.

### Human Access Controls

| Role       | Allowed                               | Denied                                                |
| ---------- | ------------------------------------- | ----------------------------------------------------- |
| DevOps     | Deploy services, view CloudTrail logs | Read PHI, console access to Aurora, S3 bucket listing |
| Security   | Audit logs, IAM analysis              | Read PHI, decrypt KMS keys                            |
| Support    | None                                  | All PHI/PII                                           |
| Developers | None                                  | All PHI/PII                                           |
| Executives | None                                  | All PHI/PII                                           |

**Rule**: No human reads PHI. All access is via services only.

---

## Detailed Per-Service Permissions

## Service: claims-intake-service

### IAM Role

`advancia-claims-intake-irsa`

### Permissions

#### Aurora (RDS)

- **Resource**: `health_claims_intake`, `health_insurance_cards`
- **Actions**: SELECT, INSERT, UPDATE
- **Conditions**: Must set `app.tenant_id` per connection

#### S3

- **Resource**: `s3://advancia-phi-docs/intake/*`
- **Actions**: s3:PutObject, s3:PutObjectAcl
- **Conditions**: Server-side encryption required

#### SQS

- **Resource**: `health-claims-processing-queue`
- **Actions**: sqs:SendMessage
- **Conditions**: Message must be encrypted

#### Secrets Manager

- **Resource**: `advancia/prod/claims-intake-service`
- **Actions**: secretsmanager:GetSecretValue

#### KMS

- **Resource**: `phi-data-key`, `phi-docs-key`
- **Actions**: kms:Decrypt, kms:GenerateDataKey

---

## Service: patient-link-service

### IAM Role

`advancia-patient-link-irsa`

### Permissions

#### Aurora (RDS)

- **Resource**: `health_patients`
- **Actions**: SELECT, INSERT, UPDATE
- **Conditions**: Must set `app.tenant_id` per connection

#### SQS

- **Resource**: `health-patient-link-queue` (if needed)
- **Actions**: sqs:SendMessage, sqs:ReceiveMessage

#### Secrets Manager

- **Resource**: `advancia/prod/patient-link-service`
- **Actions**: secretsmanager:GetSecretValue

#### KMS

- **Resource**: `phi-data-key`
- **Actions**: kms:Decrypt

---

## Service: health-billing-service

### IAM Role

`advancia-health-billing-irsa`

### Permissions

#### Aurora (RDS)

- **Resource**: `health_claims`, `health_claims_intake`
- **Actions**: SELECT, INSERT, UPDATE
- **Conditions**: Must set `app.tenant_id` per connection

#### SQS

- **Resource**: `health-claims-processing-queue`
- **Actions**: sqs:ReceiveMessage, sqs:DeleteMessage, sqs:ChangeMessageVisibility
- **Resource**: DLQ
- **Actions**: sqs:SendMessage

#### EventBridge

- **Resource**: `health-events-bus`
- **Actions**: events:PutEvents
- **Conditions**: Only PHI-safe event schemas

#### Secrets Manager

- **Resource**: `advancia/prod/health-billing-service`
- **Actions**: secretsmanager:GetSecretValue

#### KMS

- **Resource**: `phi-data-key`
- **Actions**: kms:Decrypt, kms:GenerateDataKey

---

## Service: phi-docs-service

### IAM Role

`advancia-phi-docs-irsa`

### Permissions

#### Aurora (RDS)

- **Resource**: `health_documents`
- **Actions**: SELECT, INSERT, UPDATE
- **Conditions**: Must set `app.tenant_id` per connection

#### S3

- **Resource**: `s3://advancia-phi-docs/*`
- **Actions**: s3:PutObject, s3:GetObject, s3:PutObjectAcl
- **Conditions**: Server-side encryption required

#### SQS

- **Resource**: `health-doc-generation-queue`
- **Actions**: sqs:ReceiveMessage, sqs:DeleteMessage

#### Secrets Manager

- **Resource**: `advancia/prod/phi-docs-service`
- **Actions**: secretsmanager:GetSecretValue

#### KMS

- **Resource**: `phi-docs-key`
- **Actions**: kms:Decrypt, kms:GenerateDataKey, kms:Encrypt

---

## Service: identity-service

### IAM Role

`advancia-identity-service-irsa`

### Permissions

#### Aurora (RDS)

- **Resource**: `health_identity_documents`, `health_patients`
- **Actions**: SELECT, INSERT, UPDATE
- **Conditions**: Must set `app.tenant_id` per connection

#### S3

- **Resource**: `s3://advancia-phi-docs/identity/*`
- **Actions**: s3:PutObject, s3:PutObjectAcl
- **Conditions**: Server-side encryption required

#### SQS

- **Resource**: `identity-verification-queue`
- **Actions**: sqs:SendMessage
- **Conditions**: Message must be encrypted

#### EventBridge

- **Resource**: `health-events-bus`
- **Actions**: events:PutEvents
- **Conditions**: Only PHI-safe event schemas

#### Secrets Manager

- **Resource**: `advancia/prod/identity-service`
- **Actions**: secretsmanager:GetSecretValue

#### KMS

- **Resource**: `phi-data-key`, `phi-docs-key`
- **Actions**: kms:Decrypt, kms:GenerateDataKey

---

## Service: external-secrets (operator)

### IAM Role

`advancia-external-secrets-irsa`

### Permissions

#### Secrets Manager

- **Resource**: `advancia/prod/*`
- **Actions**: secretsmanager:GetSecretValue, secretsmanager:DescribeSecret
- **Conditions**: Only secrets with tag `managed-by: external-secrets`

#### KMS

- **Resource**: `core-data-key`
- **Actions**: kms:Decrypt

---

## Cross-Account Access (None)

PHI services have **zero** cross-account access.

- No access to core account
- No access to security account
- All operations stay within regulated account

---

## IAM Policy Template (Example)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AuroraAccess",
      "Effect": "Allow",
      "Action": ["rds-db:connect"],
      "Resource": "arn:aws:rds-db:us-east-1:123456789012:dbuser:cluster-xyz/phi_app_user"
    },
    {
      "Sid": "S3PHIBucketAccess",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl"],
      "Resource": "arn:aws:s3:::advancia-phi-docs/intake/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-server-side-encryption": "aws:kms"
        }
      }
    },
    {
      "Sid": "SQSSendMessage",
      "Effect": "Allow",
      "Action": ["sqs:SendMessage"],
      "Resource": "arn:aws:sqs:us-east-1:123456789012:health-claims-processing-queue"
    },
    {
      "Sid": "SecretsManagerRead",
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:us-east-1:123456789012:secret:advancia/prod/claims-intake-service-*"
    },
    {
      "Sid": "KMSDecrypt",
      "Effect": "Allow",
      "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
      "Resource": [
        "arn:aws:kms:us-east-1:123456789012:key/phi-data-key-id",
        "arn:aws:kms:us-east-1:123456789012:key/phi-docs-key-id"
      ]
    }
  ]
}
```

---

## Least Privilege Verification

### Automated Checks

- IAM Access Analyzer (daily)
- Unused permissions report (weekly)
- Privilege escalation scan (monthly)

### Manual Reviews

- Quarterly IAM audit
- Annual penetration test
- Security assessment before each release

---

## Emergency Break-Glass Procedures

### Scenario: Production incident requires immediate PHI access

**Process:**

1. Incident commander creates Jira ticket
2. Security approves temporary elevated role
3. Engineer assumes role (max 1 hour)
4. All actions logged to CloudTrail
5. Post-incident review within 24 hours
6. Temporary role revoked

**Never Allowed:**

- Console access to PHI Aurora
- Direct S3 bucket access
- SSH to PHI services
- CloudWatch Logs Insights on PHI logs
