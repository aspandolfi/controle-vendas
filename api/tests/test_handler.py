"""
Unit tests for Lambda handler
"""
import json
from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture
def api_gateway_event():
    """API Gateway event fixture"""
    return {
        "httpMethod": "GET",
        "path": "/health",
        "headers": {},
        "queryStringParameters": None,
        "body": None,
        "requestContext": {
            "requestId": "test-request-id"
        }
    }


@pytest.fixture
def lambda_context():
    """Lambda context fixture"""
    context = MagicMock()
    context.function_name = "test-function"
    context.memory_limit_in_mb = 128
    context.invoked_function_arn = "arn:aws:lambda:us-east-1:123456789012:function:test-function"
    context.aws_request_id = "test-request-id"
    return context


def test_health_check(api_gateway_event, lambda_context):
    """Test health check endpoint"""
    from src.handler import lambda_handler
    
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["status"] == "healthy"
    assert body["service"] == "controle-vendas-api"
    assert body["version"] == "0.0.1"


def test_list_customers(api_gateway_event, lambda_context):
    """Test list customers endpoint"""
    from src.handler import lambda_handler
    
    api_gateway_event["path"] = "/customers"
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "customers" in body


def test_create_customer(api_gateway_event, lambda_context):
    """Test create customer endpoint"""
    from src.handler import lambda_handler
    
    api_gateway_event["httpMethod"] = "POST"
    api_gateway_event["path"] = "/customers"
    api_gateway_event["body"] = json.dumps({
        "name": "Test Customer"
    })
    
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["message"] == "Customer created"


def test_list_sales(api_gateway_event, lambda_context):
    """Test list sales endpoint"""
    from src.handler import lambda_handler
    
    api_gateway_event["path"] = "/sales"
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "sales" in body


def test_create_sale(api_gateway_event, lambda_context):
    """Test create sale endpoint"""
    from src.handler import lambda_handler
    
    api_gateway_event["httpMethod"] = "POST"
    api_gateway_event["path"] = "/sales"
    api_gateway_event["body"] = json.dumps({
        "customer_id": "customer-123",
        "quantity": 10,
        "total_value": 100.00
    })
    
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["message"] == "Sale created"


def test_list_payments(api_gateway_event, lambda_context):
    """Test list payments endpoint"""
    from src.handler import lambda_handler
    
    api_gateway_event["path"] = "/payments"
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "payments" in body


def test_create_payment(api_gateway_event, lambda_context):
    """Test create payment endpoint"""
    from src.handler import lambda_handler
    
    api_gateway_event["httpMethod"] = "POST"
    api_gateway_event["path"] = "/payments"
    api_gateway_event["body"] = json.dumps({
        "customer_id": "customer-123",
        "amount": 50.00
    })
    
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["message"] == "Payment created"
