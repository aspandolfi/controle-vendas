# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-api"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.project_name}-${var.environment}-lambda-logs"
  }
}

# Lambda Function
resource "aws_lambda_function" "api" {
  function_name = "${var.project_name}-${var.environment}-api"
  role          = aws_iam_role.lambda_execution.arn
  
  # Deployment package (will be created by CI/CD or manually)
  filename         = "${path.module}/../deployment.zip"
  source_code_hash = fileexists("${path.module}/../deployment.zip") ? filebase64sha256("${path.module}/../deployment.zip") : null
  
  handler = "handler.lambda_handler"
  runtime = var.lambda_runtime
  
  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout

  environment {
    variables = {
      DYNAMODB_TABLE_NAME      = aws_dynamodb_table.main.name
      ENVIRONMENT              = var.environment
      LOG_LEVEL                = var.environment == "prod" ? "INFO" : "DEBUG"
      POWERTOOLS_SERVICE_NAME  = var.project_name
      POWERTOOLS_METRICS_NAMESPACE = var.project_name
    }
  }

  tracing_config {
    mode = var.enable_xray_tracing ? "Active" : "PassThrough"
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy.lambda_logs,
    aws_iam_role_policy.lambda_dynamodb
  ]

  tags = {
    Name = "${var.project_name}-${var.environment}-api"
  }
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Lambda Alias for versioning
resource "aws_lambda_alias" "live" {
  name             = "live"
  description      = "Live alias pointing to latest version"
  function_name    = aws_lambda_function.api.function_name
  function_version = "$LATEST"
}
