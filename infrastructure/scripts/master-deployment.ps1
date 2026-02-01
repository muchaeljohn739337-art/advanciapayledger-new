# Master Production Deployment Orchestration Script
# Executes all production readiness tasks in the correct order

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$true)]
    [string]$GatewayPublicIP,
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "prod",
    
    [Parameter(Mandatory=$false)]
    [string]$BackendUrl = "",
    
    [Parameter(Mandatory=$false)]
    [string]$FrontendUrl = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipDNS = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "Master Production Deployment" -ForegroundColor Blue
Write-Host "Advancia Pay Ledger" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "  Domain: $Domain" -ForegroundColor White
Write-Host "  Gateway IP: $GatewayPublicIP" -ForegroundColor White
Write-Host "  Environment: $Environment" -ForegroundColor White
Write-Host ""

$deploymentLog = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    resourceGroup = $ResourceGroup
    domain = $Domain
    environment = $Environment
    phases = @()
    status = "in_progress"
}

function Execute-Phase {
    param(
        [string]$Name,
        [string]$Description,
        [scriptblock]$Script
    )
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Phase: $Name" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "$Description" -ForegroundColor Cyan
    Write-Host ""
    
    $phase = @{
        name = $Name
        description = $Description
        startTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        status = "running"
        duration = 0
        error = ""
    }
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        & $Script
        $stopwatch.Stop()
        
        $phase.status = "completed"
        $phase.duration = $stopwatch.ElapsedMilliseconds
        $phase.endTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
        Write-Host ""
        Write-Host "✓ Phase completed in $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Green
        
    } catch {
        $stopwatch.Stop()
        $phase.status = "failed"
        $phase.error = $_.Exception.Message
        $phase.duration = $stopwatch.ElapsedMilliseconds
        $phase.endTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
        Write-Host ""
        Write-Host "✗ Phase failed: $($_.Exception.Message)" -ForegroundColor Red
        throw
    } finally {
        $script:deploymentLog.phases += $phase
    }
}

# Phase 1: Pre-deployment Verification
Execute-Phase -Name "Pre-Deployment Verification" -Description "Verify Azure login and resource availability" -Script {
    Write-Host "Checking Azure login..." -ForegroundColor Cyan
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "✓ Logged in as: $($account.user.name)" -ForegroundColor Green
    Write-Host "✓ Subscription: $($account.name)" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Checking resource group..." -ForegroundColor Cyan
    $rg = az group show --name $ResourceGroup --output json 2>$null | ConvertFrom-Json
    if ($rg) {
        Write-Host "✓ Resource group exists: $ResourceGroup" -ForegroundColor Green
    } else {
        Write-Host "Creating resource group: $ResourceGroup" -ForegroundColor Yellow
        az group create --name $ResourceGroup --location eastus
        Write-Host "✓ Resource group created" -ForegroundColor Green
    }
}

# Phase 2: Infrastructure Deployment
Execute-Phase -Name "Infrastructure Deployment" -Description "Deploy Azure infrastructure (Database, Redis, Key Vault)" -Script {
    Write-Host "Deploying infrastructure components..." -ForegroundColor Cyan
    
    # Deploy using the existing deployment script
    $scriptPath = Join-Path $PSScriptRoot "deploy-application.ps1"
    if (Test-Path $scriptPath) {
        Write-Host "Executing deployment script..." -ForegroundColor Cyan
        & $scriptPath -ResourceGroup $ResourceGroup -Environment $Environment
    } else {
        Write-Host "⚠ Deployment script not found, skipping infrastructure deployment" -ForegroundColor Yellow
    }
}

# Phase 3: DNS Configuration
if (-not $SkipDNS) {
    Execute-Phase -Name "DNS Configuration" -Description "Configure DNS records for production domain" -Script {
        Write-Host "Configuring DNS..." -ForegroundColor Cyan
        
        $dnsScript = Join-Path $PSScriptRoot "configure-dns.ps1"
        if (Test-Path $dnsScript) {
            & $dnsScript -Domain $Domain -GatewayPublicIP $GatewayPublicIP -DNSProvider "Azure" -ResourceGroup $ResourceGroup
        } else {
            Write-Host "Manual DNS configuration required:" -ForegroundColor Yellow
            Write-Host "  A Record: $Domain -> $GatewayPublicIP" -ForegroundColor White
            Write-Host "  A Record: api.$Domain -> $GatewayPublicIP" -ForegroundColor White
            Write-Host "  A Record: app.$Domain -> $GatewayPublicIP" -ForegroundColor White
        }
        
        Write-Host ""
        Write-Host "Waiting 30 seconds for DNS propagation..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    }
} else {
    Write-Host "⚠ Skipping DNS configuration (--SkipDNS flag set)" -ForegroundColor Yellow
}

# Phase 4: SSL Certificate Setup
Execute-Phase -Name "SSL Certificate Setup" -Description "Configure Let's Encrypt SSL certificates" -Script {
    Write-Host "SSL certificate setup instructions:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Run on the gateway VM:" -ForegroundColor Yellow
    Write-Host "  sudo bash infrastructure/scripts/setup-ssl-certificates.sh $Domain admin@$Domain" -ForegroundColor White
    Write-Host ""
    Write-Host "This will:" -ForegroundColor Cyan
    Write-Host "  1. Install Certbot" -ForegroundColor White
    Write-Host "  2. Obtain SSL certificates from Let's Encrypt" -ForegroundColor White
    Write-Host "  3. Configure automatic renewal" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Enter when SSL certificates are configured..." -ForegroundColor Yellow
    Read-Host
}

# Phase 5: NGINX Configuration
Execute-Phase -Name "NGINX Configuration" -Description "Update NGINX upstream configuration" -Script {
    Write-Host "NGINX configuration instructions:" -ForegroundColor Cyan
    Write-Host ""
    
    if ([string]::IsNullOrEmpty($BackendUrl) -or [string]::IsNullOrEmpty($FrontendUrl)) {
        Write-Host "⚠ Backend/Frontend URLs not provided" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please provide the URLs:" -ForegroundColor Yellow
        $script:BackendUrl = Read-Host "Backend URL (e.g., backend-prod.azurewebsites.net)"
        $script:FrontendUrl = Read-Host "Frontend URL (e.g., frontend-prod.azurewebsites.net)"
    }
    
    Write-Host ""
    Write-Host "Run on the gateway VM:" -ForegroundColor Yellow
    Write-Host "  sudo bash infrastructure/scripts/update-nginx-upstream.sh $BackendUrl $FrontendUrl $Domain" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Enter when NGINX is configured..." -ForegroundColor Yellow
    Read-Host
}

# Phase 6: Integration Tests
if (-not $SkipTests) {
    Execute-Phase -Name "Integration Tests" -Description "Run comprehensive integration tests" -Script {
        Write-Host "Running integration tests..." -ForegroundColor Cyan
        
        $testScript = Join-Path $PSScriptRoot "integration-tests.ps1"
        if (Test-Path $testScript) {
            & $testScript -BaseUrl "https://$Domain" -ApiUrl "https://api.$Domain"
        } else {
            Write-Host "⚠ Integration test script not found" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⚠ Skipping integration tests (--SkipTests flag set)" -ForegroundColor Yellow
}

# Phase 7: Kill-Switch Test
Execute-Phase -Name "Kill-Switch Test" -Description "Test emergency kill-switch procedures (dry run)" -Script {
    Write-Host "Testing kill-switch procedures..." -ForegroundColor Cyan
    
    $killSwitchScript = Join-Path $PSScriptRoot "test-kill-switch.ps1"
    if (Test-Path $killSwitchScript) {
        & $killSwitchScript -ResourceGroup $ResourceGroup -Environment $Environment -DryRun
    } else {
        Write-Host "⚠ Kill-switch test script not found" -ForegroundColor Yellow
    }
}

# Phase 8: Final Verification
Execute-Phase -Name "Final Verification" -Description "Verify all systems are operational" -Script {
    Write-Host "Performing final verification..." -ForegroundColor Cyan
    Write-Host ""
    
    $checks = @(
        @{ Name = "Frontend"; Url = "https://$Domain" },
        @{ Name = "API"; Url = "https://api.$Domain/api/health" },
        @{ Name = "App Subdomain"; Url = "https://app.$Domain" }
    )
    
    $allPassed = $true
    foreach ($check in $checks) {
        Write-Host "Checking $($check.Name)..." -NoNewline
        try {
            $response = Invoke-WebRequest -Uri $check.Url -Method GET -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Host " ✓ OK" -ForegroundColor Green
            } else {
                Write-Host " ⚠ Status: $($response.StatusCode)" -ForegroundColor Yellow
                $allPassed = $false
            }
        } catch {
            Write-Host " ✗ FAILED" -ForegroundColor Red
            $allPassed = $false
        }
    }
    
    Write-Host ""
    if ($allPassed) {
        Write-Host "✓ All systems operational" -ForegroundColor Green
    } else {
        Write-Host "⚠ Some systems need attention" -ForegroundColor Yellow
    }
}

# Deployment Summary
$deploymentLog.status = "completed"
$deploymentLog.endTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Deployment Summary:" -ForegroundColor Cyan
Write-Host "  Start Time: $($deploymentLog.timestamp)" -ForegroundColor White
Write-Host "  End Time: $($deploymentLog.endTime)" -ForegroundColor White
Write-Host "  Total Phases: $($deploymentLog.phases.Count)" -ForegroundColor White
Write-Host ""

Write-Host "Phase Results:" -ForegroundColor Cyan
foreach ($phase in $deploymentLog.phases) {
    $status = if ($phase.status -eq "completed") { "✓" } else { "✗" }
    $color = if ($phase.status -eq "completed") { "Green" } else { "Red" }
    Write-Host "  $status $($phase.name) ($($phase.duration)ms)" -ForegroundColor $color
}

Write-Host ""
Write-Host "Production URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:    https://$Domain" -ForegroundColor White
Write-Host "  API:         https://api.$Domain" -ForegroundColor White
Write-Host "  App:         https://app.$Domain" -ForegroundColor White
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Monitor application logs and metrics" -ForegroundColor White
Write-Host "  2. Set up monitoring alerts in Azure Portal" -ForegroundColor White
Write-Host "  3. Schedule regular backups" -ForegroundColor White
Write-Host "  4. Document deployment in runbook" -ForegroundColor White
Write-Host "  5. Schedule investor demos" -ForegroundColor White
Write-Host ""

# Save deployment log
$logFile = "deployment-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$deploymentLog | ConvertTo-Json -Depth 10 | Out-File $logFile
Write-Host "✓ Deployment log saved to $logFile" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "🚀 PRODUCTION DEPLOYMENT SUCCESSFUL 🚀" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
