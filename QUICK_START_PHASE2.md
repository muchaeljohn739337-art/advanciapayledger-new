# Phase 2 Quick Start Guide - FREE TIER

## 🎯 Total Cost: $0/month

Get monitoring, security, and API docs running in **under 30 minutes**.

---

## Step 1: Install Dependencies (5 minutes)

```bash
cd backend
npm install swagger-jsdoc swagger-ui-express prom-client
npm install -D @types/swagger-jsdoc @types/swagger-ui-express
```

---

## Step 2: Update Backend App (2 minutes)

Add these imports to `backend/src/app.ts`:

```typescript
import { setupSwagger } from './config/swagger';
import { metricsMiddleware } from './services/metrics';
import metricsRouter from './routes/metrics';
import kycRouter from './routes/kyc';
```

Add after middleware setup (around line 72):

```typescript
// Metrics middleware (add early)
app.use(metricsMiddleware);

// Swagger documentation
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DOCS === 'true') {
  setupSwagger(app);
}
```

Add with other routes (around line 100):

```typescript
app.use('/api', metricsRouter);
app.use('/api/kyc', kycRouter);
```

---

## Step 3: Update Package.json Scripts (1 minute)

Add to `backend/package.json`:

```json
{
  "scripts": {
    "snyk:test": "snyk test",
    "snyk:monitor": "snyk monitor"
  }
}
```

---

## Step 4: Set Up Snyk (5 minutes)

1. **Sign up**: https://snyk.io (use GitHub login)
2. **Connect repository**: Link your GitHub repo
3. **Get API token**: Settings → API Token
4. **Add to GitHub Secrets**:
   - Go to GitHub repo → Settings → Secrets → Actions
   - Add `SNYK_TOKEN` with your token

The workflow is already created at `.github/workflows/snyk-free.yml`

---

## Step 5: Start Monitoring Stack (5 minutes)

```bash
cd infrastructure/monitoring
docker-compose up -d
```

**Access**:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)

---

## Step 6: Test Everything (5 minutes)

### Test Swagger Docs
```bash
cd backend
npm run dev
# Visit: http://localhost:3001/api-docs
```

### Test Metrics
```bash
curl http://localhost:3001/api/metrics
# Should see Prometheus metrics
```

### Test Grafana
1. Open http://localhost:3000
2. Login: admin/admin
3. Go to Dashboards → Import
4. Enter ID: `1860`
5. Select Prometheus datasource
6. Import

---

## Step 7: Add Swagger Documentation to Routes (Ongoing)

Example for any route file:

```typescript
/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               recipientId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment created
 */
router.post('/', authenticateToken, createPayment);
```

---

## Step 8: Add Metrics Tracking to Controllers (Ongoing)

Example in payment controller:

```typescript
import { trackPayment } from '../services/metrics';

export const createPayment = async (req, res) => {
  try {
    const payment = await prisma.payment.create({ data: req.body });
    
    // Track metric
    trackPayment('completed', 'transfer', payment.amount);
    
    res.json({ success: true, data: payment });
  } catch (error) {
    trackPayment('failed', 'transfer', 0);
    res.status(500).json({ success: false });
  }
};
```

---

## Step 9: Enable KYC (When Needed)

### Add to Prisma Schema

```prisma
model KycVerification {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  sessionId   String    @unique
  provider    String    @default("stripe")
  status      String    @default("pending")
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([userId])
  @@index([status])
}
```

### Run Migration

```bash
cd backend
npx prisma migrate dev --name add_kyc_verification
```

### Add to User Model

```prisma
model User {
  // ... existing fields
  kycVerifications KycVerification[]
}
```

---

## ✅ Verification Checklist

- [ ] Swagger docs accessible at `/api-docs`
- [ ] Metrics endpoint working at `/api/metrics`
- [ ] Prometheus scraping metrics (check http://localhost:9090/targets)
- [ ] Grafana showing dashboards
- [ ] Snyk workflow running on GitHub
- [ ] KYC routes available (if needed)

---

## 🎯 What You Get

### 1. **Snyk Security Scanning**
- Weekly vulnerability scans
- Dependency monitoring
- GitHub PR checks
- **Cost: FREE** (200 tests/month)

### 2. **OpenAPI/Swagger Docs**
- Interactive API documentation
- Try-it-out functionality
- Auto-generated from code comments
- **Cost: FREE**

### 3. **Prometheus + Grafana**
- Real-time metrics
- Custom dashboards
- Performance monitoring
- **Cost: FREE** (self-hosted)

### 4. **KYC Integration**
- Stripe Identity verification
- $1.50 per verification
- No monthly fees
- **Cost: Pay-per-use**

---

## 📊 Monitoring Dashboards

### Key Metrics to Watch

1. **Request Rate**: `rate(http_requests_total[5m])`
2. **Error Rate**: `rate(http_requests_total{status_code=~"5.."}[5m])`
3. **Response Time**: `http_request_duration_seconds`
4. **Payment Volume**: `rate(payments_total[5m])`
5. **Active Users**: `active_users_total`

---

## 🔧 Troubleshooting

### Swagger not showing
- Check `NODE_ENV` is not 'production' OR set `ENABLE_DOCS=true`
- Verify swagger files exist in `backend/src/config/`
- Check console for errors

### Metrics not appearing
- Verify backend is running
- Check `/api/metrics` endpoint directly
- Ensure Prometheus can reach `host.docker.internal:3001`

### Grafana not connecting
- Check Prometheus is running: `docker ps`
- Verify datasource URL: `http://prometheus:9090`
- Check network connectivity

### Snyk not running
- Verify `SNYK_TOKEN` is in GitHub Secrets
- Check workflow file exists
- Look at GitHub Actions logs

---

## 🚀 Next Steps

### When You Hit 100 Users:
- Consider Grafana Cloud ($49/month) for easier management
- Upgrade Snyk if needed ($99/month)

### When You Hit $50k MRR:
- Add Datadog APM ($300/month)
- Consider SOC 2 compliance

### When You Hit $100k MRR:
- Add Drata/Vanta ($2,000/month)
- Full compliance automation

---

## 📚 Resources

- **Full Implementation Guide**: `PHASE2_FREE_TIER_IMPLEMENTATION.md`
- **Monitoring Setup**: `infrastructure/monitoring/README.md`
- **Snyk Docs**: https://docs.snyk.io
- **Swagger Docs**: https://swagger.io/docs
- **Prometheus Docs**: https://prometheus.io/docs
- **Grafana Docs**: https://grafana.com/docs

---

## 💡 Pro Tips

1. **Document as you go**: Add Swagger comments when creating routes
2. **Track business metrics**: Use custom metrics for key business events
3. **Set up alerts**: Configure Grafana alerts for critical issues
4. **Regular reviews**: Check Snyk reports weekly
5. **Monitor costs**: KYC is pay-per-use, track verification volume

---

**Total Setup Time**: ~30 minutes  
**Total Monthly Cost**: $0 + pay-per-use KYC  
**Maintenance**: ~1 hour/week

---

**Ready to deploy?** Follow the steps above and you'll have enterprise-grade monitoring without the enterprise price tag! 🚀
