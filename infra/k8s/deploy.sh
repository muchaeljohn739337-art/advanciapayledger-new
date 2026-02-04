#!/bin/bash

# Kubernetes Deployment Script for Advancia Platform
# This script handles the deployment of Kubernetes manifests across different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
NAMESPACE="platform-core"
DRY_RUN=false
VERBOSE=false
WAIT=false
TIMEOUT=300s

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
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
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
    
    # Check if kustomize is installed
    if ! command -v kustomize &> /dev/null; then
        print_error "kustomize is not installed. Please install kustomize first."
        exit 1
    fi
    
    # Check if cluster is accessible
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    
    print_status "Prerequisites check passed."
}

# Function to create namespaces
create_namespaces() {
    print_status "Creating namespaces..."
    
    # Create base namespaces
    kubectl apply -f base/namespaces.yaml --dry-run=$DRY_RUN
    
    if [ "$DRY_RUN" = false ]; then
        kubectl wait --for=condition=Established namespace/platform-core --timeout=$TIMEOUT
        kubectl wait --for=condition=Established namespace/services --timeout=$TIMEOUT
        kubectl wait --for=condition=Established namespace/observability --timeout=$TIMEOUT
        kubectl wait --for=condition=Established namespace/ingress-nginx --timeout=$TIMEOUT
    fi
}

# Function to deploy base infrastructure
deploy_base() {
    print_status "Deploying base infrastructure..."
    
    local base_dir="base"
    
    # Deploy RBAC
    print_status "Deploying RBAC configurations..."
    kubectl apply -k "$base_dir" --dry-run=$DRY_RUN
    
    if [ "$DRY_RUN" = false ]; then
        kubectl apply -k "$base_dir"
        print_status "Base infrastructure deployed successfully."
    fi
}

# Function to deploy environment-specific overlay
deploy_overlay() {
    local env=$1
    local overlay_dir="overlays/$env"
    
    if [ ! -d "$overlay_dir" ]; then
        print_error "Overlay directory $overlay_dir does not exist."
        exit 1
    fi
    
    print_status "Deploying $env overlay..."
    
    # Validate kustomization
    if ! kustomize build "$overlay_dir" &> /dev/null; then
        print_error "Kustomization validation failed for $overlay_dir"
        exit 1
    fi
    
    # Show what will be deployed
    if [ "$VERBOSE" = true ]; then
        print_debug "Resources to be deployed:"
        kustomize build "$overlay_dir" | kubectl diff -f - || true
    fi
    
    # Deploy or dry-run
    if [ "$DRY_RUN" = true ]; then
        print_status "Dry run: Resources that would be deployed:"
        kustomize build "$overlay_dir" | kubectl apply --dry-run=client -f -
    else
        kustomize build "$overlay_dir" | kubectl apply -f -
        
        if [ "$WAIT" = true ]; then
            wait_for_deployment "$env"
        fi
    fi
}

# Function to wait for deployments to be ready
wait_for_deployment() {
    local env=$1
    print_status "Waiting for deployments to be ready in $env environment..."
    
    # Get all deployments from the overlay
    local deployments=$(kustomize build "overlays/$env" | grep -A 10 "kind: Deployment" | grep "name:" | awk '{print $2}' | head -10)
    
    for deployment in $deployments; do
        print_status "Waiting for deployment $deployment..."
        kubectl wait --for=condition=available deployment/$deployment --timeout=$TIMEOUT -n platform-core || \
        kubectl wait --for=condition=available deployment/$deployment --timeout=$TIMEOUT -n services || \
        kubectl wait --for=condition=available deployment/$deployment --timeout=$TIMEOUT -n observability || \
        print_warning "Could not wait for deployment $deployment, continuing..."
    done
    
    print_status "All deployments are ready."
}

# Function to verify deployment
verify_deployment() {
    local env=$1
    print_status "Verifying deployment in $env environment..."
    
    # Check pod status
    print_status "Checking pod status..."
    kubectl get pods -n platform-core -l app.kubernetes.io/environment=$env
    kubectl get pods -n services -l app.kubernetes.io/environment=$env
    kubectl get pods -n observability -l app.kubernetes.io/environment=$env
    
    # Check services
    print_status "Checking services..."
    kubectl get services -n platform-core -l app.kubernetes.io/environment=$env
    kubectl get services -n services -l app.kubernetes.io/environment=$env
    
    # Check ingress
    print_status "Checking ingress..."
    kubectl get ingress -n platform-core -l app.kubernetes.io/environment=$env || \
    print_warning "No ingress resources found."
    
    print_status "Deployment verification completed."
}

# Function to rollback deployment
rollback_deployment() {
    local env=$1
    print_warning "Rolling back deployment in $env environment..."
    
    # Get all deployments from the overlay
    local deployments=$(kustomize build "overlays/$env" | grep -A 10 "kind: Deployment" | grep "name:" | awk '{print $2}' | head -10)
    
    for deployment in $deployments; do
        print_status "Rolling back deployment $deployment..."
        kubectl rollout undo deployment/$deployment -n platform-core || \
        kubectl rollout undo deployment/$deployment -n services || \
        kubectl rollout undo deployment/$deployment -n observability || \
        print_warning "Could not rollback deployment $deployment, continuing..."
    done
    
    print_status "Rollback completed."
}

# Function to clean up resources
cleanup_resources() {
    local env=$1
    print_warning "Cleaning up resources in $env environment..."
    
    if [ "$DRY_RUN" = true ]; then
        print_status "Dry run: Resources that would be deleted:"
        kustomize build "overlays/$env" | kubectl delete --dry-run=client -f -
    else
        kustomize build "overlays/$env" | kubectl delete -f -
        print_status "Cleanup completed."
    fi
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS] COMMAND

Commands:
    deploy              Deploy the application
    verify              Verify the deployment
    rollback            Rollback the deployment
    cleanup             Clean up all resources
    base-only           Deploy only base infrastructure

Options:
    -e, --environment ENV     Set environment (dev, staging, prod) [default: dev]
    -n, --namespace NS        Set target namespace [default: platform-core]
    -d, --dry-run             Show what would be deployed without actually deploying
    -v, --verbose             Show detailed output
    -w, --wait                Wait for deployments to be ready
    -t, --timeout DURATION    Set timeout for wait operations [default: 300s]
    -h, --help                Show this help message

Examples:
    $0 deploy -e dev -v
    $0 deploy -e prod --wait
    $0 verify -e staging
    $0 rollback -e prod
    $0 cleanup -e dev --dry-run

EOF
}

# Parse command line arguments
COMMAND=""
while [[ $# -gt 0 ]]; do
    case $1 in
        deploy|verify|rollback|cleanup|base-only)
            COMMAND="$1"
            shift
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -w|--wait)
            WAIT=true
            shift
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
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

# Validate command
if [ -z "$COMMAND" ]; then
    print_error "No command specified."
    show_usage
    exit 1
fi

# Main execution
main() {
    print_status "Starting Kubernetes deployment for environment: $ENVIRONMENT"
    
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
    
    case $COMMAND in
        deploy)
            create_namespaces
            deploy_base
            deploy_overlay "$ENVIRONMENT"
            if [ "$DRY_RUN" = false ]; then
                verify_deployment "$ENVIRONMENT"
            fi
            ;;
        verify)
            verify_deployment "$ENVIRONMENT"
            ;;
        rollback)
            rollback_deployment "$ENVIRONMENT"
            ;;
        cleanup)
            cleanup_resources "$ENVIRONMENT"
            ;;
        base-only)
            create_namespaces
            deploy_base
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
    
    print_status "Deployment process completed!"
}

# Run main function
main "$@"
