# 🚀 Quick Start - Security Implementation

## ⚡ 5-Minute Setup Guide

### **Step 1: Install Dependencies**
```bash
cd backend
npm install ioredis stripe
npm install --save-dev @types/ioredis
```

### **Step 2: Environment Variables**
Create/update `backend/.env`:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/advancia

# Redis (Required for locks)
REDIS_URL=redis://localhost:6379

# Stripe (Required for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Security
NODE_ENV=production
JWT_SECRET=your-jwt-secret-here

# Optional
PORT=3000
```

### **Step 3: Run Prisma Migration**
```bash
cd backend
npx prisma migrate dev --name add_security_tables
npx prisma generate
```

### **Step 4: Apply RLS Policies**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `ENABLE_RLS_COMPLETE_26_TABLES.sql`
3. Paste and click **Run**
4. Verify: All 26 tables should show `rls_enabled = true`

### **Step 5: Start Services**
```bash
# Terminal 1: Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Terminal 2: Start Backend
cd backend
npm run dev
```

### **Step 6: Test Security**
```bash
# Run security tests
npm test -- parallelRequestTests

# Expected: All tests pass ✅
```

---

## 🔧 Integration Checklist

### **Backend Integration**
- [ ] Services initialized in `backend/src/config/services.ts`
- [ ] Routes mounted:
  - `/api/wallet/*` → wallet.routes.ts
  - `/api/payments/*` → payment.routes.ts
  - `/webhooks/stripe` → payment.routes.ts
- [ ] Rate limiters applied to routes
- [ ] GraphQL security middleware configured
- [ ] Authentication middleware in place

### **Security Verification**
- [ ] Redis connection working (`redis-cli ping` → PONG)
- [ ] Stripe webhook signature verification enabled
- [ ] Idempotency keys required for all payment endpoints
- [ ] RLS enabled on all 26 tables in Supabase
- [ ] No `/var/run/docker.sock` in docker-compose.yml

---

## 📝 Example API Calls

### **Wallet Debit (with idempotency)**
```bash
curl -X POST http://localhost:3000/api/wallet/debit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Idempotency-Key: debit-$(date +%s)" \
  -d '{
    "amount": 50,
    "currency": "USD",
    "description": "Payment for consultation"
  }'
```

### **Payment Processing**
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Idempotency-Key: payment-$(date +%s)" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "paymentMethod": "CREDIT_CARD",
    "description": "Medical consultation",
    "patientId": "patient-uuid",
    "facilityId": "facility-uuid"
  }'
```

### **Transfer Between Users**
```bash
curl -X POST http://localhost:3000/api/wallet/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Idempotency-Key: transfer-$(date +%s)" \
  -d '{
    "toUserId": "recipient-uuid",
    "amount": 25,
    "currency": "USD"
  }'
```

---

## 🧪 Testing Parallel Requests

### **Test Double Spend Prevention**
```bash
# Send 10 parallel debit requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/wallet/debit \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Idempotency-Key: test-parallel-$i" \
    -d '{"amount": 10, "currency": "USD"}' &
done
wait

# Expected: Only valid debits succeed, no negative balance
```

### **Test Idempotency**
```bash
# Send same request 5 times with same idempotency key
KEY="test-idempotency-$(date +%s)"
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/wallet/debit \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Idempotency-Key: $KEY" \
    -d '{"amount": 10, "currency": "USD"}'
done

# Expected: Same response 5 times, only 1 debit executed
```

---

## 🔍 Monitoring

### **Check Redis Locks**
```bash
redis-cli keys "lock:*"
# Should show active locks during operations
```

### **Check Idempotency Keys**
```bash
redis-cli keys "idempotency:*"
# Should show cached results
```

### **Check Lock TTL**
```bash
redis-cli ttl "lock:wallet:user123:USD"
# Should show remaining seconds (0-5)
```

### **Monitor Rate Limits**
```bash
redis-cli keys "ratelimit:*"
# Shows rate limit counters per user/IP
```

---

## ⚠️ Common Issues & Fixes

### **Issue: "Failed to acquire lock"**
```bash
# Check Redis connection
redis-cli ping

# Check for stuck locks
redis-cli keys "lock:*"

# Clear stuck locks (development only!)
redis-cli del "lock:wallet:user123:USD"
```

### **Issue: "Idempotency-Key header required"**
```bash
# Always include in requests
-H "Idempotency-Key: unique-key-here"

# Generate unique keys
-H "Idempotency-Key: payment-$(uuidgen)"
```

### **Issue: "Insufficient balance"**
```bash
# Check current balance
curl http://localhost:3000/api/wallet/balance/USD \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Credit wallet first
curl -X POST http://localhost:3000/api/wallet/credit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Idempotency-Key: credit-$(date +%s)" \
  -d '{"amount": 100, "currency": "USD"}'
```

### **Issue: Stripe webhook failing**
```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/webhooks/stripe

# Verify webhook secret matches
echo $STRIPE_WEBHOOK_SECRET
```

---

## 📊 Health Checks

### **System Health**
```bash
# Check all services
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "redis": "connected",
  "database": "connected",
  "stripe": "configured"
}
```

### **Security Status**
```bash
# Verify RLS enabled
psql $DATABASE_URL -c "
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
"

# Expected: 26 tables with RLS enabled
```

---

## 🎯 Production Deployment

### **Pre-Deployment Checklist**
- [ ] All tests passing
- [ ] Redis cluster configured (not single instance)
- [ ] Stripe live keys configured
- [ ] RLS enabled in production database
- [ ] Rate limiters configured
- [ ] Monitoring alerts set up
- [ ] No docker.sock exposure
- [ ] Secrets in environment (not code)

### **Deploy Command**
```bash
# Build
docker-compose build

# Deploy
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs -f backend
```

---

## 🆘 Emergency Procedures

### **High Lock Contention**
```bash
# Check lock wait times
redis-cli --latency

# Increase lock TTL temporarily
# Edit: redisLockService.ts → DEFAULT_TTL = 10
```

### **Redis Down**
```bash
# Backend will reject new requests gracefully
# Restart Redis
docker-compose restart redis

# Verify
redis-cli ping
```

### **Database Connection Issues**
```bash
# Check connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Restart backend to reset pool
docker-compose restart backend
```

---

## ✅ Success Criteria

Your system is working correctly when:
- ✅ 10 parallel debits don't cause double spend
- ✅ Same idempotency key returns same result
- ✅ Negative balance attempts are rejected
- ✅ Transfers maintain total balance (no money created/destroyed)
- ✅ Rate limits block excessive requests
- ✅ GraphQL deep queries are rejected
- ✅ Stripe webhooks process successfully

---

## 📚 Next Steps

1. **Load Testing:** Use Apache Bench or k6 for 100+ concurrent users
2. **Security Audit:** Run OWASP ZAP or similar tools
3. **Monitoring:** Set up Datadog, New Relic, or Prometheus
4. **Alerts:** Configure PagerDuty or similar for critical issues
5. **Documentation:** Update API docs with security requirements

---

**Your system is now production-ready! 🚀**

For detailed information, see:
- `SECURITY_IMPLEMENTATION_GUIDE.md`
- `PRODUCTION_SECURITY_CHECKLIST.md`
- `DOCKER_SECURITY_AUDIT.md`
