# Deployment Readiness Check Prompt

## Mission
Verify Advancia Pay Ledger is production-ready before deployment. Catch issues before they reach users.

## Pre-Deployment Checklist

### 1. Environment Configuration
**Verify:**
- [ ] All required environment variables set
- [ ] No `.env` files in version control
- [ ] Production secrets rotated from staging
- [ ] Database connection string correct
- [ ] Redis connection configured
- [ ] Blockchain RPC URLs working
- [ ] External API keys valid (Stripe, Sentry, etc.)

**Check Command:**
```bash
# Verify all required env vars
node scripts/check-env.js
```

**Red Flags:**
- Missing required environment variables
- Development credentials in production
- Hardcoded secrets in code
- Default passwords still in use

### 2. Database Migrations
**Verify:**
- [ ] All migrations applied successfully
- [ ] Migration rollback tested
- [ ] Database indexes created
- [ ] RLS policies active (sessions table)
- [ ] Backup taken before migration
- [ ] Data integrity verified

**Check Command:**
```bash
# Check migration status
npx prisma migrate status

# Verify RLS policies
psql $DATABASE_URL -f backend/scripts/verify-rls.sql
```

**Red Flags:**
- Pending migrations
- Failed migration rollback
- Missing indexes on large tables
- RLS policies not applied

### 3. Dependencies & Security
**Verify:**
- [ ] No critical vulnerabilities (`npm audit`)
- [ ] Dependencies up to date
- [ ] No dev dependencies in production build
- [ ] Package-lock.json committed
- [ ] Node version matches production

**Check Command:**
```bash
# Security audit
npm audit --production

# Check for outdated packages
npm outdated
```

**Red Flags:**
- Critical or high severity vulnerabilities
- Packages with known exploits
- Outdated security patches

### 4. Build & Tests
**Verify:**
- [ ] All tests passing
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] Linting passes
- [ ] Code coverage meets threshold (70%+)

**Check Command:**
```bash
# Run full test suite
npm test

# Build check
npm run build

# Lint check
npm run lint
```

**Red Flags:**
- Failing tests
- Build errors
- TypeScript compilation errors
- Linting errors

### 5. Health Checks
**Verify:**
- [ ] `/health` endpoint returns 200
- [ ] `/health/ready` shows all systems up
- [ ] Database connection working
- [ ] Redis connection working
- [ ] Blockchain RPC endpoints responding
- [ ] External APIs accessible

**Check Command:**
```bash
# Test health endpoints
curl http://localhost:3001/health
curl http://localhost:3001/health/ready
curl http://localhost:3001/health/detailed
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "solana": "connected",
  "ethereum": "connected"
}
```

### 6. Monitoring & Logging
**Verify:**
- [ ] Sentry configured and capturing errors
- [ ] BetterUptime monitoring active
- [ ] Log aggregation working
- [ ] Slack alerts configured
- [ ] Metrics collection active

**Check Command:**
```bash
# Trigger test error
curl -X POST http://localhost:3001/api/test/error

# Check Sentry dashboard for event
```

**Red Flags:**
- Sentry not capturing errors
- Monitoring not reporting
- Logs not being collected
- Alerts not firing

### 7. Backup & Recovery
**Verify:**
- [ ] Automated backups configured
- [ ] Backup script tested
- [ ] Backup encryption working
- [ ] Backup uploaded to S3/Spaces
- [ ] Restore procedure tested
- [ ] Rollback script ready

**Check Command:**
```bash
# Test backup
./scripts/backup-database.sh

# Verify backup in S3
aws s3 ls s3://advancia-backups/daily/
```

**Red Flags:**
- Backup script failing
- Backups not encrypted
- No recent backup available
- Restore never tested

### 8. Performance
**Verify:**
- [ ] API response times < 500ms (p95)
- [ ] Database queries optimized
- [ ] Redis caching working
- [ ] No memory leaks
- [ ] Connection pooling configured

**Check Command:**
```bash
# Load test
npm run load-test

# Check memory usage
node --inspect src/index.ts
```

**Red Flags:**
- Slow API responses
- Memory growing over time
- Database connection exhaustion
- High CPU usage at idle

### 9. Security
**Verify:**
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Security headers set (helmet)
- [ ] HTTPS enforced
- [ ] Sensitive data filtered from logs
- [ ] Authentication required on protected routes

**Check Command:**
```bash
# Test rate limiting
for i in {1..100}; do curl http://localhost:3001/api/auth/login; done

# Check security headers
curl -I https://api.advanciapayledger.com
```

**Red Flags:**
- No rate limiting
- CORS set to `*`
- Missing security headers
- HTTP allowed in production

### 10. Documentation
**Verify:**
- [ ] API documentation updated
- [ ] Runbook current
- [ ] Deployment guide accurate
- [ ] Rollback procedure documented
- [ ] On-call contacts updated

**Red Flags:**
- Outdated documentation
- Missing runbook
- No rollback procedure
- Unclear deployment steps

## Deployment Decision Matrix

### ✅ PROCEED with deployment if:
- All critical checks pass
- No high-severity vulnerabilities
- All tests passing
- Backup available
- Rollback plan ready
- Monitoring active

### ⚠️ PROCEED WITH CAUTION if:
- Minor issues present
- Non-critical tests failing
- Low-severity vulnerabilities
- Performance slightly degraded

### 🛑 DO NOT DEPLOY if:
- Critical security vulnerabilities
- Database migration issues
- Core functionality broken
- No backup available
- Monitoring not working
- Missing required environment variables

## Post-Deployment Verification

**Immediately after deployment:**
```bash
# 1. Health check
curl https://api.advanciapayledger.com/health

# 2. Test critical path
curl -X POST https://api.advanciapayledger.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 3. Check error tracking
# Trigger test error and verify Sentry captures it

# 4. Monitor logs
# Watch for errors in first 5 minutes

# 5. Check metrics
# Verify response times normal
```

**Within 1 hour:**
- [ ] No spike in error rate
- [ ] Response times normal
- [ ] No customer complaints
- [ ] Monitoring shows healthy
- [ ] Database performance normal

**Within 24 hours:**
- [ ] All background jobs running
- [ ] Automated backups successful
- [ ] No memory leaks detected
- [ ] Performance metrics stable

## Rollback Triggers

**Immediate rollback if:**
- Error rate > 5%
- API response time > 2s (p95)
- Database connection failures
- Payment processing failures
- Critical security issue discovered
- Data corruption detected

**Rollback Command:**
```bash
./scripts/rollback.sh
```

## Deployment Checklist Summary

```
Environment:     [ ]
Migrations:      [ ]
Dependencies:    [ ]
Tests:           [ ]
Health Checks:   [ ]
Monitoring:      [ ]
Backups:         [ ]
Performance:     [ ]
Security:        [ ]
Documentation:   [ ]

Decision: PROCEED / CAUTION / STOP
```

## Contact Information

**On-Call Engineer:** [Phone/Slack]
**Database Admin:** [Contact]
**Security Lead:** [Contact]
**CEO (Critical Issues):** [Contact]

## Deployment Log Template

```
Date: [YYYY-MM-DD HH:MM UTC]
Version: [git commit hash]
Deployed By: [Name]
Environment: Production

Pre-Deployment Checks:
- Environment: ✅
- Migrations: ✅
- Tests: ✅
- Health: ✅
- Monitoring: ✅

Deployment Steps:
1. [Step with timestamp]
2. [Step with timestamp]
3. [Step with timestamp]

Post-Deployment Verification:
- Health Check: ✅ [timestamp]
- Error Rate: 0.1% [timestamp]
- Response Time: 250ms p95 [timestamp]

Issues: None / [List any issues]
Rollback: Not needed / [Reason and timestamp]
```
