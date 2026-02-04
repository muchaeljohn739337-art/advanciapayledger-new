#!/bin/bash

# Kubernetes Secrets Management Script
# This script manages secrets for the Advancia platform across different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
REGION="us-east-1"
DRY_RUN=false
IMPORT_AWS_SECRETS=false
GENERATE_SECRETS=false
ROTATE_SECRETS=false

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

print_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
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
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    # Check if AWS CLI is installed (for AWS secrets)
    if [ "$IMPORT_AWS_SECRETS" = true ] && ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi
    
    # Check if openssl is installed (for generating secrets)
    if [ "$GENERATE_SECRETS" = true ] && ! command -v openssl &> /dev/null; then
        print_error "openssl is not installed. Please install openssl first."
        exit 1
    fi
    
    print_status "Prerequisites check passed."
}

# Function to generate random string
generate_random_string() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Function to generate JWT secret
generate_jwt_secret() {
    openssl rand -base64 64
}

# Function to generate database password
generate_db_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to create namespace if it doesn't exist
ensure_namespace() {
    local namespace=$1
    if ! kubectl get namespace "$namespace" &> /dev/null; then
        print_status "Creating namespace: $namespace"
        kubectl create namespace "$namespace" --dry-run=$DRY_RUN
        if [ "$DRY_RUN" = false ]; then
            kubectl create namespace "$namespace"
        fi
    fi
}

# Function to create generic secret
create_generic_secret() {
    local name=$1
    local namespace=$2
    local data=$3
    
    print_status "Creating secret: $name in namespace: $namespace"
    
    if [ "$DRY_RUN" = true ]; then
        print_debug "Dry run: Would create secret $name with data: $data"
        return
    fi
    
    # Create temporary file for secret data
    local temp_file=$(mktemp)
    echo "$data" > "$temp_file"
    
    kubectl create secret generic "$name" \
        --namespace="$namespace" \
        --from-file="$temp_file" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    rm "$temp_file"
}

# Function to create secret from literal values
create_literal_secret() {
    local name=$1
    local namespace=$2
    shift 2
    local literals=("$@")
    
    print_status "Creating secret: $name in namespace: $namespace"
    
    if [ "$DRY_RUN" = true ]; then
        print_debug "Dry run: Would create secret $name with literals: ${literals[*]}"
        return
    fi
    
    kubectl create secret generic "$name" \
        --namespace="$namespace" \
        "${literals[@]}" \
        --dry-run=client -o yaml | kubectl apply -f -
}

# Function to import AWS Secrets Manager secret
import_aws_secret() {
    local secret_name=$1
    local namespace=$2
    local aws_secret_name=$3
    
    print_status "Importing AWS secret: $aws_secret_name to K8s secret: $secret_name"
    
    if [ "$DRY_RUN" = true ]; then
        print_debug "Dry run: Would import AWS secret $aws_secret_name"
        return
    fi
    
    # Get secret from AWS Secrets Manager
    local secret_value=$(aws secretsmanager get-secret-value --secret-id "$aws_secret_name" --region "$REGION" --query SecretString --output text)
    
    if [ $? -ne 0 ]; then
        print_error "Failed to retrieve AWS secret: $aws_secret_name"
        return 1
    fi
    
    # Parse JSON and create Kubernetes secret
    echo "$secret_value" | jq -r 'to_entries[] | "--from-literal=\(.key)=\(.value)"' | xargs kubectl create secret generic "$secret_name" --namespace="$namespace" --dry-run=client -o yaml | kubectl apply -f -
}

# Function to generate service secrets
generate_service_secrets() {
    local env=$1
    print_status "Generating secrets for environment: $env"
    
    # Ensure namespaces exist
    ensure_namespace "platform-core"
    ensure_namespace "services"
    ensure_namespace "observability"
    
    # Generate API Gateway secrets
    print_status "Generating API Gateway secrets..."
    create_literal_secret "api-gateway-secrets" "platform-core" \
        "--from-literal=JWT_SECRET=$(generate_jwt_secret)" \
        "--from-literal=API_KEY=$(generate_random_string 24)" \
        "--from-literal=ENCRYPTION_KEY=$(generate_random_string 32)"
    
    # Generate Auth Service secrets
    print_status "Generating Auth Service secrets..."
    create_literal_secret "auth-service-secrets" "platform-core" \
        "--from-literal=SESSION_SECRET=$(generate_random_string 32)" \
        "--from-literal=OAUTH_CLIENT_SECRET=$(generate_random_string 40)" \
        "--from-literal=ENCRYPTION_KEY=$(generate_random_string 32)"
    
    # Generate Database secrets
    print_status "Generating Database secrets..."
    create_literal_secret "database-credentials" "platform-core" \
        "--from-literal=POSTGRES_USER=advancia_${env}" \
        "--from-literal=POSTGRES_PASSWORD=$(generate_db_password)" \
        "--from-literal=POSTGRES_DB=advancia_${env}"
    
    # Generate Redis secrets
    print_status "Generating Redis secrets..."
    create_literal_secret "redis-credentials" "platform-core" \
        "--from-literal=REDIS_PASSWORD=$(generate_random_string 24)" \
        "--from-literal=url=redis://:$(generate_random_string 24)@redis.platform-core.svc.cluster.local:6379"
    
    # Generate Monitoring Service secrets
    print_status "Generating Monitoring Service secrets..."
    create_literal_secret "monitoring-service-secrets" "services" \
        "--from-literal=DATABASE_URL=postgresql://advancia_${env}:$(generate_db_password)@postgres.platform-core.svc.cluster.local:5432/advancia_${env}" \
        "--from-literal=API_KEY=$(generate_random_string 32)"
    
    # Generate AI Orchestrator secrets
    print_status "Generating AI Orchestrator secrets..."
    create_literal_secret "ai-orchestrator-secrets" "services" \
        "--from-literal=DATABASE_URL=postgresql://advancia_${env}:$(generate_db_password)@postgres.platform-core.svc.cluster.local:5432/advancia_${env}" \
        "--from-literal=BEDROCK_API_KEY=$(generate_random_string 40)" \
        "--from-literal=MODEL_API_KEY=$(generate_random_string 32)"
    
    # Generate Billing Service secrets
    print_status "Generating Billing Service secrets..."
    create_literal_secret "billing-service-secrets" "services" \
        "--from-literal=DATABASE_URL=postgresql://advancia_${env}:$(generate_db_password)@postgres.platform-core.svc.cluster.local:5432/advancia_${env}" \
        "--from-literal=STRIPE_SECRET_KEY=$(generate_random_string 40)" \
        "--from-literal=WEBHOOK_SECRET=$(generate_random_string 32)"
    
    print_status "Service secrets generated successfully!"
}

# Function to rotate secrets
rotate_secrets() {
    local env=$1
    print_warning "Rotating secrets for environment: $env"
    
    # Delete existing secrets
    local secrets=(
        "api-gateway-secrets"
        "auth-service-secrets"
        "database-credentials"
        "redis-credentials"
        "monitoring-service-secrets"
        "ai-orchestrator-secrets"
        "billing-service-secrets"
    )
    
    for secret in "${secrets[@]}"; do
        if kubectl get secret "$secret" -n platform-core &> /dev/null; then
            print_status "Deleting secret: $secret"
            kubectl delete secret "$secret" -n platform-core --dry-run=$DRY_RUN
            if [ "$DRY_RUN" = false ]; then
                kubectl delete secret "$secret" -n platform-core
            fi
        fi
        
        if kubectl get secret "$secret" -n services &> /dev/null; then
            print_status "Deleting secret: $secret"
            kubectl delete secret "$secret" -n services --dry-run=$DRY_RUN
            if [ "$DRY_RUN" = false ]; then
                kubectl delete secret "$secret" -n services
            fi
        fi
    done
    
    # Generate new secrets
    generate_service_secrets "$env"
    
    print_status "Secret rotation completed!"
}

# Function to verify secrets
verify_secrets() {
    local env=$1
    print_status "Verifying secrets in environment: $env"
    
    local namespaces=("platform-core" "services" "observability")
    local expected_secrets=(
        "api-gateway-secrets"
        "auth-service-secrets"
        "database-credentials"
        "redis-credentials"
        "monitoring-service-secrets"
        "ai-orchestrator-secrets"
        "billing-service-secrets"
    )
    
    for namespace in "${namespaces[@]}"; do
        print_status "Checking secrets in namespace: $namespace"
        for secret in "${expected_secrets[@]}"; do
            if kubectl get secret "$secret" -n "$namespace" &> /dev/null; then
                print_status "✓ Secret $secret exists in $namespace"
            else
                print_warning "✗ Secret $secret missing in $namespace"
            fi
        done
    done
    
    print_status "Secret verification completed!"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV     Set environment (dev, staging, prod) [default: dev]
    -r, --region REGION      Set AWS region [default: us-east-1]
    -d, --dry-run             Show what would be done without actually doing it
    -g, --generate            Generate new secrets
    -i, --import-aws          Import secrets from AWS Secrets Manager
    -o, --rotate              Rotate existing secrets
    -v, --verify              Verify existing secrets
    -h, --help                Show this help message

Examples:
    $0 -e dev -g                    # Generate secrets for dev environment
    $0 -e prod -g --dry-run         # Generate secrets for prod (dry run)
    $0 -e staging -o                # Rotate secrets in staging
    $0 -e prod -v                   # Verify secrets in production
    $0 -e prod -i --dry-run         # Import AWS secrets (dry run)

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
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -g|--generate)
            GENERATE_SECRETS=true
            shift
            ;;
        -i|--import-aws)
            IMPORT_AWS_SECRETS=true
            shift
            ;;
        -o|--rotate)
            ROTATE_SECRETS=true
            shift
            ;;
        -v|--verify)
            VERIFY_SECRETS=true
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
    print_status "Starting secrets management for environment: $ENVIRONMENT"
    
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
    
    # Set kubectl context
    export KUBECONFIG="${KUBECONFIG:-$HOME/.kube/config}"
    
    # Execute requested actions
    if [ "$GENERATE_SECRETS" = true ]; then
        generate_service_secrets "$ENVIRONMENT"
    elif [ "$IMPORT_AWS_SECRETS" = true ]; then
        import_aws_secrets "$ENVIRONMENT"
    elif [ "$ROTATE_SECRETS" = true ]; then
        rotate_secrets "$ENVIRONMENT"
    elif [ "$VERIFY_SECRETS" = true ]; then
        verify_secrets "$ENVIRONMENT"
    else
        print_error "No action specified. Use -g, -i, -o, or -v"
        show_usage
        exit 1
    fi
    
    print_status "Secrets management process completed!"
}

# Run main function
main "$@"
