# Advancia Pay Ledger - Project Structure

**Last Updated**: January 31, 2026

---

## Directory Organization

```
advancia-payledger/
├─ /ai                          # AI thinking layer
│  ├─ /prompts                  # Reusable AI prompts
│  │  ├─ code_review.md         # Code review guidelines
│  │  ├─ security_audit.md      # Security audit checklist
│  │  ├─ deployment_check.md    # Pre-deployment verification
│  │  └─ refactor.md            # Refactoring guidelines
│  └─ ai-client.ts              # AI integration client (future)
│
├─ /backend                     # Backend API server
│  ├─ /src
│  │  ├─ /config                # Configuration files
│  │  │  └─ sentry.ts           # Error tracking config
│  │  ├─ /controllers           # Request handlers
│  │  ├─ /middleware            # Express middleware
│  │  │  ├─ auth.ts             # Authentication
│  │  │  ├─ security.ts         # Security middleware
│  │  │  └─ rateLimiter.ts      # Rate limiting
│  │  ├─ /routes                # API routes
│  │  │  ├─ auth.ts             # Authentication routes
│  │  │  ├─ payments.ts         # Payment processing
│  │  │  ├─ facilities.ts       # Facility management
│  │  │  ├─ health.ts           # Health monitoring
│  │  │  └─ ...
│  │  ├─ /services              # Business logic
│  │  │  ├─ currencyConversionService.ts
│  │  │  ├─ emailIntegrationService.ts
│  │  │  ├─ reconciliationAgent.ts
│  │  │  └─ ...
│  │  ├─ /utils                 # Utility functions
│  │  ├─ /tests                 # Test files
│  │  │  ├─ setup.ts            # Test configuration
│  │  │  └─ payment.test.ts     # Payment tests
│  │  ├─ app.ts                 # Express app setup
│  │  └─ index.ts               # Entry point
│  ├─ /prisma                   # Database schema
│  │  ├─ schema.prisma          # Prisma schema
│  │  └─ /migrations            # Database migrations
│  ├─ /scripts                  # Database scripts
│  │  ├─ add-session-rls.sql    # RLS migration
│  │  └─ verify-rls.sql         # RLS verification
│  ├─ /email-templates          # Email HTML templates
│  ├─ jest.config.js            # Jest configuration
│  ├─ package.json
│  └─ .env.example
│
├─ /frontend                    # Next.js frontend
│  ├─ /app                      # Next.js 13 app directory
│  │  ├─ /dashboard             # Dashboard pages
│  │  ├─ layout.tsx             # Root layout
│  │  └─ page.tsx               # Home page
│  ├─ /lib                      # Frontend utilities
│  │  └─ sentry.ts              # Frontend error tracking
│  ├─ /components               # React components
│  ├─ /public                   # Static assets
│  ├─ package.json
│  └─ .env.example
│
├─ /scripts                     # Execution layer
│  ├─ backup-database.sh        # Automated backups
│  ├─ rollback.sh               # Production rollback
│  ├─ deploy.ps1                # Deployment script (future)
│  ├─ test.ps1                  # Test runner (future)
│  └─ check-env.js              # Environment validation (future)
│
├─ /docs                        # Documentation
│  ├─ api-documentation.yaml    # OpenAPI 3.0 spec
│  ├─ BRAND_STYLE_GUIDE.md      # Brand guidelines
│  ├─ PROJECT_STRUCTURE.md      # This file
│  ├─ architecture.md           # System architecture (future)
│  └─ runbook.md                # Operations guide (future)
│
├─ /.github                     # GitHub configuration
│  └─ /workflows
│     └─ ci-cd.yml              # CI/CD pipeline
│
├─ /olympus                     # AI webhook server (separate project)
│
├─ CRITICAL-INFRASTRUCTURE-ROADMAP.md
├─ INFRASTRUCTURE_IMPLEMENTATION_SUMMARY.md
├─ QUICK_START_INFRASTRUCTURE.md
├─ INFRASTRUCTURE_FILES_COMPLETE.md
├─ .gitignore
├─ package.json
└─ README.md
```

---

## Layer Responsibilities

### 🤖 AI Layer (`/ai`)
**Purpose**: Thinking and decision-making layer

**Contents**:
- Reusable prompts for code review, security audits, deployment checks
- AI client for automated code analysis (future)
- Guidelines for AI-assisted development

**Usage**:
```bash
# Use prompts with AI tools
cat ai/prompts/code_review.md | ai-tool review src/routes/payments.ts
```

### ⚙️ Scripts Layer (`/scripts`)
**Purpose**: Execution and automation layer

**Contents**:
- Backup automation (`backup-database.sh`)
- Rollback procedures (`rollback.sh`)
- Deployment scripts
- Environment validation
- Test runners

**Usage**:
```bash
# Run backup
./scripts/backup-database.sh

# Rollback deployment
./scripts/rollback.sh
```

### 🏗️ Infrastructure Layer (`/docs`, root config files)
**Purpose**: Infrastructure truth and documentation

**Contents**:
- API documentation (OpenAPI)
- Architecture diagrams
- Deployment guides
- Runbooks
- Configuration files

**Usage**:
- Reference for system design
- Deployment procedures
- Operational guides

### 💻 Application Layer (`/backend`, `/frontend`)
**Purpose**: Core application code

**Contents**:
- Backend API server
- Frontend web application
- Business logic
- Database models
- Tests

---

## Key Files Reference

### Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| `backend/.env.example` | Backend environment template | `/backend/.env.example` |
| `frontend/.env.example` | Frontend environment template | `/frontend/.env.example` |
| `backend/jest.config.js` | Test configuration | `/backend/jest.config.js` |
| `backend/prisma/schema.prisma` | Database schema | `/backend/prisma/schema.prisma` |

### Infrastructure Files

| File | Purpose | Location |
|------|---------|----------|
| `backend/src/config/sentry.ts` | Error tracking | `/backend/src/config/sentry.ts` |
| `backend/src/routes/health.ts` | Health monitoring | `/backend/src/routes/health.ts` |
| `scripts/backup-database.sh` | Automated backups | `/scripts/backup-database.sh` |
| `scripts/rollback.sh` | Production rollback | `/scripts/rollback.sh` |
| `.github/workflows/ci-cd.yml` | CI/CD pipeline | `/.github/workflows/ci-cd.yml` |

### Documentation Files

| File | Purpose | Location |
|------|---------|----------|
| `docs/api-documentation.yaml` | API specification | `/docs/api-documentation.yaml` |
| `docs/BRAND_STYLE_GUIDE.md` | Brand guidelines | `/docs/BRAND_STYLE_GUIDE.md` |
| `QUICK_START_INFRASTRUCTURE.md` | Setup guide | Root |
| `CRITICAL-INFRASTRUCTURE-ROADMAP.md` | 30-day plan | Root |

### AI Prompts

| File | Purpose | Location |
|------|---------|----------|
| `ai/prompts/code_review.md` | Code review checklist | `/ai/prompts/code_review.md` |
| `ai/prompts/security_audit.md` | Security audit guide | `/ai/prompts/security_audit.md` |
| `ai/prompts/deployment_check.md` | Pre-deployment checks | `/ai/prompts/deployment_check.md` |
| `ai/prompts/refactor.md` | Refactoring guidelines | `/ai/prompts/refactor.md` |

---

## Development Workflow

### 1. Local Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### 2. Testing
```bash
# Backend tests
cd backend
npm test

# Frontend build
cd frontend
npm run build
```

### 3. Code Review
```bash
# Use AI prompts
cat ai/prompts/code_review.md
# Review code against checklist
```

### 4. Deployment
```bash
# Pre-deployment checks
cat ai/prompts/deployment_check.md

# Deploy (via CI/CD)
git push origin main
```

---

## Environment Variables

### Backend Required
```bash
DATABASE_URL              # PostgreSQL connection
REDIS_URL                 # Redis connection
JWT_SECRET                # JWT signing key
SENTRY_DSN                # Error tracking
STRIPE_SECRET_KEY         # Payment processing
SOLANA_RPC_URL            # Blockchain RPC
ETHEREUM_RPC_URL          # Blockchain RPC
```

### Frontend Required
```bash
NEXT_PUBLIC_API_URL       # Backend API URL
NEXT_PUBLIC_SENTRY_DSN    # Error tracking
```

### Infrastructure Required
```bash
BACKUP_ENCRYPTION_KEY     # Backup encryption
AWS_ACCESS_KEY_ID         # S3/Spaces access
AWS_SECRET_ACCESS_KEY     # S3/Spaces secret
SLACK_WEBHOOK_URL         # Notifications
```

---

## Testing Strategy

### Unit Tests
- Location: `backend/src/tests/*.test.ts`
- Coverage: 70% minimum
- Run: `npm test`

### Integration Tests
- Location: `backend/src/tests/integration/*.test.ts`
- Coverage: Critical paths
- Run: `npm run test:integration`

### E2E Tests
- Location: `frontend/e2e/*.spec.ts`
- Coverage: User flows
- Run: `npm run test:e2e`

---

## CI/CD Pipeline

### Stages
1. **Test**: Run unit and integration tests
2. **Security**: Scan for vulnerabilities
3. **Build**: Compile and bundle
4. **Deploy Staging**: Deploy to staging environment
5. **Deploy Production**: Deploy to production (manual approval)

### Triggers
- **Push to `develop`**: Deploy to staging
- **Push to `main`**: Deploy to production
- **Pull Request**: Run tests only

---

## Security Considerations

### Secrets Management
- Never commit `.env` files
- Use GitHub Secrets for CI/CD
- Rotate secrets regularly
- Use different secrets per environment

### Access Control
- Backend: JWT authentication
- Database: Row Level Security (RLS)
- API: Rate limiting
- Admin: 2FA required

### Compliance
- **HIPAA**: No PHI in logs or errors
- **PCI-DSS**: No card data storage
- **Audit**: All sensitive operations logged

---

## Monitoring & Observability

### Error Tracking
- **Tool**: Sentry
- **Backend**: `backend/src/config/sentry.ts`
- **Frontend**: `frontend/lib/sentry.ts`

### Health Monitoring
- **Endpoints**: `/health`, `/health/ready`, `/health/detailed`
- **Tool**: BetterUptime
- **Alerts**: Slack notifications

### Metrics
- **Endpoint**: `/metrics`
- **Format**: Prometheus
- **Dashboard**: Grafana (future)

---

## Backup & Recovery

### Automated Backups
- **Frequency**: Daily at 2 AM
- **Retention**: 30 days (daily), 12 months (monthly)
- **Encryption**: AES-256
- **Storage**: DigitalOcean Spaces

### Rollback Procedure
```bash
# Automatic rollback on deployment failure
./scripts/rollback.sh

# Manual rollback
./scripts/rollback.sh --version=previous
```

---

## Contributing

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier
- Write tests for new features
- Document complex logic

### Pull Request Process
1. Create feature branch
2. Write code and tests
3. Run linter and tests
4. Submit PR with description
5. Address review comments
6. Merge after approval

### Commit Messages
```
feat: Add payment refund functionality
fix: Resolve race condition in transaction processing
docs: Update API documentation
test: Add tests for currency conversion
```

---

## Support & Resources

### Documentation
- API Docs: `/docs/api-documentation.yaml`
- Brand Guide: `/docs/BRAND_STYLE_GUIDE.md`
- Setup Guide: `QUICK_START_INFRASTRUCTURE.md`

### External Resources
- Sentry: https://docs.sentry.io
- Prisma: https://www.prisma.io/docs
- Next.js: https://nextjs.org/docs

### Contact
- **Technical Issues**: Create GitHub issue
- **Security Issues**: security@advanciapayledger.com
- **General Support**: support@advanciapayledger.com

---

**Version**: 1.0  
**Last Updated**: January 31, 2026  
**Maintained By**: Engineering Team
