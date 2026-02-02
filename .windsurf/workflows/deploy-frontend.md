---
description: Deploy frontend to Vercel with environment configuration
---

# Deploy Frontend Workflow

## Prerequisites
- Vercel CLI installed (`npm i -g vercel`)
- Vercel account connected
- Database deployed and RLS applied

## Steps

### 1. Login to Vercel
```bash
vercel login
```

### 2. Navigate to Frontend
```bash
cd frontend
```

// turbo
### 3. Deploy to Production
```bash
vercel --prod
```

### 4. Configure Environment Variables
Add in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://fvceynqcxfwtbpbugtqr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Get from Supabase Dashboard]
NEXT_PUBLIC_API_URL=[Your backend URL]
NEXT_PUBLIC_ENV=production
```

### 5. Redeploy with Environment Variables
```bash
vercel --prod
```

### 6. Verify Deployment
- Visit your Vercel URL
- Test authentication
- Check database connections
- Verify RLS is working

## Success Criteria
- ✅ Frontend deployed successfully
- ✅ Environment variables configured
- ✅ Authentication working
- ✅ Database connections active
- ✅ No console errors
