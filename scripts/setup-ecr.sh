#!/bin/bash

# ECR Setup Script for Advancia Platform
# This script creates ECR repositories and sets up lifecycle policies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-"032474760584"}
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Services list
SERVICES=(
    "api-gateway"
    "auth-service"
    "tenant-service"
    "billing-service"
    "metering-service"
    "web3-event-service"
    "ai-orchestrator"
    "monitoring-service"
    "notification-service"
    "security-service"
    "audit-log-service"
)

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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
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
    
    # Verify AWS account ID
    local current_account=$(aws sts get-caller-identity --query Account --output text)
    if [ "$current_account" != "$AWS_ACCOUNT_ID" ]; then
        print_warning "AWS account ID mismatch. Using current account: $current_account"
        AWS_ACCOUNT_ID="$current_account"
        ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    fi
    
    print_status "Prerequisites check passed."
}

# Function to create ECR repository
create_repository() {
    local service_name=$1
    local repo_name=$service_name
    
    print_status "Creating ECR repository: $repo_name"
    
    # Check if repository already exists
    if aws ecr describe-repositories --repository-names "$repo_name" --region "$AWS_REGION" &> /dev/null; then
        print_warning "Repository $repo_name already exists. Skipping creation."
        return
    fi
    
    # Create repository
    aws ecr create-repository \
        --repository-name "$repo_name" \
        --region "$AWS_REGION" \
        --image-scanning-configuration scanOnPush=true \
        --image-tag-mutability MUTABLE \
        --encryption-configuration encryptionType=AES256
    
    print_status "Repository $repo_name created successfully."
}

# Function to set up lifecycle policy
setup_lifecycle_policy() {
    local service_name=$1
    local repo_name=$service_name
    
    print_status "Setting up lifecycle policy for: $repo_name"
    
    # Create lifecycle policy
    local lifecycle_policy=$(cat <<EOF
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 30 images",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["v"],
        "countType": "imageCountMoreThan",
        "countNumber": 30
      },
      "action": {
        "type": "expire"
      }
    },
    {
      "rulePriority": 2,
      "description": "Keep untagged images for 7 days",
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 7
      },
      "action": {
        "type": "expire"
      }
    },
    {
      "rulePriority": 3,
      "description": "Move images older than 90 days to cold storage",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["v"],
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 90
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
EOF
    )
    
    aws ecr put-lifecycle-policy \
        --repository-name "$repo_name" \
        --region "$AWS_REGION" \
        --lifecycle-policy-text "$lifecycle_policy"
    
    print_status "Lifecycle policy set for $repo_name."
}

# Function to set up repository policy for cross-account access
setup_repository_policy() {
    local service_name=$1
    local repo_name=$service_name
    
    print_status "Setting up repository policy for: $repo_name"
    
    # Create repository policy (allow access from EKS nodes)
    local repository_policy=$(cat <<EOF
{
  "Version": "2008-10-17",
  "Statement": [
    {
      "Sid": "AllowEKSNodePull",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/advancia-prod-eks-node-role"
      },
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability"
      ]
    },
    {
      "Sid": "AllowCrossAccountPull",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${AWS_ACCOUNT_ID}:root"
      },
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ]
    }
  ]
}
EOF
    )
    
    aws ecr set-repository-policy \
        --repository-name "$repo_name" \
        --region "$AWS_REGION" \
        --policy-text "$repository_policy"
    
    print_status "Repository policy set for $repo_name."
}

# Function to create ECR pull-through cache rules (optional)
setup_pull_through_cache() {
    print_status "Setting up ECR pull-through cache rules..."
    
    # Create pull-through cache rules for common public registries
    local registries=("docker.io" "public.ecr.aws" "k8s.gcr.io")
    
    for registry in "${registries[@]}"; do
        print_status "Creating pull-through cache for: $registry"
        
        # Check if rule already exists
        if aws ecr describe-pull-through-cache-rules --region "$AWS_REGION" | grep -q "$registry"; then
            print_warning "Pull-through cache rule for $registry already exists. Skipping."
            continue
        fi
        
        aws ecr create-pull-through-cache-rule \
            --region "$AWS_REGION" \
            --ecr-repository-prefix "cache-${registry//-}" \
            --upstream-registry-url "$registry"
        
        print_status "Pull-through cache rule created for $registry."
    done
}

# Function to generate Docker login script
generate_docker_login_script() {
    print_status "Generating Docker login script..."
    
    cat > scripts/ecr-login.sh <<EOF
#!/bin/bash

# ECR Docker Login Script
# This script logs Docker into ECR

set -e

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-$AWS_ACCOUNT_ID}"
ECR_REGISTRY="\${AWS_ACCOUNT_ID}.dkr.ecr.\${AWS_REGION}.amazonaws.com"

# Get ECR login password
PASSWORD=\$(aws ecr get-login-password --region \${AWS_REGION})

# Login to ECR
echo "\$PASSWORD" | docker login --username AWS --password-stdin \${ECR_REGISTRY}

echo "Successfully logged into ECR: \${ECR_REGISTRY}"
EOF

    chmod +x scripts/ecr-login.sh
    print_status "Docker login script generated: scripts/ecr-login.sh"
}

# Function to generate Kubernetes secret for ECR
generate_k8s_secret() {
    print_status "Generating Kubernetes secret for ECR..."
    
    # Create secret template
    cat > manifests/ecr-pull-secret.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: ecr-pull-secret
  namespace: default
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: \$(aws ecr get-login-password --region ${AWS_REGION} | base64 | tr -d '\n' | xargs -I {} echo -n '{"auths":{"${ECR_REGISTRY}":{"username":"AWS","password":"'{}'"}}}' | base64 -w 0)
EOF
    
    print_status "Kubernetes secret template generated: manifests/ecr-pull-secret.yaml"
}

# Function to list all repositories
list_repositories() {
    print_status "Listing all ECR repositories..."
    
    aws ecr describe-repositories --region "$AWS_REGION" --query 'repositories[].repositoryName' --output table
}

# Function to get repository information
get_repository_info() {
    local service_name=$1
    local repo_name=$service_name
    
    print_status "Getting repository information for: $repo_name"
    
    aws ecr describe-repositories \
        --repository-names "$repo_name" \
        --region "$AWS_REGION" \
        --query 'repositories[0]'
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -r, --region REGION        Set AWS region [default: us-east-1]
    -a, --account-id ACCOUNT   Set AWS account ID [default: 123456789012]
    -s, --service SERVICE      Create specific service repository
    -l, --list                 List all repositories
    -i, --info SERVICE         Get repository information
    -p, --pull-through         Set up pull-through cache
    -h, --help                 Show this help message

Examples:
    $0                          # Create all repositories
    $0 -s api-gateway           # Create specific repository
    $0 -l                       # List all repositories
    $0 -i api-gateway           # Get repository info
    $0 -p                       # Set up pull-through cache

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--region)
            AWS_REGION="$2"
            shift 2
            ;;
        -a|--account-id)
            AWS_ACCOUNT_ID="$2"
            shift 2
            ;;
        -s|--service)
            SPECIFIC_SERVICE="$2"
            shift 2
            ;;
        -l|--list)
            LIST_REPOS=true
            shift
            ;;
        -i|--info)
            GET_INFO=true
            INFO_SERVICE="$2"
            shift 2
            ;;
        -p|--pull-through)
            SETUP_PULL_THROUGH=true
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
    print_status "Starting ECR setup for Advancia Platform"
    print_status "AWS Region: $AWS_REGION"
    print_status "AWS Account: $AWS_ACCOUNT_ID"
    print_status "ECR Registry: $ECR_REGISTRY"
    
    check_prerequisites
    
    # Handle specific operations
    if [ "$LIST_REPOS" = true ]; then
        list_repositories
        exit 0
    fi
    
    if [ "$GET_INFO" = true ]; then
        get_repository_info "$INFO_SERVICE"
        exit 0
    fi
    
    # Create directories
    mkdir -p scripts manifests
    
    # Setup repositories
    if [ -n "$SPECIFIC_SERVICE" ]; then
        if [[ " ${SERVICES[@]} " =~ " ${SPECIFIC_SERVICE} " ]]; then
            create_repository "$SPECIFIC_SERVICE"
            setup_lifecycle_policy "$SPECIFIC_SERVICE"
            setup_repository_policy "$SPECIFIC_SERVICE"
        else
            print_error "Unknown service: $SPECIFIC_SERVICE"
            print_status "Available services: ${SERVICES[*]}"
            exit 1
        fi
    else
        # Create all repositories
        for service in "${SERVICES[@]}"; do
            create_repository "$service"
            setup_lifecycle_policy "$service"
            setup_repository_policy "$service"
        done
    fi
    
    # Optional setup
    if [ "$SETUP_PULL_THROUGH" = true ]; then
        setup_pull_through_cache
    fi
    
    # Generate helper scripts
    generate_docker_login_script
    generate_k8s_secret
    
    print_status "ECR setup completed successfully!"
    print_status "Registry URL: $ECR_REGISTRY"
    print_status "Use 'scripts/ecr-login.sh' to login to ECR"
}

# Run main function
main "$@"
