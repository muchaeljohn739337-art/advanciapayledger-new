#!/bin/bash
# Database Performance Benchmarks for Advancia Pay Ledger
# Usage: ./db-benchmark.sh [database_url]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_URL=${1:-"postgresql://postgres.jwabwrcykdtpwdhwhmqq:Good_mother1!?@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"}
PGBENCH_SCALE=10
PGBENCH_CLIENTS=50
PGBENCH_DURATION=300 # 5 minutes
RESULTS_DIR="benchmark-results"

echo "========================================="
echo "Database Performance Benchmark"
echo "========================================="
echo "Database: ${DB_URL%%@*}@***"
echo "Scale: $PGBENCH_SCALE"
echo "Clients: $PGBENCH_CLIENTS"
echo "Duration: ${PGBENCH_DURATION}s"
echo "========================================="

# Create results directory
mkdir -p $RESULTS_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Function to run SQL query and measure time
run_query() {
    local query_name=$1
    local query=$2
    
    echo -e "\n${YELLOW}Running: $query_name${NC}"
    
    TIMEFORMAT='%3R'
    exec_time=$( { time psql "$DB_URL" -c "$query" > /dev/null 2>&1; } 2>&1 )
    
    echo -e "${GREEN}✓${NC} Completed in ${exec_time}s"
    echo "$query_name,$exec_time" >> "$RESULTS_DIR/query_times_$TIMESTAMP.csv"
}

# Function to analyze query plan
analyze_query() {
    local query_name=$1
    local query=$2
    
    echo -e "\n${YELLOW}Analyzing: $query_name${NC}"
    
    psql "$DB_URL" -c "EXPLAIN ANALYZE $query" > "$RESULTS_DIR/${query_name}_plan_$TIMESTAMP.txt"
    echo -e "${GREEN}✓${NC} Query plan saved"
}

# Initialize results file
echo "Query,Execution_Time_Seconds" > "$RESULTS_DIR/query_times_$TIMESTAMP.csv"

echo -e "\n${YELLOW}=== 1. BASIC PGBENCH TESTS ===${NC}"

# Standard pgbench test (TPC-B-like)
if command -v pgbench &> /dev/null; then
    echo -e "\n${YELLOW}Running standard pgbench (TPC-B)...${NC}"
    pgbench -i -s $PGBENCH_SCALE "$DB_URL" > /dev/null 2>&1 || echo "Skipping pgbench init"
    pgbench -c $PGBENCH_CLIENTS -j 4 -T $PGBENCH_DURATION "$DB_URL" > "$RESULTS_DIR/pgbench_standard_$TIMESTAMP.txt" 2>&1 || echo "pgbench failed"

    if [ -f "$RESULTS_DIR/pgbench_standard_$TIMESTAMP.txt" ]; then
        echo -e "${GREEN}✓${NC} Standard pgbench completed"
        cat "$RESULTS_DIR/pgbench_standard_$TIMESTAMP.txt" | grep -E "tps|latency" || true
    fi

    echo -e "\n${YELLOW}=== 2. READ-ONLY TESTS ===${NC}"

    # Read-only pgbench
    pgbench -c $PGBENCH_CLIENTS -j 4 -T 60 -S "$DB_URL" > "$RESULTS_DIR/pgbench_readonly_$TIMESTAMP.txt" 2>&1 || echo "Read-only pgbench failed"

    if [ -f "$RESULTS_DIR/pgbench_readonly_$TIMESTAMP.txt" ]; then
        echo -e "${GREEN}✓${NC} Read-only pgbench completed"
        cat "$RESULTS_DIR/pgbench_readonly_$TIMESTAMP.txt" | grep -E "tps|latency" || true
    fi
else
    echo -e "${YELLOW}⚠${NC} pgbench not installed, skipping pgbench tests"
fi

echo -e "\n${YELLOW}=== 3. APPLICATION-SPECIFIC QUERIES ===${NC}"

# Patient lookup (indexed)
run_query "patient_lookup_by_id" "
SELECT * FROM patients WHERE id = 1 LIMIT 1;
"

# Patient search by email
run_query "patient_search_by_email" "
SELECT * FROM patients WHERE email LIKE '%test%' LIMIT 10;
"

# Transaction creation
run_query "transaction_insert" "
INSERT INTO transactions (
    facility_id, patient_id, amount, status, created_at
) VALUES (
    1, 1, 100.00, 'completed', NOW()
) RETURNING *;
"

# Dashboard revenue query (30 days)
run_query "dashboard_revenue_30days" "
SELECT 
    DATE_TRUNC('day', created_at) as date,
    SUM(amount) as revenue,
    COUNT(*) as transaction_count
FROM transactions
WHERE facility_id = 1 
    AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;
"

# Facility analytics
run_query "facility_analytics" "
SELECT 
    f.id,
    f.name,
    COUNT(DISTINCT p.id) as patient_count,
    COUNT(t.id) as transaction_count,
    COALESCE(SUM(t.amount), 0) as total_revenue
FROM facilities f
LEFT JOIN patients p ON p.facility_id = f.id
LEFT JOIN transactions t ON t.facility_id = f.id
WHERE f.id = 1
GROUP BY f.id, f.name;
"

# Complex join query
run_query "complex_join_analytics" "
SELECT 
    f.name as facility,
    p.first_name || ' ' || p.last_name as patient,
    COUNT(t.id) as transaction_count,
    SUM(t.amount) as total_spent,
    AVG(t.amount) as avg_transaction
FROM facilities f
INNER JOIN patients p ON p.facility_id = f.id
INNER JOIN transactions t ON t.patient_id = p.id
WHERE t.created_at >= NOW() - INTERVAL '90 days'
GROUP BY f.id, f.name, p.id, p.first_name, p.last_name
HAVING COUNT(t.id) > 0
ORDER BY total_spent DESC
LIMIT 100;
"

echo -e "\n${YELLOW}=== 4. QUERY PLAN ANALYSIS ===${NC}"

# Analyze critical queries
analyze_query "patient_lookup" "
SELECT * FROM patients WHERE id = 1;
"

analyze_query "dashboard_revenue" "
SELECT 
    DATE_TRUNC('day', created_at) as date,
    SUM(amount) as revenue
FROM transactions
WHERE facility_id = 1 
    AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY date;
"

echo -e "\n${YELLOW}=== 5. INDEX EFFICIENCY ===${NC}"

# Check index usage
psql "$DB_URL" -c "
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
" > "$RESULTS_DIR/index_usage_$TIMESTAMP.txt"

echo -e "${GREEN}✓${NC} Index usage statistics saved"

# Find unused indexes
psql "$DB_URL" -c "
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
" > "$RESULTS_DIR/unused_indexes_$TIMESTAMP.txt"

echo -e "${GREEN}✓${NC} Unused indexes report saved"

echo -e "\n${YELLOW}=== 6. TABLE STATISTICS ===${NC}"

# Table sizes
psql "$DB_URL" -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
" > "$RESULTS_DIR/table_sizes_$TIMESTAMP.txt"

echo -e "${GREEN}✓${NC} Table sizes saved"

# Row counts
psql "$DB_URL" -c "
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
" > "$RESULTS_DIR/row_counts_$TIMESTAMP.txt"

echo -e "${GREEN}✓${NC} Row counts saved"

echo -e "\n${YELLOW}=== 7. SLOW QUERIES ===${NC}"

# Enable pg_stat_statements if not already enabled
psql "$DB_URL" -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;" > /dev/null 2>&1 || echo "pg_stat_statements extension may not be available"

# Top 20 slowest queries
psql "$DB_URL" -c "
SELECT 
    calls,
    ROUND(total_exec_time::numeric, 2) as total_time_ms,
    ROUND(mean_exec_time::numeric, 2) as avg_time_ms,
    ROUND((100 * total_exec_time / NULLIF(SUM(total_exec_time) OVER (), 0))::numeric, 2) AS percentage,
    LEFT(query, 100) as query_preview
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
" > "$RESULTS_DIR/slow_queries_$TIMESTAMP.txt" 2>&1 || echo "Could not retrieve slow queries"

echo -e "${GREEN}✓${NC} Slow queries report saved"

echo -e "\n${YELLOW}=== 8. CONNECTION POOL STATS ===${NC}"

# Current connections
psql "$DB_URL" -c "
SELECT 
    state,
    COUNT(*) as connection_count
FROM pg_stat_activity
GROUP BY state;
" > "$RESULTS_DIR/connections_$TIMESTAMP.txt"

echo -e "${GREEN}✓${NC} Connection statistics saved"

echo -e "\n${YELLOW}=== 9. CACHE HIT RATIO ===${NC}"

# Cache hit ratio (should be > 90%)
psql "$DB_URL" -c "
SELECT 
    'index hit rate' AS name,
    (sum(idx_blks_hit)) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0) * 100 AS ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT 
    'table hit rate' AS name,
    sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100 AS ratio
FROM pg_statio_user_tables;
" > "$RESULTS_DIR/cache_hit_ratio_$TIMESTAMP.txt"

cat "$RESULTS_DIR/cache_hit_ratio_$TIMESTAMP.txt"

echo -e "\n${YELLOW}=== 10. CUSTOM BENCHMARK QUERIES ===${NC}"

# Create custom benchmark file
cat > /tmp/custom_benchmark.sql << 'EOF'
\set patient_id random(1, 10000)
\set facility_id random(1, 24)
\set amount random(10, 500)

-- Patient lookup
SELECT * FROM patients WHERE id = :patient_id LIMIT 1;

-- Dashboard query
SELECT COUNT(*), SUM(amount) 
FROM transactions 
WHERE facility_id = :facility_id 
    AND created_at >= NOW() - INTERVAL '7 days';
EOF

if command -v pgbench &> /dev/null; then
    echo -e "\n${YELLOW}Running custom benchmark (mixed workload)...${NC}"
    pgbench -c 50 -j 4 -T 120 -f /tmp/custom_benchmark.sql "$DB_URL" > "$RESULTS_DIR/custom_benchmark_$TIMESTAMP.txt" 2>&1 || echo "Custom benchmark failed"

    if [ -f "$RESULTS_DIR/custom_benchmark_$TIMESTAMP.txt" ]; then
        echo -e "${GREEN}✓${NC} Custom benchmark completed"
        cat "$RESULTS_DIR/custom_benchmark_$TIMESTAMP.txt" | grep -E "tps|latency" || true
    fi
fi

# Cleanup
rm -f /tmp/custom_benchmark.sql

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}Benchmark Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "Results saved to: ${YELLOW}$RESULTS_DIR/${NC}"
echo ""
echo "Key files:"
echo "  - query_times_$TIMESTAMP.csv (query execution times)"
echo "  - pgbench_standard_$TIMESTAMP.txt (standard benchmark)"
echo "  - slow_queries_$TIMESTAMP.txt (slowest queries)"
echo "  - cache_hit_ratio_$TIMESTAMP.txt (cache performance)"
echo "  - table_sizes_$TIMESTAMP.txt (storage usage)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review slow queries and optimize"
echo "2. Check cache hit ratio (should be > 90%)"
echo "3. Identify unused indexes"
echo "4. Monitor table growth"
echo ""
