# Vercel Final Setup Instructions

You have multiple Vercel projects. Based on your deployment, you need to configure the **frontend-clean** project.

## Step 1: Add Environment Variables

Go to: https://vercel.com/advanciapayledger/frontend-clean/settings/environment-variables

Add these three variables:

### Variable 1: NEXT_PUBLIC_SUPABASE_URL
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://jwabwrcykdtpwdhwhmqq.supabase.co`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YWJ3cmN5a2R0cHdkaHdobXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTI3NTQsImV4cCI6MjA4NTEyODc1NH0.wk7Ok5i8O4eigd7iYhb-LwR48-B9QpKuRPi5GZfGWwk`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

### Variable 3: NEXT_PUBLIC_API_URL
- **Name**: `NEXT_PUBLIC_API_URL`
- **Value**: `http://localhost:3001` (temporary - update after backend deployment)
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

## Step 2: Redeploy

After adding all three variables:

1. Go to: https://vercel.com/advanciapayledger/frontend-clean
2. Click on the **Deployments** tab
3. Find the latest deployment
4. Click the **three dots (⋯)** menu
5. Select **Redeploy**
6. Click **Redeploy** button

## Step 3: Verify Deployment

Once redeployed, your app will be live at:
- **Production URL**: Check the deployment page for your URL

## Alternative: Deploy via CLI

If you prefer CLI deployment:

```powershell
cd frontend
npx vercel --prod --yes
```

## Your Projects Overview

From your screenshot, you have these projects:
- **frontend-clean** ← Current deployment
- **advanciapayledger** ← Main project
- **advancia-monetization**
- **advancia-subscriptions**
- **advancia-payledger-demo**
- **advancia-onboarding**
- **advancia-payledger-landing**

Make sure you're configuring the correct project!

## Next Steps After Deployment

1. ✅ Frontend deployed to Vercel
2. ⏳ Deploy backend to Digital Ocean
3. ⏳ Update `NEXT_PUBLIC_API_URL` with actual backend URL
4. ⏳ Test the full application

## Quick Links

- **Vercel Dashboard**: https://vercel.com/advanciapayledger
- **Supabase Dashboard**: https://app.supabase.com/project/jwabwrcykdtpwdhwhmqq
- **Frontend Project**: https://vercel.com/advanciapayledger/frontend-clean
