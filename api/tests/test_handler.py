"""
Unit tests for Lambda handler
"""
import json
import os
from unittest.mock import MagicMock, patch

import pytest

# Set environment variable for tests
os.environ['DYNAMODB_TABLE_NAME'] = 'test-table'


@pytest.fixture(autouse=True)
def mock_dynamodb_table():
    """Mock DynamoDB table for all tests"""
    import boto3
    mock_table = boto3.resource('dynamodb').Table('test-table')
    yield mock_table


def test_health_check(api_gateway_event, lambda_context):
    """Test health check endpoint"""
    from src.handler import lambda_handler
    
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["status"] == "healthy"
    assert body["service"] == "controle-vendas-api"
    assert body["version"] == "0.0.1"


def test_create_sale(mock_dynamodb_table, api_gateway_event, lambda_context):
    """Test create sale endpoint"""
    from src.handler import lambda_handler
    from src.container import reset_container
    
    reset_container()
    
    # Configure mock table
    mock_dynamodb_table.put_item = MagicMock(return_value=None)
    
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


def test_create_payment(mock_dynamodb_table, api_gateway_event, lambda_context):
    """Test create payment endpoint"""
    from src.handler import lambda_handler
    from src.container import reset_container
    
    reset_container()
    
    # Configure mock table
    mock_dynamodb_table.put_item = MagicMock(return_value=None)
    mock_dynamodb_table.get_item = MagicMock(return_value={})  # No sale to update
    
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


def test_create_customer(mock_dynamodb_table, api_gateway_event, lambda_context):
    """Test create customer endpoint"""
    from src.handler import lambda_handler
    from src.container import reset_container
    
    reset_container()
    
    # Configure mock table
    mock_dynamodb_table.put_item = MagicMock(return_value=None)
    
    api_gateway_event["httpMethod"] = "POST"
    api_gateway_event["path"] = "/customers"
    api_gateway_event["body"] = json.dumps({
        "name": "New Customer"
    })
    
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["message"] == "Customer created"
    assert body["customer"]["name"] == "New Customer"
    assert "id" in body["customer"]
    assert "created_at" in body["customer"]


def test_list_customers(mock_dynamodb_table, api_gateway_event, lambda_context):
    """Test list customers endpoint"""
    from src.handler import lambda_handler
    from src.container import reset_container
    
    reset_container()
    
    # Configure mock table query
    mock_dynamodb_table.query = MagicMock(return_value={
        "Items": [
            {
                "PK": "CUSTOMER#customer-1",
                "SK": "CUSTOMER#customer-1",
                "GSI1PK": "CUSTOMER",
                "GSI1SK": "2024-01-01T00:00:00Z",
                "entity_type": "customer",
                "name": "John Doe",
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "PK": "CUSTOMER#customer-2",
                "SK": "CUSTOMER#customer-2",
                "GSI1PK": "CUSTOMER",
                "GSI1SK": "2024-01-02T00:00:00Z",
                "entity_type": "customer",
                "name": "Jane Smith",
                "created_at": "2024-01-02T00:00:00Z"
            }
        ]
    })
    
    api_gateway_event["httpMethod"] = "GET"
    api_gateway_event["path"] = "/customers"
    
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "customers" in body
    assert len(body["customers"]) == 2
    assert body["customers"][0]["name"] == "John Doe"
    assert body["customers"][1]["name"] == "Jane Smith"


def test_list_sales(mock_dynamodb_table, api_gateway_event, lambda_context):
    """Test list sales endpoint without customer filter"""
    from src.handler import lambda_handler
    from src.container import reset_container
    
    reset_container()
    
    # Configure mock table query
    mock_dynamodb_table.query = MagicMock(return_value={
        "Items": [
            {
                "PK": "CUSTOMER#customer-1",
                "SK": "SALE#sale-1",
                "GSI1PK": "SALE",
                "GSI1SK": "2024-01-01T00:00:00Z",
                "entity_type": "sale",
                "id": "sale-1",
                "customer_id": "customer-1",
                "type": "AVULSO",
                "quantity": 10,
                "total_value": "100.0",
                "remaining_balance": "100.0",
                "date": "2024-01-01T00:00:00Z",
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "PK": "CUSTOMER#customer-2",
                "SK": "SALE#sale-2",
                "GSI1PK": "SALE",
                "GSI1SK": "2024-01-02T00:00:00Z",
                "entity_type": "sale",
                "id": "sale-2",
                "customer_id": "customer-2",
                "type": "FIADO",
                "quantity": 5,
                "total_value": "50.0",
                "remaining_balance": "25.0",
                "date": "2024-01-02T00:00:00Z",
                "created_at": "2024-01-02T00:00:00Z"
            }
        ]
    })
    
    api_gateway_event["httpMethod"] = "GET"
    api_gateway_event["path"] = "/sales"
    
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "sales" in body
    assert len(body["sales"]) == 2
    assert body["sales"][0]["quantity"] == 10
    assert body["sales"][1]["quantity"] == 5


def test_list_sales_by_customer(mock_dynamodb_table, api_gateway_event, lambda_context):
    """Test list sales endpoint with customer filter"""
    from src.handler import lambda_handler
    from src.container import reset_container
    
    reset_container()
    
    # Configure mock table query
    mock_dynamodb_table.query = MagicMock(return_value={
        "Items": [
            {
                "PK": "CUSTOMER#customer-123",
                "SK": "SALE#sale-1",
                "entity_type": "sale",
                "id": "sale-1",
                "customer_id": "customer-123",
                "type": "AVULSO",
                "quantity": 10,
                "total_value": "100.0",
                "remaining_balance": "100.0",
                "date": "2024-01-01T00:00:00Z",
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
    })
    
    api_gateway_event["httpMethod"] = "GET"
    api_gateway_event["path"] = "/sales"
    api_gateway_event["queryStringParameters"] = {"customer_id": "customer-123"}
    
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "sales" in body
    assert len(body["sales"]) == 1
    assert body["sales"][0]["quantity"] == 10


def test_list_payments(mock_dynamodb_table, api_gateway_event, lambda_context):
    """Test list payments endpoint without customer filter"""
    from src.handler import lambda_handler
    from src.container import reset_container
    
    reset_container()
    
    # Configure mock table query
    mock_dynamodb_table.query = MagicMock(return_value={
        "Items": [
            {
                "PK": "CUSTOMER#customer-1",
                "SK": "PAYMENT#payment-1",
                "GSI1PK": "PAYMENT",
                "GSI1SK": "2024-01-01T00:00:00Z",
                "entity_type": "payment",
                "id": "payment-1",
                "customer_id": "customer-1",
                "amount": "50.0",
                "date": "2024-01-01T00:00:00Z",
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "PK": "CUSTOMER#customer-2",
                "SK": "PAYMENT#payment-2",
                "GSI1PK": "PAYMENT",
                "GSI1SK": "2024-01-02T00:00:00Z",
                "entity_type": "payment",
                "id": "payment-2",
                "customer_id": "customer-2",
                "amount": "75.0",
                "date": "2024-01-02T00:00:00Z",
                "created_at": "2024-01-02T00:00:00Z"
            }
        ]
    })
    
    api_gateway_event["httpMethod"] = "GET"
    api_gateway_event["path"] = "/payments"
    
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "payments" in body
    assert len(body["payments"]) == 2
    assert body["payments"][0]["amount"] == "50.0"
    assert body["payments"][1]["amount"] == "75.0"


def test_list_payments_by_customer(mock_dynamodb_table, api_gateway_event, lambda_context):
    """Test list payments endpoint with customer filter"""
    from src.handler import lambda_handler
    from src.container import reset_container
    
    reset_container()
    
    # Configure mock table query
    mock_dynamodb_table.query = MagicMock(return_value={
        "Items": [
            {
                "PK": "CUSTOMER#customer-123",
                "SK": "PAYMENT#payment-1",
                "entity_type": "payment",
                "id": "payment-1",
                "customer_id": "customer-123",
                "amount": "50.0",
                "date": "2024-01-01T00:00:00Z",
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
    })
    
    api_gateway_event["httpMethod"] = "GET"
    api_gateway_event["path"] = "/payments"
    api_gateway_event["queryStringParameters"] = {"customer_id": "customer-123"}
    
    response = lambda_handler(api_gateway_event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "payments" in body
    assert len(body["payments"]) == 1
    assert body["payments"][0]["amount"] == "50.0"

