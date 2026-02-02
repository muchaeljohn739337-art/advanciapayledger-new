# Performance Benchmark Guide

Complete guide for running performance benchmarks on Advancia PayLedger.

## 📋 Prerequisites

### Install Required Tools

#### macOS
```bash
# Install k6 for load testing
brew install k6

# Install Lighthouse for frontend testing
npm install -g lighthouse

# PostgreSQL client (if not installed)
brew install postgresql
```

#### Windows
```powershell
# Install k6
choco install k6

# Install Lighthouse
npm install -g lighthouse

# Install PostgreSQL client tools
# Download from: https://www.postgresql.org/download/windows/
```

#### Linux
```bash
# Install k6
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Install Lighthouse
npm install -g lighthouse

# Install PostgreSQL client
sudo apt-get install postgresql-client
```

## 🚀 Quick Start

### Run Full Benchmark Suite

#### macOS/Linux
```bash
chmod +x run-benchmarks.sh
./run-benchmarks.sh \
  http://147.182.193.11:3001 \
  https://your-app.vercel.app \
  postgresql://postgres.jwabwrcykdtpwdhwhmqq:Good_mother1!?@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
```

#### Windows PowerShell
```powershell
.\run-benchmarks.ps1 `
  -ApiUrl "http://147.182.193.11:3001" `
  -FrontendUrl "https://your-app.vercel.app" `
  -DatabaseUrl "postgresql://postgres.jwabwrcykdtpwdhwhmqq:Good_mother1!?@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

## 📊 Individual Benchmarks

### 1. API Load Testing (k6)

Tests API endpoints under various load conditions.

```bash
# Set API URL
export API_URL=http://147.182.193.11:3001

# Run load test
k6 run load-test.js
```

**What it tests:**
- Health check endpoint
- Authentication endpoints
- Wallet balance queries
- Transaction history
- Response times under load
- Error rates

**Load profile:**
- Ramp up: 0 → 10 → 50 → 100 users
- Duration: ~26 minutes
- Thresholds:
  - 95% requests < 500ms
  - 99% requests < 1000ms
  - Error rate < 1%

### 2. Database Benchmarking

Tests database performance and query optimization.

#### macOS/Linux
```bash
chmod +x db-benchmark.sh
./db-benchmark.sh "postgresql://user:pass@host:port/db"
```

#### Windows
Use the PowerShell script or run queries manually via `psql`.

**What it tests:**
- Connection latency
- Simple SELECT queries
- Complex JOIN operations
- Aggregation queries
- Index performance
- Write operations (INSERT)
- Transaction performance
- RLS policy overhead
- Concurrent connections
- Full-text search

### 3. Frontend Performance (Lighthouse)

Tests frontend performance, accessibility, and best practices.

#### macOS/Linux
```bash
chmod +x frontend-benchmark.sh
./frontend-benchmark.sh https://your-app.vercel.app
```

#### Windows
```powershell
# Run Lighthouse manually for each page
lighthouse https://your-app.vercel.app `
  --output=html `
  --output=json `
  --output-path=./lighthouse-home `
  --chrome-flags="--headless"
```

**What it tests:**
- Performance score
- Accessibility score
- Best practices score
- SEO score
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)

**Pages tested:**
- Home page (/)
- Login (/login)
- Dashboard (/dashboard)
- Wallet (/wallet)
- Transactions (/transactions)

## 📈 Understanding Results

### k6 Load Test Results

```
✓ checks.........................: 95.00%
✓ http_req_duration..............: avg=250.5ms
✓ http_req_failed................: 0.50%
✓ http_reqs......................: 15000
✓ iterations.....................: 3000
```

**Good performance:**
- Average response time < 300ms
- 95th percentile < 500ms
- Error rate < 1%

### Database Benchmark Results

```
Connection time: 45ms
Simple SELECT: 12ms
Complex JOIN: 85ms
Aggregation: 120ms
Indexed query: 8ms
INSERT: 15ms
Transaction: 25ms
RLS query: 18ms
```

**Good performance:**
- Connection < 100ms
- Simple queries < 50ms
- Complex queries < 200ms
- Writes < 50ms

### Lighthouse Results

```
Performance: 95
Accessibility: 98
Best Practices: 100
SEO: 100
First Contentful Paint: 1.2s
Largest Contentful Paint: 2.1s
Time to Interactive: 2.8s
```

**Good performance:**
- Performance score > 90
- Accessibility score > 90
- FCP < 1.8s
- LCP < 2.5s
- TTI < 3.9s

## 🔧 Customization

### Modify Load Test Profile

Edit `load-test.js`:

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '3m', target: 20 },   // Stay at 20 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
};
```

### Add Custom API Endpoints

In `load-test.js`, add new test scenarios:

```javascript
// Custom endpoint test
let customRes = http.get(`${BASE_URL}/api/custom-endpoint`, authParams);
check(customRes, {
  'custom endpoint status is 200': (r) => r.status === 200,
  'custom endpoint response time < 200ms': (r) => r.timings.duration < 200,
});
```

### Add Database Queries

In `db-benchmark.sh`, add new test cases:

```bash
# Test N: Custom Query
echo -e "${YELLOW}Test N: Custom Query${NC}"
START=$(date +%s%N)
psql "$DATABASE_URL" -c "YOUR CUSTOM QUERY HERE;" > /dev/null 2>&1
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "✓ Custom query: ${DURATION}ms"
```

## 📊 Continuous Monitoring

### Schedule Regular Benchmarks

#### Using cron (Linux/macOS)
```bash
# Run benchmarks daily at 2 AM
0 2 * * * /path/to/run-benchmarks.sh API_URL FRONTEND_URL DB_URL
```

#### Using Task Scheduler (Windows)
Create a scheduled task to run `run-benchmarks.ps1` daily.

### Compare Results Over Time

```bash
# Save results with timestamps
./run-benchmarks.sh ... > benchmark-$(date +%Y%m%d).log

# Compare with previous results
diff benchmark-20260101.log benchmark-20260201.log
```

## 🎯 Performance Targets

### API Performance
- **Response Time:** 95% < 500ms, 99% < 1000ms
- **Throughput:** > 100 requests/second
- **Error Rate:** < 1%
- **Availability:** > 99.9%

### Database Performance
- **Query Time:** 95% < 100ms
- **Connection Time:** < 50ms
- **Transaction Time:** < 100ms
- **Concurrent Connections:** Support 100+ connections

### Frontend Performance
- **Lighthouse Score:** > 90
- **FCP:** < 1.8s
- **LCP:** < 2.5s
- **TTI:** < 3.9s
- **CLS:** < 0.1

## 🐛 Troubleshooting

### k6 Issues

**Error: "k6: command not found"**
```bash
# Verify installation
which k6

# Reinstall if needed
brew reinstall k6  # macOS
```

### Lighthouse Issues

**Error: "lighthouse: command not found"**
```bash
# Verify installation
which lighthouse

# Reinstall if needed
npm install -g lighthouse
```

**Error: "Chrome not found"**
```bash
# Install Chrome or Chromium
# macOS: brew install --cask google-chrome
# Linux: sudo apt-get install chromium-browser
```

### Database Issues

**Error: "psql: command not found"**
```bash
# Install PostgreSQL client
brew install postgresql  # macOS
sudo apt-get install postgresql-client  # Linux
```

**Error: "Connection refused"**
- Check DATABASE_URL is correct
- Verify network connectivity
- Check firewall rules
- Verify database is running

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Web Vitals](https://web.dev/vitals/)

## 🔐 Security Notes

- Never commit database credentials to version control
- Use environment variables for sensitive data
- Rotate credentials regularly
- Run benchmarks in isolated environments
- Monitor for unusual patterns during load tests

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review error logs in results directory
3. Verify all prerequisites are installed
4. Check network connectivity
5. Contact the development team

---

**Last Updated:** February 1, 2026
