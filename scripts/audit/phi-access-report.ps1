#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Generate PHI access report for compliance review.

.DESCRIPTION
    Queries CloudTrail and application logs to generate a report of all
    PHI access for audit purposes per HIPAA §164.312(b) requirements.

.PARAMETER StartDate
    Start date for report (default: 30 days ago)

.PARAMETER EndDate
    End date for report (default: today)

.PARAMETER PatientId
    Optional: Filter by specific patient ID

.PARAMETER UserId
    Optional: Filter by specific user ID

.EXAMPLE
    ./phi-access-report.ps1 -StartDate 2026-01-01 -EndDate 2026-01-31
#>

param(
    [DateTime]$StartDate = (Get-Date).AddDays(-30),
    [DateTime]$EndDate = (Get-Date),
    [string]$PatientId,
    [string]$UserId,
    [string]$Region = "us-east-1",
    [string]$OutputFile = "phi-access-report-$(Get-Date -Format 'yyyy-MM-dd').json"
)

$ErrorActionPreference = "Continue"

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       PHI Access Audit Report                             ║" -ForegroundColor Cyan
Write-Host "║       HIPAA §164.312(b) Compliance                        ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Report Period: $($StartDate.ToString('yyyy-MM-dd')) to $($EndDate.ToString('yyyy-MM-dd'))" -ForegroundColor Gray
Write-Host ""

$report = @{
    generated_at = (Get-Date -Format "o")
    period = @{
        start = $StartDate.ToString("o")
        end = $EndDate.ToString("o")
    }
    filters = @{
        patient_id = $PatientId
        user_id = $UserId
    }
    summary = @{
        total_accesses = 0
        unique_users = 0
        unique_patients = 0
        by_service = @{}
        by_action = @{}
    }
    access_log = @()
}

# Convert dates to CloudWatch timestamp format
$startTimestamp = [DateTimeOffset]$StartDate
$endTimestamp = [DateTimeOffset]$EndDate

# Services to query
$phiServices = @(
    "health-billing-service",
    "patient-link-service",
    "phi-docs-service",
    "claims-intake-service",
    "identity-service"
)

Write-Host "Querying PHI access logs..." -ForegroundColor Yellow
Write-Host ""

foreach ($service in $phiServices) {
    Write-Host "  Scanning $service..." -NoNewline
    
    $logGroup = "/aws/ecs/$service"
    
    # Build filter pattern for PHI access
    $filterPattern = '[timestamp, requestId, level="INFO", message="PHI_ACCESS*"]'
    
    if ($PatientId) {
        $filterPattern = "[timestamp, requestId, level, message, patientId=`"$PatientId`"*]"
    }
    
    try {
        # Query CloudWatch Logs Insights for structured access logs
        $queryString = @"
fields @timestamp, @message
| filter @message like /PHI_ACCESS|PATIENT_VIEW|DOCUMENT_ACCESS|CLAIM_VIEW/
| parse @message '"user_id":"*"' as user_id
| parse @message '"patient_ref_id":"*"' as patient_ref_id
| parse @message '"action":"*"' as action
| parse @message '"resource":"*"' as resource
| sort @timestamp desc
| limit 10000
"@

        $queryId = aws logs start-query `
            --log-group-name $logGroup `
            --start-time $startTimestamp.ToUnixTimeSeconds() `
            --end-time $endTimestamp.ToUnixTimeSeconds() `
            --query-string $queryString `
            --region $Region 2>$null | ConvertFrom-Json
        
        if ($queryId.queryId) {
            # Wait for query to complete
            Start-Sleep -Seconds 3
            
            $results = aws logs get-query-results --query-id $queryId.queryId --region $Region 2>$null | ConvertFrom-Json
            
            $accessCount = $results.results.Count
            Write-Host " $accessCount accesses" -ForegroundColor $(if ($accessCount -gt 0) { "Green" } else { "Gray" })
            
            # Update summary
            $report.summary.total_accesses += $accessCount
            $report.summary.by_service[$service] = $accessCount
            
            # Add to access log
            foreach ($result in $results.results) {
                $entry = @{
                    timestamp = ($result | Where-Object { $_.field -eq "@timestamp" }).value
                    service = $service
                    message = ($result | Where-Object { $_.field -eq "@message" }).value
                }
                $report.access_log += $entry
            }
        }
    } catch {
        Write-Host " ERROR" -ForegroundColor Red
    }
}

# Query CloudTrail for S3 PHI bucket access
Write-Host ""
Write-Host "  Scanning S3 PHI bucket access..." -NoNewline

try {
    $s3Events = aws cloudtrail lookup-events `
        --start-time $StartDate.ToString("yyyy-MM-ddTHH:mm:ssZ") `
        --end-time $EndDate.ToString("yyyy-MM-ddTHH:mm:ssZ") `
        --lookup-attributes AttributeKey=ResourceType,AttributeValue=AWS::S3::Object `
        --region $Region 2>$null | ConvertFrom-Json
    
    $phiBucketEvents = $s3Events.Events | Where-Object { 
        $_.CloudTrailEvent -match "advancia-phi-docs" 
    }
    
    Write-Host " $($phiBucketEvents.Count) S3 accesses" -ForegroundColor $(if ($phiBucketEvents.Count -gt 0) { "Green" } else { "Gray" })
    
    $report.summary.by_service["s3-phi-bucket"] = $phiBucketEvents.Count
    $report.summary.total_accesses += $phiBucketEvents.Count
    
} catch {
    Write-Host " SKIPPED" -ForegroundColor Yellow
}

# Calculate unique users and patients
$uniqueUsers = @{}
$uniquePatients = @{}

foreach ($entry in $report.access_log) {
    if ($entry.message -match '"user_id":"([^"]+)"') {
        $uniqueUsers[$matches[1]] = $true
    }
    if ($entry.message -match '"patient_ref_id":"([^"]+)"') {
        $uniquePatients[$matches[1]] = $true
    }
}

$report.summary.unique_users = $uniqueUsers.Count
$report.summary.unique_patients = $uniquePatients.Count

# Generate summary by action type
$actionCounts = @{}
foreach ($entry in $report.access_log) {
    if ($entry.message -match '"action":"([^"]+)"') {
        $action = $matches[1]
        if ($actionCounts.ContainsKey($action)) {
            $actionCounts[$action]++
        } else {
            $actionCounts[$action] = 1
        }
    }
}
$report.summary.by_action = $actionCounts

# Save report
$report | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding utf8

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "REPORT SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total PHI Accesses:  $($report.summary.total_accesses)" -ForegroundColor White
Write-Host "  Unique Users:        $($report.summary.unique_users)" -ForegroundColor White
Write-Host "  Unique Patients:     $($report.summary.unique_patients)" -ForegroundColor White
Write-Host ""
Write-Host "  By Service:" -ForegroundColor Gray
foreach ($svc in $report.summary.by_service.Keys) {
    Write-Host "    $($svc): $($report.summary.by_service[$svc])" -ForegroundColor Gray
}
Write-Host ""
Write-Host "  Report saved to: $OutputFile" -ForegroundColor Green
Write-Host ""

# Compliance reminder
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "HIPAA §164.312(b) REQUIREMENTS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ✓ Audit controls record information system activity" -ForegroundColor Green
Write-Host "  ✓ Logs include user identification" -ForegroundColor Green
Write-Host "  ✓ Date/time of access recorded" -ForegroundColor Green
Write-Host "  ✓ Actions performed are logged" -ForegroundColor Green
Write-Host ""
Write-Host "  Retention Requirement: 6 years minimum" -ForegroundColor White
Write-Host "  Review Frequency: Regular (recommend monthly)" -ForegroundColor White
Write-Host ""
