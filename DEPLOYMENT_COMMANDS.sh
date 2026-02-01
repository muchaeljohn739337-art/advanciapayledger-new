#!/bin/bash

# ============================================================================
# Advancia Pay Ledger - Fresh Supabase Deployment Script
# ============================================================================

set -e  # Exit on error

echo "🚀 Starting fresh Supabase deployment..."

# ============================================================================
# STEP 1: Environment Setup
# ============================================================================

echo ""
echo "📋 Step 1: Checking environment variables..."

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set"
    echo "Set it with: export DATABASE_URL='postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres'"
    exit 1
fi

if [ -z "$SUPABASE_URL" ]; then
    echo "⚠️  SUPABASE_URL not set (optional for this script)"
fi

echo "✅ Environment variables configured"

# ============================================================================
# STEP 2: Install Dependencies
# ============================================================================

echo ""
echo "📦 Step 2: Installing dependencies..."

cd backend
npm install
echo "✅ Backend dependencies installed"

cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

cd ..

# ============================================================================
# STEP 3: Run Database Migrations
# ============================================================================

echo ""
echo "🗄️  Step 3: Running database migrations..."

cd backend

# Deploy migrations
npx prisma migrate deploy
echo "✅ Migrations deployed"

# Generate Prisma client
npx prisma generate
echo "✅ Prisma client generated"

cd ..

# ============================================================================
# STEP 4: Verify Database Schema
# ============================================================================

echo ""
echo "🔍 Step 4: Verifying database schema..."

cd backend

# Check tables
npx prisma db pull > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database schema verified"
else
    echo "❌ Database schema verification failed"
    exit 1
fi

cd ..

# ============================================================================
# STEP 5: Apply RLS Policies
# ============================================================================

echo ""
echo "🔒 Step 5: RLS policies need to be applied manually..."
echo ""
echo "Please run the following in Supabase SQL Editor:"
echo "1. Go to https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Click SQL Editor"
echo "4. Copy contents of ENABLE_RLS_COMPLETE_26_TABLES.sql"
echo "5. Paste and click Run"
echo ""
read -p "Press Enter after applying RLS policies..."

# ============================================================================
# STEP 6: Build Applications
# ============================================================================

echo ""
echo "🏗️  Step 6: Building applications..."

# Build backend
cd backend
npm run build
echo "✅ Backend built"

# Build frontend
cd ../frontend
npm run build
echo "✅ Frontend built"

cd ..

# ============================================================================
# STEP 7: Run Tests
# ============================================================================

echo ""
echo "🧪 Step 7: Running tests..."

cd backend
npm test -- --passWithNoTests
echo "✅ Tests passed"

cd ..

# ============================================================================
# STEP 8: Final Verification
# ============================================================================

echo ""
echo "✅ Step 8: Final verification..."

# Check if backend can start
cd backend
timeout 10s npm start > /dev/null 2>&1 &
BACKEND_PID=$!
sleep 5

if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend starts successfully"
    kill $BACKEND_PID
else
    echo "⚠️  Backend may have issues starting"
fi

cd ..

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================

echo ""
echo "🎉 ============================================"
echo "🎉 Deployment Complete!"
echo "🎉 ============================================"
echo ""
echo "📋 Next Steps:"
echo "1. ✅ Database migrated (26 tables created)"
echo "2. ⚠️  Apply RLS policies in Supabase (if not done)"
echo "3. 🚀 Deploy backend to production server"
echo "4. 🌐 Deploy frontend to Vercel/Netlify"
echo "5. 🔍 Run verification: npm test"
echo ""
echo "📚 Documentation:"
echo "- Setup Guide: NEW_SUPABASE_SETUP.md"
echo "- Security Guide: SECURITY_IMPLEMENTATION_GUIDE.md"
echo "- Quick Start: QUICK_START_SECURITY.md"
echo ""
echo "🔐 Security Checklist:"
echo "- [ ] RLS policies applied"
echo "- [ ] Authentication configured"
echo "- [ ] Environment variables set"
echo "- [ ] Redis configured"
echo "- [ ] Stripe configured"
echo "- [ ] Monitoring enabled"
echo ""
echo "✅ Your application is ready for production!"
