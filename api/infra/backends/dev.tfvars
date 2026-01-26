# Backend configuration for Development environment
# Usage: terraform init -backend-config=backends/dev.tfvars

bucket         = "controle-vendas-terraform-state-dev"
key            = "api/dev/terraform.tfstate"
region         = "sa-east-1"
encrypt        = true
dynamodb_table = "controle-vendas-terraform-lock"
