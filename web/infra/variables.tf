variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "sa-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
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

variable "cloudfront_price_class" {
  description = "CloudFront price class (PriceClass_All, PriceClass_200, PriceClass_100)"
  type        = string
  default     = "PriceClass_100"
  validation {
    condition     = contains(["PriceClass_All", "PriceClass_200", "PriceClass_100"], var.cloudfront_price_class)
    error_message = "CloudFront price class must be PriceClass_All, PriceClass_200, or PriceClass_100."
  }
}

variable "domain_name" {
  description = "Custom domain name for the website (optional). If not provided, CloudFront default domain will be used"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ARN of SSL certificate in ACM (us-east-1). Can be ACM-generated or imported from Let's Encrypt. If not provided, a new ACM certificate will be created"
  type        = string
  default     = ""
}

variable "use_acm_certificate" {
  description = "Whether to create a new ACM certificate (true) or use an imported certificate ARN (false)"
  type        = bool
  default     = true
}
