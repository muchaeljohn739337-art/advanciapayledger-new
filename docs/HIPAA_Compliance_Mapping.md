# HIPAA §164 Technical Safeguards Compliance Mapping

## Overview

This document maps Advancia's PHI platform architecture to HIPAA Security Rule §164.312 Technical Safeguards requirements.

---

## §164.312(a)(1) Access Control

### Requirement

Implement technical policies and procedures for electronic information systems that maintain ePHI to allow access only to those persons or software programs that have been granted access rights.

### Implementation Standards

#### §164.312(a)(2)(i) Unique User Identification (Required)

**Advancia Implementation:**

- **IAM roles per service**: Each PHI service has dedicated IRSA role
- **ServiceAccount per microservice**: Kubernetes/ECS service accounts
- **No shared credentials**: Each service uses unique Secrets Manager entries
- **CloudTrail logging**: All access attempts logged with identity

**Evidence:**

- [IAM Access Matrix](IAM_Access_Matrix.md)
- [IRSA role definitions](advanciapayledger/infra/terraform/envs/prod/irsa.tf)
- CloudTrail logs showing service-level attribution

#### §164.312(a)(2)(ii) Emergency Access Procedure (Required)

**Advancia Implementation:**

- **Break-glass IAM roles**: Time-limited elevated access
- **Incident commander approval**: Required before role assumption
- **Maximum 1-hour sessions**: Automatic expiration
- **Post-incident review**: Mandatory within 24 hours
- **All actions logged**: CloudTrail captures every operation

**Evidence:**

- [Break-glass procedures](IAM_Access_Matrix.md#emergency-break-glass-procedures)
- IAM policy with time-based conditions
- Incident response playbook

#### §164.312(a)(2)(iii) Automatic Logoff (Addressable)

**Advancia Implementation:**

- **Session tokens expire**: JWT tokens with 15-minute lifetime
- **No long-lived credentials**: All tokens rotate
- **Idle timeout**: 30 minutes for console sessions (if enabled)

**Evidence:**

- API Gateway JWT validation configuration
- Token expiration in auth service

#### §164.312(a)(2)(iv) Encryption and Decryption (Addressable)

**Advancia Implementation:**

- **At rest encryption**:
  - Aurora: KMS `phi-data-key`
  - S3: KMS `phi-docs-key`
  - SQS: KMS `phi-data-key`
  - ElastiCache: KMS `phi-data-key`
- **In transit encryption**:
  - TLS 1.2+ for all API endpoints
  - TLS for Aurora connections (`sslmode=require`)
  - HTTPS-only S3 access
- **Key rotation**: Automatic annual rotation enabled

**Evidence:**

- [KMS module](advanciapayledger/infra/terraform/modules/kms)
- Aurora encrypted storage configuration
- S3 bucket policy requiring encryption

---

## §164.312(b) Audit Controls

### Requirement

Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use ePHI.

**Advancia Implementation:**

- **CloudTrail**: Org-wide, immutable, 7-year retention
- **CloudWatch Logs**: Service logs (PHI-redacted), 1-year retention
- **S3 Access Logs**: All PHI bucket operations, 1-year retention
- **VPC Flow Logs**: Network traffic metadata, 90 days
- **EventBridge logs**: All event publishes captured
- **Database audit logging**: Aurora logs all queries (metadata only)

**Audit Coverage:**

- Who accessed what PHI
- When access occurred
- What actions were taken
- Source IP and user agent
- Success/failure of operations

**Evidence:**

- CloudTrail configuration showing all data events
- CloudWatch Log Groups for each service
- S3 bucket with access logging enabled
- [Audit layer documentation](PHI_Data_Flow.md#audit--compliance-layer)

---

## §164.312(c)(1) Integrity

### Requirement

Implement policies and procedures to protect ePHI from improper alteration or destruction.

#### §164.312(c)(2) Mechanism to Authenticate ePHI (Addressable)

**Advancia Implementation:**

- **Database constraints**: Foreign keys, check constraints, NOT NULL
- **Audit trails**: Every PHI modification logged
- **Versioning**: S3 versioning enabled on PHI bucket
- **Checksums**: S3 ETags for document integrity
- **Immutable logs**: CloudTrail logs cannot be altered
- **Digital signatures**: (Future) Sign generated documents

**Evidence:**

- [Aurora schema](advanciapayledger/infra/db/aurora/phi_schema.sql) with constraints
- S3 versioning configuration
- CloudTrail log file integrity validation

---

## §164.312(d) Person or Entity Authentication

### Requirement

Implement procedures to verify that a person or entity seeking access to ePHI is the one claimed.

**Advancia Implementation:**

- **JWT-based authentication**: All API requests require valid tokens
- **Service-to-service authentication**: IRSA roles with OIDC provider
- **Multi-factor authentication**: (Recommended for admin access)
- **Certificate-based TLS**: Aurora connections use certificates
- **No anonymous access**: All endpoints require authentication

**Evidence:**

- API Gateway JWT authorizer configuration
- IRSA trust policies with OIDC
- [PHI service authentication flow](PHI_Data_Flow.md#layer-1-ingress---api-gateway)

---

## §164.312(e)(1) Transmission Security

### Requirement

Implement technical security measures to guard against unauthorized access to ePHI that is being transmitted over an electronic communications network.

#### §164.312(e)(2)(i) Integrity Controls (Addressable)

**Advancia Implementation:**

- **TLS 1.2+ for all transmissions**: API Gateway, Aurora, S3
- **HTTPS-only policies**: S3 bucket policies deny HTTP
- **VPC endpoints**: PHI services communicate via private AWS network
- **No internet egress**: PHI services have zero outbound internet
- **Message authentication**: SQS message deduplication

**Evidence:**

- API Gateway TLS configuration
- S3 bucket policy requiring `aws:SecureTransport`
- VPC endpoint configuration
- Security groups blocking outbound internet

#### §164.312(e)(2)(ii) Encryption (Addressable)

**Advancia Implementation:**

- **End-to-end encryption**:
  - Client → API Gateway: TLS 1.3
  - API Gateway → ECS/EKS: TLS within VPC
  - Services → Aurora: TLS required
  - Services → S3: HTTPS enforced
  - Services → SQS: HTTPS + KMS encryption
- **No plaintext PHI in transit**: All channels encrypted

**Evidence:**

- TLS certificates from ACM
- Aurora connection strings with `sslmode=require`
- S3 SDK configuration requiring HTTPS
- [Transmission security controls](PHI_Threat_Model.md#c-data-layer-aurora-s3-elasticache)

---

## Administrative Safeguards (§164.308)

### §164.308(a)(1)(ii)(D) Information System Activity Review

**Requirement**: Implement procedures to regularly review records of information system activity (e.g., audit logs, access reports, security incident tracking reports).

**Advancia Implementation:**

- **Weekly IAM privilege review**: Automated reports via IAM Access Analyzer
- **Monthly access pattern analysis**: GuardDuty findings review
- **Quarterly audit trail verification**: Manual CloudTrail log review
- **Annual penetration test**: External security assessment
- **Real-time alerting**: CloudWatch alarms for anomalous activity
- **Automated anomaly detection**: GuardDuty for suspicious behavior

**Evidence:**

- [Security testing requirements](PHI_Threat_Model.md#security-testing-requirements)
- IAM Access Analyzer reports
- GuardDuty findings dashboard
- CloudWatch alarm configurations

### §164.308(a)(3) Workforce Security

**Requirement**: Implement policies and procedures to ensure that all members of the workforce have appropriate access to ePHI and to prevent those workforce members who do not have access from obtaining access.

**Advancia Implementation:**

- **Principle of least privilege**: Each service has minimal IAM permissions
- **Role separation**: No service can access others' PHI resources
- **No developer/support access to PHI**: Service-only access enforced
- **IAM role separation**: DevOps, Security, Engineering roles distinct
- **Break-glass access disabled by default**: Requires explicit approval
- **Zero trust between services**: No service trusts another
- **Termination procedures**: Automated IAM role revocation on offboarding
- **Access reviews**: Quarterly verification of all active roles

**Evidence:**

- [IAM least privilege verification](IAM_Access_Matrix.md#least-privilege-verification)
- [Human access controls](IAM_Access_Matrix.md#human-access-controls)
- Automated role cleanup scripts
- [PHI boundary enforcement](PHI_Threat_Model.md#phi-boundary-enforcement-rules)

### §164.308(a)(4) Information Access Management

**Requirement**: Implement policies and procedures for authorizing access to ePHI consistent with applicable requirements (minimum necessary principle).

**Advancia Implementation:**

- **Role-based access**: Services grouped by function
- **Table-level Aurora permissions**: No service has full schema access
- **S3 bucket-level restrictions**: Path-based access control (`/intake/*`, `/documents/*`, `/identity/*`)
- **Queue-level SQS restrictions**: Producer/consumer separation
- **Service-specific IAM roles**: Each microservice has dedicated role
- **No console access to PHI**: Break-glass only, with approval
- **Aurora RLS (Row-Level Security)**: Tenant isolation enforced at DB level
- **S3 bucket policies**: VPC endpoint-only access, deny all non-PHI roles
- **No cross-service access**: Unless explicitly required and documented

**Evidence:**

- [Aurora permissions matrix](IAM_Access_Matrix.md#services--aurora-access)
- [S3 access matrix](IAM_Access_Matrix.md#services--s3-access-phipii-bucket)
- [RLS policies](advanciapayledger/infra/db/aurora/phi_rls_policies.sql)
- S3 bucket policy denying non-VPC access
- [PHI boundary rules](PHI_Threat_Model.md#phi-boundary-enforcement-rules)

### §164.308(a)(5) Security Awareness and Training

**Requirement**: Implement a security awareness and training program for all members of its workforce.

**Advancia Implementation:**

- **Engineering guidelines**:
  - No PHI in logs (automated redaction middleware)
  - No PHI in non-HIPAA tools (Slack, Jira, etc.)
  - No screenshots or exports of PHI
  - No local storage of PHI
- **Automated PHI redaction middleware**: [phiRedaction.ts](advanciapayledger/services/phi/shared/middleware/phiRedaction.ts)
- **Internal documentation for PHI boundary**: [PHI Threat Model](PHI_Threat_Model.md), [Data Flow](PHI_Data_Flow.md)
- **Developer onboarding**: HIPAA awareness training
- **Incident response training**: Annual drills

**Evidence:**

- [PHI redaction middleware](advanciapayledger/services/phi/shared/middleware/phiRedaction.ts)
- [PHI handling guidelines](PHI_Threat_Model.md#phi-boundary-enforcement-rules)
- Developer handbook (internal)

### §164.308(a)(6) Security Incident Procedures

**Requirement**: Implement policies and procedures to address security incidents.

**Advancia Implementation:**

- **GuardDuty monitoring**: Real-time threat detection
- **CloudWatch alarms**: Anomalous activity alerts
- **EventBridge alerts**: PHI access pattern anomalies
- **Incident response runbooks**: Documented procedures for breach scenarios
- **Immutable audit logs**: CloudTrail logs cannot be altered post-incident
- **Automated containment**: Security groups auto-revoke on threat detection
- **Post-incident review**: Mandatory root cause analysis within 24 hours

**Evidence:**

- GuardDuty configuration
- CloudWatch alarm definitions
- Incident response playbook (internal)
- [Break-glass procedures](IAM_Access_Matrix.md#emergency-break-glass-procedures)

### §164.308(a)(7) Contingency Plan

**Requirement**: Establish (and implement as needed) policies and procedures for responding to an emergency or other occurrence that damages systems containing ePHI.

**Advancia Implementation:**

- **Aurora Multi-AZ**: Automatic failover to standby
- **Automated backups**: Daily snapshots with 7-day retention (configurable to 35 days)
- **S3 versioning**: All PHI documents have version history
- **Cross-region replication**: (Optional) Disaster recovery in secondary region
- **ECS/EKS Multi-AZ deployment**: Services distributed across availability zones
- **RTO/RPO targets**:
  - RTO: < 15 minutes (Aurora failover)
  - RPO: < 5 minutes (Aurora continuous backup)
- **Disaster recovery testing**: Quarterly failover drills

**Evidence:**

- Aurora Multi-AZ configuration
- Automated backup schedule
- S3 versioning policy
- [Disaster recovery plan](DISASTER_RECOVERY_PLAN.md) (if exists)

### §164.308(a)(8) Evaluation

**Requirement**: Perform a periodic technical and nontechnical evaluation of how well security policies and procedures meet the requirements.

**Advancia Implementation:**

- **Quarterly access reviews**: IAM privilege verification
- **Automated IAM drift detection**: Daily scans with IAM Access Analyzer
- **Infrastructure scanning**: Weekly vulnerability scans
- **Architecture review against HIPAA controls**: Quarterly compliance check
- **External penetration testing**: Annual assessment
- **Compliance documentation review**: This document updated quarterly

**Evidence:**

- IAM Access Analyzer reports
- Security Hub findings
- External audit reports
- This compliance mapping (quarterly review schedule)

---

## Physical Safeguards (§164.310)

### §164.310(a)(1) Facility Access Controls

**Requirement**: Implement policies and procedures to limit physical access to electronic information systems and the facility or facilities in which they are housed.

**Advancia Implementation:**

- **AWS managed data centers**: Physical security per AWS BAA
- **No on-premises PHI storage**: Fully cloud-native architecture
- **No physical servers**: All compute via ECS/EKS managed services
- **AWS SOC 2 Type II compliance**: Third-party validated physical controls

**Evidence:**

- AWS BAA covering physical security
- AWS SOC 2 Type II report

### §164.310(d)(1) Device and Media Controls

**Requirement**: Implement policies and procedures that govern the receipt and removal of hardware and electronic media that contain ePHI into and out of a facility.

**Advancia Implementation:**

- **No local storage**: All PHI in AWS managed services (Aurora, S3)
- **Encrypted backups**: Aurora snapshots encrypted with KMS
- **Secure disposal**: AWS handles hardware destruction per BAA
- **No removable media**: Fully cloud-native, no USB/disk exports
- **No developer devices**: PHI never touches laptops, desktops, or mobile devices
- **No PHI in logs or exports**: Automated redaction prevents accidental leakage

**Evidence:**

- Aurora backup configuration with KMS
- AWS BAA covering media disposal
- AWS SOC 2 Type II report
- [PHI redaction controls](PHI_Threat_Model.md#layer-7-logging--observability)

### §164.310(d)(2)(iii) Accountability

**Requirement**: Maintain a record of the movements of hardware and electronic media and any person responsible therefor.

**Advancia Implementation:**

- **S3 access logs**: Track all object-level operations
- **CloudTrail**: Logs all API calls including data access
- **EBS volume encryption**: All volumes encrypted, tracked in AWS Config
- **AWS Config**: Tracks all resource changes
- **No physical media movement**: Cloud-native eliminates this risk

**Evidence:**

- CloudTrail data event logging
- S3 access logs
- AWS Config rules

### §164.310(d)(2)(iv) Data Backup and Storage

**Requirement**: Create a retrievable, exact copy of ePHI when needed.

**Advancia Implementation:**

- **Aurora automated backups**: Continuous backup to S3
- **Point-in-time recovery**: Up to 35 days
- **S3 versioning**: Every PHI document has version history
- **Cross-region backup**: (Optional) Replicate to secondary region
- **Backup testing**: Quarterly restore drills

**Evidence:**

- Aurora backup retention settings
- S3 versioning configuration
- Backup restore test logs

---

## Compliance Summary Matrix

| HIPAA Standard                           | Status       | Advancia Implementation                 | Evidence Location                                                                            |
| ---------------------------------------- | ------------ | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Technical Safeguards (§164.312)**      |              |                                         |                                                                                              |
| §164.312(a)(1) Access Control            | ✅ Compliant | IRSA, IAM, Secrets Manager              | [IAM Access Matrix](IAM_Access_Matrix.md)                                                    |
| §164.312(a)(2)(i) Unique User ID         | ✅ Compliant | Service-level IAM roles                 | [IRSA definitions](advanciapayledger/infra/terraform/envs/prod/irsa.tf)                      |
| §164.312(a)(2)(ii) Emergency Access      | ✅ Compliant | Break-glass procedures                  | [IAM Access Matrix](IAM_Access_Matrix.md#emergency-break-glass-procedures)                   |
| §164.312(a)(2)(iii) Auto Logoff          | ✅ Compliant | JWT expiration, session timeout         | API Gateway config                                                                           |
| §164.312(a)(2)(iv) Encryption            | ✅ Compliant | KMS at rest, TLS in transit             | [KMS module](advanciapayledger/infra/terraform/modules/kms)                                  |
| §164.312(b) Audit Controls               | ✅ Compliant | CloudTrail, CloudWatch, S3 logs         | [Audit layer](PHI_Data_Flow.md#audit--compliance-layer)                                      |
| §164.312(c)(1) Integrity                 | ✅ Compliant | DB constraints, versioning, logs        | [Aurora schema](advanciapayledger/infra/db/aurora/phi_schema.sql)                            |
| §164.312(c)(2) Authentication            | ✅ Compliant | Checksums, versioning, signatures       | S3 versioning config                                                                         |
| §164.312(d) Entity Authentication        | ✅ Compliant | JWT, IRSA, certificate-based TLS        | [Data flow](PHI_Data_Flow.md)                                                                |
| §164.312(e)(1) Transmission Security     | ✅ Compliant | TLS 1.2+, VPC endpoints                 | [Threat model](PHI_Threat_Model.md)                                                          |
| §164.312(e)(2)(i) Integrity              | ✅ Compliant | TLS, message auth, deduplication        | S3 bucket policy                                                                             |
| §164.312(e)(2)(ii) Encryption            | ✅ Compliant | End-to-end TLS                          | ACM certificates                                                                             |
| **Administrative Safeguards (§164.308)** |              |                                         |                                                                                              |
| §164.308(a)(1)(ii)(D) Activity Review    | ✅ Compliant | IAM Analyzer, GuardDuty, quarterly logs | IAM Access Analyzer, GuardDuty dashboard                                                     |
| §164.308(a)(3) Workforce Security        | ✅ Compliant | Least privilege, zero human PHI access  | [Human access controls](IAM_Access_Matrix.md#human-access-controls)                          |
| §164.308(a)(4) Access Management         | ✅ Compliant | RLS, table-level perms, min necessary   | [Aurora perms](IAM_Access_Matrix.md#services--aurora-access)                                 |
| §164.308(a)(5) Security Training         | ✅ Compliant | PHI redaction, engineering guidelines   | [PHI redaction middleware](advanciapayledger/services/phi/shared/middleware/phiRedaction.ts) |
| §164.308(a)(6) Incident Procedures       | ✅ Compliant | GuardDuty, alarms, runbooks             | [Break-glass](IAM_Access_Matrix.md#emergency-break-glass-procedures)                         |
| §164.308(a)(7) Contingency Plan          | ✅ Compliant | Multi-AZ, backups, versioning           | Aurora Multi-AZ, S3 versioning                                                               |
| §164.308(a)(8) Evaluation                | ✅ Compliant | Quarterly reviews, IAM drift detection  | This document (quarterly schedule)                                                           |
| **Physical Safeguards (§164.310)**       |              |                                         |                                                                                              |
| §164.310(a)(1) Facility Access           | ✅ Compliant | AWS managed data centers                | AWS BAA, SOC 2 Type II                                                                       |
| §164.310(d)(1) Device & Media Controls   | ✅ Compliant | Cloud-native, no local storage          | [PHI redaction](PHI_Threat_Model.md#layer-7-logging--observability)                          |
| §164.310(d)(2)(iii) Accountability       | ✅ Compliant | S3 logs, CloudTrail, AWS Config         | CloudTrail data events                                                                       |
| §164.310(d)(2)(iv) Backup & Storage      | ✅ Compliant | Aurora backups, S3 versioning, PITR     | Aurora backup config                                                                         |

---

## Gaps and Recommendations

### Current Gaps

None identified for technical safeguards.

### Future Enhancements

1. **Digital signatures for documents**: Sign all generated EOBs/statements
2. **MFA for break-glass access**: Require hardware tokens
3. **Real-time anomaly detection**: ML-based access pattern analysis
4. **Automated compliance scanning**: Daily HIPAA control verification

---

## Audit Readiness Checklist

### Pre-Audit Preparation

- [ ] Generate CloudTrail access report (last 90 days)
- [ ] Export IAM privilege review results
- [ ] Verify all KMS keys have rotation enabled
- [ ] Confirm S3 public access block on all buckets
- [ ] Review GuardDuty findings (all resolved)
- [ ] Test break-glass procedures
- [ ] Verify RLS policies active on all PHI tables
- [ ] Confirm all services using latest patched images

### Documentation to Provide

- [ ] This compliance mapping
- [ ] [PHI Threat Model](PHI_Threat_Model.md)
- [ ] [IAM Access Matrix](IAM_Access_Matrix.md)
- [ ] [PHI Data Flow](PHI_Data_Flow.md)
- [ ] AWS BAA
- [ ] CloudTrail log samples (PHI-redacted)
- [ ] Incident response playbook
- [ ] Disaster recovery plan

### Live Demonstrations

- [ ] Show CloudTrail logging of PHI access
- [ ] Demonstrate PHI redaction in logs
- [ ] Walk through IRSA role assumption
- [ ] Show encrypted Aurora snapshot
- [ ] Demonstrate S3 bucket policy blocking public access
- [ ] Show EventBridge PHI-safe event transformation

---

## Certification Path

### HIPAA Compliance

- **Status**: Architecture compliant with §164.312
- **Next steps**:
  1. Complete administrative safeguard documentation
  2. Conduct security risk assessment
  3. Finalize policies and procedures
  4. Employee training on PHI handling

### SOC 2 Type II

- **Readiness**: High (infrastructure controls in place)
- **Timeline**: 6-9 months (requires 3-month observation period)

### HITRUST

- **Readiness**: Medium (requires additional controls)
- **Timeline**: 12-18 months

---

## Attestation

This compliance mapping reflects the technical architecture as of February 4, 2026.

**Architecture Owner**: Michael, Advancia Engineering  
**Last Review**: February 4, 2026  
**Next Review**: May 4, 2026 (Quarterly)
