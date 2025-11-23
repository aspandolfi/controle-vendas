#!/bin/bash

# Deploy script for Terraform infrastructure

set -e

ENVIRONMENT=${1:-dev}
ACTION=${2:-plan}

echo "🚀 Deploying to $ENVIRONMENT..."

cd "$(dirname "$0")/../infra"

# Check if deployment.zip exists
if [ ! -f "../deployment.zip" ]; then
    echo "⚠️  deployment.zip not found. Running build script..."
    ../scripts/build.sh
fi

# Initialize if needed
if [ ! -d ".terraform" ]; then
    echo "🔧 Initializing Terraform..."
    terraform init -backend-config="backend-${ENVIRONMENT}.tfvars"
fi

# Select workspace or use tfvars
if terraform workspace list | grep -q "$ENVIRONMENT"; then
    terraform workspace select "$ENVIRONMENT"
fi

# Execute action
case $ACTION in
    plan)
        echo "📋 Running terraform plan..."
        terraform plan -var-file="terraform.tfvars"
        ;;
    apply)
        echo "✅ Applying infrastructure changes..."
        terraform apply -var-file="terraform.tfvars" -auto-approve
        echo ""
        echo "🎉 Deployment complete!"
        echo ""
        terraform output
        ;;
    destroy)
        echo "💥 Destroying infrastructure..."
        read -p "Are you sure you want to destroy $ENVIRONMENT? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            terraform destroy -var-file="terraform.tfvars" -auto-approve
        else
            echo "Destroy cancelled."
        fi
        ;;
    output)
        echo "📤 Outputs:"
        terraform output
        ;;
    *)
        echo "Unknown action: $ACTION"
        echo "Usage: ./deploy.sh [environment] [plan|apply|destroy|output]"
        exit 1
        ;;
esac
