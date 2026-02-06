# HIPAA AWS Island

This document outlines the recommended "HIPAA island" backbone on AWS and how Advancia splits PHI vs non-PHI.

## Backbone (HIPAA-eligible)

- VPC with private subnets; public only for ALB/API Gateway
- Compute in private subnets: EKS or ECS/Fargate
- Data plane: Aurora/RDS Postgres, ElastiCache Redis, SQS, SNS/EventBridge, S3
- Security & compliance: KMS, CloudTrail, CloudWatch Logs, strict IAM; BAA with AWS

## PHI vs Non-PHI Split

- PHI services run in AWS and use HIPAA-eligible services exclusively
- Non-PHI can run hybrid (e.g., Vercel, Upstash), but never process PHI
- Communication via authenticated, encrypted APIs; no shared DBs across the boundary

## Current Implementation (first pass)

- Terraform modules: EKS cluster, Postgres (RDS), Redis (ElastiCache), Ingress, KMS, Messaging (SQS/SNS)
- Kubernetes: platform-core overlays with service manifests
- GitOps: Argo CD Applications and ApplicationSet; monitoring stack; External Secrets operator
- Secrets: Both Vault and AWS Secrets Manager support via External Secrets

## Secrets Management for PHI

- Use AWS Secrets Manager via ClusterSecretStore: [infra/k8s/overlays/prod/platform-core/clustersecretstore-aws.yaml](advanciapayledger/infra/k8s/overlays/prod/platform-core/clustersecretstore-aws.yaml)
- External Secrets operator uses IRSA through its ServiceAccount in `external-secrets` namespace
- PHI-aware services should reference `aws-secretsmanager` store

## Messaging

- SQS queues and SNS topics via Terraform
- Example tfvars: [infra/terraform/envs/prod/messaging.tfvars.example](advanciapayledger/infra/terraform/envs/prod/messaging.tfvars.example)

## Next Steps

1. Classify services into PHI-aware vs non-PHI
2. Point PHI services' `ExternalSecret` to `aws-secretsmanager`
3. Populate `terraform.tfvars` with VPC/subnets/SGs, DB creds, queue/topic names
4. Apply Terraform in a non-prod environment and verify
5. Deploy External Secrets and monitoring apps, then service apps via Argo CD

## Notes

- Ensure KMS keys are configured on data plane resources (RDS, EBS, ElastiCache)
- Use CloudTrail + CloudWatch Logs for audit; restrict IAM roles via IRSA to least privilege
