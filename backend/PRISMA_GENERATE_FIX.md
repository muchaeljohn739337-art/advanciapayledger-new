# Prisma Generate - Windows Permission Fix

## Issue
Windows file lock preventing Prisma client generation during deployment.

## Quick Solutions

### Option 1: Close All Terminals & Retry (Recommended)
```powershell
# Close ALL PowerShell/CMD windows
# Open a NEW PowerShell window
cd C:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\backend
npx prisma generate
```

### Option 2: Kill Node Processes
```powershell
# Stop all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Then generate
npx prisma generate
```

### Option 3: Manual Cleanup
```powershell
# Remove the locked folder
Remove-Item -Recurse -Force C:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\node_modules\.prisma

# Regenerate
cd C:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\backend
npx prisma generate
```

### Option 4: Use WSL (If Available)
```bash
# In WSL terminal
cd /mnt/c/Users/mucha.DESKTOP-H7T9NPM/Downloads/productution/backend
npx prisma generate
```

### Option 5: Restart Computer
If all else fails, restart your computer to release all file locks, then:
```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\backend
npx prisma generate
```

## For Production Deployment

Since you're deploying to production, you have two options:

### Option A: Deploy Without Local Generate
The deployment platform (Vercel/DigitalOcean) will run `npx prisma generate` automatically during build.

**For Vercel (Frontend):**
- Already deployed ✅
- No Prisma needed on frontend

**For DigitalOcean (Backend):**
```yaml
# In .do/app.yaml or build command
build_command: npm install && npx prisma generate && npm run build
```

### Option B: Generate on Deployment Server
Skip local generation and let the production server handle it:

1. **Push your code to Git**
2. **Deploy to DigitalOcean**
3. **Prisma generates automatically during build**

## Deployment Commands

### Backend to DigitalOcean App Platform

**Using doctl CLI:**
```bash
# Install doctl if needed
# https://docs.digitalocean.com/reference/doctl/how-to/install/

# Deploy
doctl apps create --spec .do/app.yaml
```

**Using Git Deploy:**
```bash
# Connect your GitHub repo to DigitalOcean App Platform
# It will auto-deploy on push
git add .
git commit -m "Deploy backend with booking and admin systems"
git push origin main
```

**Manual Deploy via Dashboard:**
1. Go to https://cloud.digitalocean.com/apps
2. Create New App
3. Connect your GitHub repository
4. Select `backend` folder as source
5. Set build command: `npm install && npx prisma generate && npm run build`
6. Set run command: `npm start`
7. Add environment variables from `.env`
8. Deploy!

## Environment Variables for Production

Make sure these are set in DigitalOcean:

```bash
DATABASE_URL="postgresql://postgres.jwabwrcykdtpwdhwhmqq:F3vR2UQT49NK8ifI@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="your-production-secret"
JWT_REFRESH_SECRET="your-production-refresh-secret"
REDIS_URL="your-redis-url"
FRONTEND_URL="https://your-vercel-app.vercel.app"
NODE_ENV="production"
```

## Verify Deployment

### Frontend (Vercel)
```bash
# Check deployment status
vercel ls

# Your app should be live at:
# https://your-app.vercel.app
```

### Backend (DigitalOcean)
```bash
# Once deployed, test health endpoint
curl https://your-backend-url.ondigitalocean.app/health

# Test API
curl https://your-backend-url.ondigitalocean.app/api/chambers
```

## Summary

**For Local Development:**
- Close all terminals and retry `npx prisma generate`

**For Production:**
- Frontend already deployed to Vercel ✅
- Backend: Let DigitalOcean run `npx prisma generate` during build
- No need to generate locally for production deployment

## Next Steps

1. ✅ Frontend deployed to Vercel
2. ⏳ Deploy backend to DigitalOcean
3. ⏳ Configure environment variables
4. ⏳ Test production endpoints
5. ⏳ Update frontend API URLs to production backend

---

**The file lock issue won't affect production deployment - the build servers will generate Prisma client automatically!**
