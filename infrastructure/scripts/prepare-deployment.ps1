# Zero Trust Stack - Deployment Preparation Script (PowerShell)
# This script helps you gather the required information for zero-trust deployment

$ErrorActionPreference = "Stop"

Write-Host "Zero Trust Stack - Deployment Preparation" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Blue
Write-Host ""

# Check if Azure CLI is installed
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✓ Azure CLI installed: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "✗ Azure CLI is not installed" -ForegroundColor Red
    Write-Host "Please install it from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    Write-Host "Or run: winget install -e --id Microsoft.AzureCLI" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "✓ Azure Login Successful" -ForegroundColor Green
    Write-Host "  Subscription: $($account.name)" -ForegroundColor Gray
    Write-Host "  Subscription ID: $($account.id)" -ForegroundColor Gray
    Write-Host "  Tenant ID: $($account.tenantId)" -ForegroundColor Gray
    Write-Host ""
    
    $SUBSCRIPTION_ID = $account.id
    $TENANT_ID = $account.tenantId
} catch {
    Write-Host "You need to log in to Azure first" -ForegroundColor Yellow
    Write-Host "Running: az login" -ForegroundColor Cyan
    az login
    
    $account = az account show --output json | ConvertFrom-Json
    $SUBSCRIPTION_ID = $account.id
    $TENANT_ID = $account.tenantId
}

# Gather GitHub information
Write-Host "GitHub Repository Information" -ForegroundColor Blue
Write-Host "----------------------------" -ForegroundColor Blue
$GITHUB_OWNER = Read-Host "GitHub Owner/Organization"
$GITHUB_REPO = Read-Host "GitHub Repository Name (default: advancia-payledger)"
if ([string]::IsNullOrWhiteSpace($GITHUB_REPO)) {
    $GITHUB_REPO = "advancia-payledger"
}
Write-Host ""

# SSH Key
Write-Host "SSH Public Key for VM Access" -ForegroundColor Blue
Write-Host "----------------------------" -ForegroundColor Blue
Write-Host "You need an SSH public key for VM access." -ForegroundColor Gray
Write-Host ""

$sshKeyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"
$sshKeyPathEd25519 = "$env:USERPROFILE\.ssh\id_ed25519.pub"

if (Test-Path $sshKeyPathEd25519) {
    Write-Host "✓ Found existing SSH key: $sshKeyPathEd25519" -ForegroundColor Green
    $useExisting = Read-Host "Use this key? (y/n)"
    if ($useExisting -eq "y") {
        $SSH_PUBLIC_KEY = Get-Content $sshKeyPathEd25519 -Raw
        $SSH_PUBLIC_KEY = $SSH_PUBLIC_KEY.Trim()
    } else {
        $SSH_PUBLIC_KEY = Read-Host "Enter your SSH public key"
    }
} elseif (Test-Path $sshKeyPath) {
    Write-Host "✓ Found existing SSH key: $sshKeyPath" -ForegroundColor Green
    $useExisting = Read-Host "Use this key? (y/n)"
    if ($useExisting -eq "y") {
        $SSH_PUBLIC_KEY = Get-Content $sshKeyPath -Raw
        $SSH_PUBLIC_KEY = $SSH_PUBLIC_KEY.Trim()
    } else {
        $SSH_PUBLIC_KEY = Read-Host "Enter your SSH public key"
    }
} else {
    Write-Host "No SSH key found. Generating new key..." -ForegroundColor Yellow
    
    # Ensure .ssh directory exists
    $sshDir = "$env:USERPROFILE\.ssh"
    if (-not (Test-Path $sshDir)) {
        New-Item -ItemType Directory -Path $sshDir | Out-Null
    }
    
    # Generate SSH key
    $keyPath = "$sshDir\azure_vm_key"
    ssh-keygen -t ed25519 -C "azure-vm-access" -f $keyPath -N '""'
    
    $SSH_PUBLIC_KEY = Get-Content "$keyPath.pub" -Raw
    $SSH_PUBLIC_KEY = $SSH_PUBLIC_KEY.Trim()
    Write-Host "✓ New SSH key generated: $keyPath" -ForegroundColor Green
}
Write-Host ""

# Developer access
Write-Host "Developer Access (Optional)" -ForegroundColor Blue
Write-Host "----------------------------" -ForegroundColor Blue
Write-Host "Enter developer email addresses (Azure AD users) for Key Vault access." -ForegroundColor Gray
Write-Host "Press Enter without input when done." -ForegroundColor Gray
$DEVELOPERS = @()
while ($true) {
    $devEmail = Read-Host "Developer email (or Enter to skip)"
    if ([string]::IsNullOrWhiteSpace($devEmail)) {
        break
    }
    $DEVELOPERS += $devEmail
}
Write-Host ""

# Alert configuration
Write-Host "Alert Configuration (Optional)" -ForegroundColor Blue
Write-Host "----------------------------" -ForegroundColor Blue
$ALERT_EMAIL = Read-Host "Alert email address (or Enter to skip)"
$TEAMS_WEBHOOK = Read-Host "Teams webhook URL (or Enter to skip)"
Write-Host ""

# Environment selection
Write-Host "Environment Configuration" -ForegroundColor Blue
Write-Host "----------------------------" -ForegroundColor Blue
$ENVIRONMENT = Read-Host "Environment name (default: prod)"
if ([string]::IsNullOrWhiteSpace($ENVIRONMENT)) {
    $ENVIRONMENT = "prod"
}

$LOCATION = Read-Host "Azure region (default: eastus)"
if ([string]::IsNullOrWhiteSpace($LOCATION)) {
    $LOCATION = "eastus"
}
Write-Host ""

# Generate deployment command
Write-Host "=== Deployment Command ===" -ForegroundColor Green
Write-Host ""

$deployCmd = @"
# PowerShell Deployment Command
`$env:GITHUB_OWNER = "$GITHUB_OWNER"
`$env:GITHUB_REPO = "$GITHUB_REPO"
`$env:ADMIN_SSH_KEY = "$SSH_PUBLIC_KEY"
`$env:ENVIRONMENT = "$ENVIRONMENT"
`$env:LOCATION = "$LOCATION"
"@

if ($DEVELOPERS.Count -gt 0) {
    $devList = $DEVELOPERS -join ","
    $deployCmd += "`n`$env:DEVELOPERS = `"$devList`""
}

if (-not [string]::IsNullOrWhiteSpace($ALERT_EMAIL)) {
    $deployCmd += "`n`$env:ALERT_EMAIL = `"$ALERT_EMAIL`""
}

if (-not [string]::IsNullOrWhiteSpace($TEAMS_WEBHOOK)) {
    $deployCmd += "`n`$env:TEAMS_WEBHOOK = `"$TEAMS_WEBHOOK`""
}

$deployCmd += @"

# Deploy using Azure CLI
az deployment sub create \
  --location `$env:LOCATION \
  --template-file infrastructure/azure/main.bicep \
  --parameters environment=`$env:ENVIRONMENT \
  --parameters githubOwner=`$env:GITHUB_OWNER \
  --parameters githubRepo=`$env:GITHUB_REPO \
  --parameters adminSshPublicKey=`$env:ADMIN_SSH_KEY
"@

Write-Host $deployCmd -ForegroundColor Cyan
Write-Host ""

# Save to file
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$deployFile = "deploy-command-$timestamp.ps1"
$deployCmd | Out-File -FilePath $deployFile -Encoding UTF8

Write-Host "✓ Deployment command saved to: $deployFile" -ForegroundColor Green
Write-Host ""

# GitHub OIDC setup reminder
Write-Host "⚠️  Important: GitHub OIDC Setup Required" -ForegroundColor Yellow
Write-Host "Before deployment, you need to set up GitHub OIDC authentication." -ForegroundColor Gray
Write-Host ""
Write-Host "Run these commands to create the Azure AD application:" -ForegroundColor Gray
Write-Host ""

$oidcSetup = @"
# Create Azure AD application for GitHub OIDC
`$APP_NAME = "github-oidc-advancia-$ENVIRONMENT"
`$APP_ID = az ad app create --display-name `$APP_NAME --query appId -o tsv

# Create service principal
az ad sp create --id `$APP_ID

# Add federated credential for GitHub
az ad app federated-credential create \
  --id `$APP_ID \
  --parameters '{\"name\":\"github-deploy\",\"issuer\":\"https://token.actions.githubusercontent.com\",\"subject\":\"repo:$GITHUB_OWNER/${GITHUB_REPO}:ref:refs/heads/main\",\"audiences\":[\"api://AzureADTokenExchange\"]}'

# Assign Contributor role
az role assignment create \
  --assignee `$APP_ID \
  --role Contributor \
  --scope "/subscriptions/$SUBSCRIPTION_ID"

# Display values for GitHub secrets
Write-Host "Add these secrets to your GitHub repository:" -ForegroundColor Yellow
Write-Host "AZURE_CLIENT_ID: `$APP_ID"
Write-Host "AZURE_TENANT_ID: $TENANT_ID"
Write-Host "AZURE_SUBSCRIPTION_ID: $SUBSCRIPTION_ID"
"@

Write-Host $oidcSetup -ForegroundColor Cyan
Write-Host ""

# Save OIDC setup script
$oidcFile = "setup-github-oidc-$timestamp.ps1"
$oidcSetup | Out-File -FilePath $oidcFile -Encoding UTF8
Write-Host "✓ OIDC setup script saved to: $oidcFile" -ForegroundColor Green
Write-Host ""

# Confirmation
Write-Host "Ready to deploy?" -ForegroundColor Yellow
$runNow = Read-Host "Run OIDC setup now? (y/n)"

if ($runNow -eq "y") {
    Write-Host ""
    Write-Host "Setting up GitHub OIDC..." -ForegroundColor Green
    & $oidcFile
} else {
    Write-Host ""
    Write-Host "Setup scripts saved. Run them when ready:" -ForegroundColor Yellow
    Write-Host "  1. First: .\$oidcFile" -ForegroundColor Cyan
    Write-Host "  2. Then: .\$deployFile" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Blue
Write-Host "1. Run the OIDC setup script to configure GitHub authentication" -ForegroundColor Gray
Write-Host "2. Add the GitHub secrets to your repository" -ForegroundColor Gray
Write-Host "3. Run the deployment script to create the infrastructure" -ForegroundColor Gray
Write-Host "4. Review DEPLOYMENT_QUICKSTART.md for detailed instructions" -ForegroundColor Gray
