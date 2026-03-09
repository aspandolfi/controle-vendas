# Development Environment Configuration

environment = "dev"
aws_region  = "sa-east-1"

# Project
project_name = "controle-vendas"

# Lambda Configuration
lambda_runtime     = "python3.11"
lambda_memory_size = 512
lambda_timeout     = 30

# DynamoDB Configuration
dynamodb_billing_mode = "PAY_PER_REQUEST"

# Monitoring
enable_xray_tracing = true
log_retention_days  = 7

# CORS
cors_allowed_origins = [
  "http://localhost:4200",
  "http://localhost:3000"
]

# API Documentation
enable_api_docs = true
