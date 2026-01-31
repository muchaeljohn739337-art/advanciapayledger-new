# ☁️ Cloudflare Workers Deployment Guide

## 🎯 Current Setup

You're using:
- **Cloudflare Workers** (via Wrangler CLI)
- **Webhooks** for deployment automation
- **Vercel** for frontend (already deployed ✅)

---

## 📋 Backend Deployment to Cloudflare Workers

### Prerequisites

```powershell
# Install Wrangler CLI globally
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

---

## 🔧 Step 1: Create Wrangler Configuration

I'll create a `wrangler.toml` for your backend:

```toml
name = "advancia-payledger-backend"
main = "dist/worker.js"
compatibility_date = "2024-01-01"
node_compat = true

[env.production]
name = "advancia-payledger-backend"
routes = [
  { pattern = "api.advancia.com/*", zone_name = "advancia.com" }
]

# Database connection via Hyperdrive (for Postgres)
[[hyperdrive]]
binding = "DATABASE"
id = "your-hyperdrive-id"

# KV for session storage
[[kv_namespaces]]
binding = "SESSIONS"
id = "your-kv-namespace-id"

# D1 for caching (optional)
[[d1_databases]]
binding = "CACHE"
database_name = "advancia-cache"
database_id = "your-d1-id"

[vars]
NODE_ENV = "production"
FRONTEND_URL = "https://your-vercel-app.vercel.app"
```

---

## 🚀 Step 2: Adapt Backend for Cloudflare Workers

Cloudflare Workers have some differences from Node.js:

### Create Worker Entry Point

```typescript
// backend/src/worker.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// CORS
app.use('/*', cors({
  origin: ['https://your-vercel-app.vercel.app'],
  credentials: true,
}));

// Import your routes
import chamberRoutes from './routes/chambers';
import bookingRoutes from './routes/bookings';
import scheduleRoutes from './routes/schedule';

// Register routes
app.route('/api/chambers', chamberRoutes);
app.route('/api/bookings', bookingRoutes);
app.route('/api/schedule', scheduleRoutes);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
```

---

## 🗄️ Step 3: Database Setup with Hyperdrive

Cloudflare Hyperdrive connects to your Supabase database:

```powershell
# Create Hyperdrive connection
wrangler hyperdrive create advancia-db --connection-string="postgresql://postgres.jwabwrcykdtpwdhwhmqq:F3vR2UQT49NK8ifI@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

Update Prisma to use Hyperdrive:

```typescript
// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

export const getPrisma = (env: any) => {
  const connectionString = env.DATABASE?.connectionString || process.env.DATABASE_URL;
  
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });
};
```

---

## 🔐 Step 4: Set Secrets

```powershell
# Set JWT secrets
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET

# Set database URL (if not using Hyperdrive)
wrangler secret put DATABASE_URL
```

---

## 📦 Step 5: Deploy to Cloudflare

```powershell
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\backend

# Build for Workers
npm run build

# Deploy to Cloudflare
wrangler deploy

# Or deploy to production environment
wrangler deploy --env production
```

---

## 🔗 Step 6: Set Up Webhooks

### GitHub Webhook (Auto-deploy on push)

1. Go to your GitHub repo settings
2. Add webhook: `https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{script_name}/deployments`
3. Set content type: `application/json`
4. Add secret token

### Cloudflare Deploy Hook

```powershell
# Create deploy hook
wrangler deployments create-hook advancia-payledger-backend

# Use the webhook URL in your CI/CD
```

---

## 🌐 Alternative: Use Cloudflare Pages for Backend

If you prefer Pages over Workers:

```powershell
cd backend

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=advancia-backend
```

---

## 📋 Current Deployment Options

Based on your setup, here are your options:

### Option 1: Cloudflare Workers (Recommended for API)
- Best for: REST API, serverless functions
- Cost: Pay-per-request (100k requests/day free)
- Deploy: `wrangler deploy`

### Option 2: Cloudflare Pages Functions
- Best for: Static sites with API routes
- Cost: Unlimited requests (free tier)
- Deploy: `wrangler pages deploy`

### Option 3: Hybrid (Current Setup)
- Frontend: Vercel ✅
- Backend: Cloudflare Workers
- Database: Supabase ✅

---

## 🔧 Quick Deploy Commands

```powershell
# Navigate to backend
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\backend

# Install Wrangler (if not installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create wrangler.toml (I'll create this for you)

# Deploy
wrangler deploy
```

---

## 📊 What's Your Current Webhook Setup?

Please clarify:

1. **What webhook are you using?**
   - GitHub webhook for auto-deploy?
   - Cloudflare deploy hook?
   - Custom webhook?

2. **Where is your backend currently deployed?**
   - Cloudflare Workers?
   - Cloudflare Pages?
   - Not deployed yet?

3. **What's the webhook URL?**
   - I can help configure it properly

---

## 🎯 Next Steps

Tell me:
1. Do you already have a Cloudflare Workers project set up?
2. What's your Cloudflare account ID?
3. Should I create the `wrangler.toml` configuration for your backend?
4. What webhook are you referring to?

I'll then create the exact deployment commands you need! 🚀
