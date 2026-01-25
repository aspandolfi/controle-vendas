variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "sa-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "controle-vendas"
}

variable "bucket_name" {
  description = "S3 bucket name for static website hosting (optional, will be generated if not provided)"
  type        = string
  default     = ""
}
