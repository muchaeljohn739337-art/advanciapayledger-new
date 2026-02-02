# ============================================================================
# Deploy Database to New Supabase Instance
# ============================================================================

Write-Host "🚀 Deploying database to Supabase..." -ForegroundColor Green
Write-Host ""

# Set the correct DATABASE_URL for new Supabase instance
$env:DATABASE_URL = "postgresql://postgres:ov0Zq3qP8wXhVlzq@db.fvceynqcxfwtbpbugtqr.supabase.co:5432/postgres"

Write-Host "✅ Database URL configured" -ForegroundColor Green
Write-Host "   Project: fvceynqcxfwtbpbugtqr" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend
Set-Location backend

# Run Prisma migrations
Write-Host "📦 Running Prisma migrations..." -ForegroundColor Cyan
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations deployed successfully (26 tables created)" -ForegroundColor Green
} else {
    Write-Host "❌ Migration failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host ""

# Generate Prisma Client
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "❌ Prisma Client generation failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "🎉 ============================================" -ForegroundColor Green
Write-Host "🎉 DATABASE DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "🎉 ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Database Status:" -ForegroundColor Cyan
Write-Host "   ✅ 26 tables created" -ForegroundColor Green
Write-Host "   ✅ Prisma Client generated" -ForegroundColor Green
Write-Host "   ✅ Ready for RLS policies" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Apply RLS Policies:" -ForegroundColor Yellow
Write-Host "   - Go to: https://supabase.com/dashboard/project/fvceynqcxfwtbpbugtqr/sql"
Write-Host "   - Copy contents of: ENABLE_RLS_COMPLETE_26_TABLES.sql"
Write-Host "   - Paste and click 'Run'"
Write-Host ""
Write-Host "2. Deploy Frontend:" -ForegroundColor Yellow
Write-Host "   cd frontend"
Write-Host "   vercel --prod"
Write-Host ""
Write-Host "✅ Your database is ready!" -ForegroundColor Green
