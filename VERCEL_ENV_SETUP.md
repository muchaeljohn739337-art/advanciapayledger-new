# Vercel Environment Variables Setup

Add these environment variables in your Vercel Dashboard:

## Steps

1. Go to: https://vercel.com/advanciapayledgeradvanciapayledger/frontend/settings/environment-variables

2. Add these three variables (one at a time):

### Variable 1: NEXT_PUBLIC_SUPABASE_URL
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://jwabwrcykdtpwdhwhmqq.supabase.co`
- **Environment**: Production, Preview, Development (select all)

### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YWJ3cmN5a2R0cHdkaHdobXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTI3NTQsImV4cCI6MjA4NTEyODc1NH0.wk7Ok5i8O4eigd7iYhb-LwR48-B9QpKuRPi5GZfGWwk`
- **Environment**: Production, Preview, Development (select all)

### Variable 3: NEXT_PUBLIC_API_URL
- **Name**: `NEXT_PUBLIC_API_URL`
- **Value**: `http://localhost:3001` (temporary - update after backend deployment)
- **Environment**: Production, Preview, Development (select all)

## After Adding Variables

Once all three variables are added, redeploy your application:

1. Go to: https://vercel.com/advanciapayledgeradvanciapayledger/frontend
2. Click on the latest deployment
3. Click the three dots menu (⋯)
4. Select "Redeploy"
5. Check "Use existing Build Cache" (optional)
6. Click "Redeploy"

Your app will rebuild with the new environment variables and be live in a few minutes!
