locals {
  bucket_name = var.bucket_name != "" ? var.bucket_name : "${var.project_name}-web-${var.environment}-${data.aws_caller_identity.current.account_id}"
}

data "aws_caller_identity" "current" {}

# S3 Bucket for static website hosting
resource "aws_s3_bucket" "website" {
  bucket = local.bucket_name

  tags = {
    Name        = local.bucket_name
    Environment = var.environment
    Project     = var.project_name
  }
}

# Enable versioning
resource "aws_s3_bucket_versioning" "website" {
  bucket = aws_s3_bucket.website.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Configure static website hosting
resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Configure public access for website hosting
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket policy is now managed in cloudfront.tf (renamed but kept for compatibility)

# CORS configuration
resource "aws_s3_bucket_cors_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
