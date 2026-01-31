# Quick Start Guide

Your Supabase credentials are configured. Follow these steps to get started.

## Your Credentials

- **Supabase URL**: `https://jwabwrcykdtpwdhwhmqq.supabase.co`
- **Database Password**: `Good_mother1!?`
- **Vercel Project ID**: `prj_UOg8luLXlQkvylq3rK45euuABGUR`

## Setup Steps

### 1. Run Environment Setup Script

```powershell
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution
.\scripts\setup-env.ps1
```

This will create all necessary `.env` files with your Supabase credentials.

### 2. Install Dependencies

```powershell
# Backend
cd backend
npm install

# Frontend
cd ..\frontend
npm install
```

### 3. Setup Database

```powershell
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npm run seed
```

### 4. Start Development Server

```powershell
# Option A: Using Docker (recommended)
cd ..
docker-compose up

# Option B: Manual start
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access the app at: `http://localhost:3000`

## Deploy to Production

### Deploy Frontend to Vercel

```powershell
cd frontend

# Deploy
npx vercel --prod

# Add environment variables
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste: https://jwabwrcykdtpwdhwhmqq.supabase.co

npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste your anon key

npx vercel env add NEXT_PUBLIC_API_URL production
# Enter your backend URL (after backend deployment)

# Redeploy with env vars
npx vercel --prod
```

### Deploy Backend to Digital Ocean

```powershell
# Install doctl
choco install doctl

# Login
doctl auth init

# Deploy
doctl apps create --spec .do\app.yaml
```

## Vercel Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jwabwrcykdtpwdhwhmqq.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Production |
| `NEXT_PUBLIC_API_URL` | Your backend URL | Production |

## Testing

### Test Supabase Connection

```powershell
cd backend
node -e "const { supabase } = require('./dist/config/supabase'); console.log('Supabase connected:', !!supabase)"
```

### Test Database Connection

```powershell
cd backend
npx prisma studio
```

This opens a database GUI at `http://localhost:5555`

### Test API Endpoints

```powershell
# Health check
curl http://localhost:3001/health

# Test with frontend
curl http://localhost:3000
```

## Troubleshooting

### Database Connection Issues

If you get connection errors, use the direct connection URL:

```
DATABASE_URL=postgresql://postgres:Good_mother1!?@db.jwabwrcykdtpwdhwhmqq.supabase.co:5432/postgres
```

### Vercel Build Fails

Check that all `NEXT_PUBLIC_*` variables are set in Vercel dashboard.

### CORS Errors

Update backend CORS settings to include your Vercel domain:

```typescript
// backend/src/app.ts
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-app.vercel.app']
}));
```

## Security Reminders

⚠️ **Important**: Before deploying to production:

1. Generate new JWT secrets:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Generate new encryption key:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Update these in your `.env` files and Vercel/DO environment variables

4. Never commit `.env` files to git

## Resources

- [Supabase Dashboard](https://app.supabase.com/project/jwabwrcykdtpwdhwhmqq)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Digital Ocean Dashboard](https://cloud.digitalocean.com/)
- [Full Deployment Guide](./DEPLOYMENT.md)
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
