"""
Test configuration
"""
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

# Set environment variables before any imports
os.environ["POWERTOOLS_TRACE_DISABLED"] = "true"
os.environ["AWS_XRAY_CONTEXT_MISSING"] = "LOG_ERROR"
os.environ["DYNAMODB_TABLE_NAME"] = "test-table"
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"

# Add src directory to Python path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

# Mock aws_xray_sdk before imports
mock_xray_recorder = MagicMock()
mock_core = MagicMock()
mock_core.xray_recorder = mock_xray_recorder
sys.modules['aws_xray_sdk'] = MagicMock()
sys.modules['aws_xray_sdk.core'] = mock_core

# Mock boto3 before any imports
mock_table = MagicMock()
mock_dynamodb = MagicMock()
mock_dynamodb.Table.return_value = mock_table

mock_boto3 = MagicMock()
mock_boto3.resource.return_value = mock_dynamodb
sys.modules['boto3'] = mock_boto3


@pytest.fixture
def mock_repository():
    """Mock DynamoDB repository"""
    from unittest.mock import MagicMock
    return MagicMock()


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

