#!/bin/bash

# Terraform deployment script with environment selection

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

print_header() {
    echo ""
    echo "=================================="
    echo "$1"
    echo "=================================="
    echo ""
}

# Check arguments
if [ $# -lt 1 ]; then
    print_error "Usage: ./terraform.sh <environment> [action]
    
Environments: dev, staging, prod
Actions: init, plan, apply, destroy, output, validate, fmt

Examples:
    ./terraform.sh dev plan
    ./terraform.sh prod apply
    ./terraform.sh staging destroy"
fi

ENVIRONMENT=$1
ACTION=${2:-plan}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT. Must be dev, staging, or prod"
fi

# Change to infra directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../infra"

print_header "🚀 Terraform - $ENVIRONMENT environment"

# Check if environment config exists
if [ ! -f "environments/${ENVIRONMENT}.tfvars" ]; then
    print_error "Environment config not found: environments/${ENVIRONMENT}.tfvars"
fi

# Check if backend config exists
if [ ! -f "backends/${ENVIRONMENT}.tfvars" ]; then
    print_error "Backend config not found: backends/${ENVIRONMENT}.tfvars"
fi

# Handle actions
case $ACTION in
    init)
        print_info "Initializing Terraform for $ENVIRONMENT..."
        terraform init -backend-config="backends/${ENVIRONMENT}.tfvars" -reconfigure
        print_success "Terraform initialized!"
        ;;
        
    validate)
        print_info "Validating Terraform configuration..."
        terraform validate
        print_success "Configuration is valid!"
        ;;
        
    fmt)
        print_info "Formatting Terraform files..."
        terraform fmt -recursive
        print_success "Files formatted!"
        ;;
        
    plan)
        print_info "Creating execution plan for $ENVIRONMENT..."
        
        # Check if deployment.zip exists
        if [ ! -f "../deployment.zip" ]; then
            print_warning "deployment.zip not found. Building Lambda package..."
            cd ..
            ./scripts/build.sh
            cd infra
        fi
        
        terraform plan -var-file="environments/${ENVIRONMENT}.tfvars" -out="${ENVIRONMENT}.tfplan"
        print_success "Plan created: ${ENVIRONMENT}.tfplan"
        print_info "Review the plan above. To apply, run: ./terraform.sh $ENVIRONMENT apply"
        ;;
        
    apply)
        # Check if plan exists
        if [ -f "${ENVIRONMENT}.tfplan" ]; then
            print_info "Applying saved plan for $ENVIRONMENT..."
            terraform apply "${ENVIRONMENT}.tfplan"
            rm "${ENVIRONMENT}.tfplan"
        else
            print_warning "No saved plan found. Creating and applying..."
            
            # Check if deployment.zip exists
            if [ ! -f "../deployment.zip" ]; then
                print_warning "deployment.zip not found. Building Lambda package..."
                cd ..
                ./scripts/build.sh
                cd infra
            fi
            
            terraform apply -var-file="environments/${ENVIRONMENT}.tfvars" -auto-approve
        fi
        
        print_success "Infrastructure deployed successfully!"
        echo ""
        print_info "📤 Outputs:"
        terraform output
        ;;
        
    destroy)
        print_warning "⚠️  DESTRUCTIVE ACTION ⚠️"
        print_warning "You are about to destroy all resources in $ENVIRONMENT environment!"
        echo ""
        read -p "Type the environment name '$ENVIRONMENT' to confirm: " confirm
        
        if [ "$confirm" != "$ENVIRONMENT" ]; then
            print_error "Confirmation failed. Destroy cancelled."
        fi
        
        print_info "Destroying infrastructure in $ENVIRONMENT..."
        terraform destroy -var-file="environments/${ENVIRONMENT}.tfvars" -auto-approve
        print_success "Infrastructure destroyed!"
        ;;
        
    output)
        print_info "📤 Outputs for $ENVIRONMENT:"
        terraform output
        ;;
        
    refresh)
        print_info "Refreshing state for $ENVIRONMENT..."
        terraform refresh -var-file="environments/${ENVIRONMENT}.tfvars"
        print_success "State refreshed!"
        ;;
        
    state)
        print_info "Showing current state for $ENVIRONMENT..."
        terraform state list
        ;;
        
    console)
        print_info "Opening Terraform console for $ENVIRONMENT..."
        terraform console -var-file="environments/${ENVIRONMENT}.tfvars"
        ;;
        
    *)
        print_error "Unknown action: $ACTION
        
Available actions:
  init      - Initialize Terraform
  validate  - Validate configuration
  fmt       - Format Terraform files
  plan      - Create execution plan
  apply     - Apply infrastructure changes
  destroy   - Destroy infrastructure
  output    - Show outputs
  refresh   - Refresh state
  state     - List state resources
  console   - Open Terraform console"
        ;;
esac

print_success "Done!"
