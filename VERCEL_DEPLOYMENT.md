# Vercel Deployment Guide - Frontend

This guide covers deploying the Advancia PayLedger frontend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Backend Deployed**: Ensure your backend is deployed (Digital Ocean or other)

## Quick Deploy

### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

4. Add Environment Variables (see below)
5. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd frontend
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - What's your project's name? advancia-payledger-frontend
# - In which directory is your code located? ./
# - Want to override settings? No

# Deploy to production
vercel --prod
```

## Environment Variables

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

### Required Variables

```bash
# Backend API URL (your Digital Ocean backend URL)
NEXT_PUBLIC_API_URL=https://your-backend-url.ondigitalocean.app

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Optional Variables

```bash
# Analytics
NEXT_PUBLIC_GA_ID=GA-XXXXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Project Configuration

The `vercel.json` file in the frontend directory configures:

- Build settings
- Environment variables
- CORS headers for API routes
- Region selection (default: iad1 - Washington D.C.)

## Custom Domain Setup

### 1. Add Domain in Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., `app.advanciapayledger.com`)
3. Follow DNS configuration instructions

### 2. Configure DNS

Add these records to your DNS provider:

```
Type: A
Name: app (or @)
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt.

## Backend CORS Configuration

Update your backend to allow requests from Vercel:

```typescript
// backend/src/app.ts
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'https://your-app.vercel.app',
  'https://app.advanciapayledger.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

Or use environment variable:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

Update backend `.env`:
```bash
FRONTEND_URL=https://your-app.vercel.app
```

## Deployment Workflow

### Automatic Deployments

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

### Manual Deployment

```bash
# Deploy to preview
cd frontend
vercel

# Deploy to production
vercel --prod
```

### Rollback

```bash
# List deployments
vercel ls

# Promote a previous deployment
vercel promote [deployment-url]
```

## Environment-Specific Builds

### Development
```bash
vercel dev
```

### Preview
```bash
vercel
```

### Production
```bash
vercel --prod
```

## Performance Optimization

### 1. Enable Edge Functions (Optional)

Create `middleware.ts` for edge runtime:

```typescript
// frontend/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add custom headers
  const response = NextResponse.next();
  response.headers.set('x-custom-header', 'advancia-payledger');
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

### 2. Image Optimization

Vercel automatically optimizes images. Use Next.js Image component:

```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority
/>
```

### 3. Enable Analytics

```bash
# Install Vercel Analytics
npm install @vercel/analytics
```

```tsx
// frontend/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## Monitoring

### Vercel Dashboard

Monitor in real-time:
1. Go to your project dashboard
2. View:
   - Deployment status
   - Build logs
   - Runtime logs
   - Analytics
   - Performance metrics

### Logs

```bash
# View production logs
vercel logs [deployment-url]

# Stream logs
vercel logs --follow
```

## CI/CD Integration

### GitHub Actions (Optional)

Create `.github/workflows/vercel.yml`:

```yaml
name: Vercel Deployment

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: ./frontend
      
      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: ./frontend
      
      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: ./frontend
```

Add `VERCEL_TOKEN` to GitHub Secrets:
1. Generate token at [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Add to GitHub → Settings → Secrets → Actions

## Multi-Environment Setup

### Development
- Branch: `develop`
- URL: `https://advancia-payledger-dev.vercel.app`

### Staging
- Branch: `staging`
- URL: `https://advancia-payledger-staging.vercel.app`

### Production
- Branch: `main`
- URL: `https://advancia-payledger.vercel.app`

Configure in Vercel:
1. Settings → Git
2. Set Production Branch: `main`
3. Preview branches will auto-deploy

## Troubleshooting

### Build Fails

Check build logs:
```bash
vercel logs [deployment-url]
```

Common issues:
- Missing environment variables
- TypeScript errors
- Dependency issues

### Environment Variables Not Working

Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access:
```bash
# ✅ Correct
NEXT_PUBLIC_API_URL=https://api.example.com

# ❌ Wrong (won't be available in browser)
API_URL=https://api.example.com
```

### CORS Errors

Update backend CORS settings to include Vercel domain:
```typescript
origin: ['https://your-app.vercel.app']
```

### 404 on Refresh

Next.js handles this automatically. If issues persist, check `next.config.js`:
```javascript
module.exports = {
  trailingSlash: true,
  // or
  output: 'standalone'
}
```

## Cost Estimation

### Vercel Pricing

**Hobby (Free)**:
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- Perfect for development

**Pro ($20/month)**:
- 1 TB bandwidth
- Advanced analytics
- Password protection
- Team collaboration

**Enterprise (Custom)**:
- Custom bandwidth
- SLA guarantees
- Advanced security
- Dedicated support

## Security Best Practices

1. **Environment Variables**: Never commit `.env.local`
2. **API Keys**: Use Vercel's encrypted environment variables
3. **CORS**: Restrict to specific domains
4. **Rate Limiting**: Implement on backend
5. **Authentication**: Use Supabase Auth with proper session handling

## Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Environment variables configured in Vercel
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] CORS configured on backend
- [ ] Analytics enabled
- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring enabled
- [ ] Test all API endpoints
- [ ] Test authentication flow
- [ ] Test file uploads
- [ ] Verify mobile responsiveness

## Architecture Overview

```
┌─────────────────┐
│   Vercel CDN    │ ← Frontend (Next.js)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Digital Ocean   │ ← Backend API
│  App Platform   │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────┐
│Supabase│ │ DO Spaces│
│  Auth  │ │  Storage │
└────────┘ └──────────┘
```

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Project Issues](https://github.com/your-repo/issues)

## Quick Commands Reference

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]

# Link local project
vercel link

# Pull environment variables
vercel env pull

# Add environment variable
vercel env add NEXT_PUBLIC_API_URL
```
