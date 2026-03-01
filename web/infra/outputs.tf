output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.website.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.website.arn
}

output "website_endpoint" {
  description = "Website endpoint URL"
  value       = aws_s3_bucket_website_configuration.website.website_endpoint
}

output "website_url" {
  description = "Full website URL (S3)"
  value       = "http://${aws_s3_bucket_website_configuration.website.website_endpoint}"
}

output "website_domain" {
  description = "S3 website domain"
  value       = aws_s3_bucket_website_configuration.website.website_domain
}

output "custom_domain_url" {
  description = "Custom domain URL (if domain_name is configured)"
  value       = var.domain_name != "" ? "http://${var.environment == "prod" ? var.domain_name : "${var.environment}.${var.domain_name}"}" : null
}
