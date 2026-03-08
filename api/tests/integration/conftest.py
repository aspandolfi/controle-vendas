"""
Configuration for integration tests with LocalStack
"""
import os
import sys
import time
from pathlib import Path
from typing import Generator

import boto3
import pytest
from botocore.config import Config
from botocore.exceptions import ClientError

# Add src directory to Python path
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

# Environment configuration for LocalStack
LOCALSTACK_ENDPOINT = os.getenv("LOCALSTACK_ENDPOINT", "http://localhost:4566")
AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "sa-east-1")
TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "controle-vendas-integration-test")


@pytest.fixture(scope="session")
def aws_credentials():
    """Set up AWS credentials for LocalStack"""
    os.environ["AWS_ACCESS_KEY_ID"] = "test"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "test"
    os.environ["AWS_DEFAULT_REGION"] = AWS_REGION
    os.environ["AWS_REGION"] = AWS_REGION
    os.environ["POWERTOOLS_TRACE_DISABLED"] = "true"
    os.environ["POWERTOOLS_SERVICE_NAME"] = "controle-vendas-api-integration-test"
    os.environ["POWERTOOLS_LOG_LEVEL"] = "DEBUG"


@pytest.fixture(scope="session")
def localstack_config(aws_credentials) -> Config:
    """Boto3 configuration for LocalStack"""
    return Config(
        region_name=AWS_REGION,
        signature_version='v4',
        retries={
            'max_attempts': 3,
            'mode': 'standard'
        }
    )


@pytest.fixture(scope="session")
def dynamodb_client(localstack_config):
    """DynamoDB client pointing to LocalStack"""
    return boto3.client(
        'dynamodb',
        endpoint_url=LOCALSTACK_ENDPOINT,
        config=localstack_config
    )


@pytest.fixture(scope="session")
def dynamodb_resource(localstack_config):
    """DynamoDB resource pointing to LocalStack"""
    return boto3.resource(
        'dynamodb',
        endpoint_url=LOCALSTACK_ENDPOINT,
        config=localstack_config
    )


@pytest.fixture(scope="session")
def dynamodb_table(dynamodb_client, dynamodb_resource) -> Generator:
    """
    Create DynamoDB table for integration tests
    
    Table structure:
    - PK: Partition Key (string)
    - SK: Sort Key (string)
    - GSI1PK/GSI1SK: Global Secondary Index for querying by entity type
    """
    table_name = TABLE_NAME
    
    # Check if table exists
    try:
        dynamodb_client.describe_table(TableName=table_name)
        print(f"Table {table_name} already exists, deleting...")
        dynamodb_client.delete_table(TableName=table_name)
        
        # Wait for table to be deleted
        waiter = dynamodb_client.get_waiter('table_not_exists')
        waiter.wait(TableName=table_name)
    except ClientError as e:
        if e.response['Error']['Code'] != 'ResourceNotFoundException':
            raise
    
    # Create table
    print(f"Creating table {table_name}...")
    dynamodb_client.create_table(
        TableName=table_name,
        KeySchema=[
            {'AttributeName': 'PK', 'KeyType': 'HASH'},
            {'AttributeName': 'SK', 'KeyType': 'RANGE'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'PK', 'AttributeType': 'S'},
            {'AttributeName': 'SK', 'AttributeType': 'S'},
            {'AttributeName': 'GSI1PK', 'AttributeType': 'S'},
            {'AttributeName': 'GSI1SK', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'GSI1',
                'KeySchema': [
                    {'AttributeName': 'GSI1PK', 'KeyType': 'HASH'},
                    {'AttributeName': 'GSI1SK', 'KeyType': 'RANGE'}
                ],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            }
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    )
    
    # Wait for table to be active
    waiter = dynamodb_client.get_waiter('table_exists')
    waiter.wait(TableName=table_name)
    
    # Additional wait for GSI to be active
    time.sleep(2)
    
    print(f"Table {table_name} created successfully")
    
    table = dynamodb_resource.Table(table_name)
    
    yield table
    
    # Cleanup: Delete table after all tests
    try:
        print(f"Cleaning up: Deleting table {table_name}...")
        dynamodb_client.delete_table(TableName=table_name)
    except ClientError as e:
        print(f"Error deleting table: {e}")


@pytest.fixture(autouse=True)
def clean_table(dynamodb_table):
    """Clean table before each test"""
    # Scan and delete all items
    response = dynamodb_table.scan()
    
    with dynamodb_table.batch_writer() as batch:
        for item in response.get('Items', []):
            batch.delete_item(
                Key={'PK': item['PK'], 'SK': item['SK']}
            )
    
    yield
    
    # Clean again after test
    response = dynamodb_table.scan()
    with dynamodb_table.batch_writer() as batch:
        for item in response.get('Items', []):
            batch.delete_item(
                Key={'PK': item['PK'], 'SK': item['SK']}
            )


@pytest.fixture
def repository(dynamodb_table):
    """Repository instance for integration tests"""
    # Set environment variable for the repository to use LocalStack
    os.environ['DYNAMODB_ENDPOINT'] = LOCALSTACK_ENDPOINT
    os.environ['DYNAMODB_TABLE_NAME'] = TABLE_NAME
    
    from repository import DynamoDBRepository
    
    return DynamoDBRepository(TABLE_NAME)


@pytest.fixture
def customer_service(repository):
    """CustomerService instance for integration tests"""
    from service import CustomerService
    
    return CustomerService(repository)


@pytest.fixture
def sample_customer_data():
    """Sample customer data for testing"""
    return {
        "name": "João Silva",
    }


@pytest.fixture
def sample_sale_data():
    """Sample sale data for testing"""
    return {
        "customer_id": "test-customer-id",
        "quantity": 10,
        "total_value": "100.50",
        "type": "PRAZO"
    }


@pytest.fixture
def sample_payment_data():
    """Sample payment data for testing"""
    return {
        "customer_id": "test-customer-id",
        "amount": "50.00",
        "sale_id": "test-sale-id"
    }
