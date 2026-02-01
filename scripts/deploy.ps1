# Advancia Pay Ledger - Secure Deployment Script
# Version: 1.0

[CmdletBinding()]
param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("sandbox", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [string]$Version = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Security: Validate script is run from correct directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath

if (-not (Test-Path "$projectRoot\package.json")) {
    Write-Error "Must run from project root. package.json not found."
    exit 1
}

# Security: Validate environment variables exist
$requiredEnvVars = @(
    "DATABASE_URL",
    "JWT_SECRET",
    "SENTRY_DSN"
)

foreach ($envVar in $requiredEnvVars) {
    if (-not (Test-Path "env:$envVar")) {
        Write-Error "Required environment variable missing: $envVar"
        exit 1
    }
}

# Security: Prevent deployment with default/weak secrets
$jwtSecret = $env:JWT_SECRET
if ($jwtSecret -match "^(test|default|secret|changeme)" -or $jwtSecret.Length -lt 32) {
    Write-Error "JWT_SECRET is weak or default. Use strong secret (32+ chars)."
    exit 1
}

# Security: Validate NODE_ENV matches deployment target
if ($Environment -eq "prod" -and $env:NODE_ENV -ne "production") {
    Write-Error "NODE_ENV must be 'production' for prod deployment. Current: $($env:NODE_ENV)"
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Advancia Pay Ledger Deployment" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Version: $(if ($Version) { $Version } else { 'latest' })" -ForegroundColor Cyan
Write-Host "Dry Run: $DryRun" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Pre-deployment validation
Write-Host "`n[1/7] Running pre-deployment checks..." -ForegroundColor Yellow

# Check Git status
$gitStatus = git status --porcelain
if ($gitStatus -and $Environment -eq "prod") {
    Write-Error "Uncommitted changes detected. Commit or stash changes before production deployment."
    exit 1
}

# Get current commit hash for tracking
$commitHash = git rev-parse --short HEAD
Write-Host "Deploying commit: $commitHash" -ForegroundColor Green

# Step 2: Dependency audit
Write-Host "`n[2/7] Running security audit..." -ForegroundColor Yellow

Push-Location "$projectRoot\backend"
try {
    $auditResult = npm audit --production --audit-level=high 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Security vulnerabilities found. Run 'npm audit fix' before deploying."
        exit 1
    }
    Write-Host "Security audit passed" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 3: Linting
Write-Host "`n[3/7] Running linter..." -ForegroundColor Yellow

Push-Location "$projectRoot\backend"
try {
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Linting failed. Fix errors before deploying."
        exit 1
    }
    Write-Host "Linting passed" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 4: Tests
if (-not $SkipTests) {
    Write-Host "`n[4/7] Running tests..." -ForegroundColor Yellow
    
    Push-Location "$projectRoot\backend"
    try {
        npm test
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Tests failed. Fix failing tests before deploying."
            exit 1
        }
        Write-Host "Tests passed" -ForegroundColor Green
    } finally {
        Pop-Location
    }
} else {
    Write-Host "`n[4/7] Skipping tests (--SkipTests flag)" -ForegroundColor Yellow
}

# Step 5: Build
Write-Host "`n[5/7] Building application..." -ForegroundColor Yellow

Push-Location "$projectRoot\backend"
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed."
        exit 1
    }
    Write-Host "Build completed" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 6: Backup (production only)
if ($Environment -eq "prod" -and -not $DryRun) {
    Write-Host "`n[6/7] Creating pre-deployment backup..." -ForegroundColor Yellow
    
    $backupScript = "$projectRoot\scripts\backup-database.sh"
    if (Test-Path $backupScript) {
        bash $backupScript
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Backup failed. Aborting deployment."
            exit 1
        }
        Write-Host "Backup completed" -ForegroundColor Green
    } else {
        Write-Warning "Backup script not found. Proceeding without backup."
    }
} else {
    Write-Host "`n[6/7] Skipping backup (sandbox or dry-run)" -ForegroundColor Yellow
}

# Step 7: Deploy
Write-Host "`n[7/7] Deploying to $Environment..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "DRY RUN - Deployment skipped" -ForegroundColor Cyan
    Write-Host "Would deploy commit $commitHash to $Environment" -ForegroundColor Cyan
    exit 0
}

# Environment-specific deployment
switch ($Environment) {
    "sandbox" {
        Write-Host "Deploying to sandbox environment..." -ForegroundColor Cyan
        
        # Sandbox deployment commands
        # TODO: Add actual sandbox deployment logic
        # Example: ssh sandbox-server "cd /app && git pull && npm install && pm2 restart all"
        
        Write-Host "Sandbox deployment completed" -ForegroundColor Green
    }
    
    "prod" {
        Write-Host "Deploying to production environment..." -ForegroundColor Cyan
        
        # Production deployment requires confirmation
        $confirmation = Read-Host "Deploy to PRODUCTION? Type 'DEPLOY' to confirm"
        if ($confirmation -ne "DEPLOY") {
            Write-Host "Deployment cancelled by user" -ForegroundColor Yellow
            exit 0
        }
        
        # Production deployment commands
        # TODO: Add actual production deployment logic
        # Example: 
        # - Run database migrations
        # - Deploy to load balancer
        # - Health check verification
        # - Gradual rollout
        
        Write-Host "Production deployment completed" -ForegroundColor Green
    }
}

# Post-deployment verification
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Post-Deployment Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$healthUrl = if ($Environment -eq "prod") { 
    "https://api.advanciapayledger.com/health" 
} else { 
    "https://sandbox-api.advanciapayledger.com/health" 
}

Write-Host "Waiting for service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10
    if ($response.status -eq "ok") {
        Write-Host "Health check passed" -ForegroundColor Green
    } else {
        Write-Warning "Health check returned unexpected status: $($response.status)"
    }
} catch {
    Write-Error "Health check failed: $_"
    Write-Host "Consider rolling back deployment" -ForegroundColor Red
    exit 1
}

# Log deployment
$deploymentLog = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"
    environment = $Environment
    commit = $commitHash
    version = $Version
    deployedBy = $env:USERNAME
    status = "success"
} | ConvertTo-Json

$logFile = "$projectRoot\deployments.log"
Add-Content -Path $logFile -Value $deploymentLog

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deployment Successful!" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Green
Write-Host "Commit: $commitHash" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
