# PHI Threat Model & Attack Surface

## Overview

This document defines the security posture for Advancia's HIPAA-regulated PHI processing environment.

## Primary Objective

Protect PHI from:

- Unauthorized access
- Unauthorized disclosure
- Tampering
- Exfiltration
- Lateral movement
- Misconfiguration
- Insider misuse

## Primary Assets

- PHI in Aurora (health schema)
- PHI documents in S3
- PHI messages in SQS
- PHI events in EventBridge
- PHI-processing services in ECS/EKS
- KMS keys
- IAM roles
- API Gateway endpoints

## Attack Surface Map

### A. Ingress Layer (API Gateway)

**Attack Vectors:**

- Credential theft
- Token replay
- Injection attacks
- Overly permissive CORS
- Misconfigured authorizers

**Controls:**

- Strict JWT validation
- TLS enforced
- WAF rules
- Rate limiting
- No PHI in logs
- IAM-based service routing

### B. Application Layer (PHI Services)

**Attack Vectors:**

- Vulnerable dependencies
- SSRF / RCE
- Logic flaws
- Over-privileged IAM roles
- Debug logs leaking PHI

**Controls:**

- Minimal IAM per service
- No outbound internet
- Dependency scanning
- Secrets in AWS Secrets Manager
- Structured logging with PHI redaction

### C. Data Layer (Aurora, S3, ElastiCache)

**Attack Vectors:**

- Misconfigured S3 bucket
- Public subnet exposure
- SQL injection
- Credential leakage
- Snapshot exfiltration

**Controls:**

- Private subnets only
- KMS encryption at rest
- S3 bucket policies locked to VPC endpoints
- Parameterized queries
- Encrypted snapshots
- No public access

### D. Queue/Event Layer (SQS, EventBridge)

**Attack Vectors:**

- PHI in event payloads
- Over-permissive queue policies
- Replay attacks

**Controls:**

- PHI-safe event schemas
- Strict IAM on queue consumers
- KMS encryption
- Dead-letter queues with PHI isolation

### E. Compute Layer (ECS/EKS)

**Attack Vectors:**

- Container escape
- Privileged containers
- Node compromise
- Lateral movement

**Controls:**

- Fargate (no nodes to manage) or private EKS nodes
- No privileged containers
- Security groups per service
- No public IPs
- Zero outbound internet

### F. Identity Layer (IAM, KMS)

**Attack Vectors:**

- Over-privileged roles
- Key misuse
- Credential leakage

**Controls:**

- IAM least privilege
- One role per service
- Separate KMS keys for PHI vs non-PHI
- Key rotation enabled
- CloudTrail logging of all key usage

### G. Logging & Monitoring Layer

**Attack Vectors:**

- PHI in logs
- Log exfiltration
- Missing audit trails

**Controls:**

- PHI redaction middleware
- CloudTrail (org-wide)
- CloudWatch Logs (metadata only)
- GuardDuty
- Security Hub
- S3 immutable audit bucket

## Threat Scenarios & Mitigations

### Scenario 1: Compromised tenant account uploads malicious payload

**Mitigation:**

- Strict validation at intake
- WAF rules
- No direct DB access
- Intake service sanitizes everything
- Rate limiting per tenant

### Scenario 2: Developer accidentally logs PHI

**Mitigation:**

- Redaction middleware in all services
- Log scanning with automated alerts
- PHI-safe logging guidelines
- CloudWatch alarms for suspicious patterns

### Scenario 3: Misconfigured S3 bucket exposes PHI documents

**Mitigation:**

- Block public access at bucket and account level
- VPC endpoint-only access
- KMS encryption required
- Bucket policy denies all non-PHI roles
- S3 Access Analyzer

### Scenario 4: Lateral movement inside VPC

**Mitigation:**

- Security groups per service
- No cross-service access unless explicitly required
- No outbound internet
- IAM least privilege
- VPC Flow Logs

### Scenario 5: Insider attempts to access PHI

**Mitigation:**

- IAM role separation
- No console access for PHI services
- CloudTrail logs all access
- S3 access logs
- KMS key usage logs
- Break-glass procedures only

### Scenario 6: Dependency vulnerability in PHI service

**Mitigation:**

- Automated dependency scanning in CI/CD
- ECR image scanning
- Regular patching schedule
- Vulnerability response SLA

### Scenario 7: Snapshot/backup exfiltration

**Mitigation:**

- Encrypted snapshots with separate KMS key
- Snapshot sharing disabled
- IAM controls on snapshot access
- Audit all snapshot operations

## PHI Boundary Enforcement Rules

### Absolute Rules

- No PHI leaves AWS regulated account
- No PHI in logs, metrics, traces, or events
- No PHI in non-HIPAA vendors
- No PHI in Upstash, Vercel KV, or any non-eligible DB
- Only PHI services can access PHI Aurora schemas
- Only PHI services can access PHI S3 bucket
- Only PHI workers can consume PHI SQS queues
- Only PHI KMS keys can decrypt PHI data

### Data Classification

- **PHI**: Stays in Aurora health.\*, S3 PHI bucket, encrypted SQS
- **PHI-derived opaque IDs**: Can cross boundary (patient_ref_id, claim_ref_id)
- **Financial summaries**: Can cross boundary (amounts, status)
- **De-identified analytics**: Can cross boundary after review

### Service Boundaries

- PHI services: claims-intake, patient-link, health-billing, phi-docs
- Non-PHI services: auth, tenant, billing, ledger, events
- No direct communication between islands
- API Gateway enforces boundary

## Security Testing Requirements

### Pre-Production

- Penetration testing (annual)
- OWASP Top 10 validation
- Infrastructure scanning
- IAM privilege escalation testing

### Continuous

- Dependency scanning
- Container image scanning
- CloudTrail monitoring
- GuardDuty alerts
- Security Hub findings

### Incident Response

- Breach notification procedures (72 hours)
- Evidence preservation
- Root cause analysis
- Remediation tracking

## Compliance Checkpoints

- [ ] BAA signed with AWS
- [ ] KMS encryption on all PHI data stores
- [ ] Private subnets for all PHI services
- [ ] No public IPs on PHI resources
- [ ] IAM least privilege enforced
- [ ] CloudTrail enabled org-wide
- [ ] S3 public access blocked
- [ ] VPC Flow Logs enabled
- [ ] GuardDuty enabled
- [ ] Security Hub enabled
- [ ] PHI redaction in logs verified
- [ ] RLS enabled on PHI tables
- [ ] Backup encryption verified
- [ ] Key rotation enabled
