# Advancia PayLedger - Complete Deployment Script (PowerShell)
# This script deploys the entire application stack

$ErrorActionPreference = "Stop"

Write-Host "🚀 Advancia PayLedger Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if required tools are installed
function Test-Dependencies {
    Write-Host "`nChecking dependencies..." -ForegroundColor Yellow
    
    $dependencies = @{
        "doctl" = "https://docs.digitalocean.com/reference/doctl/how-to/install/"
        "vercel" = "npm i -g vercel"
        "npm" = "https://nodejs.org/"
    }
    
    foreach ($cmd in $dependencies.Keys) {
        if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
            Write-Host "❌ $cmd not found. Install from: $($dependencies[$cmd])" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "✅ All dependencies found" -ForegroundColor Green
}

# Verify environment variables
function Test-EnvVars {
    Write-Host "`nChecking environment variables..." -ForegroundColor Yellow
    
    if (-not (Test-Path ".env")) {
        Write-Host "❌ .env file not found. Copy from .env.example and configure." -ForegroundColor Red
        exit 1
    }
    
    # Load .env file
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    
    # Check critical variables
    $requiredVars = @(
        "DATABASE_URL",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "DO_SPACES_KEY",
        "DO_SPACES_SECRET"
    )
    
    foreach ($var in $requiredVars) {
        if (-not [Environment]::GetEnvironmentVariable($var)) {
            Write-Host "❌ Missing required variable: $var" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "✅ Environment variables configured" -ForegroundColor Green
}

# Deploy backend to Digital Ocean
function Deploy-Backend {
    Write-Host "`nDeploying backend to Digital Ocean..." -ForegroundColor Yellow
    
    Push-Location backend
    
    try {
        # Install dependencies
        Write-Host "Installing backend dependencies..."
        npm install
        
        # Build
        Write-Host "Building backend..."
        npm run build
        
        # Deploy to Digital Ocean App Platform
        Write-Host "Deploying to Digital Ocean..."
        $doAppId = [Environment]::GetEnvironmentVariable("DO_APP_ID")
        
        if ([string]::IsNullOrEmpty($doAppId)) {
            Write-Host "Creating new app..."
            doctl apps create --spec ../.do/app.yaml
        } else {
            Write-Host "Updating existing app: $doAppId"
            doctl apps update $doAppId --spec ../.do/app.yaml
        }
        
        Write-Host "✅ Backend deployed" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

# Run database migrations
function Invoke-Migrations {
    Write-Host "`nRunning database migrations..." -ForegroundColor Yellow
    
    Push-Location backend
    
    try {
        # Generate Prisma client
        Write-Host "Generating Prisma client..."
        npx prisma generate
        
        # Run migrations
        Write-Host "Running migrations..."
        npx prisma migrate deploy
        
        Write-Host "✅ Migrations completed" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

# Deploy frontend to Vercel
function Deploy-Frontend {
    Write-Host "`nDeploying frontend to Vercel..." -ForegroundColor Yellow
    
    Push-Location frontend
    
    try {
        # Install dependencies
        Write-Host "Installing frontend dependencies..."
        npm install
        
        # Build
        Write-Host "Building frontend..."
        npm run build
        
        # Deploy to Vercel
        Write-Host "Deploying to Vercel..."
        vercel --prod --yes
        
        Write-Host "✅ Frontend deployed" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

# Verify deployments
function Test-Deployments {
    Write-Host "`nVerifying deployments..." -ForegroundColor Yellow
    
    # Get backend URL
    $backendUrl = [Environment]::GetEnvironmentVariable("BACKEND_URL")
    if ($backendUrl) {
        Write-Host "Testing backend health endpoint..."
        try {
            $response = Invoke-WebRequest -Uri "$backendUrl/health" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Backend is healthy" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "❌ Backend health check failed" -ForegroundColor Red
        }
    }
    
    # Get frontend URL
    $frontendUrl = [Environment]::GetEnvironmentVariable("FRONTEND_URL")
    if ($frontendUrl) {
        Write-Host "Testing frontend..."
        try {
            $response = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Frontend is accessible" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "❌ Frontend check failed" -ForegroundColor Red
        }
    }
}

# Main deployment flow
function Main {
    Write-Host "`nStarting deployment process..." -ForegroundColor Yellow
    
    # Ask for confirmation
    $confirmation = Read-Host "Deploy to production? (y/n)"
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-Host "Deployment cancelled."
        exit 0
    }
    
    Test-Dependencies
    Test-EnvVars
    
    # Deploy components
    Deploy-Backend
    Invoke-Migrations
    Deploy-Frontend
    Test-Deployments
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nNext steps:"
    Write-Host "1. Verify your application at: $($env:FRONTEND_URL)"
    Write-Host "2. Check backend API at: $($env:BACKEND_URL)"
    Write-Host "3. Monitor logs in Vercel and Digital Ocean dashboards"
    Write-Host "4. Set up custom domains if needed"
}

# Run main function
Main
