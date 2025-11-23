# Backend configuration for Production environment
# Usage: terraform init -backend-config=backends/prod.tfvars

bucket         = "controle-vendas-terraform-state"
key            = "controle-vendas/prod/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "controle-vendas-terraform-lock"
