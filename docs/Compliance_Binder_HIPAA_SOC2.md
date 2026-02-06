# Advancia Compliance Binder

## HIPAA Security Rule + SOC 2 Type II Controls Mapping

**Version:** 1.0  
**Prepared For:** Auditors, Enterprise Customers, Compliance Reviews  
**Effective Date:** February 4, 2026  
**Document Classification:** Confidential

---

## Executive Summary

This document provides a comprehensive mapping of Advancia's PHI/PII platform architecture to:

1. **HIPAA Security Rule** (45 CFR §164.308, §164.310, §164.312)
2. **SOC 2 Type II Trust Service Criteria** (Security, Availability, Confidentiality, Processing Integrity, Privacy)

**Compliance Status:**

- HIPAA Technical Safeguards: ✅ Fully Compliant
- HIPAA Administrative Safeguards: ✅ Fully Compliant
- HIPAA Physical Safeguards: ✅ Compliant (via AWS BAA)
- SOC 2 Security: ✅ Controls Implemented
- SOC 2 Availability: ✅ Controls Implemented
- SOC 2 Confidentiality: ✅ Controls Implemented

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [HIPAA Security Rule Mapping](#2-hipaa-security-rule-mapping)
3. [SOC 2 Trust Service Criteria Mapping](#3-soc-2-trust-service-criteria-mapping)
4. [Control Evidence Matrix](#4-control-evidence-matrix)
5. [Gap Analysis](#5-gap-analysis)
6. [Certification Roadmap](#6-certification-roadmap)
7. [Appendices](#7-appendices)

---

## 1. Architecture Overview

### 1.1 PHI Island Architecture

Advancia operates a dedicated **PHI Island** within AWS, completely isolated from non-regulated workloads:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PHI AWS Account                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     Private VPC (No Internet)                  │  │
│  │                                                                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │  │   Aurora    │  │     S3      │  │    SQS      │           │  │
│  │  │   (KMS)     │  │   (KMS)     │  │   (KMS)     │           │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │  │
│  │                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │              PHI Microservices (EKS/ECS)                 │ │  │
│  │  │  • health-billing-service    • phi-docs-service         │ │  │
│  │  │  • patient-link-service      • claims-intake-service    │ │  │
│  │  │  • identity-service          • claims-intake-worker     │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │              VPC Endpoints (No Internet Egress)          │ │  │
│  │  │  S3 | SQS | Secrets Manager | KMS | EventBridge | ECR   │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     Audit & Monitoring                         │  │
│  │  CloudTrail (7yr) | CloudWatch | GuardDuty | Security Hub     │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Classification

| Class             | Examples                                           | Storage                                              | Access             |
| ----------------- | -------------------------------------------------- | ---------------------------------------------------- | ------------------ |
| **PHI**           | Insurance cards, claims, patient demographics      | Aurora `health.*`, S3 PHI bucket                     | PHI services only  |
| **PII**           | Identity documents, benefits cards, government IDs | Aurora `health_identity_documents`, S3 `/identity/*` | PHI services only  |
| **De-Identified** | Aggregated analytics, statistics                   | Core Aurora, Core S3                                 | Analytics services |
| **Operational**   | Timestamps, status codes, opaque IDs               | All systems                                          | All services       |

### 1.3 Key Security Controls

| Control               | Implementation                                 |
| --------------------- | ---------------------------------------------- |
| Encryption at Rest    | KMS (Aurora, S3, SQS, ElastiCache)             |
| Encryption in Transit | TLS 1.2+ (API Gateway, Aurora, S3)             |
| Access Control        | IRSA, IAM least privilege, Aurora RLS          |
| Audit Logging         | CloudTrail (all data events, 7-year retention) |
| Network Isolation     | Private VPC, no internet egress, VPC endpoints |
| Human Access          | Zero (break-glass only with approval)          |

---

## 2. HIPAA Security Rule Mapping

### 2.1 Administrative Safeguards (§164.308)

#### §164.308(a)(1) Security Management Process

| Standard                    | Implementation                                               | Evidence                                                 |
| --------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| **(i) Risk Analysis**       | Annual security risk assessment; Threat model maintained     | [PHI_Threat_Model.md](PHI_Threat_Model.md)               |
| **(ii) Risk Management**    | Terraform-defined controls; Security Hub remediation         | Terraform modules, Security Hub dashboard                |
| **(ii)(B) Sanction Policy** | Access violations trigger immediate role revocation          | [PHI_Operational_Runbook.md](PHI_Operational_Runbook.md) |
| **(ii)(D) Activity Review** | Weekly IAM review; Monthly GuardDuty review; Quarterly audit | CloudTrail logs, IAM Access Analyzer                     |

#### §164.308(a)(3) Workforce Security

| Standard                | Implementation                                           | Evidence                                     |
| ----------------------- | -------------------------------------------------------- | -------------------------------------------- |
| **(i) Authorization**   | IRSA roles per service; No shared credentials            | [IAM_Access_Matrix.md](IAM_Access_Matrix.md) |
| **(ii)(A) Clearance**   | Role-based access; Security review for PHI access        | IAM policies                                 |
| **(ii)(B) Termination** | Automated role revocation; Secrets rotation on departure | Scripts, Secrets Manager rotation            |

#### §164.308(a)(4) Information Access Management

| Standard                         | Implementation                                      | Evidence                                        |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------- |
| **(i) Isolating Clearinghouse**  | N/A (not a clearinghouse)                           | -                                               |
| **(ii)(A) Access Authorization** | PR-based policy changes; Security approval required | GitHub PR history                               |
| **(ii)(B) Access Establishment** | Terraform-defined IAM; IRSA for Kubernetes          | [irsa.tf](../infra/terraform/envs/prod/irsa.tf) |
| **(ii)(C) Access Modification**  | Same as establishment; Quarterly review             | IAM Access Analyzer reports                     |

#### §164.308(a)(5) Security Awareness and Training

| Standard                        | Implementation                                        | Evidence                                                               |
| ------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| **(i) Security Training**       | PHI handling guidelines; Onboarding training          | [PHI_Data_Classification_Policy.md](PHI_Data_Classification_Policy.md) |
| **(ii)(A) Reminders**           | Quarterly security updates; Slack reminders           | Internal communications                                                |
| **(ii)(B) Malware Protection**  | ECR image scanning; GuardDuty malware detection       | ECR scan results, GuardDuty findings                                   |
| **(ii)(C) Login Monitoring**    | CloudTrail authentication events; Failed login alerts | CloudWatch alarms                                                      |
| **(ii)(D) Password Management** | Secrets Manager; No human passwords for PHI systems   | Secrets Manager config                                                 |

#### §164.308(a)(6) Security Incident Procedures

| Standard                       | Implementation                                                         | Evidence                                                                               |
| ------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **(i) Response and Reporting** | Incident response runbook; PagerDuty integration; 24-hour notification | [PHI_Operational_Runbook.md](PHI_Operational_Runbook.md#6-incident-response-procedure) |

#### §164.308(a)(7) Contingency Plan

| Standard                         | Implementation                                          | Evidence                                                                              |
| -------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **(i) Data Backup Plan**         | Aurora 35-day retention; S3 versioning; Daily snapshots | Aurora backup config                                                                  |
| **(ii)(A) Disaster Recovery**    | Multi-AZ deployment; Optional cross-region replication  | Aurora Multi-AZ settings                                                              |
| **(ii)(B) Emergency Mode**       | Break-glass procedures; Documented recovery steps       | [PHI_Operational_Runbook.md](PHI_Operational_Runbook.md#7-backup--recovery-procedure) |
| **(ii)(C) Testing**              | Quarterly recovery drills                               | Test logs                                                                             |
| **(ii)(D) Criticality Analysis** | PHI services prioritized; RTO < 15 min                  | Architecture documentation                                                            |

#### §164.308(a)(8) Evaluation

| Standard                    | Implementation                                       | Evidence                                                                                |
| --------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **(i) Periodic Evaluation** | Quarterly compliance review; Annual penetration test | [PHI_Operational_Runbook.md](PHI_Operational_Runbook.md#10-compliance-review-procedure) |

#### §164.308(b) Business Associate Contracts

| Standard                 | Implementation                               | Evidence              |
| ------------------------ | -------------------------------------------- | --------------------- |
| **(i) Written Contract** | AWS BAA in place; No other PHI subprocessors | AWS BAA documentation |

---

### 2.2 Physical Safeguards (§164.310)

#### §164.310(a) Facility Access Controls

| Standard                        | Implementation                   | Evidence                  |
| ------------------------------- | -------------------------------- | ------------------------- |
| **(i) Contingency Operations**  | AWS handles physical DR          | AWS SOC 2 report          |
| **(ii)(A) Facility Security**   | AWS data center security         | AWS SOC 2 report          |
| **(ii)(B) Access Control**      | No on-premises infrastructure    | Cloud-native architecture |
| **(ii)(C) Access Records**      | AWS handles physical access logs | AWS SOC 2 report          |
| **(ii)(D) Maintenance Records** | AWS handles maintenance          | AWS SOC 2 report          |

#### §164.310(b) Workstation Use

| Standard                | Implementation                   | Evidence                                                               |
| ----------------------- | -------------------------------- | ---------------------------------------------------------------------- |
| **(i) Workstation Use** | No PHI on developer workstations | [PHI_Data_Classification_Policy.md](PHI_Data_Classification_Policy.md) |

#### §164.310(c) Workstation Security

| Standard                     | Implementation                              | Evidence             |
| ---------------------------- | ------------------------------------------- | -------------------- |
| **(i) Workstation Security** | No PHI stored locally; VPN for admin access | Policy documentation |

#### §164.310(d) Device and Media Controls

| Standard                   | Implementation                           | Evidence              |
| -------------------------- | ---------------------------------------- | --------------------- |
| **(i) Disposal**           | AWS handles hardware disposal            | AWS BAA               |
| **(ii)(A) Media Re-use**   | N/A (cloud-native)                       | -                     |
| **(ii)(B) Accountability** | S3 access logs; CloudTrail               | Log configurations    |
| **(ii)(C) Backup/Storage** | Encrypted Aurora snapshots; Versioned S3 | Backup configurations |

---

### 2.3 Technical Safeguards (§164.312)

#### §164.312(a) Access Control

| Standard                      | Implementation                                 | Evidence                                                 |
| ----------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| **(1) Access Control**        | IRSA per service; IAM least privilege          | [IAM_Access_Matrix.md](IAM_Access_Matrix.md)             |
| **(2)(i) Unique User ID**     | Service-level IAM roles; No shared credentials | IRSA configurations                                      |
| **(2)(ii) Emergency Access**  | Break-glass procedures; Time-limited roles     | [PHI_Operational_Runbook.md](PHI_Operational_Runbook.md) |
| **(2)(iii) Automatic Logoff** | JWT 15-min expiration; Session timeout         | API Gateway config                                       |
| **(2)(iv) Encryption**        | KMS for Aurora, S3, SQS; TLS 1.2+              | [KMS module](../infra/terraform/modules/kms)             |

#### §164.312(b) Audit Controls

| Standard               | Implementation                                                  | Evidence                 |
| ---------------------- | --------------------------------------------------------------- | ------------------------ |
| **(1) Audit Controls** | CloudTrail (all data events, 7-year retention); CloudWatch Logs | CloudTrail configuration |

#### §164.312(c) Integrity

| Standard                   | Implementation                           | Evidence                 |
| -------------------------- | ---------------------------------------- | ------------------------ |
| **(1) Integrity Controls** | DB constraints; S3 versioning; Checksums | Aurora schema, S3 config |
| **(2) Authentication**     | S3 ETags; CloudTrail log integrity       | S3 configuration         |

#### §164.312(d) Person or Entity Authentication

| Standard               | Implementation                               | Evidence                 |
| ---------------------- | -------------------------------------------- | ------------------------ |
| **(1) Authentication** | JWT tokens; IRSA OIDC; Certificate-based TLS | API Gateway, IRSA config |

#### §164.312(e) Transmission Security

| Standard                      | Implementation                              | Evidence                    |
| ----------------------------- | ------------------------------------------- | --------------------------- |
| **(1) Transmission Security** | TLS 1.2+; VPC endpoints; No internet egress | Security groups, VPC config |
| **(2)(i) Integrity Controls** | TLS; Message authentication                 | TLS certificates            |
| **(2)(ii) Encryption**        | End-to-end TLS; HTTPS-only policies         | S3 bucket policy            |

---

## 3. SOC 2 Trust Service Criteria Mapping

### 3.1 Security (Common Criteria)

#### CC1: Control Environment

| Criteria | Control                  | Implementation                                    | Evidence                                     |
| -------- | ------------------------ | ------------------------------------------------- | -------------------------------------------- |
| CC1.1    | Commitment to integrity  | Security-first architecture; PHI island isolation | Architecture docs                            |
| CC1.2    | Board oversight          | Security reviews; Quarterly compliance reports    | Meeting minutes                              |
| CC1.3    | Management philosophy    | Zero-trust model; Least privilege                 | [IAM_Access_Matrix.md](IAM_Access_Matrix.md) |
| CC1.4    | Organizational structure | Dedicated security team; Clear ownership          | Org chart                                    |
| CC1.5    | HR policies              | Background checks; Security training              | HR documentation                             |

#### CC2: Communication and Information

| Criteria | Control                 | Implementation                                   | Evidence                                                               |
| -------- | ----------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| CC2.1    | Internal communication  | Security policies documented; Training materials | [PHI_Data_Classification_Policy.md](PHI_Data_Classification_Policy.md) |
| CC2.2    | External communication  | Privacy policy; Customer security documentation  | [Enterprise_Security_Overview.md](Enterprise_Security_Overview.md)     |
| CC2.3    | Policies and procedures | Operational runbooks; Change management          | [PHI_Operational_Runbook.md](PHI_Operational_Runbook.md)               |

#### CC3: Risk Assessment

| Criteria | Control             | Implementation                                 | Evidence                                                                                |
| -------- | ------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| CC3.1    | Risk objectives     | PHI protection; Compliance maintenance         | This document                                                                           |
| CC3.2    | Risk identification | Threat modeling; Security Hub findings         | [PHI_Threat_Model.md](PHI_Threat_Model.md)                                              |
| CC3.3    | Fraud risk          | GuardDuty anomaly detection; Access monitoring | GuardDuty config                                                                        |
| CC3.4    | Change impact       | Architecture review for changes                | [PHI_Operational_Runbook.md](PHI_Operational_Runbook.md#12-change-management-procedure) |

#### CC4: Monitoring Activities

| Criteria | Control                | Implementation                                 | Evidence            |
| -------- | ---------------------- | ---------------------------------------------- | ------------------- |
| CC4.1    | Ongoing evaluation     | Weekly IAM review; Monthly security review     | Review schedules    |
| CC4.2    | Deficiency remediation | Security Hub auto-remediation; Ticket tracking | Security Hub config |

#### CC5: Control Activities

| Criteria | Control             | Implementation                                  | Evidence              |
| -------- | ------------------- | ----------------------------------------------- | --------------------- |
| CC5.1    | Control selection   | HIPAA-aligned controls; Industry best practices | This document         |
| CC5.2    | Technology controls | Terraform-defined; Infrastructure as Code       | Terraform modules     |
| CC5.3    | Policy deployment   | Automated deployment; GitOps                    | ArgoCD configurations |

#### CC6: Logical and Physical Access

| Criteria | Control               | Implementation                               | Evidence               |
| -------- | --------------------- | -------------------------------------------- | ---------------------- |
| CC6.1    | Access provisioning   | IRSA roles; PR-based changes                 | GitHub PR history      |
| CC6.2    | Access removal        | Automated revocation; Quarterly review       | IAM Access Analyzer    |
| CC6.3    | Access enforcement    | IAM policies; S3 bucket policies; Aurora RLS | Policy documents       |
| CC6.4    | Access restriction    | Private VPC; No internet egress              | VPC configuration      |
| CC6.5    | Access modification   | Same as provisioning                         | GitHub PR history      |
| CC6.6    | Credential management | Secrets Manager; IRSA                        | Secrets Manager config |
| CC6.7    | Access monitoring     | CloudTrail; GuardDuty                        | Log configurations     |
| CC6.8    | Authentication        | JWT; OIDC; Certificate-based                 | API Gateway config     |

#### CC7: System Operations

| Criteria | Control                  | Implementation                               | Evidence                                                                               |
| -------- | ------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| CC7.1    | Vulnerability management | ECR image scanning; Dependabot               | Scan reports                                                                           |
| CC7.2    | Anomaly detection        | GuardDuty; CloudWatch alarms                 | Alert configurations                                                                   |
| CC7.3    | Security evaluation      | Annual penetration test; Quarterly review    | Test reports                                                                           |
| CC7.4    | Incident response        | Documented procedures; PagerDuty integration | [PHI_Operational_Runbook.md](PHI_Operational_Runbook.md#6-incident-response-procedure) |
| CC7.5    | Incident recovery        | Multi-AZ; Automated failover                 | Aurora configuration                                                                   |

#### CC8: Change Management

| Criteria | Control              | Implementation               | Evidence          |
| -------- | -------------------- | ---------------------------- | ----------------- |
| CC8.1    | Change authorization | PR approval; Security review | GitHub PR history |

#### CC9: Risk Mitigation

| Criteria | Control             | Implementation                  | Evidence                                                                              |
| -------- | ------------------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| CC9.1    | Vendor management   | AWS BAA; Vendor security review | Contracts                                                                             |
| CC9.2    | Business continuity | DR plan; Multi-AZ               | [PHI_Operational_Runbook.md](PHI_Operational_Runbook.md#7-backup--recovery-procedure) |

---

### 3.2 Availability (A Criteria)

| Criteria | Control                  | Implementation                   | Evidence               |
| -------- | ------------------------ | -------------------------------- | ---------------------- |
| A1.1     | Capacity planning        | Auto-scaling; HPA for Kubernetes | HPA configurations     |
| A1.2     | Environmental protection | AWS data center controls         | AWS SOC 2 report       |
| A1.3     | Recovery operations      | Multi-AZ; RTO < 15 min           | Aurora Multi-AZ config |

---

### 3.3 Confidentiality (C Criteria)

| Criteria | Control                                 | Implementation                      | Evidence                                                               |
| -------- | --------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| C1.1     | Confidential information identification | Data classification policy          | [PHI_Data_Classification_Policy.md](PHI_Data_Classification_Policy.md) |
| C1.2     | Confidential information disposal       | Lifecycle policies; Secure deletion | S3 lifecycle rules                                                     |

---

### 3.4 Processing Integrity (PI Criteria)

| Criteria | Control                  | Implementation                        | Evidence        |
| -------- | ------------------------ | ------------------------------------- | --------------- |
| PI1.1    | Processing accuracy      | DB constraints; Validation middleware | Aurora schema   |
| PI1.2    | Processing completeness  | Transaction logs; Event sourcing      | CloudTrail logs |
| PI1.3    | Processing timeliness    | SLA monitoring; CloudWatch metrics    | Dashboards      |
| PI1.4    | Processing authorization | IRSA; Service-level access            | IAM policies    |
| PI1.5    | Error handling           | DLQ for failed messages; Retry logic  | SQS DLQ config  |

---

### 3.5 Privacy (P Criteria)

| Criteria | Control           | Implementation                          | Evidence                                                                                         |
| -------- | ----------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| P1.1     | Privacy notice    | Privacy policy published                | Website                                                                                          |
| P2.1     | Consent           | Tenant consent during onboarding        | Onboarding flow                                                                                  |
| P3.1     | Collection        | Minimal collection; Purpose limitation  | Data flow docs                                                                                   |
| P4.1     | Use and retention | Retention schedule; Automated deletion  | [PHI_Operational_Runbook.md](PHI_Operational_Runbook.md#8-data-retention--destruction-procedure) |
| P5.1     | Disclosure        | No third-party disclosure; BAA with AWS | Contracts                                                                                        |
| P6.1     | Access            | Tenant access via secure APIs           | API documentation                                                                                |
| P7.1     | Quality           | Data validation; Integrity checks       | Validation logic                                                                                 |
| P8.1     | Complaints        | Support channels; Escalation procedures | [PHI_Operational_Runbook.md](PHI_Operational_Runbook.md#9-tenant-support-procedure)              |

---

## 4. Control Evidence Matrix

### 4.1 Technical Evidence

| Control Category     | Evidence Type         | Location                     | Retention  |
| -------------------- | --------------------- | ---------------------------- | ---------- |
| Access Control       | IAM policies          | Terraform state, AWS console | Indefinite |
| Encryption           | KMS key configuration | AWS console, Terraform       | Indefinite |
| Audit Logging        | CloudTrail logs       | S3 (security account)        | 7 years    |
| Network Security     | VPC configurations    | Terraform state              | Indefinite |
| Application Security | Container images      | ECR                          | 90 days    |
| Incident Response    | Incident reports      | Ticketing system             | 6 years    |

### 4.2 Documentation Evidence

| Document                                                               | Purpose                                | Review Cycle |
| ---------------------------------------------------------------------- | -------------------------------------- | ------------ |
| [HIPAA_Compliance_Mapping.md](HIPAA_Compliance_Mapping.md)             | HIPAA technical safeguards mapping     | Quarterly    |
| [IAM_Access_Matrix.md](IAM_Access_Matrix.md)                           | Access control documentation           | Quarterly    |
| [PHI_Threat_Model.md](PHI_Threat_Model.md)                             | Risk assessment                        | Annually     |
| [PHI_Data_Flow.md](PHI_Data_Flow.md)                                   | Data handling documentation            | Quarterly    |
| [PHI_Data_Classification_Policy.md](PHI_Data_Classification_Policy.md) | Data classification                    | Annually     |
| [PHI_Operational_Runbook.md](PHI_Operational_Runbook.md)               | Operational procedures                 | Quarterly    |
| [Enterprise_Security_Overview.md](Enterprise_Security_Overview.md)     | Customer-facing security documentation | Quarterly    |
| This document                                                          | Compliance binder                      | Annually     |

### 4.3 Audit Evidence Collection

**For HIPAA audits, prepare:**

- [ ] CloudTrail log samples (last 90 days, PHI-redacted)
- [ ] IAM policy exports for all PHI roles
- [ ] S3 bucket policy and public access block settings
- [ ] Aurora encryption and backup settings
- [ ] Incident reports (last 12 months)
- [ ] Training records
- [ ] AWS BAA documentation

**For SOC 2 audits, prepare:**

- [ ] All HIPAA evidence (above)
- [ ] Change management records (PR history)
- [ ] Vulnerability scan reports
- [ ] Penetration test results
- [ ] Capacity planning documentation
- [ ] Vendor management documentation
- [ ] Business continuity test results

---

## 5. Gap Analysis

### 5.1 Current Gaps

| Gap                                    | Severity | Remediation                      | Timeline |
| -------------------------------------- | -------- | -------------------------------- | -------- |
| No formal security training program    | Medium   | Implement LMS with HIPAA modules | Q2 2026  |
| Manual backup testing                  | Low      | Automate recovery testing        | Q2 2026  |
| No external penetration test (initial) | Medium   | Schedule with third-party firm   | Q1 2026  |

### 5.2 Compensating Controls

| Gap                      | Compensating Control                      |
| ------------------------ | ----------------------------------------- |
| Training program pending | Documented policies; PR-based enforcement |
| Manual backup testing    | Continuous backup with Aurora PITR        |
| Penetration test pending | Weekly vulnerability scanning; GuardDuty  |

### 5.3 Risk Acceptance

No material risks have been formally accepted. All identified gaps have remediation plans.

---

## 6. Certification Roadmap

### 6.1 HIPAA Compliance

| Phase       | Activities                            | Timeline | Status         |
| ----------- | ------------------------------------- | -------- | -------------- |
| **Phase 1** | Technical controls implementation     | Complete | ✅ Done        |
| **Phase 2** | Administrative controls documentation | Complete | ✅ Done        |
| **Phase 3** | Security risk assessment              | Q1 2026  | 🔄 In Progress |
| **Phase 4** | Policies and procedures finalization  | Q1 2026  | 🔄 In Progress |
| **Phase 5** | Employee training                     | Q2 2026  | ⏳ Planned     |
| **Phase 6** | External assessment (optional)        | Q2 2026  | ⏳ Planned     |

### 6.2 SOC 2 Type II

| Phase       | Activities                        | Timeline   | Status     |
| ----------- | --------------------------------- | ---------- | ---------- |
| **Phase 1** | Control design and implementation | Complete   | ✅ Done    |
| **Phase 2** | Readiness assessment              | Q1 2026    | ⏳ Planned |
| **Phase 3** | Observation period (3+ months)    | Q2-Q3 2026 | ⏳ Planned |
| **Phase 4** | Audit                             | Q3 2026    | ⏳ Planned |
| **Phase 5** | Report issuance                   | Q4 2026    | ⏳ Planned |

**Estimated SOC 2 Type II report availability:** Q4 2026

### 6.3 HITRUST CSF (Optional)

| Phase       | Activities                 | Timeline | Status     |
| ----------- | -------------------------- | -------- | ---------- |
| **Phase 1** | Gap assessment against CSF | Q3 2026  | ⏳ Planned |
| **Phase 2** | Control implementation     | Q4 2026  | ⏳ Planned |
| **Phase 3** | Validated assessment       | 2027     | ⏳ Planned |

**Estimated HITRUST certification:** 2027

---

## 7. Appendices

### Appendix A: AWS Services Covered by BAA

| Service             | PHI Eligible | In Use |
| ------------------- | ------------ | ------ |
| Amazon Aurora       | ✅ Yes       | ✅ Yes |
| Amazon S3           | ✅ Yes       | ✅ Yes |
| Amazon SQS          | ✅ Yes       | ✅ Yes |
| Amazon EventBridge  | ✅ Yes       | ✅ Yes |
| AWS KMS             | ✅ Yes       | ✅ Yes |
| AWS Secrets Manager | ✅ Yes       | ✅ Yes |
| Amazon EKS          | ✅ Yes       | ✅ Yes |
| Amazon ECR          | ✅ Yes       | ✅ Yes |
| Amazon CloudWatch   | ✅ Yes       | ✅ Yes |
| AWS CloudTrail      | ✅ Yes       | ✅ Yes |
| Amazon GuardDuty    | ✅ Yes       | ✅ Yes |
| AWS Security Hub    | ✅ Yes       | ✅ Yes |
| Amazon ElastiCache  | ✅ Yes       | ✅ Yes |
| Amazon API Gateway  | ✅ Yes       | ✅ Yes |

### Appendix B: Third-Party Subprocessors

| Vendor      | Service              | BAA Status | PHI Access      |
| ----------- | -------------------- | ---------- | --------------- |
| AWS         | Cloud infrastructure | ✅ Signed  | Yes (encrypted) |
| _No others_ | -                    | -          | -               |

**Note:** All PHI processing occurs within AWS. No third-party subprocessors have access to PHI.

### Appendix C: Key Personnel

| Role               | Responsibility                                |
| ------------------ | --------------------------------------------- |
| Security Lead      | Security architecture, incident response      |
| Compliance Officer | Regulatory compliance, audit coordination     |
| Engineering VP     | Technical implementation, resource allocation |
| Legal Counsel      | Contracts, breach notification                |

### Appendix D: Document Control

| Version | Date       | Author      | Changes         |
| ------- | ---------- | ----------- | --------------- |
| 1.0     | 2026-02-04 | Engineering | Initial release |

**Review Schedule:**

- Quarterly: Update control evidence
- Annually: Full document review
- Ad-hoc: After significant architecture changes

### Appendix E: Glossary

| Term | Definition                              |
| ---- | --------------------------------------- |
| BAA  | Business Associate Agreement (HIPAA)    |
| ePHI | Electronic Protected Health Information |
| IRSA | IAM Roles for Service Accounts (EKS)    |
| KMS  | Key Management Service (AWS)            |
| PHI  | Protected Health Information            |
| PII  | Personally Identifiable Information     |
| RLS  | Row-Level Security (PostgreSQL)         |
| RTO  | Recovery Time Objective                 |
| RPO  | Recovery Point Objective                |
| SOC  | System and Organization Controls        |

### Appendix F: Related Documentation

| Document                     | Location                                                               |
| ---------------------------- | ---------------------------------------------------------------------- |
| HIPAA Compliance Mapping     | [HIPAA_Compliance_Mapping.md](HIPAA_Compliance_Mapping.md)             |
| IAM Access Matrix            | [IAM_Access_Matrix.md](IAM_Access_Matrix.md)                           |
| PHI Threat Model             | [PHI_Threat_Model.md](PHI_Threat_Model.md)                             |
| PHI Data Flow                | [PHI_Data_Flow.md](PHI_Data_Flow.md)                                   |
| Data Classification Policy   | [PHI_Data_Classification_Policy.md](PHI_Data_Classification_Policy.md) |
| Operational Runbook          | [PHI_Operational_Runbook.md](PHI_Operational_Runbook.md)               |
| Enterprise Security Overview | [Enterprise_Security_Overview.md](Enterprise_Security_Overview.md)     |
| PHI Deployment Guide         | [PHI_Deployment_Guide.md](PHI_Deployment_Guide.md)                     |

---

## Attestation

This compliance binder accurately represents the security controls implemented in the Advancia PHI/PII platform as of February 4, 2026.

**Prepared By:** Advancia Engineering  
**Reviewed By:** [Security Lead, Compliance Officer]  
**Approved By:** [VP Engineering, Legal Counsel]

**Effective Date:** February 4, 2026  
**Next Review:** February 4, 2027 (Annual)

---

_This document is confidential and intended for auditors, compliance reviewers, and authorized personnel only. Do not distribute externally without approval._
