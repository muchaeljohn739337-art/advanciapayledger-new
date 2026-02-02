#!/bin/bash

# Frontend Performance Benchmark Script
# Tests frontend performance using Lighthouse

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🌐 Frontend Performance Benchmark${NC}"
echo "========================================"
echo ""

# Check if URL is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Frontend URL not provided${NC}"
    echo "Usage: ./frontend-benchmark.sh http://your-frontend-url"
    exit 1
fi

FRONTEND_URL=$1

# Check if lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
    echo -e "${RED}❌ Lighthouse is not installed${NC}"
    echo "Install with: npm install -g lighthouse"
    exit 1
fi

echo -e "${YELLOW}📊 Running Lighthouse audits...${NC}"
echo ""

# Create results directory
RESULTS_DIR="lighthouse-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p $RESULTS_DIR

# Test pages
PAGES=(
    "/"
    "/login"
    "/dashboard"
    "/wallet"
    "/transactions"
)

echo -e "${YELLOW}Testing pages:${NC}"
for page in "${PAGES[@]}"; do
    echo "  - $page"
done
echo ""

# Run Lighthouse for each page
for page in "${PAGES[@]}"; do
    PAGE_NAME=$(echo "$page" | sed 's/\//-/g' | sed 's/^-//')
    if [ -z "$PAGE_NAME" ]; then
        PAGE_NAME="home"
    fi
    
    echo -e "${YELLOW}Testing: $page${NC}"
    
    lighthouse "${FRONTEND_URL}${page}" \
        --output=html \
        --output=json \
        --output-path="${RESULTS_DIR}/${PAGE_NAME}" \
        --chrome-flags="--headless --no-sandbox" \
        --quiet \
        --only-categories=performance,accessibility,best-practices,seo \
        2>/dev/null || echo "Warning: Could not test $page"
    
    echo "✓ Completed: $page"
done

echo ""
echo -e "${GREEN}✅ Frontend benchmark complete!${NC}"
echo "Results saved to: $RESULTS_DIR/"
echo ""

# Generate summary report
SUMMARY_FILE="${RESULTS_DIR}/summary.txt"
echo "Frontend Performance Summary - $(date)" > $SUMMARY_FILE
echo "========================================" >> $SUMMARY_FILE
echo "" >> $SUMMARY_FILE

for page in "${PAGES[@]}"; do
    PAGE_NAME=$(echo "$page" | sed 's/\//-/g' | sed 's/^-//')
    if [ -z "$PAGE_NAME" ]; then
        PAGE_NAME="home"
    fi
    
    JSON_FILE="${RESULTS_DIR}/${PAGE_NAME}.report.json"
    
    if [ -f "$JSON_FILE" ]; then
        echo "Page: $page" >> $SUMMARY_FILE
        
        # Extract scores using jq if available, otherwise use grep
        if command -v jq &> /dev/null; then
            PERF=$(jq -r '.categories.performance.score * 100' "$JSON_FILE" 2>/dev/null || echo "N/A")
            ACCESS=$(jq -r '.categories.accessibility.score * 100' "$JSON_FILE" 2>/dev/null || echo "N/A")
            BEST=$(jq -r '.categories["best-practices"].score * 100' "$JSON_FILE" 2>/dev/null || echo "N/A")
            SEO=$(jq -r '.categories.seo.score * 100' "$JSON_FILE" 2>/dev/null || echo "N/A")
            FCP=$(jq -r '.audits["first-contentful-paint"].displayValue' "$JSON_FILE" 2>/dev/null || echo "N/A")
            LCP=$(jq -r '.audits["largest-contentful-paint"].displayValue' "$JSON_FILE" 2>/dev/null || echo "N/A")
            TTI=$(jq -r '.audits["interactive"].displayValue' "$JSON_FILE" 2>/dev/null || echo "N/A")
            
            echo "  Performance: ${PERF}" >> $SUMMARY_FILE
            echo "  Accessibility: ${ACCESS}" >> $SUMMARY_FILE
            echo "  Best Practices: ${BEST}" >> $SUMMARY_FILE
            echo "  SEO: ${SEO}" >> $SUMMARY_FILE
            echo "  First Contentful Paint: ${FCP}" >> $SUMMARY_FILE
            echo "  Largest Contentful Paint: ${LCP}" >> $SUMMARY_FILE
            echo "  Time to Interactive: ${TTI}" >> $SUMMARY_FILE
        else
            echo "  (Install jq for detailed metrics)" >> $SUMMARY_FILE
        fi
        
        echo "" >> $SUMMARY_FILE
    fi
done

# Display summary
echo -e "${GREEN}📊 Performance Summary:${NC}"
cat $SUMMARY_FILE

echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  - Open HTML reports in browser for detailed analysis"
echo "  - Performance score > 90 is excellent"
echo "  - Accessibility score > 90 is recommended"
echo "  - First Contentful Paint < 1.8s is good"
echo "  - Largest Contentful Paint < 2.5s is good"
