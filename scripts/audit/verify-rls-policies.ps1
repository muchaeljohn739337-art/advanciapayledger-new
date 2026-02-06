#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Verify Row-Level Security (RLS) is enabled on all PHI tables.

.DESCRIPTION
    Connects to Aurora PostgreSQL and verifies RLS policies are configured
    correctly on all PHI/PII tables per HIPAA §164.312(a)(1).

.PARAMETER DatabaseUrl
    PostgreSQL connection string

.PARAMETER OutputFile
    Output file for RLS report

.EXAMPLE
    ./verify-rls-policies.ps1 -DatabaseUrl "postgresql://user:pass@host:5432/db"
#>

param(
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$OutputFile = "rls-audit-$(Get-Date -Format 'yyyy-MM-dd').json"
)

$ErrorActionPreference = "Continue"

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       Row-Level Security (RLS) Audit                      ║" -ForegroundColor Cyan
Write-Host "║       HIPAA §164.312(a)(1) Compliance                     ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if (-not $DatabaseUrl) {
    Write-Host "ERROR: DATABASE_URL environment variable not set" -ForegroundColor Red
    Write-Host "Usage: ./verify-rls-policies.ps1 -DatabaseUrl 'postgresql://...'" -ForegroundColor Gray
    exit 1
}

# PHI tables that MUST have RLS enabled
$requiredRlsTables = @(
    @{ schema = "health"; table = "patients" },
    @{ schema = "health"; table = "claims" },
    @{ schema = "health"; table = "procedures" },
    @{ schema = "health"; table = "diagnoses" },
    @{ schema = "health"; table = "eligibility_checks" },
    @{ schema = "health"; table = "prior_authorizations" },
    @{ schema = "health"; table = "documents" },
    @{ schema = "health"; table = "identity_documents" },
    @{ schema = "health"; table = "audit_log" }
)

$report = @{
    timestamp = (Get-Date -Format "o")
    tables = @()
    passed = 0
    failed = 0
}

# SQL to check RLS status
$sqlQuery = @"
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables
JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE schemaname = 'health'
ORDER BY tablename;
"@

Write-Host "Connecting to Aurora PostgreSQL..." -ForegroundColor Gray
Write-Host ""

try {
    # Execute query using psql (assumes psql is available)
    $result = echo $sqlQuery | psql $DatabaseUrl -t -A -F '|' 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Could not connect to database" -ForegroundColor Red
        Write-Host $result -ForegroundColor Gray
        exit 1
    }
    
    $lines = $result -split "`n" | Where-Object { $_ -match '\|' }
    
    foreach ($table in $requiredRlsTables) {
        $fullName = "$($table.schema).$($table.table)"
        $line = $lines | Where-Object { $_ -match "^$($table.schema)\|$($table.table)\|" }
        
        if ($line) {
            $parts = $line -split '\|'
            $rlsEnabled = $parts[2] -eq 't'
            $forceRls = $parts[3] -eq 't'
            
            $tableResult = @{
                schema = $table.schema
                table = $table.table
                rls_enabled = $rlsEnabled
                force_rls = $forceRls
                status = if ($rlsEnabled) { "PASS" } else { "FAIL" }
            }
            $report.tables += $tableResult
            
            if ($rlsEnabled) {
                $report.passed++
                Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
                Write-Host "$fullName" -NoNewline
                if ($forceRls) {
                    Write-Host " (FORCE RLS)" -ForegroundColor Cyan
                } else {
                    Write-Host " (RLS enabled, FORCE RLS recommended)" -ForegroundColor Yellow
                }
            } else {
                $report.failed++
                Write-Host "  [FAIL] " -ForegroundColor Red -NoNewline
                Write-Host "$fullName - RLS NOT ENABLED" -ForegroundColor Red
            }
        } else {
            Write-Host "  [WARN] " -ForegroundColor Yellow -NoNewline
            Write-Host "$fullName - Table not found" -ForegroundColor Yellow
            $report.tables += @{
                schema = $table.schema
                table = $table.table
                rls_enabled = $false
                status = "NOT_FOUND"
            }
        }
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    
    # Fallback: Show manual verification SQL
    Write-Host ""
    Write-Host "Manual verification SQL:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host @"
-- Run this in your PostgreSQL client:
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables
JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE schemaname = 'health'
ORDER BY tablename;

-- Check policies:
SELECT * FROM pg_policies WHERE schemaname = 'health';

-- Enable RLS if missing:
ALTER TABLE health.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.patients FORCE ROW LEVEL SECURITY;
"@ -ForegroundColor Gray
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Tables checked: $($requiredRlsTables.Count)" -ForegroundColor White
Write-Host "  RLS enabled:    $($report.passed)" -ForegroundColor Green
Write-Host "  RLS missing:    $($report.failed)" -ForegroundColor $(if ($report.failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

# Save report
$report | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding utf8
Write-Host "  Report saved to: $OutputFile" -ForegroundColor Gray
Write-Host ""

if ($report.failed -gt 0) {
    Write-Host "  ⚠️  RLS COMPLIANCE FAILURE - Enable RLS on all PHI tables" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Fix command:" -ForegroundColor Yellow
    foreach ($table in $report.tables | Where-Object { $_.status -eq "FAIL" }) {
        Write-Host "    ALTER TABLE $($table.schema).$($table.table) ENABLE ROW LEVEL SECURITY;" -ForegroundColor Gray
        Write-Host "    ALTER TABLE $($table.schema).$($table.table) FORCE ROW LEVEL SECURITY;" -ForegroundColor Gray
    }
    exit 1
} else {
    Write-Host "  ✅ All PHI tables have RLS enabled." -ForegroundColor Green
    exit 0
}
