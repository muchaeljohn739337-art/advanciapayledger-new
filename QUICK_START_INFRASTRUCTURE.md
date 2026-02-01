# 🚀 Quick Start - Infrastructure Setup

**Time to Production Ready**: 6-8 hours  
**Monthly Cost**: $71  
**Status**: All files created ✅

---

## ✅ Files Created (Just Now)

1. **`frontend/lib/sentry.ts`** - Frontend error tracking (HIPAA-compliant)
2. **`backend/src/routes/health.ts`** - Health check endpoints
3. **`scripts/backup-database.sh`** - Automated backup script
4. **`CRITICAL-INFRASTRUCTURE-ROADMAP.md`** - 30-day implementation plan
5. **`INFRASTRUCTURE_IMPLEMENTATION_SUMMARY.md`** - Complete guide

---

## 🎯 Next Steps (In Order)

### Step 1: Install Dependencies (15 min)

```bash
# Backend - Sentry
cd backend
npm install @sentry/node @sentry/tracing @sentry/profiling-node

# Frontend - Sentry
cd ../frontend
npm install @sentry/nextjs

# Backend - Rate limiting (already have express-rate-limit)
cd ../backend
npm install rate-limit-redis
```

### Step 2: Create Backend Sentry Config (10 min)

Create: `backend/src/config/sentry.ts`

```typescript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function initializeSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn('⚠️  Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 0.1,
    integrations: [new ProfilingIntegration()],
    beforeSend(event) {
      // Filter sensitive data
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });

  console.log('✅ Sentry initialized');
}
```

### Step 3: Integrate Sentry into Backend (5 min)

Update `backend/src/index.ts`:

```typescript
import { initializeSentry } from './config/sentry';

// At the very top, before any other imports
initializeSentry();

// Rest of your code...
```

### Step 4: Integrate Health Checks (5 min)

Update `backend/src/index.ts`:

```typescript
import healthRouter from './routes/health';

// Add health check routes
app.use(healthRouter);
```

### Step 5: Add Environment Variables (5 min)

Add to `backend/.env`:

```bash
# Sentry
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Monitoring
UPTIME_WEBHOOK_URL=https://betteruptime.com/api/v2/heartbeat/your-key

# Backups
BACKUP_ENCRYPTION_KEY=your-32-character-encryption-key-here
DB_PASSWORD=your-database-password
S3_BUCKET=advancia-backups
S3_REGION=nyc3
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
AWS_ACCESS_KEY_ID=your-do-spaces-key
AWS_SECRET_ACCESS_KEY=your-do-spaces-secret

# Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Add to `frontend/.env.local`:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

### Step 6: Initialize Frontend Sentry (5 min)

Update `frontend/app/layout.tsx`:

```typescript
import { initializeFrontendSentry } from '@/lib/sentry';

// At the top of your root layout
if (typeof window !== 'undefined') {
  initializeFrontendSentry();
}
```

### Step 7: Sign Up for Services (30 min)

#### Sentry (Error Tracking)
1. Go to https://sentry.io
2. Sign up (free tier available)
3. Create new project → Select "Next.js" for frontend, "Node.js" for backend
4. Copy DSN
5. Add to `.env` files

#### BetterUptime (Monitoring)
1. Go to https://betteruptime.com
2. Sign up (free tier: 10 monitors)
3. Add monitor: `http://your-server:3001/health`
4. Configure Slack alerts
5. Copy heartbeat URL

#### DigitalOcean Spaces (Backups)
1. Go to DigitalOcean → Spaces
2. Create new Space: `advancia-backups`
3. Generate API keys
4. Add to `.env`

### Step 8: Setup Automated Backups (15 min)

```bash
# Make script executable
chmod +x scripts/backup-database.sh

# Test backup manually
./scripts/backup-database.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add: 0 2 * * * /path/to/scripts/backup-database.sh
```

### Step 9: Test Everything (30 min)

```bash
# 1. Start backend
cd backend
npm run dev

# 2. Test health endpoints
curl http://localhost:3001/health
curl http://localhost:3001/health/ready
curl http://localhost:3001/health/detailed

# 3. Test error tracking
# Trigger a test error in your app
# Check Sentry dashboard for the error

# 4. Start frontend
cd frontend
npm run dev

# 5. Trigger frontend error
# Check Sentry dashboard
```

### Step 10: Deploy (1-2 hours)

```bash
# 1. Commit all changes
git add .
git commit -m "feat: Add production infrastructure (Sentry, health checks, backups)"
git push origin master

# 2. Deploy to production
# Follow your normal deployment process

# 3. Verify in production
curl https://your-production-url/health
```

---

## 📊 Verification Checklist

After setup, verify:

- [ ] Sentry dashboard shows events from backend
- [ ] Sentry dashboard shows events from frontend
- [ ] Health endpoint returns 200 OK
- [ ] Detailed health check shows all systems up
- [ ] BetterUptime monitor is green
- [ ] Backup script runs successfully
- [ ] Backup appears in DigitalOcean Spaces
- [ ] Slack notifications working

---

## 🎉 You're Done!

**What you now have**:
- ✅ Real-time error tracking (Sentry)
- ✅ Health monitoring endpoints
- ✅ Automated daily backups
- ✅ Slack notifications
- ✅ Production-ready infrastructure

**Monthly cost**: $71
- Sentry: $26
- BetterUptime: $20
- DO Spaces: $5
- SendGrid: $20

**Time invested**: 6-8 hours
**Value**: Enterprise-grade infrastructure

---

## 🚨 Troubleshooting

### Sentry not capturing errors
- Check DSN is correct in `.env`
- Verify Sentry is initialized before other code
- Check Sentry dashboard for quota limits

### Health checks failing
- Verify database connection
- Check Redis is running
- Ensure blockchain RPC URLs are correct

### Backups failing
- Check AWS credentials
- Verify S3 bucket exists
- Check disk space
- Review logs: `/var/log/advancia-backup.log`

---

## 📞 Support

**Documentation**:
- `CRITICAL-INFRASTRUCTURE-ROADMAP.md` - Full 30-day plan
- `INFRASTRUCTURE_IMPLEMENTATION_SUMMARY.md` - Complete guide
- `RLS_IMPLEMENTATION_GUIDE.md` - Database security

**Quick Reference**:
- Sentry Docs: https://docs.sentry.io
- BetterUptime: https://betteruptime.com/docs
- DO Spaces: https://docs.digitalocean.com/products/spaces

---

**Status**: ✅ All infrastructure files created and ready to implement!

**Next**: Follow steps 1-10 above to complete setup (6-8 hours total)
