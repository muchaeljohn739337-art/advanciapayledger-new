#!/bin/bash

# Advancia PayLedger - Automated Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 Setting up Advancia PayLedger..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 20+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        log_error "Node.js version 20+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    log_success "Node.js $(node -v) detected"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_warning "Docker is not installed. Please install Docker Desktop for the best experience."
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        log_warning "Docker is not running. Please start Docker Desktop."
        return 1
    fi
    
    log_success "Docker is running"
    return 0
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Install root dependencies
    npm install
    log_success "Root dependencies installed"
    
    # Install backend dependencies
    cd backend
    npm install
    log_success "Backend dependencies installed"
    cd ..
    
    # Install frontend dependencies
    cd frontend
    npm install
    log_success "Frontend dependencies installed"
    cd ..
}

# Setup environment files
setup_environment() {
    log_info "Setting up environment files..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        log_success "Environment file created from template"
        log_warning "Please edit .env file with your actual values"
    else
        log_info "Environment file already exists"
    fi
}

# Setup database with Docker
setup_database_docker() {
    log_info "Setting up database with Docker..."
    
    # Start PostgreSQL and Redis
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10
    
    # Run database migrations
    cd backend
    npx prisma migrate dev --name init || true
    npx prisma generate
    cd ..
    
    log_success "Database setup completed"
}

# Setup database locally
setup_database_local() {
    log_info "Setting up database locally..."
    
    # Check if PostgreSQL is running locally
    if ! pg_isready -h localhost -p 5432 &> /dev/null; then
        log_error "PostgreSQL is not running on localhost:5432"
        log_info "Please start PostgreSQL or use Docker setup"
        return 1
    fi
    
    # Run database migrations
    cd backend
    npx prisma migrate dev --name init || true
    npx prisma generate
    cd ..
    
    log_success "Database setup completed"
}

# Create logs directory
create_logs_dir() {
    log_info "Creating logs directory..."
    mkdir -p backend/logs
    log_success "Logs directory created"
}

# Start development servers
start_servers() {
    log_info "Starting development servers..."
    
    # Start in background
    npm run dev &
    
    log_success "Development servers starting..."
    log_info "Frontend: http://localhost:3000"
    log_info "Backend: http://localhost:3001"
    log_info "Health Check: http://localhost:3001/health"
}

# Main setup function
main() {
    echo "🏥 Advancia PayLedger Setup"
    echo "=========================="
    
    # Check prerequisites
    check_nodejs
    
    # Check Docker (optional)
    DOCKER_AVAILABLE=false
    if check_docker; then
        DOCKER_AVAILABLE=true
    fi
    
    # Install dependencies
    install_dependencies
    
    # Setup environment
    setup_environment
    
    # Create logs directory
    create_logs_dir
    
    # Setup database
    if [ "$DOCKER_AVAILABLE" = true ]; then
        setup_database_docker
    else
        log_warning "Docker not available. Attempting local database setup..."
        if ! setup_database_local; then
            log_error "Database setup failed. Please install Docker or setup PostgreSQL manually."
            exit 1
        fi
    fi
    
    # Start servers
    start_servers
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo "==============================="
    echo ""
    echo "📱 Access your application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:3001"
    echo "   Health:   http://localhost:3001/health"
    echo ""
    echo "🔧 Useful commands:"
    echo "   Stop servers:     Ctrl+C or docker-compose down"
    echo "   View logs:        docker-compose logs -f"
    echo "   Database GUI:     npm run db:studio"
    echo "   Run tests:        npm test"
    echo ""
    echo "📚 Documentation:"
    echo "   README.md:        Main documentation"
    echo "   QUICK_START.md:   Quick start guide"
    echo "   DEPLOYMENT.md:    Production deployment"
    echo ""
    echo "⚠️  Important:"
    echo "   - Edit .env file with your actual values"
    echo "   - Change default passwords for production"
    echo "   - Keep your encryption keys secure"
    echo ""
    
    log_success "Advancia PayLedger is ready to use! 🚀"
}

# Run main function
main
