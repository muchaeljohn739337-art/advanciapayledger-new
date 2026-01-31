# Fix Vercel Build Issue

## Problem

Vercel is building from the **root directory** and trying to build the backend instead of the frontend.

The logs show:
```
> @advancia/payledger-backend@1.0.0 build
> tsc
```

This means it's using the backend's package.json.

## Solution: Update Vercel Project Settings

### Go to Project Settings

1. Open: https://vercel.com/advanciapayledger/frontend-clean/settings
2. Click on **"General"** in the left sidebar

### Update Root Directory

Look for **"Root Directory"** setting and change it to:
```
frontend
```

Click **"Save"**

### Alternative: Check Build & Development Settings

If Root Directory is already set, check:

1. **Framework Preset**: Should be "Next.js"
2. **Build Command**: Should be `npm run build` or `next build`
3. **Output Directory**: Should be `.next`
4. **Install Command**: Should be `npm install`

### After Fixing

1. Go back to Deployments
2. Click the three dots on the failed deployment
3. Click **"Redeploy"**

## If Settings Look Correct

The issue might be that the project is linked to the wrong GitHub directory. In that case:

### Option 1: Create New Project

1. Go to: https://vercel.com/new
2. Import your repository: `advancia-devuser/advancia-payledger1`
3. **Important**: Set "Root Directory" to `frontend` BEFORE deploying
4. Add the 3 environment variables
5. Deploy

### Option 2: Use CLI with Correct Directory

```powershell
cd frontend
npx vercel --prod --yes
```

This ensures Vercel builds from the frontend directory.

## Quick Fix Command

Run this from your project root:

```powershell
cd frontend
npx vercel --prod --yes
```

This will deploy the frontend correctly.
