# Local variable for OpenAPI spec with environment substitution
locals {
  openapi_spec = templatefile("${path.module}/../api-gtw/openapi.json", {
    api_title       = "${var.project_name}-${var.environment}"
    api_description = "API Gateway for ${var.project_name} ${var.environment}"
    lambda_uri      = aws_lambda_function.api.invoke_arn
  })
}

# API Gateway HTTP API with OpenAPI specification
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-${var.environment}-api"
  protocol_type = "HTTP"
  description   = "API Gateway for ${var.project_name} ${var.environment}"
  
  # Import OpenAPI specification
  body = local.openapi_spec

  cors_configuration {
    allow_origins = var.cors_allowed_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
    max_age       = 300
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-api-gateway"
  }
}

# API Gateway Integration with Lambda
resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  connection_type      = "INTERNET"
  integration_method   = "POST"
  integration_uri      = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

# API Gateway Route - Catch all
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      errorMessage   = "$context.error.message"
    })
  }

  default_route_settings {
    throttling_burst_limit = 1000
    throttling_rate_limit  = 500
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-stage"
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.project_name}-${var.environment}-api-gateway-logs"
  }
}

# API Gateway Domain Name (Optional - for custom domain)
# Uncomment when you have a domain and certificate
# resource "aws_apigatewayv2_domain_name" "main" {
#   domain_name = "api-${var.environment}.yourdomain.com"
#
#   domain_name_configuration {
#     certificate_arn = aws_acm_certificate.main.arn
#     endpoint_type   = "REGIONAL"
#     security_policy = "TLS_1_2"
#   }
#
#   tags = {
#     Name = "${var.project_name}-${var.environment}-domain"
#   }
# }

# API Mapping (Optional - for custom domain)
# resource "aws_apigatewayv2_api_mapping" "main" {
#   api_id      = aws_apigatewayv2_api.main.id
#   domain_name = aws_apigatewayv2_domain_name.main.id
#   stage       = aws_apigatewayv2_stage.main.id
# }
