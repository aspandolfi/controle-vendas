# CloudFront distribution for web application

locals {
  s3_origin_id = "S3-${aws_s3_bucket.website.id}"
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "website" {
  comment = "OAI for ${local.bucket_name}"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "website" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name}-${var.environment}-web"
  default_root_object = "index.html"
  price_class         = var.cloudfront_price_class
  aliases             = var.domain_name != "" ? [var.environment == "prod" ? var.domain_name : "${var.environment}.${var.domain_name}"] : []

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = local.s3_origin_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.website.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false
      headers      = []

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400    # 1 day
    max_ttl                = 31536000 # 1 year
    compress               = true
  }

  # Cache behavior for index.html (no cache for main entry point)
  ordered_cache_behavior {
    path_pattern     = "/index.html"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false
      headers      = []

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }

  # Custom error response for SPA routing
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.domain_name == ""
    # Usa certificado importado (Let's Encrypt) se fornecido, senão usa ACM
    acm_certificate_arn = var.domain_name != "" ? (
      var.certificate_arn != "" ? var.certificate_arn : aws_acm_certificate.website[0].arn
    ) : null
    ssl_support_method       = var.domain_name != "" ? "sni-only" : null
    minimum_protocol_version = var.domain_name != "" ? "TLSv1.2_2021" : null
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cdn"
  }

  # Aguarda validação do certificado ACM (se estiver sendo criado)
  # Para certificados Let's Encrypt importados, não há dependência
  depends_on = [
    aws_acm_certificate_validation.website
  ]
}

# Update S3 bucket policy to allow CloudFront access
resource "aws_s3_bucket_policy" "website_cloudfront" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "CloudFrontReadGetObject"
        Effect    = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.website.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.website]
}
