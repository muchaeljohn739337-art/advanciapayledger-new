#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automated incident response for PHI/security incidents.

.DESCRIPTION
    Executes immediate containment and evidence preservation steps
    for security incidents per HIPAA §164.308(a)(6) requirements.

.PARAMETER IncidentType
    Type of incident: breach, unauthorized_access, malware, data_loss

.PARAMETER AffectedService
    Name of the affected PHI service

.PARAMETER Severity
    Incident severity: critical, high, medium, low

.PARAMETER ContainmentOnly
    Only perform containment, skip evidence collection

.EXAMPLE
    ./incident-response.ps1 -IncidentType breach -AffectedService identity-service -Severity critical
#>

param(
    [Parameter(Mandatory)]
    [ValidateSet('breach', 'unauthorized_access', 'malware', 'data_loss', 'phi_exposure')]
    [string]$IncidentType,
    
    [Parameter(Mandatory)]
    [string]$AffectedService,
    
    [Parameter(Mandatory)]
    [ValidateSet('critical', 'high', 'medium', 'low')]
    [string]$Severity,
    
    [string]$Region = "us-east-1",
    [string]$Env = "prod",
    [switch]$ContainmentOnly,
    [string]$OutputDir = "incident-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
)

$ErrorActionPreference = "Continue"

# Create incident directory
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

$incident = @{
    id = "INC-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    type = $IncidentType
    severity = $Severity
    affected_service = $AffectedService
    started_at = (Get-Date -Format "o")
    status = "in_progress"
    containment_actions = @()
    evidence_collected = @()
    responder = $env:USERNAME
}

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║       INCIDENT RESPONSE AUTOMATION                        ║" -ForegroundColor Red
Write-Host "║       HIPAA §164.308(a)(6) Compliance                     ║" -ForegroundColor Red
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""
Write-Host "  Incident ID: $($incident.id)" -ForegroundColor Yellow
Write-Host "  Type: $IncidentType" -ForegroundColor Yellow
Write-Host "  Severity: $Severity" -ForegroundColor $(if ($Severity -eq 'critical') { 'Red' } elseif ($Severity -eq 'high') { 'Yellow' } else { 'White' })
Write-Host "  Affected Service: $AffectedService" -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# PHASE 1: IMMEDIATE CONTAINMENT
# ============================================================================
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host "PHASE 1: CONTAINMENT" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host ""

# 1.1 Revoke IAM credentials if unauthorized access
if ($IncidentType -in @('breach', 'unauthorized_access')) {
    Write-Host "[1.1] Rotating service credentials..." -ForegroundColor Yellow
    
    try {
        # Rotate Secrets Manager secret
        $secretName = "advancia/$Env/$AffectedService"
        aws secretsmanager rotate-secret --secret-id $secretName --region $Region 2>&1 | Out-Null
        
        $incident.containment_actions += "Rotated secret: $secretName"
        Write-Host "  ✓ Rotated secret: $secretName" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed to rotate secret: $_" -ForegroundColor Red
    }
}

# 1.2 Block network access if malware detected
if ($IncidentType -eq 'malware') {
    Write-Host "[1.2] Isolating affected service..." -ForegroundColor Yellow
    
    # Scale down to 0 replicas
    try {
        kubectl scale deployment $AffectedService --replicas=0 -n platform-core 2>&1 | Out-Null
        $incident.containment_actions += "Scaled $AffectedService to 0 replicas"
        Write-Host "  ✓ Scaled $AffectedService to 0 replicas" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed to scale down: $_" -ForegroundColor Red
    }
}

# 1.3 Disable compromised IAM role
if ($IncidentType -eq 'unauthorized_access' -and $Severity -eq 'critical') {
    Write-Host "[1.3] Disabling IAM role..." -ForegroundColor Yellow
    
    $roleName = "advancia-$AffectedService-irsa"
    try {
        # Attach deny-all policy
        $denyPolicy = @{
            Version = "2012-10-17"
            Statement = @(
                @{
                    Sid = "DenyAll"
                    Effect = "Deny"
                    Action = "*"
                    Resource = "*"
                }
            )
        } | ConvertTo-Json -Depth 10
        
        aws iam put-role-policy --role-name $roleName --policy-name "IncidentDenyAll" --policy-document $denyPolicy --region $Region 2>&1 | Out-Null
        
        $incident.containment_actions += "Attached DenyAll policy to role: $roleName"
        Write-Host "  ✓ Attached DenyAll policy to $roleName" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed to disable role: $_" -ForegroundColor Red
    }
}

# 1.4 Block S3 access if data exfiltration suspected
if ($IncidentType -in @('breach', 'data_loss')) {
    Write-Host "[1.4] Adding S3 bucket policy restrictions..." -ForegroundColor Yellow
    
    $bucketName = "advancia-phi-docs-$Env"
    # Note: In production, implement more surgical blocking based on source IPs
    $incident.containment_actions += "Review S3 bucket policy for $bucketName"
    Write-Host "  ⚠ Manual review required for S3 bucket: $bucketName" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Containment phase complete." -ForegroundColor Green

if ($ContainmentOnly) {
    Write-Host ""
    Write-Host "ContainmentOnly flag set - skipping evidence collection." -ForegroundColor Yellow
    $incident.status = "contained"
    $incident | ConvertTo-Json -Depth 10 | Out-File "$OutputDir/incident.json"
    exit 0
}

# ============================================================================
# PHASE 2: EVIDENCE PRESERVATION
# ============================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "PHASE 2: EVIDENCE PRESERVATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 2.1 Export CloudTrail logs
Write-Host "[2.1] Exporting CloudTrail logs (last 24 hours)..." -ForegroundColor Yellow

$startTime = (Get-Date).AddHours(-24).ToString("yyyy-MM-ddTHH:mm:ssZ")
$endTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")

try {
    aws cloudtrail lookup-events `
        --start-time $startTime `
        --end-time $endTime `
        --lookup-attributes AttributeKey=ResourceName,AttributeValue=$AffectedService `
        --region $Region `
        --output json > "$OutputDir/cloudtrail_events.json" 2>&1
    
    $incident.evidence_collected += "cloudtrail_events.json"
    Write-Host "  ✓ Exported CloudTrail events" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to export CloudTrail: $_" -ForegroundColor Red
}

# 2.2 Export CloudWatch logs
Write-Host "[2.2] Exporting CloudWatch logs..." -ForegroundColor Yellow

$logGroup = "/aws/ecs/$AffectedService"
try {
    # Start log export to S3
    $taskId = aws logs create-export-task `
        --log-group-name $logGroup `
        --from (([DateTimeOffset](Get-Date).AddHours(-24)).ToUnixTimeMilliseconds()) `
        --to (([DateTimeOffset](Get-Date)).ToUnixTimeMilliseconds()) `
        --destination "advancia-audit-logs-$Env" `
        --destination-prefix "incidents/$($incident.id)" `
        --region $Region `
        --query 'taskId' --output text 2>&1
    
    $incident.evidence_collected += "CloudWatch logs export task: $taskId"
    Write-Host "  ✓ Started log export (task: $taskId)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to export logs: $_" -ForegroundColor Red
}

# 2.3 Export VPC Flow Logs (if applicable)
Write-Host "[2.3] Querying VPC Flow Logs..." -ForegroundColor Yellow

try {
    aws logs filter-log-events `
        --log-group-name "/aws/vpc/flow-logs" `
        --start-time (([DateTimeOffset](Get-Date).AddHours(-24)).ToUnixTimeMilliseconds()) `
        --filter-pattern "REJECT" `
        --region $Region `
        --output json > "$OutputDir/vpc_flow_logs_rejects.json" 2>&1
    
    $incident.evidence_collected += "vpc_flow_logs_rejects.json"
    Write-Host "  ✓ Exported VPC Flow Log rejects" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ VPC Flow Logs not available or no rejects" -ForegroundColor Yellow
}

# 2.4 Export GuardDuty findings
Write-Host "[2.4] Exporting GuardDuty findings..." -ForegroundColor Yellow

try {
    $detectorId = aws guardduty list-detectors --region $Region --query 'DetectorIds[0]' --output text 2>&1
    if ($detectorId) {
        aws guardduty list-findings `
            --detector-id $detectorId `
            --region $Region `
            --output json > "$OutputDir/guardduty_findings.json" 2>&1
        
        $incident.evidence_collected += "guardduty_findings.json"
        Write-Host "  ✓ Exported GuardDuty findings" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠ No GuardDuty findings" -ForegroundColor Yellow
}

# 2.5 Snapshot affected database
if ($Severity -in @('critical', 'high')) {
    Write-Host "[2.5] Creating Aurora snapshot..." -ForegroundColor Yellow
    
    $snapshotId = "incident-$($incident.id)-$(Get-Date -Format 'yyyyMMddHHmmss')"
    try {
        aws rds create-db-cluster-snapshot `
            --db-cluster-identifier "advancia-phi-$Env" `
            --db-cluster-snapshot-identifier $snapshotId `
            --region $Region 2>&1 | Out-Null
        
        $incident.evidence_collected += "Aurora snapshot: $snapshotId"
        Write-Host "  ✓ Created Aurora snapshot: $snapshotId" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed to create snapshot: $_" -ForegroundColor Red
    }
}

# 2.6 Capture current K8s state
Write-Host "[2.6] Capturing Kubernetes state..." -ForegroundColor Yellow

try {
    kubectl get pods -n platform-core -l app=$AffectedService -o yaml > "$OutputDir/k8s_pods.yaml" 2>&1
    kubectl describe pods -n platform-core -l app=$AffectedService > "$OutputDir/k8s_pods_describe.txt" 2>&1
    kubectl get events -n platform-core --sort-by='.lastTimestamp' > "$OutputDir/k8s_events.txt" 2>&1
    
    $incident.evidence_collected += @("k8s_pods.yaml", "k8s_pods_describe.txt", "k8s_events.txt")
    Write-Host "  ✓ Captured K8s state" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Could not capture K8s state (may not be connected to cluster)" -ForegroundColor Yellow
}

# ============================================================================
# PHASE 3: NOTIFICATION
# ============================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "PHASE 3: NOTIFICATION" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

# Create incident report
$incident.status = "evidence_collected"
$incident.completed_at = (Get-Date -Format "o")
$incident | ConvertTo-Json -Depth 10 | Out-File "$OutputDir/incident.json"

Write-Host "[3.1] Incident report saved to: $OutputDir/incident.json" -ForegroundColor Green

# Notification checklist
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "REQUIRED NOTIFICATIONS (HIPAA §164.308(a)(6))" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [ ] Security Team Lead notified" -ForegroundColor White
Write-Host "  [ ] Privacy Officer notified (within 24 hours)" -ForegroundColor White
Write-Host "  [ ] Legal counsel engaged (if breach confirmed)" -ForegroundColor White

if ($IncidentType -eq 'breach' -or $IncidentType -eq 'phi_exposure') {
    Write-Host ""
    Write-Host "  POTENTIAL BREACH - Additional requirements:" -ForegroundColor Red
    Write-Host "  [ ] HHS notification (within 60 days if >500 individuals)" -ForegroundColor Red
    Write-Host "  [ ] Affected individuals notification (without unreasonable delay)" -ForegroundColor Red
    Write-Host "  [ ] Media notification (if >500 in a state/jurisdiction)" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "INCIDENT RESPONSE AUTOMATION COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Incident ID: $($incident.id)" -ForegroundColor White
Write-Host "  Evidence Dir: $OutputDir" -ForegroundColor White
Write-Host "  Files Collected: $($incident.evidence_collected.Count)" -ForegroundColor White
Write-Host "  Actions Taken: $($incident.containment_actions.Count)" -ForegroundColor White
Write-Host ""
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review evidence in $OutputDir" -ForegroundColor White
Write-Host "  2. Complete notification checklist" -ForegroundColor White
Write-Host "  3. Perform root cause analysis" -ForegroundColor White
Write-Host "  4. Document lessons learned" -ForegroundColor White
Write-Host ""
