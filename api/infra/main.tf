terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Backend configuration will be provided via backend config file
    # Example: terraform init -backend-config=backend.tfvars
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "controle-vendas"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
