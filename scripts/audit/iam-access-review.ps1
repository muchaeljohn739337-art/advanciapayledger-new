#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Generate quarterly IAM access review report.

.DESCRIPTION
    Reviews all IAM roles with PHI access and generates a compliance report.
    Identifies unused permissions, overly permissive policies, and anomalies.

.PARAMETER Region
    AWS region (default: us-east-1)

.PARAMETER OutputFile
    Output file for report (default: iam-review-YYYY-MM-DD.json)

.EXAMPLE
    ./iam-access-review.ps1 -Region us-east-1
#>

param(
    [string]$Region = "us-east-1",
    [string]$OutputFile = "iam-review-$(Get-Date -Format 'yyyy-MM-dd').json"
)

$ErrorActionPreference = "Continue"

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       Quarterly IAM Access Review                         ║" -ForegroundColor Cyan
Write-Host "║       HIPAA §164.308(a)(4) Compliance                     ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$report = @{
    timestamp = (Get-Date -Format "o")
    region = $Region
    roles = @()
    findings = @()
    recommendations = @()
}

# PHI-related roles to review
$phiRoles = @(
    "advancia-health-billing-irsa",
    "advancia-patient-link-irsa",
    "advancia-phi-docs-irsa",
    "advancia-claims-intake-irsa",
    "advancia-identity-service-irsa",
    "advancia-external-secrets-irsa"
)

foreach ($roleName in $phiRoles) {
    Write-Host "Reviewing: $roleName" -ForegroundColor White
    
    $roleData = @{
        name = $roleName
        exists = $false
        attachedPolicies = @()
        inlinePolicies = @()
        issues = @()
        lastUsed = $null
    }
    
    try {
        # Get role info
        $role = aws iam get-role --role-name $roleName --region $Region 2>$null | ConvertFrom-Json
        
        if ($role.Role) {
            $roleData.exists = $true
            $roleData.arn = $role.Role.Arn
            $roleData.createDate = $role.Role.CreateDate
            
            # Get attached policies
            $attachedPolicies = aws iam list-attached-role-policies --role-name $roleName --region $Region 2>$null | ConvertFrom-Json
            foreach ($policy in $attachedPolicies.AttachedPolicies) {
                $roleData.attachedPolicies += $policy.PolicyName
                
                # Check for overly permissive policies
                if ($policy.PolicyName -match "(Admin|FullAccess|PowerUser)") {
                    $roleData.issues += "Overly permissive policy: $($policy.PolicyName)"
                    $report.findings += @{
                        role = $roleName
                        severity = "HIGH"
                        finding = "Overly permissive policy attached: $($policy.PolicyName)"
                        recommendation = "Replace with least-privilege custom policy"
                    }
                }
            }
            
            # Get inline policies
            $inlinePolicies = aws iam list-role-policies --role-name $roleName --region $Region 2>$null | ConvertFrom-Json
            $roleData.inlinePolicies = $inlinePolicies.PolicyNames
            
            # Check last used
            $lastUsed = aws iam get-role --role-name $roleName --region $Region 2>$null | ConvertFrom-Json
            if ($lastUsed.Role.RoleLastUsed.LastUsedDate) {
                $roleData.lastUsed = $lastUsed.Role.RoleLastUsed.LastUsedDate
                
                # Check if unused for 90+ days
                $lastUsedDate = [DateTime]::Parse($lastUsed.Role.RoleLastUsed.LastUsedDate)
                $daysSinceUse = (Get-Date) - $lastUsedDate
                if ($daysSinceUse.Days -gt 90) {
                    $roleData.issues += "Not used in $($daysSinceUse.Days) days"
                    $report.findings += @{
                        role = $roleName
                        severity = "MEDIUM"
                        finding = "Role not used in $($daysSinceUse.Days) days"
                        recommendation = "Verify role is still needed or remove"
                    }
                }
            }
            
            Write-Host "  ✓ Found, $($roleData.attachedPolicies.Count) policies attached" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ✗ Not found or access denied" -ForegroundColor Yellow
        $roleData.issues += "Role not found or access denied"
    }
    
    $report.roles += $roleData
}

# Check for IAM Access Analyzer findings
Write-Host ""
Write-Host "Checking IAM Access Analyzer..." -ForegroundColor White

try {
    $analyzers = aws accessanalyzer list-analyzers --region $Region 2>$null | ConvertFrom-Json
    if ($analyzers.analyzers.Count -gt 0) {
        $analyzerArn = $analyzers.analyzers[0].arn
        $findings = aws accessanalyzer list-findings --analyzer-arn $analyzerArn --filter '{"status":{"eq":["ACTIVE"]}}' --region $Region 2>$null | ConvertFrom-Json
        
        if ($findings.findings.Count -gt 0) {
            Write-Host "  ⚠ $($findings.findings.Count) active findings" -ForegroundColor Yellow
            foreach ($finding in $findings.findings) {
                $report.findings += @{
                    role = $finding.resource
                    severity = $finding.status
                    finding = "IAM Access Analyzer: $($finding.resourceType) - $($finding.condition)"
                    recommendation = "Review external access"
                }
            }
        } else {
            Write-Host "  ✓ No active findings" -ForegroundColor Green
        }
    } else {
        Write-Host "  ⚠ No IAM Access Analyzer configured" -ForegroundColor Yellow
        $report.recommendations += "Enable IAM Access Analyzer for continuous monitoring"
    }
} catch {
    Write-Host "  ✗ Could not check IAM Access Analyzer" -ForegroundColor Yellow
}

# Generate recommendations
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$totalRoles = $report.roles.Count
$existingRoles = ($report.roles | Where-Object { $_.exists }).Count
$rolesWithIssues = ($report.roles | Where-Object { $_.issues.Count -gt 0 }).Count

Write-Host "  Roles reviewed: $totalRoles" -ForegroundColor White
Write-Host "  Roles found:    $existingRoles" -ForegroundColor $(if ($existingRoles -eq $totalRoles) { "Green" } else { "Yellow" })
Write-Host "  Roles with issues: $rolesWithIssues" -ForegroundColor $(if ($rolesWithIssues -eq 0) { "Green" } else { "Red" })
Write-Host "  Total findings: $($report.findings.Count)" -ForegroundColor $(if ($report.findings.Count -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

# Save report
$report | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding utf8
Write-Host "  Report saved to: $OutputFile" -ForegroundColor Gray
Write-Host ""

# Compliance attestation
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "QUARTERLY REVIEW ATTESTATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Review Date: $(Get-Date -Format 'yyyy-MM-dd')" -ForegroundColor White
Write-Host "  Next Review: $(Get-Date (Get-Date).AddMonths(3) -Format 'yyyy-MM-dd')" -ForegroundColor White
Write-Host ""
Write-Host "  Reviewer: ___________________________" -ForegroundColor Gray
Write-Host "  Signature: __________________________" -ForegroundColor Gray
Write-Host ""

if ($report.findings.Count -gt 0) {
    exit 1
} else {
    exit 0
}
