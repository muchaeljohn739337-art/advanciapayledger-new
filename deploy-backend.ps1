# Advancia PayLedger - Backend Deployment Script (Windows/PowerShell)
# Target: DigitalOcean Server 147.182.193.11

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Advancia PayLedger Backend Deployment..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Configuration
$SERVER_IP = "147.182.193.11"
$SERVER_USER = "root"
$APP_DIR = "/var/www/advancia-payledger"
$BACKEND_DIR = "$APP_DIR/backend"

Write-Host ""
Write-Host "📦 Step 1: Building Backend Locally..." -ForegroundColor Cyan
Set-Location backend

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Build TypeScript
Write-Host "Building TypeScript..." -ForegroundColor Yellow
npm run build

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "✅ Local build complete!" -ForegroundColor Green

Write-Host ""
Write-Host "📤 Step 2: Deploying to Server..." -ForegroundColor Cyan

# Note: You'll need to use SCP or WinSCP for file transfer on Windows
Write-Host "⚠️  Manual Step Required:" -ForegroundColor Yellow
Write-Host "Please use one of these methods to copy files to server:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1 - Using SCP (if available):" -ForegroundColor White
Write-Host "  scp -r dist package.json package-lock.json prisma ${SERVER_USER}@${SERVER_IP}:${BACKEND_DIR}/" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2 - Using WinSCP:" -ForegroundColor White
Write-Host "  1. Open WinSCP" -ForegroundColor Gray
Write-Host "  2. Connect to $SERVER_IP as $SERVER_USER" -ForegroundColor Gray
Write-Host "  3. Navigate to $BACKEND_DIR" -ForegroundColor Gray
Write-Host "  4. Upload: dist/, package.json, package-lock.json, prisma/" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 3 - Using Git:" -ForegroundColor White
Write-Host "  git push origin main" -ForegroundColor Gray
Write-Host "  ssh ${SERVER_USER}@${SERVER_IP} 'cd ${BACKEND_DIR} && git pull'" -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Have you copied the files to the server? (y/n)"
if ($continue -ne "y") {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Step 3: Setting Up on Server..." -ForegroundColor Cyan

# SSH commands to run on server
$sshCommands = @"
cd $BACKEND_DIR
echo 'Installing production dependencies...'
npm install --production
echo 'Running database migrations...'
npx prisma migrate deploy
echo 'Stopping existing PM2 process...'
pm2 stop advancia-backend || true
pm2 delete advancia-backend || true
echo 'Starting backend with PM2...'
pm2 start dist/index.js --name advancia-backend --time --log /var/log/advancia-backend.log --error /var/log/advancia-backend-error.log
echo 'Saving PM2 configuration...'
pm2 save
pm2 startup
echo '✅ Backend deployed and running!'
echo ''
echo '📊 Current Status:'
pm2 status
pm2 logs advancia-backend --lines 20
"@

Write-Host "Executing deployment commands on server..." -ForegroundColor Yellow
ssh "${SERVER_USER}@${SERVER_IP}" $sshCommands

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend is now running on: http://${SERVER_IP}:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  - Check status: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 status'" -ForegroundColor Gray
Write-Host "  - View logs: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs advancia-backend'" -ForegroundColor Gray
Write-Host "  - Restart: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 restart advancia-backend'" -ForegroundColor Gray
Write-Host ""
