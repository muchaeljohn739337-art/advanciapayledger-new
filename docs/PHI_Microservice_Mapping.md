# PHI Microservice Mapping

This document maps PHI-aware services, data stores, and AWS resources.

## Services

- health-billing-service
  - Endpoints: POST /health/claims/submit, GET /health/claims/{id}
  - Data: Claims, billing PHI
  - AWS: Aurora (health schemas), SQS (claims-processing), EventBridge (health-events-bus)
- patient-link-service
  - Endpoints: GET /health/patient/{id}, POST /health/patient/link
  - Data: Patient identifiers and linkage tokens
  - AWS: Aurora (patients), SQS (link tasks)
- phi-docs-service
  - Endpoints: POST /health/documents/generate, GET /health/documents/{id}
  - Data: Generated PHI documents (PDF/JSON)
  - AWS: S3 (advancia-phi-docs), SQS (doc-generation)

## Boundaries

- Ingress: /health/\* routes terminate in AWS (ALB → ECS/EKS)
- Data residency: PHI only in Aurora/S3/SQS (regulated account)
- Non-PHI: core services outside AWS may integrate via de-identified events

## IAM & Secrets

- IRSA roles per service with least-privilege
- Secrets in AWS Secrets Manager: advancia/prod/<service>
- KMS keys: kms/phi-data-key, kms/phi-docs-key

## Observability

- CloudWatch Logs, org CloudTrail, Security Hub, GuardDuty
