# ============================================================================
# Quick Deploy Script - Push to GitHub & Deploy to Vercel
# ============================================================================

Write-Host "🚀 Starting deployment process..." -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 1: Git Status Check
# ============================================================================

Write-Host "📋 Step 1: Checking git status..." -ForegroundColor Cyan
git status

Write-Host ""
$continue = Read-Host "Continue with commit and push? (y/n)"
if ($continue -ne "y") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 0
}

# ============================================================================
# STEP 2: Add All Changes
# ============================================================================

Write-Host ""
Write-Host "📦 Step 2: Adding all changes..." -ForegroundColor Cyan
git add .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes added" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to add changes" -ForegroundColor Red
    exit 1
}

# ============================================================================
# STEP 3: Commit Changes
# ============================================================================

Write-Host ""
Write-Host "💾 Step 3: Committing changes..." -ForegroundColor Cyan

$commitMessage = @"
feat: Configure new Supabase instance and add security features

- Add new Supabase credentials (fvceynqcxfwtbpbugtqr)
- Configure backend environment with database URL and keys
- Configure frontend environment with Supabase URL and anon key
- Add complete RLS policies for 26 tables
- Add security implementation (Redis locks, idempotency, wallet service)
- Add deployment guides for AWS and Vercel
- Add automated deployment scripts
"@

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "⚠️  No changes to commit or commit failed" -ForegroundColor Yellow
}

# ============================================================================
# STEP 4: Push to GitHub
# ============================================================================

Write-Host ""
Write-Host "🌐 Step 4: Pushing to GitHub..." -ForegroundColor Cyan

$branch = git branch --show-current
Write-Host "Pushing to branch: $branch" -ForegroundColor Yellow

git push origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Pushed to GitHub successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    Write-Host "Check your git remote and credentials" -ForegroundColor Yellow
    exit 1
}

# ============================================================================
# STEP 5: Deploy Frontend to Vercel
# ============================================================================

Write-Host ""
Write-Host "🚀 Step 5: Deploying frontend to Vercel..." -ForegroundColor Cyan

Set-Location frontend

# Check if vercel is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Deploy to Vercel
Write-Host "Deploying to production..." -ForegroundColor Yellow
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend deployed to Vercel" -ForegroundColor Green
} else {
    Write-Host "❌ Vercel deployment failed" -ForegroundColor Red
    Write-Host "You may need to run 'vercel login' first" -ForegroundColor Yellow
    Set-Location ..
    exit 1
}

Set-Location ..

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================

Write-Host ""
Write-Host "🎉 ============================================" -ForegroundColor Green
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "🎉 ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Code pushed to GitHub" -ForegroundColor Green
Write-Host "✅ Frontend deployed to Vercel" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Go to Vercel Dashboard → Settings → Environment Variables"
Write-Host "2. Add the following variables:"
Write-Host "   - NEXT_PUBLIC_SUPABASE_URL=https://fvceynqcxfwtbpbugtqr.supabase.co"
Write-Host "   - NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your anon key]"
Write-Host "   - NEXT_PUBLIC_API_URL=[Your backend URL]"
Write-Host "3. Redeploy: vercel --prod"
Write-Host ""
Write-Host "4. Apply RLS policies in Supabase:"
Write-Host "   - Go to: https://supabase.com/dashboard/project/fvceynqcxfwtbpbugtqr/sql"
Write-Host "   - Copy ENABLE_RLS_COMPLETE_26_TABLES.sql"
Write-Host "   - Paste and Run"
Write-Host ""
Write-Host "5. Run database migrations:"
Write-Host "   cd backend"
Write-Host "   npx prisma migrate deploy"
Write-Host ""
Write-Host "📊 Check deployment status:" -ForegroundColor Cyan
Write-Host "- GitHub Actions: https://github.com/your-repo/actions"
Write-Host "- Vercel Dashboard: https://vercel.com/dashboard"
Write-Host ""
Write-Host "✅ Your app is deploying! Check the URLs above." -ForegroundColor Green
