# Deployment Architecture

Complete deployment architecture for Advancia PayLedger with Supabase, Digital Ocean, and Vercel.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Architecture                  │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │    Users     │
                    └──────┬───────┘
                           │
                ┏━━━━━━━━━━┻━━━━━━━━━━┓
                ↓                      ↓
        ┌───────────────┐      ┌──────────────┐
        │  Vercel CDN   │      │   Mobile     │
        │   (Frontend)  │      │     App      │
        └───────┬───────┘      └──────┬───────┘
                │                     │
                └──────────┬──────────┘
                           │
                           ↓
                ┌──────────────────┐
                │ Digital Ocean    │
                │  App Platform    │
                │   (Backend API)  │
                └────────┬─────────┘
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
┌──────────────┐  ┌─────────────┐  ┌────────────┐
│   Supabase   │  │  DO Managed │  │ DO Spaces  │
│              │  │  PostgreSQL │  │  (Storage) │
│ - Auth       │  │  - Database │  │            │
│ - Database   │  │  - Redis    │  │ - Files    │
│ - Storage    │  │             │  │ - Images   │
│ - Realtime   │  │             │  │ - Docs     │
└──────────────┘  └─────────────┘  └────────────┘
```

## Component Breakdown

### Frontend - Vercel
- **Technology**: Next.js 14
- **Hosting**: Vercel
- **CDN**: Global Edge Network
- **Features**:
  - Automatic HTTPS
  - Edge Functions
  - Image Optimization
  - Analytics
  - Preview Deployments

### Backend - Digital Ocean
- **Technology**: Node.js + Express + TypeScript
- **Hosting**: Digital Ocean App Platform
- **Features**:
  - Auto-scaling
  - Health checks
  - Zero-downtime deployments
  - Managed databases
  - Container-based

### Database - Hybrid Approach

#### Option 1: Supabase (Recommended for Auth)
- PostgreSQL database
- Built-in authentication
- Row Level Security (RLS)
- Real-time subscriptions
- Auto-generated APIs

#### Option 2: Digital Ocean Managed PostgreSQL
- Dedicated database cluster
- Automated backups
- Point-in-time recovery
- Connection pooling
- High availability

### Storage - Digital Ocean Spaces
- S3-compatible object storage
- CDN integration
- Scalable and affordable
- Global edge locations

### Caching - Redis
- Digital Ocean Managed Redis
- Session storage
- Rate limiting
- Queue management

## Deployment Strategies

### Strategy 1: Full Supabase Stack
```
Frontend (Vercel) → Supabase (Auth + DB + Storage)
```
**Pros**: Simplest setup, fastest development
**Cons**: Vendor lock-in, less control

### Strategy 2: Hybrid (Recommended)
```
Frontend (Vercel) → Backend (DO) → Supabase (Auth) + DO (DB + Storage)
```
**Pros**: Best of both worlds, flexible
**Cons**: More configuration

### Strategy 3: Full Digital Ocean
```
Frontend (Vercel) → Backend (DO) → DO (DB + Redis + Storage)
```
**Pros**: Single vendor, cost-effective
**Cons**: Manual auth implementation

## Traffic Flow

### 1. User Authentication
```
User → Vercel Frontend → Supabase Auth
                       ↓
                  JWT Token
                       ↓
User ← Vercel Frontend ← Supabase Auth
```

### 2. API Request
```
User → Vercel Frontend → DO Backend API
                              ↓
                    Verify JWT (Supabase)
                              ↓
                    Query Database (DO/Supabase)
                              ↓
                    Return Response
                              ↓
User ← Vercel Frontend ← DO Backend API
```

### 3. File Upload
```
User → Vercel Frontend → DO Backend API
                              ↓
                    Validate & Process
                              ↓
                    Upload to DO Spaces
                              ↓
                    Return CDN URL
                              ↓
User ← Vercel Frontend ← DO Backend API
```

## Environment Configuration

### Development
```bash
Frontend: localhost:3000 (Vercel Dev)
Backend: localhost:3001 (Local)
Database: localhost:5432 (Docker)
Redis: localhost:6379 (Docker)
```

### Staging
```bash
Frontend: staging.vercel.app
Backend: staging-api.ondigitalocean.app
Database: Supabase/DO Staging
Redis: DO Staging
```

### Production
```bash
Frontend: app.advanciapayledger.com (Vercel)
Backend: api.advanciapayledger.com (DO)
Database: Supabase/DO Production
Redis: DO Production
```

## Security Layers

### 1. Network Security
- HTTPS/TLS everywhere
- CORS configuration
- Rate limiting
- DDoS protection (Vercel/DO)

### 2. Authentication
- JWT tokens (Supabase)
- Refresh tokens
- Session management
- OAuth providers

### 3. Authorization
- Role-based access control (RBAC)
- Row Level Security (Supabase)
- API middleware checks

### 4. Data Security
- Encryption at rest
- Encryption in transit
- Secure environment variables
- Secret management

## Scaling Strategy

### Horizontal Scaling
```
Load Balancer
    ↓
┌───┴───┬───────┬───────┐
│ API 1 │ API 2 │ API 3 │
└───────┴───────┴───────┘
```

### Database Scaling
- Read replicas
- Connection pooling
- Query optimization
- Caching layer (Redis)

### Storage Scaling
- CDN distribution
- Image optimization
- Lazy loading
- Compression

## Monitoring & Observability

### Application Monitoring
- Vercel Analytics (Frontend)
- DO Insights (Backend)
- Error tracking (Sentry)
- Performance metrics

### Infrastructure Monitoring
- Database metrics
- Redis metrics
- Storage usage
- API response times

### Logging
- Centralized logging
- Log aggregation
- Error alerts
- Audit trails

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups (7-30 day retention)
- **Files**: Versioned storage in DO Spaces
- **Code**: Git repository (GitHub)
- **Config**: Environment variables backed up

### Recovery Plan
1. Database restore from backup
2. Redeploy from Git
3. Restore environment variables
4. Verify functionality
5. Update DNS if needed

### RTO/RPO Targets
- **RTO** (Recovery Time Objective): < 1 hour
- **RPO** (Recovery Point Objective): < 24 hours

## Cost Breakdown (Monthly)

### Vercel
- **Hobby**: $0 (100GB bandwidth)
- **Pro**: $20 (1TB bandwidth)

### Digital Ocean
- **App Platform**: $24 (2 services × $12)
- **PostgreSQL**: $15 (Basic)
- **Redis**: $15 (Basic)
- **Spaces**: $5 (250GB)
- **Total**: ~$59/month

### Supabase
- **Free**: $0 (500MB DB, 1GB storage)
- **Pro**: $25 (8GB DB, 100GB storage)

### Total Estimated Cost
- **Minimal**: ~$59/month (Vercel Free + DO)
- **Recommended**: ~$84/month (Vercel Free + DO + Supabase Pro)
- **Professional**: ~$104/month (Vercel Pro + DO + Supabase Pro)

## Performance Targets

### Frontend (Vercel)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Lighthouse Score**: > 90

### Backend (DO)
- **API Response Time**: < 200ms (p95)
- **Uptime**: > 99.9%
- **Error Rate**: < 0.1%

### Database
- **Query Time**: < 50ms (p95)
- **Connection Pool**: 20-50 connections
- **Cache Hit Rate**: > 80%

## Deployment Checklist

### Pre-Deployment
- [ ] Code reviewed and tested
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Backup created
- [ ] Monitoring configured

### Deployment
- [ ] Deploy backend to DO
- [ ] Run database migrations
- [ ] Deploy frontend to Vercel
- [ ] Verify health checks
- [ ] Test critical paths

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all integrations
- [ ] Update documentation
- [ ] Notify team

## Quick Start Commands

### Deploy Everything
```bash
# 1. Deploy Backend to Digital Ocean
cd backend
doctl apps create --spec ../.do/app.yaml

# 2. Deploy Frontend to Vercel
cd ../frontend
vercel --prod

# 3. Run Database Migrations
npx prisma migrate deploy

# 4. Verify Deployment
curl https://api.advanciapayledger.com/health
curl https://app.advanciapayledger.com
```

### Rollback
```bash
# Rollback Frontend
vercel rollback

# Rollback Backend
doctl apps update APP_ID --spec .do/app.yaml

# Restore Database
doctl databases backups restore DB_ID BACKUP_ID
```

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Digital Ocean Docs**: https://docs.digitalocean.com
- **Supabase Docs**: https://supabase.com/docs
- **Project Repo**: https://github.com/your-org/advancia-payledger
