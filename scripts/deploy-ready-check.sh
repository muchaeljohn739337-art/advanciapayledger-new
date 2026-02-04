#!/bin/bash

# Deployment Readiness Check Script
# Verifies everything is ready for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Advancia Platform - Deployment Readiness Check${NC}"
echo "=================================================="

# Configuration
AWS_ACCOUNT_ID="032474760584"
AWS_REGION="us-east-1"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Check functions
check_aws_credentials() {
    echo -e "\n${YELLOW}🔍 Checking AWS credentials...${NC}"
    
    if aws sts get-caller-identity --query Account --output text 2>/dev/null | grep -q "$AWS_ACCOUNT_ID"; then
        echo -e "${GREEN}✅ AWS credentials configured correctly${NC}"
        return 0
    else
        echo -e "${RED}❌ AWS credentials not configured or incorrect account${NC}"
        echo -e "${YELLOW}Please run: aws configure${NC}"
        return 1
    fi
}

check_ecr_repositories() {
    echo -e "\n${YELLOW}🔍 Checking ECR repositories...${NC}"
    
    SERVICES=(
        "api-gateway"
        "auth-service"
        "tenant-service"
        "billing-service"
        "monitoring-service"
        "ai-orchestrator"
        "notification-service"
        "security-service"
        "audit-log-service"
        "metering-service"
        "web3-event-service"
    )
    
    local missing_repos=0
    
    for service in "${SERVICES[@]}"; do
        if aws ecr describe-repositories --repository-names "$service" --region "$AWS_REGION" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service ECR repository exists${NC}"
        else
            echo -e "${RED}❌ $service ECR repository missing${NC}"
            ((missing_repos++))
        fi
    done
    
    if [ $missing_repos -eq 0 ]; then
        echo -e "${GREEN}✅ All ECR repositories exist${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $missing_repos repositories missing. Run: ./scripts/setup-ecr.sh${NC}"
        return 1
    fi
}

check_github_secrets() {
    echo -e "\n${YELLOW}🔍 Checking GitHub secrets...${NC}"
    
    if command -v gh >/dev/null 2>&1; then
        echo -e "${BLUE}Using GitHub CLI to check secrets...${NC}"
        
        # Check if required secrets exist (this requires repo access)
        if gh secret list --repo "$(git config --get remote.origin.url 2>/dev/null | sed 's/.*:\/\/.*@//;s/.*\///;s/\.git$//' 2>/dev/null || echo 'unknown')" 2>/dev/null | grep -q "AWS_ACCESS_KEY_ID"; then
            echo -e "${GREEN}✅ GitHub secrets appear to be configured${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  GitHub secrets may not be configured${NC}"
            echo -e "${YELLOW}Please ensure these secrets are set in your repository:${NC}"
            echo -e "${YELLOW}  - AWS_ACCESS_KEY_ID${NC}"
            echo -e "${YELLOW}  - AWS_SECRET_ACCESS_KEY${NC}"
            echo -e "${YELLOW}  - SLACK_WEBHOOK (optional)${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  GitHub CLI not found. Please manually verify GitHub secrets:${NC}"
        echo -e "${YELLOW}  - AWS_ACCESS_KEY_ID${NC}"
        echo -e "${YELLOW}  - AWS_SECRET_ACCESS_KEY${NC}"
        echo -e "${YELLOW}  - SLACK_WEBHOOK (optional)${NC}"
        return 1
    fi
}

check_dockerfiles() {
    echo -e "\n${YELLOW}🔍 Checking Dockerfiles...${NC}"
    
    local missing_dockerfiles=0
    SERVICES=(
        "api-gateway"
        "auth-service"
        "tenant-service"
        "billing-service"
        "monitoring-service"
        "ai-orchestrator"
        "notification-service"
        "security-service"
        "audit-log-service"
        "metering-service"
        "web3-event-service"
    )
    
    for service in "${SERVICES[@]}"; do
        if [ -f "services/$service/Dockerfile" ]; then
            echo -e "${GREEN}✅ $service/Dockerfile exists${NC}"
        else
            echo -e "${RED}❌ $service/Dockerfile missing${NC}"
            ((missing_dockerfiles++))
        fi
        
        if [ -f "services/$service/.dockerignore" ]; then
            echo -e "${GREEN}✅ $service/.dockerignore exists${NC}"
        else
            echo -e "${YELLOW}⚠️  $service/.dockerignore missing${NC}"
        fi
    done
    
    if [ $missing_dockerfiles -eq 0 ]; then
        echo -e "${GREEN}✅ All Dockerfiles exist${NC}"
        return 0
    else
        echo -e "${RED}❌ $missing_dockerfiles Dockerfiles missing${NC}"
        return 1
    fi
}

check_workflows() {
    echo -e "\n${YELLOW}🔍 Checking GitHub workflows...${NC}"
    
    local missing_workflows=0
    SERVICES=(
        "api-gateway"
        "auth-service"
        "tenant-service"
        "billing-service"
        "monitoring-service"
        "ai-orchestrator"
        "notification-service"
        "security-service"
        "web3-event-service"
    )
    
    for service in "${SERVICES[@]}"; do
        if [ -f ".github/workflows/build-$service.yml" ]; then
            echo -e "${GREEN}✅ build-$service.yml exists${NC}"
        else
            echo -e "${RED}❌ build-$service.yml missing${NC}"
            ((missing_workflows++))
        fi
    done
    
    if [ -f ".github/workflows/build-remaining-services.yml" ]; then
        echo -e "${GREEN}✅ build-remaining-services.yml exists${NC}"
    else
        echo -e "${RED}❌ build-remaining-services.yml missing${NC}"
        ((missing_workflows++))
    fi
    
    if [ $missing_workflows -eq 0 ]; then
        echo -e "${GREEN}✅ All workflows exist${NC}"
        return 0
    else
        echo -e "${RED}❌ $missing_workflows workflows missing${NC}"
        return 1
    fi
}

check_argocd_apps() {
    echo -e "\n${YELLOW}🔍 Checking ArgoCD applications...${NC}"
    
    local missing_apps=0
    SERVICES=(
        "api-gateway"
        "auth-service"
        "tenant-service"
        "billing-service"
        "monitoring-service"
        "ai-orchestrator"
        "notification-service"
        "security-service"
        "audit-log-service"
        "metering-service"
        "web3-event-service"
    )
    
    for service in "${SERVICES[@]}"; do
        if [ -f "gitops/apps/$service-argocd.yaml" ]; then
            # Check if it has Image Updater annotations
            if grep -q "argocd-image-updater.argoproj.io" "gitops/apps/$service-argocd.yaml"; then
                echo -e "${GREEN}✅ $service-argocd.yaml exists with Image Updater${NC}"
            else
                echo -e "${YELLOW}⚠️  $service-argocd.yaml exists but missing Image Updater annotations${NC}"
            fi
        else
            echo -e "${RED}❌ $service-argocd.yaml missing${NC}"
            ((missing_apps++))
        fi
    done
    
    if [ $missing_apps -eq 0 ]; then
        echo -e "${GREEN}✅ All ArgoCD applications exist${NC}"
        return 0
    else
        echo -e "${RED}❌ $missing_apps ArgoCD applications missing${NC}"
        return 1
    fi
}

check_terraform_outputs() {
    echo -e "\n${YELLOW}🔍 Checking Terraform outputs...${NC}"
    
    if [ -f "infra/terraform/modules/k8s-cluster/outputs.tf" ]; then
        if grep -q "ecr_registry_url" "infra/terraform/modules/k8s-cluster/outputs.tf" && \
           grep -q "kubeconfig" "infra/terraform/modules/k8s-cluster/outputs.tf" && \
           grep -q "oidc_provider_url" "infra/terraform/modules/k8s-cluster/outputs.tf"; then
            echo -e "${GREEN}✅ Terraform outputs configured${NC}"
            return 0
        else
            echo -e "${RED}❌ Terraform outputs incomplete${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Terraform outputs file missing${NC}"
        return 1
    fi
}

# Main check
echo -e "${BLUE}Starting deployment readiness checks...${NC}"

checks_passed=0
total_checks=7

check_aws_credentials && ((checks_passed++))
check_ecr_repositories && ((checks_passed++))
check_github_secrets && ((checks_passed++))
check_dockerfiles && ((checks_passed++))
check_workflows && ((checks_passed++))
check_argocd_apps && ((checks_passed++))
check_terraform_outputs && ((checks_passed++))

echo -e "\n${BLUE}==================================================${NC}"
echo -e "${BLUE}📊 Readiness Summary${NC}"
echo -e "Checks passed: ${GREEN}$checks_passed${NC}/$total_checks"

if [ $checks_passed -eq $total_checks ]; then
    echo -e "\n${GREEN}🎉 CONGRATULATIONS! Your platform is ready for deployment!${NC}"
    echo -e "\n${GREEN}Next steps:${NC}"
    echo -e "1. Push a code change to test the CI/CD pipeline"
    echo -e "2. Monitor the GitHub Actions workflow"
    echo -e "3. Check ArgoCD for automatic deployments"
    echo -e "4. Verify services are running in Kubernetes"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Platform is almost ready. Please address the issues above.${NC}"
    echo -e "\n${YELLOW}Common fixes:${NC}"
    echo -e "1. Run: ./scripts/setup-ecr.sh (if ECR repos missing)"
    echo -e "2. Add GitHub secrets (if not configured)"
    echo -e "3. Run: aws configure (if AWS credentials issue)"
    exit 1
fi
