# Setup Environment Variables Script
# This script helps configure your environment variables

Write-Host "🔧 Advancia PayLedger - Environment Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Your Supabase credentials
$SUPABASE_URL = "https://jwabwrcykdtpwdhwhmqq.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YWJ3cmN5a2R0cHdkaHdobXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTI3NTQsImV4cCI6MjA4NTEyODc1NH0.wk7Ok5i8O4eigd7iYhb-LwR48-B9QpKuRPi5GZfGWwk"
$DATABASE_URL = "postgresql://postgres.jwabwrcykdtpwdhwhmqq:Good_mother1!?@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"

Write-Host "`n1. Creating .env file in root..." -ForegroundColor Yellow

$envContent = @"
# Database Configuration (Supabase)
DATABASE_URL=$DATABASE_URL
POSTGRES_PASSWORD=Good_mother1!?

# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_feavCnnLOlbVTiU0jkQrIg_GpIBiqYd
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# JWT Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-change-this-now
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-change-now

# Encryption Configuration (CHANGE THIS IN PRODUCTION!)
ENCRYPTION_KEY=your-64-hex-character-encryption-key-here-1234567890abcdef-change

# Redis Configuration
REDIS_URL=redis://:redis123@localhost:6379
REDIS_PASSWORD=redis123

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
"@

Set-Content -Path ".env" -Value $envContent
Write-Host "✅ Created .env file" -ForegroundColor Green

Write-Host "`n2. Creating frontend .env.local..." -ForegroundColor Yellow

$frontendEnvContent = @"
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
"@

Set-Content -Path "frontend\.env.local" -Value $frontendEnvContent
Write-Host "✅ Created frontend/.env.local" -ForegroundColor Green

Write-Host "`n3. Creating backend .env..." -ForegroundColor Yellow

$backendEnvContent = @"
DATABASE_URL=$DATABASE_URL
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_feavCnnLOlbVTiU0jkQrIg_GpIBiqYd
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-change-this-now
ENCRYPTION_KEY=your-64-hex-character-encryption-key-here-1234567890abcdef-change
PORT=3001
FRONTEND_URL=http://localhost:3000
"@

Set-Content -Path "backend\.env" -Value $backendEnvContent
Write-Host "✅ Created backend/.env" -ForegroundColor Green

Write-Host "`n4. Setting up Vercel environment variables..." -ForegroundColor Yellow
Write-Host "Run these commands to add variables to Vercel:" -ForegroundColor Cyan

Write-Host "`ncd frontend" -ForegroundColor White
Write-Host "vercel env add NEXT_PUBLIC_API_URL" -ForegroundColor White
Write-Host "  (Enter your backend URL when deployed)" -ForegroundColor Gray
Write-Host "vercel env add NEXT_PUBLIC_SUPABASE_URL production" -ForegroundColor White
Write-Host "  (Paste: $SUPABASE_URL)" -ForegroundColor Gray
Write-Host "vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production" -ForegroundColor White
Write-Host "  (Paste the anon key)" -ForegroundColor Gray

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "✅ Environment setup complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host "`nNext steps:"
Write-Host "1. Review and update JWT_SECRET and ENCRYPTION_KEY in .env files"
Write-Host "2. Install dependencies: npm install (in backend and frontend)"
Write-Host "3. Run migrations: cd backend && npx prisma migrate dev"
Write-Host "4. Start development: docker-compose up"
Write-Host "5. Deploy frontend: cd frontend && npx vercel --prod"
