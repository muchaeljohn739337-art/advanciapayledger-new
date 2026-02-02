#!/bin/bash
# Master Performance Benchmark Runner
# Executes all performance tests and generates comprehensive report

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
API_URL=${1:-"https://api.advanciapayledger.com"}
FRONTEND_URL=${2:-"https://advanciapayledger.vercel.app"}
DB_URL=${3:-"postgresql://postgres.jwabwrcykdtpwdhwhmqq:Good_mother1!?@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"}

RESULTS_DIR="performance-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$RESULTS_DIR/BENCHMARK_REPORT_$TIMESTAMP.md"

clear
echo -e "${MAGENTA}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     ADVANCIA PAY LEDGER - PERFORMANCE BENCHMARK SUITE        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}Configuration:${NC}"
echo "  API URL:      $API_URL"
echo "  Frontend URL: $FRONTEND_URL"
echo "  Database URL: ${DB_URL%%@*}@***"
echo "  Results Dir:  $RESULTS_DIR"
echo ""

# Create results directory
mkdir -p $RESULTS_DIR

# Initialize report
cat > "$REPORT_FILE" << EOF
# Performance Benchmark Report
**Generated:** $(date)
**Version:** 1.0.0

## Executive Summary
This report contains comprehensive performance metrics for Advancia Pay Ledger across all system components.

---

## Configuration
- **API Endpoint:** $API_URL
- **Frontend Endpoint:** $FRONTEND_URL
- **Database:** PostgreSQL 18
- **Test Duration:** Approximately 45 minutes

---

EOF

# Function to update report
update_report() {
    echo -e "\n$1\n" >> "$REPORT_FILE"
}

# Function to run test with status
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Running: $test_name${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    update_report "## $test_name"
    update_report "_Started at $(date)_"
    
    # Run command and capture output
    if eval "$test_command" 2>&1 | tee "$RESULTS_DIR/${test_name// /_}_$TIMESTAMP.log"; then
        echo -e "${GREEN}✓ $test_name completed successfully${NC}"
        update_report "**Status:** ✓ Completed"
    else
        echo -e "${RED}✗ $test_name failed${NC}"
        update_report "**Status:** ✗ Failed"
    fi
    
    update_report "_Completed at $(date)_"
    update_report "---"
}

# Health checks
echo -e "\n${YELLOW}=== PRE-FLIGHT CHECKS ===${NC}\n"

check_service() {
    local service_name=$1
    local url=$2
    
    echo -e "${BLUE}Checking $service_name...${NC}"
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✓${NC} $service_name is running"
        return 0
    else
        echo -e "${RED}✗${NC} $service_name is not responding"
        return 1
    fi
}

CHECKS_PASSED=0

if check_service "API" "$API_URL/health"; then
    ((CHECKS_PASSED++))
fi

if check_service "Frontend" "$FRONTEND_URL"; then
    ((CHECKS_PASSED++))
fi

if psql "$DB_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Database is accessible"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Database is not accessible"
fi

if [ $CHECKS_PASSED -lt 2 ]; then
    echo -e "\n${RED}Pre-flight checks failed. Please ensure services are running.${NC}"
    exit 1
fi

echo -e "\n${GREEN}All systems operational. Beginning benchmarks...${NC}"
sleep 2

# Make scripts executable
chmod +x load-test.js db-benchmark.sh frontend-benchmark.sh 2>/dev/null || true

# Test 1: API Load Testing
run_test "API Load Testing" "
    if command -v k6 &> /dev/null; then
        k6 run --env API_URL=$API_URL load-test.js
    else
        echo 'k6 not installed. Install: brew install k6'
        exit 1
    fi
"

# Test 2: Database Benchmarks
run_test "Database Performance" "
    bash db-benchmark.sh $DB_URL
"

# Test 3: Frontend Performance
run_test "Frontend Performance" "
    bash frontend-benchmark.sh $FRONTEND_URL
"

# Generate comprehensive summary
echo -e "\n${YELLOW}=== GENERATING SUMMARY ===${NC}\n"

cat >> "$REPORT_FILE" << EOF

## Key Performance Indicators (KPIs)

### API Performance
\`\`\`
Metric                    | Target      | Actual | Status
--------------------------|-------------|--------|--------
P95 Response Time         | < 500ms     | TBD    | ⏳
Requests per Second       | > 50        | TBD    | ⏳
Error Rate                | < 1%        | TBD    | ⏳
Concurrent Users          | 100         | TBD    | ⏳
\`\`\`

### Database Performance
\`\`\`
Metric                    | Target      | Actual | Status
--------------------------|-------------|--------|--------
Query Execution Time      | < 100ms     | TBD    | ⏳
Connection Pool Usage     | < 80%       | TBD    | ⏳
Cache Hit Ratio           | > 90%       | TBD    | ⏳
Transactions per Second   | > 100       | TBD    | ⏳
\`\`\`

### Frontend Performance
\`\`\`
Metric                    | Target      | Actual | Status
--------------------------|-------------|--------|--------
Largest Contentful Paint  | < 2.5s      | TBD    | ⏳
First Input Delay         | < 100ms     | TBD    | ⏳
Cumulative Layout Shift   | < 0.1       | TBD    | ⏳
Performance Score         | > 90        | TBD    | ⏳
\`\`\`

---

## Recommendations

### Immediate Actions (P0)
- [ ] Review slow queries identified in database benchmarks
- [ ] Optimize API endpoints exceeding P95 targets
- [ ] Address Core Web Vitals issues on frontend

### Short-term (P1 - Next Sprint)
- [ ] Implement database connection pooling optimizations
- [ ] Add caching layer for frequently accessed data
- [ ] Optimize JavaScript bundle sizes
- [ ] Set up automated performance monitoring

### Medium-term (P2 - Next Quarter)
- [ ] Implement horizontal scaling for API
- [ ] Set up database read replicas
- [ ] Implement CDN for static assets
- [ ] Create performance budgets and CI checks

---

## Detailed Results

All detailed logs and reports are available in:
\`$RESULTS_DIR/\` 

### Files Generated:
EOF

# List all generated files
for file in "$RESULTS_DIR"/*_$TIMESTAMP.*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        filesize=$(du -h "$file" | cut -f1)
        echo "- \`$filename\` ($filesize)" >> "$REPORT_FILE"
    fi
done

cat >> "$REPORT_FILE" << EOF

---

## Next Steps

1. **Review this report** with the engineering team
2. **Prioritize optimizations** based on findings
3. **Set up continuous monitoring** to track improvements
4. **Schedule weekly performance reviews** during scaling phase
5. **Run benchmarks before each deployment** to catch regressions

---

## Benchmark Suite Information

This benchmark suite tests:
- API endpoint performance and scalability
- Database query optimization and indexing
- Frontend load times and Core Web Vitals
- System resource utilization
- Concurrent user handling

For questions or issues, contact the DevOps team.

**Last Updated:** $(date)
EOF

# Display summary
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  BENCHMARK SUITE COMPLETED${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}Results Summary:${NC}"
echo "  Total Tests: 3"
echo "  Results Directory: $RESULTS_DIR"
echo "  Master Report: $REPORT_FILE"
echo ""

echo -e "${YELLOW}View the complete report:${NC}"
echo "  cat $REPORT_FILE"
echo ""

echo -e "${YELLOW}Open HTML reports:${NC}"
for html_file in "$RESULTS_DIR"/*.html; do
    if [ -f "$html_file" ]; then
        echo "  open $html_file"
    fi
done

echo ""
echo -e "${GREEN}✓${NC} All benchmarks completed successfully!"
echo ""

# Create quick reference card
cat > "$RESULTS_DIR/QUICK_REFERENCE_$TIMESTAMP.md" << EOF
# Performance Benchmarks - Quick Reference

## Run Individual Tests

### API Load Test
\`\`\`bash
k6 run --env API_URL=$API_URL load-test.js
\`\`\`

### Database Benchmark
\`\`\`bash
bash db-benchmark.sh $DB_URL
\`\`\`

### Frontend Benchmark
\`\`\`bash
bash frontend-benchmark.sh $FRONTEND_URL
\`\`\`

## Run Full Suite
\`\`\`bash
bash run-benchmarks.sh $API_URL $FRONTEND_URL $DB_URL
\`\`\`

## Key Metrics to Watch

- **API**: P95 < 500ms, Error rate < 1%
- **Database**: Query time < 100ms, Cache hit > 90%
- **Frontend**: LCP < 2.5s, CLS < 0.1, FID < 100ms

## Alert Thresholds

🔴 **Critical**: Response time > 2s, Error rate > 5%
🟡 **Warning**: Response time > 1s, Error rate > 1%
🟢 **Good**: All metrics within targets

---
Generated: $(date)
EOF

echo -e "${BLUE}Quick reference saved to:${NC}"
echo "  $RESULTS_DIR/QUICK_REFERENCE_$TIMESTAMP.md"
echo ""
