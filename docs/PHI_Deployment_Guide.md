# PHI Services Deployment Guide

Complete end-to-end deployment of HIPAA-ready PHI microservices on AWS EKS.

## Architecture

- **Compute**: EKS with private node groups
- **Database**: Aurora PostgreSQL (KMS-encrypted)
- **Cache**: ElastiCache Redis (encrypted at rest & in transit)
- **Queue**: SQS with DLQs
- **Events**: EventBridge buses
- **Storage**: S3 (KMS-encrypted, versioned)
- **Images**: ECR with scan-on-push
- **Secrets**: AWS Secrets Manager + External Secrets Operator
- **IAM**: IRSA roles per service (least privilege)
- **Observability**: CloudWatch, CloudTrail, GuardDuty, Security Hub

---

## Prerequisites

### AWS

- Business Associate Addendum (BAA) signed with AWS
- Regulated AWS account (advancia-regulated)
- VPC with private subnets for EKS node groups
- OIDC provider for GitHub Actions

### Local Tools

- AWS CLI v2
- kubectl
- Terraform
- Docker

---

## Step 1: Terraform Infrastructure

Navigate to prod env:

```powershell
cd advanciapayledger/infra/terraform/envs/prod
```

### Configure Variables

Copy and edit:

```powershell
cp terraform.tfvars.example terraform.tfvars
```

Update values:

- VPC ID, subnet IDs, security group IDs
- OIDC provider ARN and URL (from EKS)
- Domain, email
- S3 bucket names: `advancia-core-artifacts`, `advancia-phi-docs`
- Queue/topic/bus names (or use defaults)

### Apply Infrastructure

```powershell
terraform init
terraform plan
terraform apply
```

Outputs include:

- ECR repository URLs
- RDS endpoint
- ElastiCache endpoint
- SQS queue URLs and ARNs
- IRSA role ARNs

Capture IRSA role ARNs:

```powershell
terraform output health_billing_irsa_role_arn
terraform output patient_link_irsa_role_arn
terraform output phi_docs_irsa_role_arn
```

---

## Step 2: Create AWS Secrets

Create secrets for each PHI service:

```powershell
cd advanciapayledger
pwsh ./scripts/aws/create-phi-secrets.ps1 -Region us-east-1 -Env prod `
  -HealthBillingDatabaseUrl "postgres://user:pass@<aurora-endpoint>:5432/advancia?sslmode=require" `
  -HealthBillingJwtSecret "<random_64_char_secret>" `
  -PatientLinkDatabaseUrl "postgres://user:pass@<aurora-endpoint>:5432/advancia?sslmode=require" `
  -PatientLinkJwtSecret "<random_64_char_secret>" `
  -PhiDocsDatabaseUrl "postgres://user:pass@<aurora-endpoint>:5432/advancia?sslmode=require" `
  -PhiDocsJwtSecret "<random_64_char_secret>"
```

---

## Step 3: Apply Aurora PHI Schema

Connect to Aurora:

```bash
psql "host=<aurora-endpoint> user=<user> dbname=advancia sslmode=require"
```

Apply base schema:

```sql
\i infra/db/aurora/phi_schema.sql
```

Enable RLS (recommended):

```sql
\i infra/db/aurora/phi_rls_policies.sql
```

Test:

```sql
SET app.tenant_id = 'tenant-123';
SELECT * FROM health.patients;
```

---

## Step 4: Annotate ServiceAccounts with IRSA ARNs

Use the helper or manually update:

```powershell
pwsh ./scripts/k8s/annotate-irsa.ps1 `
  -HealthBillingRoleArn "arn:aws:iam::123:role/advancia-health-billing-irsa" `
  -PatientLinkRoleArn "arn:aws:iam::123:role/advancia-patient-link-irsa" `
  -PhiDocsRoleArn "arn:aws:iam::123:role/advancia-phi-docs-irsa"
```

This replaces `REPLACE_WITH_IRSA_ROLE_ARN` in:

- [health-billing SA](advanciapayledger/infra/k8s/overlays/prod/platform-core/health-billing-service/serviceaccount.yaml)
- [patient-link SA](advanciapayledger/infra/k8s/overlays/prod/platform-core/patient-link-service/serviceaccount.yaml)
- [phi-docs SA](advanciapayledger/infra/k8s/overlays/prod/platform-core/phi-docs-service/serviceaccount.yaml)

---

## Step 5: Update Deployment Image References

Replace `ACCOUNT_ID` in:

- [health-billing deployment](advanciapayledger/infra/k8s/overlays/prod/platform-core/health-billing-service/deployment.yaml)
- [patient-link deployment](advanciapayledger/infra/k8s/overlays/prod/platform-core/patient-link-service/deployment.yaml)
- [phi-docs deployment](advanciapayledger/infra/k8s/overlays/prod/platform-core/phi-docs-service/deployment.yaml)

Example:

```yaml
image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/health-billing-service:latest
```

---

## Step 6: Build and Push Images

### GitHub Actions (Recommended)

Set GitHub secrets:

- `AWS_REGION`: `us-east-1`
- `AWS_OIDC_ROLE_ARN`: deploy role ARN

Trigger workflow:

- Navigate to Actions → "Build and Push PHI Services to ECR"
- Click "Run workflow"

### Manual Build/Push

```powershell
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build and push each service
cd services/phi/health-billing-service
docker build -t health-billing-service:latest .
docker tag health-billing-service:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/health-billing-service:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/health-billing-service:latest

# Repeat for patient-link-service and phi-docs-service
```

---

## Step 7: Deploy to EKS via ArgoCD

Ensure ArgoCD Applications are applied:

```powershell
kubectl apply -f gitops/apps/health-billing-argocd.yaml
kubectl apply -f gitops/apps/patient-link-argocd.yaml
kubectl apply -f gitops/apps/phi-docs-argocd.yaml
```

Or use ApplicationSet:

```powershell
kubectl apply -f gitops/appset/applicationset.yaml
```

Sync manually if needed:

```powershell
argocd app sync health-billing-service
argocd app sync patient-link-service
argocd app sync phi-docs-service
```

---

## Step 8: Validate Deployment

### Check Pods

```powershell
kubectl -n platform-core get pods -l app=health-billing-service
kubectl -n platform-core get pods -l app=patient-link-service
kubectl -n platform-core get pods -l app=phi-docs-service
```

### Verify External Secrets

```powershell
kubectl -n platform-core get externalsecret
kubectl -n platform-core get secrets | Select-String "health-billing"
```

### Check IRSA Annotations

```powershell
kubectl -n platform-core describe sa health-billing-service | Select-String "role-arn"
```

### Test Ingress Routes

```powershell
curl -s https://your.domain/health/billing/health
curl -s https://your.domain/health/patient-link/health
curl -s https://your.domain/health/docs/health
```

---

## Step 9: Observability Setup

### CloudWatch Logs

- EKS logs to CloudWatch (Fluent Bit DaemonSet)
- Service logs include diagnostics

### CloudTrail

- Org-wide trail captures all API calls
- Immutable S3 audit bucket

### Security Hub & GuardDuty

- Enable in regulated account
- Review findings weekly

### Prometheus/Grafana (Optional)

- Use ServiceMonitors created in overlays
- Dashboard for PHI service health

---

## Step 10: Security Checklist

- [ ] BAA signed with AWS
- [ ] IRSA roles limited to specific ServiceAccounts
- [ ] KMS encryption on Aurora, S3, SQS
- [ ] RLS enabled on PHI tables
- [ ] `/health/*` routes terminate in AWS
- [ ] No PHI in build logs or GitHub artifacts
- [ ] Secrets in AWS Secrets Manager only
- [ ] CloudTrail + CloudWatch + GuardDuty enabled
- [ ] VPC Flow Logs enabled
- [ ] Public access blocked on S3 PHI bucket
- [ ] TLS enforced on Aurora connections

---

## Troubleshooting

### External Secrets Not Syncing

```powershell
kubectl -n platform-core logs deployment/external-secrets
kubectl -n platform-core describe externalsecret health-billing-service-external
```

Check IRSA permissions for `external-secrets-sa`.

### Pods CrashLoopBackOff

```powershell
kubectl -n platform-core logs deployment/health-billing-service
```

Common issues:

- DATABASE_URL missing or incorrect
- Aurora endpoint not reachable from EKS
- Security group rules blocking traffic

### IRSA Role Not Assumed

Verify:

- OIDC provider configured in EKS
- Trust policy includes correct SA and namespace
- ServiceAccount has `eks.amazonaws.com/role-arn` annotation

---

## Next Steps

- Add EventBridge rules for de-identified events
- Implement SQS consumers for async processing
- Add backup/restore procedures for Aurora
- Conduct penetration testing
- Document incident response plan
- Perform HIPAA compliance audit
