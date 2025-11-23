output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_stage.main.invoke_url
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_apigatewayv2_api.main.id
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.api.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.api.arn
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.main.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.main.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.lambda.name
}

output "api_documentation_url" {
  description = "API documentation URL (OpenAPI spec)"
  value       = "${aws_apigatewayv2_stage.main.invoke_url}/openapi.json"
}

output "api_base_url" {
  description = "API base URL for requests"
  value       = aws_apigatewayv2_stage.main.invoke_url
}

output "swagger_ui_url" {
  description = "Swagger UI documentation URL"
  value       = var.enable_api_docs ? "http://${aws_s3_bucket.api_docs[0].bucket}.s3-website-${var.aws_region}.amazonaws.com" : "Not enabled (set enable_api_docs=true)"
}
