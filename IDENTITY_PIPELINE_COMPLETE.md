# Identity Pipeline Complete

## Summary

The identity document processing pipeline is now complete with async verification.

## Components Created

### Services

| Component            | Purpose                                | Location                         |
| -------------------- | -------------------------------------- | -------------------------------- |
| **identity-service** | HTTP API for document upload/retrieval | `services/phi/identity-service/` |
| **identity-worker**  | Async document verification consumer   | `services/phi/identity-worker/`  |

### Infrastructure

| Component                | Location                                        |
| ------------------------ | ----------------------------------------------- |
| ECR repos                | `infra/terraform/envs/prod/ecr.tf`              |
| IRSA roles               | `infra/terraform/envs/prod/irsa.tf`             |
| K8s Deployment (service) | `infra/k8s/overlays/prod/identity-service.yaml` |
| K8s Deployment (worker)  | `infra/k8s/overlays/prod/identity-worker.yaml`  |
| Aurora schema            | `infra/db/aurora/phi_schema_identity.sql`       |
| RLS policies             | `infra/db/aurora/phi_rls_identity.sql`          |

### CI/CD

| Workflow       | Change                            |
| -------------- | --------------------------------- |
| ECR Build/Push | Added `identity-worker` to matrix |

## Data Flow

```
┌─────────────────┐      ┌──────────────┐      ┌────────────────┐
│   Client App    │──────│  identity-   │──────│    Aurora      │
│                 │ POST │   service    │ INSERT│ identity_docs  │
└─────────────────┘      └──────────────┘      └────────────────┘
                                │
                                │ SendMessage
                                ▼
                         ┌──────────────┐
                         │     SQS      │
                         │  identity-   │
                         │ verification │
                         │    queue     │
                         └──────────────┘
                                │
                                │ ReceiveMessage
                                ▼
                         ┌──────────────┐      ┌────────────────┐
                         │  identity-   │──────│    Aurora      │
                         │    worker    │UPDATE│ identity_docs  │
                         └──────────────┘      └────────────────┘
                                │
                                │ PutEvents
                                ▼
                         ┌──────────────┐
                         │ EventBridge  │
                         │ health-events│
                         │     bus      │
                         └──────────────┘
```

## Verification Statuses

| Status         | Confidence | Meaning                         |
| -------------- | ---------- | ------------------------------- |
| `verified`     | ≥ 80%      | Document passed all validation  |
| `needs_review` | 50-79%     | Manual review required          |
| `rejected`     | < 50%      | Document failed validation      |
| `expired`      | N/A        | Document expiration date passed |

## Audit Scripts Created

| Script                     | Purpose                    | HIPAA Reference    |
| -------------------------- | -------------------------- | ------------------ |
| `audit-compliance.ps1`     | Full infrastructure audit  | §164.308(a)(8)     |
| `verify-phi-redaction.ps1` | Log scanning for PHI leaks | §164.312(e)(2)(ii) |
| `iam-access-review.ps1`    | Quarterly IAM review       | §164.308(a)(4)     |
| `verify-rls-policies.ps1`  | RLS verification           | §164.312(a)(1)     |

## Deployment Checklist

```bash
# 1. Apply Terraform
cd infra/terraform/envs/prod
terraform apply

# 2. Deploy Aurora schema
psql $DATABASE_URL < infra/db/aurora/phi_schema_identity.sql
psql $DATABASE_URL < infra/db/aurora/phi_rls_identity.sql

# 3. Create secrets in Secrets Manager
aws secretsmanager create-secret \
  --name advancia/prod/identity-worker \
  --secret-string '{"database_url":"...", "queue_url":"..."}'

# 4. Push images (via GitHub Actions or manual)
# Trigger: push to services/phi/**

# 5. Deploy to K8s
kubectl apply -f infra/k8s/overlays/prod/identity-service.yaml
kubectl apply -f infra/k8s/overlays/prod/identity-worker.yaml

# 6. Verify
kubectl get pods -n platform-core -l app=identity-service
kubectl get pods -n platform-core -l app=identity-worker
```

## Next Steps

1. **Run audit scripts** to verify compliance before go-live
2. **Configure monitoring** dashboards in CloudWatch/Grafana
3. **Set up alerting** for verification failures and DLQ messages
4. **Document support procedures** for handling `needs_review` documents
5. **Train operations team** on the PHI Operational Runbook

## Security Notes

- Worker runs in private VPC with no internet access
- IRSA provides least-privilege credentials
- RLS enforces tenant isolation at database level
- PHI redaction middleware prevents logging of sensitive data
- All messages in SQS are encrypted with KMS
