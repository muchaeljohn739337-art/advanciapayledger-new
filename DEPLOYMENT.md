# Deployment Guide - Supabase & Digital Ocean

This guide covers deploying Advancia PayLedger with Supabase and Digital Ocean.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Digital Ocean Account**: Sign up at [digitalocean.com](https://digitalocean.com)
3. **doctl CLI**: Install Digital Ocean CLI tool
4. **Docker**: For local testing

## Supabase Setup

### 1. Create a New Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: `advancia-payledger`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users

### 2. Get API Keys

1. Go to Project Settings → API
2. Copy the following:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` public key
   - `service_role` secret key (keep this secure!)

### 3. Configure Database (Optional)

If you want to use Supabase as your primary database:

1. Go to Database → Connection Pooling
2. Copy the connection string
3. Update your `DATABASE_URL` environment variable

### 4. Enable Authentication

1. Go to Authentication → Providers
2. Enable Email provider
3. Configure OAuth providers as needed (Google, GitHub, etc.)

## Digital Ocean Setup

### 1. Create Spaces (Object Storage)

```bash
# Install doctl
# Windows (via Chocolatey)
choco install doctl

# Authenticate
doctl auth init

# Create a Space
doctl spaces create advancia-payledger --region nyc3
```

Or via web console:

1. Go to Spaces → Create Space
2. Choose region (e.g., NYC3)
3. Name: `advancia-payledger`
4. Enable CDN (optional)

### 2. Generate Spaces Access Keys

1. Go to API → Spaces Keys
2. Click "Generate New Key"
3. Save the Access Key and Secret Key

### 3. Deploy App Platform

#### Option A: Using doctl CLI

```bash
# Create app from spec
doctl apps create --spec .do/app.yaml

# Update app
doctl apps update YOUR_APP_ID --spec .do/app.yaml
```

#### Option B: Using Web Console

1. Go to App Platform → Create App
2. Connect your GitHub repository
3. Configure services:
   - **Backend Service**:
     - Source: `/backend`
     - Build Command: `npm install && npm run build`
     - Run Command: `npm start`
     - HTTP Port: 3001
   - **Frontend Service**:
     - Source: `/frontend`
     - Build Command: `npm install && npm run build`
     - Run Command: `npm start`
     - HTTP Port: 3000

### 4. Configure Managed Databases

1. Go to Databases → Create Database Cluster
2. Choose PostgreSQL 15
3. Select plan (Basic recommended for start)
4. Choose same region as your app
5. Create database: `advanciapayledger`

Repeat for Redis:

1. Create Redis cluster
2. Choose Redis 7
3. Same region as app

## Environment Variables

### Backend Environment Variables

Set these in Digital Ocean App Platform → Settings → Environment Variables:

```bash
NODE_ENV=production
DATABASE_URL=<your-database-url>
REDIS_URL=<your-redis-url>
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>
ENCRYPTION_KEY=<64-char-hex-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_KEY=<your-spaces-key>
DO_SPACES_SECRET=<your-spaces-secret>
DO_SPACES_BUCKET=advancia-payledger
DO_SPACES_REGION=nyc3
STRIPE_SECRET_KEY=<your-stripe-key>
FRONTEND_URL=<your-frontend-url>
```

### Frontend Environment Variables

```bash
NEXT_PUBLIC_API_URL=<your-backend-url>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Blockchain RPC (Optional - defaults to Cloudflare)
ETH_PROVIDER_URL=https://cloudflare-eth.com
```

## Database Migration

Run Prisma migrations on your production database:

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run migrations
cd backend
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Testing Deployment

### 1. Local Production Build

```bash
# Build and test locally
docker-compose -f docker-compose.prod.yml up --build

# Test endpoints
curl http://localhost:3001/health
curl http://localhost:3000
```

### 2. Test File Upload to Spaces

```bash
# Test upload endpoint
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-file.pdf"
```

### 3. Test Supabase Authentication

```bash
# Test signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Monitoring

### Digital Ocean Monitoring

1. Go to App Platform → Your App → Insights
2. Monitor:
   - CPU usage
   - Memory usage
   - Request rate
   - Error rate

### Supabase Monitoring

1. Go to Project → Reports
2. Monitor:
   - Database size
   - API requests
   - Auth users
   - Storage usage

## Scaling

### App Platform Scaling

```bash
# Scale backend
doctl apps update YOUR_APP_ID --spec .do/app.yaml

# Update instance count in app.yaml:
instance_count: 3
instance_size_slug: professional-s
```

### Database Scaling

1. Go to Databases → Your Cluster → Settings
2. Resize cluster as needed
3. Enable read replicas for high traffic

## Backup Strategy

### Database Backups

Digital Ocean automatically backs up managed databases daily. Configure:

1. Go to Databases → Your Cluster → Backups
2. Set retention period (7-30 days)
3. Enable point-in-time recovery

### Spaces Backups

```bash
# Sync Spaces to local backup
s3cmd sync s3://advancia-payledger ./backup/

# Or use AWS CLI
aws s3 sync s3://advancia-payledger ./backup/ \
  --endpoint-url=https://nyc3.digitaloceanspaces.com
```

## Security Checklist

- [ ] Enable SSL/TLS for all services
- [ ] Use environment variables for secrets (never commit)
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Enable 2FA on Digital Ocean and Supabase accounts
- [ ] Rotate API keys regularly
- [ ] Enable audit logging
- [ ] Set up monitoring alerts

## Troubleshooting

### Common Issues

1. **Build fails**: Check Node version compatibility
2. **Database connection fails**: Verify DATABASE_URL and firewall rules
3. **File upload fails**: Check Spaces credentials and CORS settings
4. **Auth fails**: Verify Supabase keys and JWT configuration

### Logs

```bash
# View app logs
doctl apps logs YOUR_APP_ID --type run

# View build logs
doctl apps logs YOUR_APP_ID --type build
```

## Cost Estimation

### Digital Ocean (Monthly)

- App Platform (Basic): $12/service × 2 = $24
- PostgreSQL (Basic): $15
- Redis (Basic): $15
- Spaces (250GB): $5
- **Total**: ~$59/month

### Supabase

- Free tier: Up to 500MB database, 1GB file storage
- Pro tier: $25/month (8GB database, 100GB storage)

## Support

- Digital Ocean Docs: [docs.digitalocean.com](https://docs.digitalocean.com)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- Project Issues: [GitHub Issues](https://github.com/your-repo/issues)
