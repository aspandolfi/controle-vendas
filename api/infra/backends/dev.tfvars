# Backend configuration for Development environment
# Usage: terraform init -backend-config=backends/dev.tfvars

bucket         = "controle-vendas-terraform-state"
key            = "controle-vendas/dev/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "controle-vendas-terraform-lock"
