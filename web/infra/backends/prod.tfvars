# Backend configuration for Production environment
# Usage: terraform init -backend-config=backends/prod.tfvars

bucket         = "controle-vendas-terraform-state-prod"
key            = "web/prod/terraform.tfstate"
region         = "sa-east-1"
encrypt        = true
dynamodb_table = "controle-vendas-terraform-lock"
