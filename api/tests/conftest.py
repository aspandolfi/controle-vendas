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
os.environ["AWS_DEFAULT_REGION"] = "sa-east-1"

# Add src directory to Python path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

# Only mock aws_xray_sdk (not boto3 - integration tests need real boto3)
mock_xray_recorder = MagicMock()
mock_core = MagicMock()
mock_core.xray_recorder = mock_xray_recorder
sys.modules['aws_xray_sdk'] = MagicMock()
sys.modules['aws_xray_sdk.core'] = mock_core


@pytest.fixture(autouse=False)
def mock_boto3():
    """Mock boto3 for unit tests - use this fixture in unit tests"""
    mock_table = MagicMock()
    mock_dynamodb = MagicMock()
    mock_dynamodb.Table.return_value = mock_table
    
    mock_boto3_module = MagicMock()
    mock_boto3_module.resource.return_value = mock_dynamodb
    
    # Temporarily replace boto3 in sys.modules
    original_boto3 = sys.modules.get('boto3')
    sys.modules['boto3'] = mock_boto3_module
    
    yield mock_boto3_module
    
    # Restore original boto3
    if original_boto3:
        sys.modules['boto3'] = original_boto3
    else:
        del sys.modules['boto3']


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
    context.invoked_function_arn = "arn:aws:lambda:sa-east-1:123456789012:function:test-function"
    context.aws_request_id = "test-request-id"
    return context

