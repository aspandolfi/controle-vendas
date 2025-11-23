# S3 bucket for API documentation (optional)
resource "aws_s3_bucket" "api_docs" {
  count  = var.enable_api_docs ? 1 : 0
  bucket = "${var.project_name}-${var.environment}-api-docs"

  tags = {
    Name = "${var.project_name}-${var.environment}-api-docs"
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "api_docs" {
  count  = var.enable_api_docs ? 1 : 0
  bucket = aws_s3_bucket.api_docs[0].id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 bucket policy for public read
resource "aws_s3_bucket_policy" "api_docs" {
  count  = var.enable_api_docs ? 1 : 0
  bucket = aws_s3_bucket.api_docs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.api_docs[0].arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.api_docs]
}

# S3 bucket website configuration
resource "aws_s3_bucket_website_configuration" "api_docs" {
  count  = var.enable_api_docs ? 1 : 0
  bucket = aws_s3_bucket.api_docs[0].id

  index_document {
    suffix = "index.html"
  }
}

# Upload OpenAPI spec to S3
resource "aws_s3_object" "openapi_spec" {
  count        = var.enable_api_docs ? 1 : 0
  bucket       = aws_s3_bucket.api_docs[0].id
  key          = "openapi.json"
  content      = local.openapi_spec
  content_type = "application/json"

  tags = {
    Name = "OpenAPI Specification"
  }
}

# Upload Swagger UI
resource "aws_s3_object" "swagger_ui_html" {
  count        = var.enable_api_docs ? 1 : 0
  bucket       = aws_s3_bucket.api_docs[0].id
  key          = "index.html"
  content_type = "text/html"

  content = templatefile("${path.module}/../api-gtw/swagger-ui.html", {
    openapi_url = "https://${aws_s3_bucket.api_docs[0].bucket}.s3.${var.aws_region}.amazonaws.com/openapi.json"
  })

  tags = {
    Name = "Swagger UI"
  }
}
