# Application Deployment Script for Azure
# This script deploys the containerized application to Azure infrastructure

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "prod",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$BackendImageTag = "latest",
    
    [Parameter(Mandatory=$false)]
    [string]$FrontendImageTag = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Application Deployment to Azure ===" -ForegroundColor Blue
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Location: $Location" -ForegroundColor Cyan
Write-Host ""

# Check if logged in to Azure
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "✓ Logged in as: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ Not logged in to Azure. Please run 'az login'" -ForegroundColor Red
    exit 1
}

# Step 1: Build and push Docker images
Write-Host ""
Write-Host "Step 1: Building and pushing Docker images..." -ForegroundColor Yellow

# Get ACR name
$acrName = az acr list --resource-group $ResourceGroup --query "[0].name" -o tsv
if ([string]::IsNullOrEmpty($acrName)) {
    Write-Host "✗ No Azure Container Registry found in resource group" -ForegroundColor Red
    exit 1
}

Write-Host "Using ACR: $acrName" -ForegroundColor Cyan

# Login to ACR
az acr login --name $acrName

# Build and push backend
Write-Host "Building backend image..." -ForegroundColor Cyan
docker build -t "${acrName}.azurecr.io/advancia-backend:${BackendImageTag}" ./backend
docker push "${acrName}.azurecr.io/advancia-backend:${BackendImageTag}"
Write-Host "✓ Backend image pushed" -ForegroundColor Green

# Build and push frontend
Write-Host "Building frontend image..." -ForegroundColor Cyan
docker build -t "${acrName}.azurecr.io/advancia-frontend:${FrontendImageTag}" ./frontend
docker push "${acrName}.azurecr.io/advancia-frontend:${FrontendImageTag}"
Write-Host "✓ Frontend image pushed" -ForegroundColor Green

# Step 2: Deploy database
Write-Host ""
Write-Host "Step 2: Deploying PostgreSQL database..." -ForegroundColor Yellow

$dbPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

$dbDeployment = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file infrastructure/azure/database-setup.bicep `
    --parameters environment=$Environment `
    --parameters administratorPassword=$dbPassword `
    --query properties.outputs -o json | ConvertFrom-Json

Write-Host "✓ Database deployed: $($dbDeployment.serverName.value)" -ForegroundColor Green

# Step 3: Deploy Redis
Write-Host ""
Write-Host "Step 3: Deploying Redis cache..." -ForegroundColor Yellow

$redisDeployment = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file infrastructure/azure/redis-setup.bicep `
    --parameters environment=$Environment `
    --query properties.outputs -o json | ConvertFrom-Json

Write-Host "✓ Redis deployed: $($redisDeployment.redisCacheName.value)" -ForegroundColor Green

# Step 4: Run database migrations
Write-Host ""
Write-Host "Step 4: Running database migrations..." -ForegroundColor Yellow

# Get database connection string from Key Vault
$kvName = az keyvault list --resource-group $ResourceGroup --query "[0].name" -o tsv
$dbConnectionString = az keyvault secret show --vault-name $kvName --name database-connection-string --query value -o tsv

# Set environment variable and run migrations
$env:DATABASE_URL = $dbConnectionString
Push-Location backend
npx prisma migrate deploy
Pop-Location

Write-Host "✓ Database migrations completed" -ForegroundColor Green

# Step 5: Deploy application containers
Write-Host ""
Write-Host "Step 5: Deploying application containers..." -ForegroundColor Yellow

# Get VM identity ID
$vmIdentityId = az identity list --resource-group $ResourceGroup --query "[?contains(name, 'vm')].id | [0]" -o tsv

$appDeployment = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file infrastructure/azure/app-deployment.bicep `
    --parameters environment=$Environment `
    --parameters containerRegistryName=$acrName `
    --parameters backendImageTag=$BackendImageTag `
    --parameters frontendImageTag=$FrontendImageTag `
    --parameters vmIdentityId=$vmIdentityId `
    --query properties.outputs -o json | ConvertFrom-Json

Write-Host "✓ Application containers deployed" -ForegroundColor Green
Write-Host "  Backend URL: https://$($appDeployment.backendAppFqdn.value)" -ForegroundColor Cyan
Write-Host "  Frontend URL: https://$($appDeployment.frontendAppFqdn.value)" -ForegroundColor Cyan

# Step 6: Health checks
Write-Host ""
Write-Host "Step 6: Running health checks..." -ForegroundColor Yellow

Start-Sleep -Seconds 30

try {
    $backendHealth = Invoke-RestMethod -Uri "https://$($appDeployment.backendAppFqdn.value)/health" -Method Get
    Write-Host "✓ Backend health check passed" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend health check failed" -ForegroundColor Red
}

try {
    $frontendHealth = Invoke-RestMethod -Uri "https://$($appDeployment.frontendAppFqdn.value)" -Method Get
    Write-Host "✓ Frontend health check passed" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend health check failed" -ForegroundColor Red
}

# Step 7: Update NGINX configuration
Write-Host ""
Write-Host "Step 7: Updating NGINX gateway configuration..." -ForegroundColor Yellow

$gatewayVmName = az vm list --resource-group $ResourceGroup --query "[?contains(name, 'gateway')].name | [0]" -o tsv

if (-not [string]::IsNullOrEmpty($gatewayVmName)) {
    # Create NGINX config update script
    $nginxConfig = @"
upstream backend_servers {
    server $($appDeployment.backendAppFqdn.value):443;
}

upstream frontend_servers {
    server $($appDeployment.frontendAppFqdn.value):443;
}
"@

    # Upload and apply configuration
    Write-Host "Updating NGINX configuration on $gatewayVmName..." -ForegroundColor Cyan
    
    # This would require SSH access - for now just output the config
    Write-Host "✓ NGINX configuration prepared" -ForegroundColor Green
    Write-Host "  Manual step: Update NGINX upstream configuration with above servers" -ForegroundColor Yellow
} else {
    Write-Host "⚠ No gateway VM found - skipping NGINX update" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Resources Deployed:" -ForegroundColor Cyan
Write-Host "  Database: $($dbDeployment.serverName.value)" -ForegroundColor White
Write-Host "  Redis: $($redisDeployment.redisCacheName.value)" -ForegroundColor White
Write-Host "  Backend: $($appDeployment.backendAppFqdn.value)" -ForegroundColor White
Write-Host "  Frontend: $($appDeployment.frontendAppFqdn.value)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure DNS to point to gateway public IP" -ForegroundColor White
Write-Host "2. Update NGINX configuration with backend/frontend URLs" -ForegroundColor White
Write-Host "3. Configure SSL certificates (Let's Encrypt)" -ForegroundColor White
Write-Host "4. Test application end-to-end" -ForegroundColor White
Write-Host "5. Monitor logs and metrics in Azure Portal" -ForegroundColor White
Write-Host ""

# Save deployment info
$deploymentInfo = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    resourceGroup = $ResourceGroup
    environment = $Environment
    database = @{
        server = $dbDeployment.serverName.value
        name = $dbDeployment.databaseName.value
    }
    redis = @{
        name = $redisDeployment.redisCacheName.value
        host = $redisDeployment.redisHostName.value
    }
    backend = @{
        url = "https://$($appDeployment.backendAppFqdn.value)"
        image = "${acrName}.azurecr.io/advancia-backend:${BackendImageTag}"
    }
    frontend = @{
        url = "https://$($appDeployment.frontendAppFqdn.value)"
        image = "${acrName}.azurecr.io/advancia-frontend:${FrontendImageTag}"
    }
}

$deploymentInfo | ConvertTo-Json -Depth 10 | Out-File "deployment-info-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
Write-Host "✓ Deployment info saved to deployment-info-*.json" -ForegroundColor Green
