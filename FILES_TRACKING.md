# Files Tracking Index

This index lists key GitOps, Kubernetes overlays, and Terraform env files for production.

## GitOps Applications

- [gitops/apps/api-gateway-argocd.yaml](advanciapayledger/gitops/apps/api-gateway-argocd.yaml)
- [gitops/apps/auth-service-argocd.yaml](advanciapayledger/gitops/apps/auth-service-argocd.yaml)
- [gitops/apps/tenant-service-argocd.yaml](advanciapayledger/gitops/apps/tenant-service-argocd.yaml)
- [gitops/apps/billing-service-argocd.yaml](advanciapayledger/gitops/apps/billing-service-argocd.yaml)
- [gitops/apps/metering-service-argocd.yaml](advanciapayledger/gitops/apps/metering-service-argocd.yaml)
- [gitops/apps/web3-event-service-argocd.yaml](advanciapayledger/gitops/apps/web3-event-service-argocd.yaml)
- [gitops/apps/ai-orchestrator-argocd.yaml](advanciapayledger/gitops/apps/ai-orchestrator-argocd.yaml)
- [gitops/apps/monitoring-service-argocd.yaml](advanciapayledger/gitops/apps/monitoring-service-argocd.yaml)
- [gitops/apps/notification-service-argocd.yaml](advanciapayledger/gitops/apps/notification-service-argocd.yaml)
- [gitops/apps/security-service-argocd.yaml](advanciapayledger/gitops/apps/security-service-argocd.yaml)
- [gitops/apps/audit-log-service-argocd.yaml](advanciapayledger/gitops/apps/audit-log-service-argocd.yaml)
- [gitops/apps/external-secrets-argocd.yaml](advanciapayledger/gitops/apps/external-secrets-argocd.yaml)
- [gitops/apps/monitoring-argocd.yaml](advanciapayledger/gitops/apps/monitoring-argocd.yaml)
- [gitops/apps/health-billing-service-argocd.yaml](advanciapayledger/gitops/apps/health-billing-service-argocd.yaml)
- [gitops/apps/patient-link-service-argocd.yaml](advanciapayledger/gitops/apps/patient-link-service-argocd.yaml)
- [gitops/apps/phi-docs-service-argocd.yaml](advanciapayledger/gitops/apps/phi-docs-service-argocd.yaml)
- [gitops/appset/applicationset.yaml](advanciapayledger/gitops/appset/applicationset.yaml)

## Kubernetes Overlays (prod/platform-core)

- [infra/k8s/overlays/prod/platform-core/ingress.yaml](advanciapayledger/infra/k8s/overlays/prod/platform-core/ingress.yaml)
- [infra/k8s/overlays/prod/platform-core/secretstore-vault.yaml](advanciapayledger/infra/k8s/overlays/prod/platform-core/secretstore-vault.yaml)
- [infra/k8s/overlays/prod/platform-core/vault-auth-serviceaccount.yaml](advanciapayledger/infra/k8s/overlays/prod/platform-core/vault-auth-serviceaccount.yaml)

### Services

Each service directory should include: deployment.yaml, service.yaml, serviceaccount.yaml, external-secret.yaml, pdb.yaml, hpa.yaml, networkpolicy.yaml, servicemonitor.yaml.

- [api-gateway](advanciapayledger/infra/k8s/overlays/prod/platform-core/api-gateway)
- [auth-service](advanciapayledger/infra/k8s/overlays/prod/platform-core/auth-service)
- [tenant-service](advanciapayledger/infra/k8s/overlays/prod/platform-core/tenant-service)
- [billing-service](advanciapayledger/infra/k8s/overlays/prod/platform-core/billing-service)
- [metering-service](advanciapayledger/infra/k8s/overlays/prod/platform-core/metering-service)
- [web3-event-service](advanciapayledger/infra/k8s/overlays/prod/platform-core/web3-event-service)
- [ai-orchestrator](advanciapayledger/infra/k8s/overlays/prod/platform-core/ai-orchestrator)
- [monitoring-service](advanciapayledger/infra/k8s/overlays/prod/platform-core/monitoring-service)
- [notification-service](advanciapayledger/infra/k8s/overlays/prod/platform-core/notification-service)
- [security-service](advanciapayledger/infra/k8s/overlays/prod/platform-core/security-service)
- [audit-log-service](advanciapayledger/infra/k8s/overlays/prod/platform-core/audit-log-service)
- [health-billing-service](advanciapayledger/infra/k8s/overlays/prod/platform-core/health-billing-service)
- [patient-link-service](advanciapayledger/infra/k8s/overlays/prod/platform-core/patient-link-service)
- [phi-docs-service](advanciapayledger/infra/k8s/overlays/prod/platform-core/phi-docs-service)

## Terraform (envs/prod)

- [infra/terraform/envs/prod/main.tf](advanciapayledger/infra/terraform/envs/prod/main.tf)
- [infra/terraform/envs/prod/variables.tf](advanciapayledger/infra/terraform/envs/prod/variables.tf)
- [infra/terraform/envs/prod/terraform.tfvars.example](advanciapayledger/infra/terraform/envs/prod/terraform.tfvars.example)
- [infra/terraform/modules/messaging](advanciapayledger/infra/terraform/modules/messaging)
- [infra/terraform/modules/eventbridge](advanciapayledger/infra/terraform/modules/eventbridge)
- [infra/terraform/modules/s3-buckets](advanciapayledger/infra/terraform/modules/s3-buckets)

## CI/CD

- [ .github/workflows/image-update.yml ](advanciapayledger/.github/workflows/image-update.yml)

Notes:

- All service overlays now have the canonical 8 manifest files.
- GitOps includes both ApplicationSet and individual Applications for flexibility.
