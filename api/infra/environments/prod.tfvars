# Production Environment Configuration

environment = "prod"
aws_region  = "us-east-1"

# Project
project_name = "controle-vendas"

# Lambda Configuration
lambda_runtime     = "python3.11"
lambda_memory_size = 2048
lambda_timeout     = 30

# DynamoDB Configuration
dynamodb_billing_mode = "PAY_PER_REQUEST"

# Monitoring
enable_xray_tracing = true
log_retention_days  = 30

# CORS
cors_allowed_origins = [
  "https://app.yourdomain.com",
  "https://www.yourdomain.com"
]

# API Documentation
enable_api_docs = false  # Disable in production for security
