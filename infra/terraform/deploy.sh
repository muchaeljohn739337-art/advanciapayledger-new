#!/bin/bash

# Terraform Deployment Script for Advancia Platform
# This script handles the deployment of infrastructure across different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
REGION="us-east-1"
TF_VAR_FILE=""
PLAN_ONLY=false
APPLY_ONLY=false
DESTROY=false

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to validate environment
validate_environment() {
    local env=$1
    case $env in
        dev|development|staging|prod|production)
            return 0
            ;;
        *)
            print_error "Invalid environment: $env. Valid options: dev, staging, prod"
            exit 1
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install Terraform first."
        exit 1
    fi
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi
    
    # Check if AWS credentials are configured
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_status "Prerequisites check passed."
}

# Function to initialize Terraform
init_terraform() {
    local env_dir=$1
    print_status "Initializing Terraform in $env_dir..."
    
    cd "$env_dir"
    
    # Create backend configuration if it doesn't exist
    if [ ! -f "backend.tf" ]; then
        print_warning "backend.tf not found. Creating default backend configuration..."
        cat > backend.tf << EOF
terraform {
  backend "s3" {
    bucket = "advancia-terraform-state"
    key    = "${ENVIRONMENT}/terraform.tfstate"
    region = "${REGION}"
    
    dynamodb_table = "advancia-terraform-locks"
    encrypt        = true
  }
}
EOF
    fi
    
    terraform init -upgrade
    cd ..
}

# Function to validate Terraform configuration
validate_terraform() {
    local env_dir=$1
    print_status "Validating Terraform configuration in $env_dir..."
    
    cd "$env_dir"
    terraform validate
    terraform fmt -check
    cd ..
}

# Function to plan Terraform changes
plan_terraform() {
    local env_dir=$1
    print_status "Planning Terraform changes in $env_dir..."
    
    cd "$env_dir"
    
    local tf_vars=""
    if [ -n "$TF_VAR_FILE" ]; then
        tf_vars="-var-file=$TF_VAR_FILE"
    fi
    
    terraform plan $tf_vars -out="tfplan"
    cd ..
}

# Function to apply Terraform changes
apply_terraform() {
    local env_dir=$1
    print_status "Applying Terraform changes in $env_dir..."
    
    cd "$env_dir"
    
    if [ -f "tfplan" ]; then
        terraform apply tfplan
        rm tfplan
    else
        local tf_vars=""
        if [ -n "$TF_VAR_FILE" ]; then
            tf_vars="-var-file=$TF_VAR_FILE"
        fi
        terraform apply $tf_vars -auto-approve
    fi
    
    cd ..
}

# Function to destroy infrastructure
destroy_terraform() {
    local env_dir=$1
    print_warning "Destroying infrastructure in $env_dir..."
    
    cd "$env_dir"
    
    local tf_vars=""
    if [ -n "$TF_VAR_FILE" ]; then
        tf_vars="-var-file=$TF_VAR_FILE"
    fi
    
    terraform destroy $tf_vars -auto-approve
    cd ..
}

# Function to generate outputs
generate_outputs() {
    local env_dir=$1
    print_status "Generating outputs from $env_dir..."
    
    cd "$env_dir"
    terraform output -json > "../outputs-${ENVIRONMENT}.json"
    cd ..
    
    print_status "Outputs saved to outputs-${ENVIRONMENT}.json"
}

# Function to deploy modules in order
deploy_modules() {
    local base_dir="envs/${ENVIRONMENT}"
    
    if [ ! -d "$base_dir" ]; then
        print_error "Environment directory $base_dir does not exist."
        exit 1
    fi
    
    # Initialize and validate
    init_terraform "$base_dir"
    validate_terraform "$base_dir"
    
    # Plan or apply based on flags
    if [ "$PLAN_ONLY" = true ]; then
        plan_terraform "$base_dir"
        print_status "Plan completed. Review the output above."
    elif [ "$DESTROY" = true ]; then
        destroy_terraform "$base_dir"
    else
        if [ "$APPLY_ONLY" = false ]; then
            plan_terraform "$base_dir"
        fi
        apply_terraform "$base_dir"
        generate_outputs "$base_dir"
        print_status "Deployment completed successfully!"
    fi
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV     Set environment (dev, staging, prod) [default: dev]
    -r, --region REGION      Set AWS region [default: us-east-1]
    -f, --var-file FILE      Path to terraform.tfvars file
    -p, --plan-only          Only generate and show plan, don't apply
    -a, --apply-only         Skip planning and apply directly
    -d, --destroy            Destroy infrastructure
    -h, --help               Show this help message

Examples:
    $0 -e dev -f terraform.tfvars
    $0 -e staging --plan-only
    $0 -e prod --apply-only
    $0 -e dev --destroy

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -f|--var-file)
            TF_VAR_FILE="$2"
            shift 2
            ;;
        -p|--plan-only)
            PLAN_ONLY=true
            shift
            ;;
        -a|--apply-only)
            APPLY_ONLY=true
            shift
            ;;
        -d|--destroy)
            DESTROY=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_status "Starting Terraform deployment for environment: $ENVIRONMENT"
    print_status "AWS Region: $REGION"
    
    # Normalize environment name
    case $ENVIRONMENT in
        development|dev)
            ENVIRONMENT="dev"
            ;;
        staging)
            ENVIRONMENT="staging"
            ;;
        production|prod)
            ENVIRONMENT="prod"
            ;;
    esac
    
    validate_environment "$ENVIRONMENT"
    check_prerequisites
    
    # Set environment variables for Terraform
    export TF_VAR_environment="$ENVIRONMENT"
    export TF_VAR_region="$REGION"
    export AWS_DEFAULT_REGION="$REGION"
    
    deploy_modules
    
    print_status "Deployment process completed!"
}

# Run main function
main "$@"
