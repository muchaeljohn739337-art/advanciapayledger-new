#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automated compliance audit script for PHI/PII platform.

.DESCRIPTION
    Verifies HIPAA and SOC 2 controls are properly configured.
    Checks IAM, S3, Aurora, CloudTrail, and security settings.

.PARAMETER Region
    AWS region (default: us-east-1)

.PARAMETER Env
    Environment name (default: prod)

.PARAMETER OutputFile
    Output file for audit report (default: audit-report.json)

.EXAMPLE
    ./audit-compliance.ps1 -Region us-east-1 -Env prod
#>

param(
    [string]$Region = "us-east-1",
    [string]$Env = "prod",
    [string]$OutputFile = "audit-report-$(Get-Date -Format 'yyyy-MM-dd').json"
)

$ErrorActionPreference = "Continue"

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       Advancia PHI/PII Compliance Audit                   ║" -ForegroundColor Cyan
Write-Host "║       HIPAA + SOC 2 Control Verification                  ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$auditResults = @{
    timestamp = (Get-Date -Format "o")
    region = $Region
    environment = $Env
    checks = @()
    summary = @{
        total = 0
        passed = 0
        failed = 0
        warnings = 0
    }
}

function Add-AuditResult {
    param(
        [string]$Category,
        [string]$Control,
        [string]$Description,
        [string]$Status,
        [string]$Details = ""
    )
    
    $result = @{
        category = $Category
        control = $Control
        description = $Description
        status = $Status
        details = $Details
        timestamp = (Get-Date -Format "o")
    }
    
    $script:auditResults.checks += $result
    $script:auditResults.summary.total++
    
    switch ($Status) {
        "PASS" { 
            $script:auditResults.summary.passed++
            Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
        }
        "FAIL" { 
            $script:auditResults.summary.failed++
            Write-Host "  [FAIL] " -ForegroundColor Red -NoNewline
        }
        "WARN" { 
            $script:auditResults.summary.warnings++
            Write-Host "  [WARN] " -ForegroundColor Yellow -NoNewline
        }
    }
    Write-Host "$Category - $Control"
    if ($Details) {
        Write-Host "         $Details" -ForegroundColor Gray
    }
}

# ============================================================================
# 1. S3 PHI Bucket Checks (HIPAA §164.312(a)(2)(iv), SOC 2 CC6.1)
# ============================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "1. S3 PHI BUCKET SECURITY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

$phiBucket = "advancia-phi-docs-$Env"

# Check public access block
try {
    $publicAccess = aws s3api get-public-access-block --bucket $phiBucket --region $Region 2>$null | ConvertFrom-Json
    if ($publicAccess.PublicAccessBlockConfiguration.BlockPublicAcls -and 
        $publicAccess.PublicAccessBlockConfiguration.IgnorePublicAcls -and
        $publicAccess.PublicAccessBlockConfiguration.BlockPublicPolicy -and
        $publicAccess.PublicAccessBlockConfiguration.RestrictPublicBuckets) {
        Add-AuditResult -Category "S3" -Control "Public Access Block" -Description "All public access blocked" -Status "PASS"
    } else {
        Add-AuditResult -Category "S3" -Control "Public Access Block" -Description "Public access not fully blocked" -Status "FAIL" -Details "Some public access settings are disabled"
    }
} catch {
    Add-AuditResult -Category "S3" -Control "Public Access Block" -Description "Could not verify public access block" -Status "WARN" -Details $_.Exception.Message
}

# Check encryption
try {
    $encryption = aws s3api get-bucket-encryption --bucket $phiBucket --region $Region 2>$null | ConvertFrom-Json
    $rules = $encryption.ServerSideEncryptionConfiguration.Rules
    if ($rules.ApplyServerSideEncryptionByDefault.SSEAlgorithm -eq "aws:kms") {
        Add-AuditResult -Category "S3" -Control "Encryption" -Description "KMS encryption enabled" -Status "PASS"
    } else {
        Add-AuditResult -Category "S3" -Control "Encryption" -Description "KMS encryption not configured" -Status "FAIL"
    }
} catch {
    Add-AuditResult -Category "S3" -Control "Encryption" -Description "Could not verify encryption" -Status "WARN" -Details $_.Exception.Message
}

# Check versioning
try {
    $versioning = aws s3api get-bucket-versioning --bucket $phiBucket --region $Region 2>$null | ConvertFrom-Json
    if ($versioning.Status -eq "Enabled") {
        Add-AuditResult -Category "S3" -Control "Versioning" -Description "Versioning enabled" -Status "PASS"
    } else {
        Add-AuditResult -Category "S3" -Control "Versioning" -Description "Versioning not enabled" -Status "FAIL"
    }
} catch {
    Add-AuditResult -Category "S3" -Control "Versioning" -Description "Could not verify versioning" -Status "WARN" -Details $_.Exception.Message
}

# ============================================================================
# 2. IAM Role Checks (HIPAA §164.312(a), SOC 2 CC6.1-CC6.3)
# ============================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "2. IAM ROLE SECURITY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

$phiRoles = @(
    "advancia-health-billing-irsa",
    "advancia-patient-link-irsa",
    "advancia-phi-docs-irsa",
    "advancia-claims-intake-irsa",
    "advancia-identity-service-irsa"
)

foreach ($role in $phiRoles) {
    try {
        $roleInfo = aws iam get-role --role-name $role --region $Region 2>$null | ConvertFrom-Json
        if ($roleInfo.Role.RoleName) {
            # Check for overly permissive policies
            $attachedPolicies = aws iam list-attached-role-policies --role-name $role --region $Region 2>$null | ConvertFrom-Json
            $hasAdminPolicy = $attachedPolicies.AttachedPolicies | Where-Object { $_.PolicyName -like "*Admin*" -or $_.PolicyName -like "*FullAccess*" }
            
            if ($hasAdminPolicy) {
                Add-AuditResult -Category "IAM" -Control "Least Privilege ($role)" -Description "Role has admin/full access policy" -Status "FAIL" -Details "Found: $($hasAdminPolicy.PolicyName)"
            } else {
                Add-AuditResult -Category "IAM" -Control "Least Privilege ($role)" -Description "No admin policies attached" -Status "PASS"
            }
        }
    } catch {
        Add-AuditResult -Category "IAM" -Control "Role Exists ($role)" -Description "Role not found" -Status "WARN" -Details $_.Exception.Message
    }
}

# ============================================================================
# 3. CloudTrail Audit Logging (HIPAA §164.312(b), SOC 2 CC4.1)
# ============================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "3. CLOUDTRAIL AUDIT LOGGING" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

try {
    $trails = aws cloudtrail describe-trails --region $Region 2>$null | ConvertFrom-Json
    if ($trails.trailList.Count -gt 0) {
        $trail = $trails.trailList[0]
        
        # Check if trail is logging
        $trailStatus = aws cloudtrail get-trail-status --name $trail.Name --region $Region 2>$null | ConvertFrom-Json
        if ($trailStatus.IsLogging) {
            Add-AuditResult -Category "CloudTrail" -Control "Logging Status" -Description "Trail is actively logging" -Status "PASS"
        } else {
            Add-AuditResult -Category "CloudTrail" -Control "Logging Status" -Description "Trail is not logging" -Status "FAIL"
        }
        
        # Check S3 data events
        $eventSelectors = aws cloudtrail get-event-selectors --trail-name $trail.Name --region $Region 2>$null | ConvertFrom-Json
        $hasS3DataEvents = $eventSelectors.EventSelectors | Where-Object { $_.DataResources.Type -eq "AWS::S3::Object" }
        if ($hasS3DataEvents) {
            Add-AuditResult -Category "CloudTrail" -Control "S3 Data Events" -Description "S3 data events enabled" -Status "PASS"
        } else {
            Add-AuditResult -Category "CloudTrail" -Control "S3 Data Events" -Description "S3 data events not enabled" -Status "FAIL"
        }
        
        # Check log file validation
        if ($trail.LogFileValidationEnabled) {
            Add-AuditResult -Category "CloudTrail" -Control "Log Integrity" -Description "Log file validation enabled" -Status "PASS"
        } else {
            Add-AuditResult -Category "CloudTrail" -Control "Log Integrity" -Description "Log file validation disabled" -Status "FAIL"
        }
    } else {
        Add-AuditResult -Category "CloudTrail" -Control "Trail Exists" -Description "No CloudTrail trail found" -Status "FAIL"
    }
} catch {
    Add-AuditResult -Category "CloudTrail" -Control "Configuration" -Description "Could not verify CloudTrail" -Status "WARN" -Details $_.Exception.Message
}

# ============================================================================
# 4. KMS Encryption (HIPAA §164.312(a)(2)(iv), SOC 2 CC6.1)
# ============================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "4. KMS ENCRYPTION KEYS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

$kmsAliases = @("alias/phi-data-key", "alias/phi-docs-key")

foreach ($alias in $kmsAliases) {
    try {
        $keyInfo = aws kms describe-key --key-id $alias --region $Region 2>$null | ConvertFrom-Json
        if ($keyInfo.KeyMetadata.KeyState -eq "Enabled") {
            Add-AuditResult -Category "KMS" -Control "Key Status ($alias)" -Description "Key is enabled" -Status "PASS"
            
            # Check key rotation
            $rotation = aws kms get-key-rotation-status --key-id $keyInfo.KeyMetadata.KeyId --region $Region 2>$null | ConvertFrom-Json
            if ($rotation.KeyRotationEnabled) {
                Add-AuditResult -Category "KMS" -Control "Key Rotation ($alias)" -Description "Automatic rotation enabled" -Status "PASS"
            } else {
                Add-AuditResult -Category "KMS" -Control "Key Rotation ($alias)" -Description "Automatic rotation disabled" -Status "WARN"
            }
        } else {
            Add-AuditResult -Category "KMS" -Control "Key Status ($alias)" -Description "Key is not enabled" -Status "FAIL"
        }
    } catch {
        Add-AuditResult -Category "KMS" -Control "Key Exists ($alias)" -Description "Key not found" -Status "WARN" -Details $_.Exception.Message
    }
}

# ============================================================================
# 5. GuardDuty Monitoring (HIPAA §164.308(a)(6), SOC 2 CC7.2)
# ============================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "5. GUARDDUTY MONITORING" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

try {
    $detectors = aws guardduty list-detectors --region $Region 2>$null | ConvertFrom-Json
    if ($detectors.DetectorIds.Count -gt 0) {
        $detector = aws guardduty get-detector --detector-id $detectors.DetectorIds[0] --region $Region 2>$null | ConvertFrom-Json
        if ($detector.Status -eq "ENABLED") {
            Add-AuditResult -Category "GuardDuty" -Control "Status" -Description "GuardDuty is enabled" -Status "PASS"
            
            # Check for high severity findings
            $findings = aws guardduty list-findings --detector-id $detectors.DetectorIds[0] --finding-criteria '{"Criterion":{"severity":{"Gte":7}}}' --region $Region 2>$null | ConvertFrom-Json
            if ($findings.FindingIds.Count -eq 0) {
                Add-AuditResult -Category "GuardDuty" -Control "High Severity Findings" -Description "No high severity findings" -Status "PASS"
            } else {
                Add-AuditResult -Category "GuardDuty" -Control "High Severity Findings" -Description "High severity findings detected" -Status "FAIL" -Details "$($findings.FindingIds.Count) findings"
            }
        } else {
            Add-AuditResult -Category "GuardDuty" -Control "Status" -Description "GuardDuty is disabled" -Status "FAIL"
        }
    } else {
        Add-AuditResult -Category "GuardDuty" -Control "Detector" -Description "No GuardDuty detector found" -Status "FAIL"
    }
} catch {
    Add-AuditResult -Category "GuardDuty" -Control "Configuration" -Description "Could not verify GuardDuty" -Status "WARN" -Details $_.Exception.Message
}

# ============================================================================
# 6. Secrets Manager (HIPAA §164.312(d), SOC 2 CC6.6)
# ============================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "6. SECRETS MANAGER" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

$requiredSecrets = @(
    "advancia/$Env/health-billing-service",
    "advancia/$Env/patient-link-service",
    "advancia/$Env/phi-docs-service",
    "advancia/$Env/claims-intake-service",
    "advancia/$Env/identity-service"
)

foreach ($secret in $requiredSecrets) {
    try {
        $secretInfo = aws secretsmanager describe-secret --secret-id $secret --region $Region 2>$null | ConvertFrom-Json
        if ($secretInfo.Name) {
            Add-AuditResult -Category "Secrets" -Control "Secret Exists ($secret)" -Description "Secret configured" -Status "PASS"
        }
    } catch {
        Add-AuditResult -Category "Secrets" -Control "Secret Exists ($secret)" -Description "Secret not found" -Status "WARN" -Details "Create before deployment"
    }
}

# ============================================================================
# 7. SQS Queue Encryption (HIPAA §164.312(e)(2)(ii), SOC 2 CC6.1)
# ============================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "7. SQS QUEUE ENCRYPTION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

$queues = @(
    "health-claims-processing-queue",
    "health-report-generation-queue",
    "identity-verification-queue"
)

foreach ($queue in $queues) {
    try {
        $queueUrl = aws sqs get-queue-url --queue-name $queue --region $Region 2>$null | ConvertFrom-Json
        if ($queueUrl.QueueUrl) {
            $attrs = aws sqs get-queue-attributes --queue-url $queueUrl.QueueUrl --attribute-names KmsMasterKeyId --region $Region 2>$null | ConvertFrom-Json
            if ($attrs.Attributes.KmsMasterKeyId) {
                Add-AuditResult -Category "SQS" -Control "Encryption ($queue)" -Description "KMS encryption enabled" -Status "PASS"
            } else {
                Add-AuditResult -Category "SQS" -Control "Encryption ($queue)" -Description "KMS encryption not enabled" -Status "FAIL"
            }
        }
    } catch {
        Add-AuditResult -Category "SQS" -Control "Queue Exists ($queue)" -Description "Queue not found" -Status "WARN" -Details "Create via Terraform"
    }
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "AUDIT SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total Checks:  $($auditResults.summary.total)" -ForegroundColor White
Write-Host "  Passed:        $($auditResults.summary.passed)" -ForegroundColor Green
Write-Host "  Failed:        $($auditResults.summary.failed)" -ForegroundColor Red
Write-Host "  Warnings:      $($auditResults.summary.warnings)" -ForegroundColor Yellow
Write-Host ""

$complianceScore = [math]::Round(($auditResults.summary.passed / $auditResults.summary.total) * 100, 1)
Write-Host "  Compliance Score: $complianceScore%" -ForegroundColor $(if ($complianceScore -ge 80) { "Green" } elseif ($complianceScore -ge 60) { "Yellow" } else { "Red" })
Write-Host ""

# Save report
$auditResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding utf8
Write-Host "  Report saved to: $OutputFile" -ForegroundColor Gray
Write-Host ""

# Exit with appropriate code
if ($auditResults.summary.failed -gt 0) {
    Write-Host "  ⚠️  Some compliance checks FAILED. Review and remediate." -ForegroundColor Red
    exit 1
} else {
    Write-Host "  ✅ All critical compliance checks PASSED." -ForegroundColor Green
    exit 0
}
