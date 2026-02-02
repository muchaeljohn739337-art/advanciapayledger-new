# Current Deployment Architecture

**Last Updated:** February 1, 2026

---

## 🏗️ Active Deployment Stack

### Frontend
- **Platform:** Vercel
- **Framework:** Next.js
- **Deployment:** Automatic via GitHub integration
- **URL:** https://your-app.vercel.app
- **Status:** ✅ Active

### Olympus AI Worker
- **Platform:** Cloudflare Workers
- **Purpose:** AI/ML processing service
- **Deployment:** Via Wrangler CLI
- **URL:** https://olympus-ai.your-account.workers.dev
- **Status:** ✅ Active

### Database
- **Platform:** Supabase
- **Type:** PostgreSQL with RLS
- **Features:** Row-Level Security enabled
- **Status:** ✅ Active

---

## ❌ Deprecated/Disabled Services

### Backend API (DigitalOcean)
- **Status:** ❌ DISABLED
- **Previous Host:** 147.182.193.11
- **Reason:** Migrated to alternative deployment method
- **Workflow:** `.github/workflows/deploy-backend.yml` (disabled)

---

## 🚀 Current Deployment Methods

### Frontend Deployment
```bash
# Automatic deployment via Vercel GitHub integration
git push origin main
# Vercel automatically builds and deploys
```

### Olympus Worker Deployment
```bash
cd olympus
wrangler deploy
```

### Database Migrations
```bash
cd backend
npx prisma migrate deploy
```

---

## 📋 Active GitHub Workflows

### ✅ Running Workflows
1. **CI/CD Pipeline** - Tests and builds
2. **Test Backend** - Backend unit tests
3. **Test Frontend** - Frontend unit tests
4. **Deploy Frontend to Vercel** - Automatic frontend deployment
5. **Deploy Olympus** - Cloudflare Worker deployment
6. **Snyk Security Scan** - Weekly vulnerability scanning
7. **SonarCloud Analysis** - Code quality checks
8. **Trivy Security Scan** - Container vulnerability scanning

### ❌ Disabled Workflows
1. **Deploy Backend to DigitalOcean** - No longer used
2. **Deploy All Services** - Backend deployment removed

---

## 🔄 Recommended Backend Deployment Options

Since DigitalOcean deployment is disabled, consider these alternatives:

### Option 1: Google Cloud Platform (GCP)
- Cloud Run for containerized backend
- Cloud SQL for managed PostgreSQL
- Automatic scaling
- See: `GCP_DEPLOYMENT_INSTRUCTIONS.md`

### Option 2: Azure
- Azure App Service
- Azure Database for PostgreSQL
- See: `.github/workflows/azure-deploy.yml`

### Option 3: AWS
- Elastic Beanstalk or ECS
- RDS for PostgreSQL
- See deployment guides in `/docs`

### Option 4: Keep Supabase + Serverless
- Use Supabase Edge Functions for backend logic
- No separate backend server needed
- Fully serverless architecture

---

## 🔐 Environment Variables

### Frontend (Vercel)
```bash
NEXT_PUBLIC_API_URL=<your-api-url>
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-key>
```

### Backend (When Deployed)
```bash
DATABASE_URL=<postgresql-connection-string>
JWT_SECRET=<jwt-secret>
STRIPE_SECRET_KEY=<stripe-key>
REDIS_URL=<redis-connection-string>
```

### Olympus Worker
```bash
ANTHROPIC_API_KEY=<anthropic-key>
OPENAI_API_KEY=<openai-key>
```

---

## 📊 Monitoring & Security

### Active Monitoring
- ✅ **Snyk** - Dependency vulnerability scanning
- ✅ **SonarCloud** - Code quality analysis
- ✅ **Sentry** - Error tracking (frontend + backend)
- ✅ **Vercel Analytics** - Frontend performance

### Planned Monitoring (Phase 2)
- ⏳ **Prometheus + Grafana** - Metrics (when Docker installed)
- ⏳ **Swagger/OpenAPI** - API documentation
- ⏳ **KYC Integration** - Identity verification

---

## 🎯 Deployment Checklist

### Before Deploying:
- [ ] All tests passing
- [ ] Snyk security scan passed
- [ ] SonarCloud quality gate passed
- [ ] Environment variables configured
- [ ] Database migrations ready

### After Deploying:
- [ ] Health checks passing
- [ ] Smoke tests completed
- [ ] Monitoring alerts configured
- [ ] Rollback plan ready

---

## 🚨 Emergency Rollback

### Frontend (Vercel)
1. Go to Vercel dashboard
2. Select previous deployment
3. Click "Promote to Production"

### Olympus Worker
```bash
cd olympus
wrangler rollback
```

### Database
```bash
# Restore from backup
# See: scripts/backup-database.sh
```

---

## 📞 Support & Documentation

- **Deployment Guides:** `/docs` folder
- **Workflow Files:** `.github/workflows/`
- **Infrastructure Scripts:** `infrastructure/scripts/`
- **Phase 2 Implementation:** `PHASE2_COMPLETE_SUMMARY.md`

---

## 🔄 Migration Notes

### DigitalOcean → Alternative Platform

**What was removed:**
- SSH deployment to 147.182.193.11
- PM2 process management
- Direct server access

**What to set up on new platform:**
- Container orchestration or serverless functions
- Managed database connection
- Auto-scaling configuration
- Health check endpoints

**Migration steps:**
1. Choose new platform (GCP/Azure/AWS)
2. Set up infrastructure
3. Configure environment variables
4. Deploy backend
5. Update DNS/routing
6. Enable new deployment workflow
7. Test thoroughly
8. Remove old DigitalOcean server

---

**Status:** ✅ Frontend and Olympus deployed  
**Next Step:** Deploy backend to chosen platform  
**Priority:** Choose backend deployment platform
