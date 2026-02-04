# Advancia PHI Platform - Enterprise Security Summary

## Executive Overview

Advancia's PHI processing platform is architected from the ground up to meet HIPAA, SOC 2, and enterprise healthcare security requirements. This document provides a high-level overview for security teams, compliance officers, and enterprise buyers.

---

## Architecture Principles

### 1. PHI Island Isolation

**What it means**: All Protected Health Information (PHI) stays within a dedicated AWS regulated account, completely isolated from non-PHI workloads.

**Why it matters**: Eliminates risk of accidental PHI exposure through misconfiguration or cross-contamination with non-regulated services.

**How it works**:

- Separate AWS account for regulated workloads
- Private VPC subnets with no internet egress
- API Gateway enforces `/health/*` boundary
- Only opaque reference IDs cross the boundary

---

### 2. Encryption Everywhere

**What it means**: PHI is encrypted at rest and in transit at all times, using AWS KMS customer-managed keys.

**Why it matters**: Even if an attacker gains access to storage, they cannot read PHI without the encryption keys.

**Coverage**:

- Aurora PostgreSQL: KMS encryption
- S3 PHI documents: KMS encryption, versioning enabled
- SQS queues: KMS encryption
- ElastiCache: KMS encryption (at rest + in transit)
- All network traffic: TLS 1.2+

---

### 3. Zero Trust Architecture

**What it means**: Every service has minimal permissions, and no service trusts any other by default.

**Why it matters**: Limits blast radius of any potential breach or misconfiguration.

**Implementation**:

- IAM roles per microservice (IRSA)
- Security groups per service (network isolation)
- No shared credentials
- All access logged and audited
- Break-glass procedures for emergencies only

---

### 4. Defense in Depth

**What it means**: Multiple layers of security controls, so failure of one layer doesn't compromise PHI.

**Layers**:

1. **Network**: VPC, security groups, no public IPs
2. **Application**: JWT auth, input validation, PHI redaction
3. **Data**: KMS encryption, RLS, parameterized queries
4. **Monitoring**: CloudTrail, GuardDuty, Security Hub
5. **Access**: IAM least privilege, MFA, break-glass

---

## Security Controls

### Authentication & Authorization

- **API-level**: JWT tokens with 15-minute expiration
- **Service-level**: IRSA roles with OIDC federation
- **Database-level**: Row-Level Security (RLS) per tenant
- **Break-glass**: Time-limited elevated access with full audit trail

### Audit & Monitoring

- **CloudTrail**: All API calls, 7-year retention, immutable
- **CloudWatch Logs**: Service logs (PHI-redacted), 1-year retention
- **S3 Access Logs**: All PHI document access, 1-year retention
- **VPC Flow Logs**: Network traffic metadata, 90 days
- **GuardDuty**: Real-time threat detection
- **Security Hub**: Centralized compliance dashboard

### Incident Response

- **Detection**: Automated alerts on suspicious activity
- **Containment**: Automated security group updates
- **Investigation**: Complete audit trail in CloudTrail
- **Notification**: Breach notification procedures (72 hours)
- **Recovery**: Disaster recovery playbook

---

## Compliance Status

### HIPAA Security Rule §164.312

✅ **Fully Compliant**

- Access Control (§164.312(a))
- Audit Controls (§164.312(b))
- Integrity (§164.312(c))
- Person/Entity Authentication (§164.312(d))
- Transmission Security (§164.312(e))

[View detailed mapping →](HIPAA_Compliance_Mapping.md)

### Business Associate Agreement (BAA)

✅ **Signed with AWS**

- Covers all AWS services used by PHI platform
- Annual review process

### SOC 2 Type II

🔄 **In Progress**

- Infrastructure controls: Complete
- Process documentation: In progress
- Observation period: Not started
- Estimated completion: Q3 2026

### HITRUST

📋 **Planned**

- Estimated start: Q4 2026
- Estimated completion: Q2 2027

---

## Data Flow Transparency

### What Enters the PHI Island

- Insurance card images
- Patient demographics
- Claims data
- Service records
- Diagnosis/procedure codes

### What Leaves the PHI Island

- Opaque reference IDs (`patient_ref_id`, `claim_ref_id`)
- Claim status updates
- Financial totals (no PHI)
- De-identified analytics

### What Never Leaves

- Patient names, DOB, SSN
- Member/group numbers
- Diagnosis/procedure codes
- Raw insurance card images
- EOBs/statements

[View complete data flow →](PHI_Data_Flow.md)

---

## Security Testing

### Continuous

- Dependency scanning (daily)
- Container image scanning (every build)
- IAM privilege escalation testing (weekly)
- GuardDuty monitoring (real-time)

### Periodic

- Penetration testing (annual, external)
- OWASP Top 10 validation (quarterly)
- Infrastructure vulnerability scanning (monthly)
- Security control audit (quarterly)

---

## Risk Mitigation

### Top Risks & Mitigations

| Risk                    | Likelihood | Impact   | Mitigation                                                  |
| ----------------------- | ---------- | -------- | ----------------------------------------------------------- |
| Misconfigured S3 bucket | Low        | Critical | Block public access, VPC endpoints only, automated scanning |
| PHI in logs             | Medium     | High     | PHI redaction middleware, log scanning, developer training  |
| Credential theft        | Medium     | High     | No long-lived credentials, IRSA, token expiration           |
| Insider threat          | Low        | Critical | IAM least privilege, CloudTrail, no console access          |
| Lateral movement        | Low        | High     | Security groups, no internet egress, network segmentation   |

[View full threat model →](PHI_Threat_Model.md)

---

## Enterprise Integration

### APIs

- RESTful JSON APIs
- OpenAPI/Swagger documentation
- JWT-based authentication
- Webhook support for events

### Data Residency

- All PHI stays in US East (N. Virginia)
- Aurora Multi-AZ for high availability
- Cross-region disaster recovery available

### Scalability

- Horizontally scalable microservices
- Auto-scaling based on demand
- Support for millions of transactions/day

### Support

- 99.9% uptime SLA
- 24/7 on-call engineering
- Dedicated enterprise support channel

---

## Questions for Procurement Teams

### Q: Where is our data stored?

**A**: All PHI is stored in AWS US East (N. Virginia) region in Aurora PostgreSQL and S3, encrypted with your organization-specific KMS keys.

### Q: Can you access our PHI?

**A**: No. Our engineers have zero access to PHI in production. Emergency break-glass access requires incident commander approval, is time-limited to 1 hour, and is fully logged.

### Q: What happens if there's a breach?

**A**: We have breach notification procedures compliant with HIPAA's 72-hour requirement. Our incident response playbook includes detection, containment, investigation, notification, and recovery phases.

### Q: How do you handle backups?

**A**: Aurora automated backups occur daily, encrypted with KMS, 7-day retention. Snapshots are encrypted and cannot be shared outside the account.

### Q: Can we audit your security controls?

**A**: Yes. We provide full CloudTrail logs, compliance documentation, and support annual security assessments by your team or third-party auditors.

### Q: What certifications do you have?

**A**: HIPAA-compliant architecture (§164.312), AWS BAA, SOC 2 Type II in progress (Q3 2026).

---

## Getting Started

### For Security Teams

1. Review [PHI Threat Model](PHI_Threat_Model.md)
2. Review [IAM Access Matrix](IAM_Access_Matrix.md)
3. Review [HIPAA Compliance Mapping](HIPAA_Compliance_Mapping.md)
4. Schedule architecture review call

### For Compliance Teams

1. Review [HIPAA Compliance Mapping](HIPAA_Compliance_Mapping.md)
2. Request AWS BAA copy
3. Request CloudTrail log samples
4. Schedule compliance walkthrough

### For Engineering Teams

1. Review [PHI Data Flow](PHI_Data_Flow.md)
2. Review API documentation
3. Review [Deployment Guide](PHI_Deployment_Guide.md)
4. Schedule technical integration call

---

## Contact

**Security Inquiries**: security@advancia.com  
**Compliance Questions**: compliance@advancia.com  
**Technical Integration**: engineering@advancia.com

---

_Last Updated: February 4, 2026_
