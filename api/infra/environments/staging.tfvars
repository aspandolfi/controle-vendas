# Staging Environment Configuration

environment = "staging"
aws_region  = "sa-east-1"

# Project
project_name = "controle-vendas"

# Lambda Configuration
lambda_runtime     = "python3.11"
lambda_memory_size = 1024
lambda_timeout     = 30

# DynamoDB Configuration
dynamodb_billing_mode = "PAY_PER_REQUEST"

# Monitoring
enable_xray_tracing = true
log_retention_days  = 14

# CORS
cors_allowed_origins = [
  "https://staging.yourdomain.com"
]

# API Documentation
enable_api_docs = true
