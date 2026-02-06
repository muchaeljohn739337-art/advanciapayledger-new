#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Verify PHI redaction is working correctly in logs.

.DESCRIPTION
    Scans CloudWatch logs for patterns that should have been redacted.
    Reports any PHI leakage in application logs.

.PARAMETER LogGroup
    CloudWatch Log Group to scan

.PARAMETER Hours
    Hours of logs to scan (default: 24)

.PARAMETER Region
    AWS region (default: us-east-1)

.EXAMPLE
    ./verify-phi-redaction.ps1 -LogGroup "/aws/ecs/identity-service" -Hours 24
#>

param(
    [string]$LogGroup = "/aws/ecs/phi-services",
    [int]$Hours = 24,
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Continue"

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       PHI Redaction Verification                          ║" -ForegroundColor Cyan
Write-Host "║       Scanning logs for unredacted PHI patterns           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# PHI patterns to check for (these should be redacted)
$phiPatterns = @(
    @{ Name = "SSN"; Pattern = '\b\d{3}-\d{2}-\d{4}\b'; Description = "Social Security Number" },
    @{ Name = "SSN-NoHyphens"; Pattern = '\b\d{9}\b'; Description = "SSN without hyphens (may have false positives)" },
    @{ Name = "MemberID"; Pattern = '\b[A-Z]{3}\d{9,12}\b'; Description = "Insurance Member ID" },
    @{ Name = "DOB-Slash"; Pattern = '\b\d{2}/\d{2}/\d{4}\b'; Description = "Date of Birth (MM/DD/YYYY)" },
    @{ Name = "DOB-ISO"; Pattern = '\b(19|20)\d{2}-\d{2}-\d{2}\b'; Description = "Date of Birth (ISO format)" },
    @{ Name = "Email"; Pattern = '\b[\w.+-]+@[\w-]+\.[\w.-]+\b'; Description = "Email Address" },
    @{ Name = "Phone"; Pattern = '\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b'; Description = "Phone Number" },
    @{ Name = "CreditCard"; Pattern = '\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b'; Description = "Credit Card Number" }
)

# Calculate time range
$endTime = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$startTime = [DateTimeOffset]::Now.AddHours(-$Hours).ToUnixTimeMilliseconds()

Write-Host "Log Group: $LogGroup" -ForegroundColor Gray
Write-Host "Time Range: Last $Hours hours" -ForegroundColor Gray
Write-Host ""

$findings = @()

foreach ($pattern in $phiPatterns) {
    Write-Host "Checking for: $($pattern.Name) - $($pattern.Description)..." -NoNewline
    
    try {
        # Use CloudWatch Logs Insights for efficient searching
        $queryId = aws logs start-query `
            --log-group-name $LogGroup `
            --start-time $startTime `
            --end-time $endTime `
            --query-string "fields @timestamp, @message | filter @message like /$($pattern.Pattern)/ | limit 100" `
            --region $Region 2>$null | ConvertFrom-Json
        
        if ($queryId.queryId) {
            # Wait for query to complete
            Start-Sleep -Seconds 2
            
            $results = aws logs get-query-results --query-id $queryId.queryId --region $Region 2>$null | ConvertFrom-Json
            
            $matchCount = $results.results.Count
            
            if ($matchCount -gt 0) {
                Write-Host " FOUND ($matchCount)" -ForegroundColor Red
                $findings += @{
                    Pattern = $pattern.Name
                    Description = $pattern.Description
                    Count = $matchCount
                    Severity = "HIGH"
                }
            } else {
                Write-Host " OK" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host " SKIP (query failed)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "RESULTS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($findings.Count -eq 0) {
    Write-Host "  ✅ No unredacted PHI patterns found in logs." -ForegroundColor Green
    Write-Host ""
    Write-Host "  PHI redaction middleware appears to be working correctly." -ForegroundColor Gray
    exit 0
} else {
    Write-Host "  ⚠️  POTENTIAL PHI LEAKAGE DETECTED" -ForegroundColor Red
    Write-Host ""
    
    foreach ($finding in $findings) {
        Write-Host "  • $($finding.Pattern): $($finding.Count) occurrences" -ForegroundColor Red
        Write-Host "    $($finding.Description)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "  IMMEDIATE ACTIONS REQUIRED:" -ForegroundColor Yellow
    Write-Host "  1. Review the matching log entries" -ForegroundColor Yellow
    Write-Host "  2. Identify the source service" -ForegroundColor Yellow
    Write-Host "  3. Fix the PHI redaction middleware" -ForegroundColor Yellow
    Write-Host "  4. Delete/archive affected logs" -ForegroundColor Yellow
    Write-Host "  5. Assess if breach notification is required" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
