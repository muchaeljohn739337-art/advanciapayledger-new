#!/bin/bash

# Advancia PayLedger - Complete Deployment Script
# This script deploys the entire application stack

set -e  # Exit on error

echo "🚀 Advancia PayLedger Deployment Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_dependencies() {
    echo -e "\n${YELLOW}Checking dependencies...${NC}"
    
    if ! command -v doctl &> /dev/null; then
        echo -e "${RED}❌ doctl CLI not found. Install from: https://docs.digitalocean.com/reference/doctl/how-to/install/${NC}"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI not found. Install with: npm i -g vercel${NC}"
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ npm/npx not found. Install Node.js from: https://nodejs.org/${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All dependencies found${NC}"
}

# Verify environment variables
check_env_vars() {
    echo -e "\n${YELLOW}Checking environment variables...${NC}"
    
    if [ ! -f .env ]; then
        echo -e "${RED}❌ .env file not found. Copy from .env.example and configure.${NC}"
        exit 1
    fi
    
    # Source the .env file
    export $(cat .env | grep -v '^#' | xargs)
    
    # Check critical variables
    REQUIRED_VARS=(
        "DATABASE_URL"
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "DO_SPACES_KEY"
        "DO_SPACES_SECRET"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}❌ Missing required variable: $var${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ Environment variables configured${NC}"
}

# Deploy backend to Digital Ocean
deploy_backend() {
    echo -e "\n${YELLOW}Deploying backend to Digital Ocean...${NC}"
    
    cd backend
    
    # Install dependencies
    echo "Installing backend dependencies..."
    npm install
    
    # Build
    echo "Building backend..."
    npm run build
    
    # Deploy to Digital Ocean App Platform
    echo "Deploying to Digital Ocean..."
    if [ -z "$DO_APP_ID" ]; then
        echo "Creating new app..."
        doctl apps create --spec ../.do/app.yaml
    else
        echo "Updating existing app: $DO_APP_ID"
        doctl apps update $DO_APP_ID --spec ../.do/app.yaml
    fi
    
    cd ..
    echo -e "${GREEN}✅ Backend deployed${NC}"
}

# Run database migrations
run_migrations() {
    echo -e "\n${YELLOW}Running database migrations...${NC}"
    
    cd backend
    
    # Generate Prisma client
    echo "Generating Prisma client..."
    npx prisma generate
    
    # Run migrations
    echo "Running migrations..."
    npx prisma migrate deploy
    
    cd ..
    echo -e "${GREEN}✅ Migrations completed${NC}"
}

# Deploy frontend to Vercel
deploy_frontend() {
    echo -e "\n${YELLOW}Deploying frontend to Vercel...${NC}"
    
    cd frontend
    
    # Install dependencies
    echo "Installing frontend dependencies..."
    npm install
    
    # Build
    echo "Building frontend..."
    npm run build
    
    # Deploy to Vercel
    echo "Deploying to Vercel..."
    vercel --prod --yes
    
    cd ..
    echo -e "${GREEN}✅ Frontend deployed${NC}"
}

# Verify deployments
verify_deployments() {
    echo -e "\n${YELLOW}Verifying deployments...${NC}"
    
    # Get backend URL
    if [ -n "$BACKEND_URL" ]; then
        echo "Testing backend health endpoint..."
        if curl -f -s "$BACKEND_URL/health" > /dev/null; then
            echo -e "${GREEN}✅ Backend is healthy${NC}"
        else
            echo -e "${RED}❌ Backend health check failed${NC}"
        fi
    fi
    
    # Get frontend URL
    if [ -n "$FRONTEND_URL" ]; then
        echo "Testing frontend..."
        if curl -f -s "$FRONTEND_URL" > /dev/null; then
            echo -e "${GREEN}✅ Frontend is accessible${NC}"
        else
            echo -e "${RED}❌ Frontend check failed${NC}"
        fi
    fi
}

# Main deployment flow
main() {
    echo -e "\n${YELLOW}Starting deployment process...${NC}"
    
    # Ask for confirmation
    read -p "Deploy to production? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    check_dependencies
    check_env_vars
    
    # Deploy components
    deploy_backend
    run_migrations
    deploy_frontend
    verify_deployments
    
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "\nNext steps:"
    echo "1. Verify your application at: $FRONTEND_URL"
    echo "2. Check backend API at: $BACKEND_URL"
    echo "3. Monitor logs in Vercel and Digital Ocean dashboards"
    echo "4. Set up custom domains if needed"
}

# Run main function
main
