"""
Unit tests for Lambda handler
"""
import json
import os
from unittest.mock import MagicMock, patch

import pytest

# Set environment variable for tests
os.environ['DYNAMODB_TABLE_NAME'] = 'test-table'


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


@patch('src.handler.repository')
def test_list_customers(mock_repo, api_gateway_event, lambda_context):
    """Test list customers endpoint"""
    from src.handler import lambda_handler
    
    # Mock repository response
    mock_repo.query_by_gsi.return_value = [
        {
            "SK": "CUSTOMER#123",
            "name": "Test Customer",
            "created_at": "2024-01-01T00:00:00"
        }
    ]
    
    api_gateway_event["path"] = "/customers"
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "customers" in body
    assert len(body["customers"]) == 1
    assert body["customers"][0]["name"] == "Test Customer"


@patch('src.handler.repository')
def test_create_customer(mock_repo, api_gateway_event, lambda_context):
    """Test create customer endpoint"""
    from src.handler import lambda_handler
    
    # Mock repository response
    mock_repo.put_item.return_value = {"id": "123", "name": "Test Customer"}
    
    api_gateway_event["httpMethod"] = "POST"
    api_gateway_event["path"] = "/customers"
    api_gateway_event["body"] = json.dumps({
        "name": "Test Customer"
    })
    
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["message"] == "Customer created"
    assert body["customer"]["name"] == "Test Customer"
    assert "id" in body["customer"]


@patch('src.handler.repository')
def test_list_sales(mock_repo, api_gateway_event, lambda_context):
    """Test list sales endpoint"""
    from src.handler import lambda_handler
    
    # Mock repository response
    mock_repo.query_by_gsi.return_value = [
        {
            "id": "sale-123",
            "customer_id": "customer-123",
            "date": "2024-01-01T00:00:00",
            "type": "AVULSO",
            "quantity": 10,
            "total_value": "100.00",
            "remaining_balance": "100.00",
            "created_at": "2024-01-01T00:00:00"
        }
    ]
    
    api_gateway_event["path"] = "/sales"
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "sales" in body
    assert len(body["sales"]) == 1


@patch('src.handler.repository')
def test_create_sale(mock_repo, api_gateway_event, lambda_context):
    """Test create sale endpoint"""
    from src.handler import lambda_handler
    
    # Mock repository response
    mock_repo.put_item.return_value = {}
    
    api_gateway_event["httpMethod"] = "POST"
    api_gateway_event["path"] = "/sales"
    api_gateway_event["body"] = json.dumps({
        "customer_id": "customer-123",
        "date": "2024-01-01T00:00:00Z",
        "type": "AVULSO",
        "quantity": 10,
        "total_value": 100.00
    })
    
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["message"] == "Sale created"
    assert body["sale"]["customer_id"] == "customer-123"
    assert body["sale"]["quantity"] == 10


@patch('src.handler.repository')
def test_list_payments(mock_repo, api_gateway_event, lambda_context):
    """Test list payments endpoint"""
    from src.handler import lambda_handler
    
    # Mock repository response
    mock_repo.query_by_gsi.return_value = [
        {
            "id": "payment-123",
            "customer_id": "customer-123",
            "date": "2024-01-01T00:00:00",
            "amount": "50.00",
            "sale_id": "sale-123",
            "created_at": "2024-01-01T00:00:00"
        }
    ]
    
    api_gateway_event["path"] = "/payments"
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "payments" in body
    assert len(body["payments"]) == 1


@patch('src.handler.repository')
def test_create_payment(mock_repo, api_gateway_event, lambda_context):
    """Test create payment endpoint"""
    from src.handler import lambda_handler
    
    # Mock repository response
    mock_repo.put_item.return_value = {}
    mock_repo.get_item.return_value = None  # No sale to update
    
    api_gateway_event["httpMethod"] = "POST"
    api_gateway_event["path"] = "/payments"
    api_gateway_event["body"] = json.dumps({
        "customer_id": "customer-123",
        "date": "2024-01-01T00:00:00Z",
        "amount": 50.00
    })
    
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["message"] == "Payment created"
    assert body["payment"]["customer_id"] == "customer-123"
    assert body["payment"]["amount"] == "50.0"
