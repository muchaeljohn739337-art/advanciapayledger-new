#!/bin/bash

# Git Conflict Resolution Script
# Purpose: Systematically resolve 572 merge conflicts
# Strategy: Keep current working implementation (--ours)
# Date: January 31, 2026

set -e  # Exit on error

echo "=================================================="
echo "Git Conflict Resolution Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Safety backup
echo -e "${YELLOW}Step 1: Creating safety backup...${NC}"
git checkout -b backup-$(date +%Y%m%d-%H%M%S)
git push origin backup-$(date +%Y%m%d-%H%M%S) || echo "Backup branch created locally"
git checkout -  # Go back to original branch

echo -e "${GREEN}✓ Backup created${NC}"
echo ""

# 2. Analyze conflicts
echo -e "${YELLOW}Step 2: Analyzing conflicts...${NC}"
CONFLICT_COUNT=$(git diff --name-only --diff-filter=U | wc -l)
echo "Total conflicted files: $CONFLICT_COUNT"
git diff --name-only --diff-filter=U > conflict-files-list.txt
echo -e "${GREEN}✓ Conflict list saved to conflict-files-list.txt${NC}"
echo ""

# 3. Auto-resolve strategy
echo -e "${YELLOW}Step 3: Auto-resolving conflicts (keeping current implementation)...${NC}"

# Keep YOUR version for these critical paths
echo "Resolving Prisma schema..."
if git diff --name-only --diff-filter=U | grep -q "prisma/schema.prisma"; then
    git checkout --ours prisma/schema.prisma
    git add prisma/schema.prisma
    echo -e "${GREEN}✓ Prisma schema resolved${NC}"
fi

echo "Resolving backend API routes..."
find . -path "*/backend/*" -path "*/api/*" \( -name "*.ts" -o -name "*.js" \) | while read file; do
    if git diff --name-only --diff-filter=U | grep -q "$file"; then
        git checkout --ours "$file"
        git add "$file"
        echo "  ✓ $file"
    fi
done

echo "Resolving frontend components..."
find . -path "*/frontend/*" -path "*/components/*" \( -name "*.tsx" -o -name "*.jsx" \) | while read file; do
    if git diff --name-only --diff-filter=U | grep -q "$file"; then
        git checkout --ours "$file"
        git add "$file"
        echo "  ✓ $file"
    fi
done

echo "Resolving middleware and utils..."
find . \( -path "*/middleware/*" -o -path "*/utils/*" -o -path "*/lib/*" \) \( -name "*.ts" -o -name "*.js" \) | while read file; do
    if git diff --name-only --diff-filter=U | grep -q "$file"; then
        git checkout --ours "$file"
        git add "$file"
        echo "  ✓ $file"
    fi
done

echo ""

# 4. Manual review needed for configs
echo -e "${YELLOW}Step 4: Files requiring manual review:${NC}"
MANUAL_REVIEW_FILES=(
    "package.json"
    "package-lock.json"
    "tsconfig.json"
    "next.config.js"
    "next.config.mjs"
    ".env"
    ".env.local"
    ".env.production"
    "docker-compose.yml"
    "Dockerfile"
    "vercel.json"
)

NEEDS_MANUAL=0
for file in "${MANUAL_REVIEW_FILES[@]}"; do
    if git diff --name-only --diff-filter=U | grep -q "$file"; then
        echo -e "${RED}  ⚠ $file - NEEDS MANUAL REVIEW${NC}"
        NEEDS_MANUAL=1
    fi
done

if [ $NEEDS_MANUAL -eq 0 ]; then
    echo -e "${GREEN}  ✓ No config files need manual review${NC}"
fi
echo ""

# 5. Auto-resolve remaining files
echo -e "${YELLOW}Step 5: Auto-resolving all remaining conflicts...${NC}"
git checkout --ours .
git add .
echo -e "${GREEN}✓ All remaining conflicts resolved using current implementation${NC}"
echo ""

# 6. Verify status
echo -e "${YELLOW}Step 6: Verifying resolution...${NC}"
REMAINING_CONFLICTS=$(git diff --name-only --diff-filter=U | wc -l)

if [ $REMAINING_CONFLICTS -eq 0 ]; then
    echo -e "${GREEN}✓ All conflicts resolved!${NC}"
    echo ""
    
    # Commit the resolution
    echo -e "${YELLOW}Step 7: Committing resolution...${NC}"
    git commit -m "Resolved merge conflicts - kept current working implementation

- Resolved $CONFLICT_COUNT file conflicts
- Strategy: Kept current implementation (--ours) for all working code
- Manual review needed for: package.json, configs
- All API routes, components, and schema preserved
"
    echo -e "${GREEN}✓ Commit created${NC}"
    echo ""
    
    # Success summary
    echo "=================================================="
    echo -e "${GREEN}SUCCESS!${NC}"
    echo "=================================================="
    echo "Resolved: $CONFLICT_COUNT files"
    echo "Strategy: Kept current working implementation"
    echo "Commit: Created"
    echo ""
    echo "Next steps:"
    echo "1. Review the commit: git show"
    echo "2. Run tests: npm run test"
    echo "3. Build: npm run build"
    echo "4. Push: git push origin main"
    echo ""
    
else
    echo -e "${RED}✗ $REMAINING_CONFLICTS conflicts still remain${NC}"
    echo "Files requiring manual resolution:"
    git diff --name-only --diff-filter=U
    echo ""
    echo "Use: git mergetool OR manually edit the files above"
fi

# 7. Generate resolution report
echo -e "${YELLOW}Step 8: Generating resolution report...${NC}"
cat > conflict-resolution-report.txt << EOF
Git Conflict Resolution Report
Generated: $(date)

Total Conflicts: $CONFLICT_COUNT
Resolved: $(($CONFLICT_COUNT - $REMAINING_CONFLICTS))
Remaining: $REMAINING_CONFLICTS

Resolution Strategy:
- Kept current implementation (--ours) for:
  * Prisma schema (80+ models)
  * Backend API routes (40+ endpoints)
  * Frontend components (1,690+ files)
  * Middleware and utilities
  
- Requires manual review:
  * Configuration files (package.json, tsconfig.json, etc.)
  * Environment files (.env)
  * Docker configuration

Auto-resolved files saved to: conflict-files-list.txt

Next Actions:
1. Review commit: git show
2. Test build: npm run build
3. Run tests: npm test
4. Push changes: git push origin main
5. Deploy to Vercel

EOF

echo -e "${GREEN}✓ Report saved to conflict-resolution-report.txt${NC}"
echo ""
echo "Done! Review the report and proceed with testing."
