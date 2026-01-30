# Backend configuration for Staging environment
# Usage: terraform init -backend-config=backends/staging.tfvars

bucket         = "controle-vendas-terraform-state-staging"
key            = "web/staging/terraform.tfstate"
region         = "sa-east-1"
encrypt        = true
dynamodb_table = "controle-vendas-terraform-lock"
