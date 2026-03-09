"""
Unit tests for DynamoDB repository
"""
import os
from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

# Set environment variable for tests
os.environ['DYNAMODB_TABLE_NAME'] = 'test-table'


@pytest.fixture
def mock_dynamodb_table():
    """Mock DynamoDB table"""
    return MagicMock()


@pytest.fixture
def mock_dynamodb_resource(mock_dynamodb_table):
    """Mock boto3 DynamoDB resource"""
    mock_resource = MagicMock()
    mock_resource.Table.return_value = mock_dynamodb_table
    return mock_resource


class TestDynamoDBRepository:
    """Tests for DynamoDBRepository"""
    
    def test_init(self, mock_dynamodb_resource):
        """Test repository initialization"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            assert repo.table_name == 'test-table'
            assert repo.dynamodb is not None
            assert repo.table is not None
    
    def test_put_item_success(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test putting item successfully"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            item = {
                'PK': 'CUSTOMER#123',
                'SK': 'CUSTOMER#123',
                'name': 'Test Customer'
            }
            
            result = repo.put_item(item)
            
            mock_dynamodb_table.put_item.assert_called_once_with(Item=item)
            assert result == item
    
    def test_put_item_error(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test put item with error"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            # Mock ClientError
            mock_dynamodb_table.put_item.side_effect = ClientError(
                {'Error': {'Code': 'ValidationException', 'Message': 'Test error'}},
                'PutItem'
            )
            
            item = {'PK': 'TEST', 'SK': 'TEST'}
            
            with pytest.raises(ClientError):
                repo.put_item(item)
    
    def test_get_item_found(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test getting item that exists"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            expected_item = {
                'PK': 'CUSTOMER#123',
                'SK': 'CUSTOMER#123',
                'name': 'Test Customer'
            }
            
            mock_dynamodb_table.get_item.return_value = {'Item': expected_item}
            
            result = repo.get_item('CUSTOMER#123', 'CUSTOMER#123')
            
            mock_dynamodb_table.get_item.assert_called_once_with(
                Key={'PK': 'CUSTOMER#123', 'SK': 'CUSTOMER#123'}
            )
            assert result == expected_item
    
    def test_get_item_not_found(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test getting item that doesn't exist"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            mock_dynamodb_table.get_item.return_value = {}
            
            result = repo.get_item('CUSTOMER#999', 'CUSTOMER#999')
            
            assert result is None
    
    def test_get_item_error(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test get item with error"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            mock_dynamodb_table.get_item.side_effect = ClientError(
                {'Error': {'Code': 'ResourceNotFoundException', 'Message': 'Table not found'}},
                'GetItem'
            )
            
            with pytest.raises(ClientError):
                repo.get_item('TEST', 'TEST')
    
    def test_query_by_pk_success(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test querying by partition key"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            expected_items = [
                {'PK': 'CUSTOMER#123', 'SK': 'SALE#1', 'type': 'sale'},
                {'PK': 'CUSTOMER#123', 'SK': 'SALE#2', 'type': 'sale'}
            ]
            
            mock_dynamodb_table.query.return_value = {'Items': expected_items}
            
            result = repo.query_by_pk('CUSTOMER#123')
            
            mock_dynamodb_table.query.assert_called_once_with(
                KeyConditionExpression='PK = :pk',
                ExpressionAttributeValues={':pk': 'CUSTOMER#123'}
            )
            assert result == expected_items
    
    def test_query_by_pk_with_limit(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test querying by partition key with limit"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            expected_items = [
                {'PK': 'CUSTOMER#123', 'SK': 'SALE#1'}
            ]
            
            mock_dynamodb_table.query.return_value = {'Items': expected_items}
            
            result = repo.query_by_pk('CUSTOMER#123', limit=10)
            
            mock_dynamodb_table.query.assert_called_once_with(
                KeyConditionExpression='PK = :pk',
                ExpressionAttributeValues={':pk': 'CUSTOMER#123'},
                Limit=10
            )
            assert result == expected_items
    
    def test_query_by_pk_empty(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test querying by partition key with no results"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            mock_dynamodb_table.query.return_value = {}
            
            result = repo.query_by_pk('CUSTOMER#999')
            
            assert result == []
    
    def test_query_by_pk_error(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test query by pk with error"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            mock_dynamodb_table.query.side_effect = ClientError(
                {'Error': {'Code': 'ValidationException', 'Message': 'Invalid query'}},
                'Query'
            )
            
            with pytest.raises(ClientError):
                repo.query_by_pk('TEST')
    
    def test_query_by_gsi_success(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test querying by GSI"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            expected_items = [
                {'PK': 'CUSTOMER#1', 'SK': 'CUSTOMER#1', 'GSI1PK': 'CUSTOMER'},
                {'PK': 'CUSTOMER#2', 'SK': 'CUSTOMER#2', 'GSI1PK': 'CUSTOMER'}
            ]
            
            mock_dynamodb_table.query.return_value = {'Items': expected_items}
            
            result = repo.query_by_gsi(
                gsi_name='GSI1',
                gsi_pk='GSI1PK',
                gsi_pk_value='CUSTOMER'
            )
            
            mock_dynamodb_table.query.assert_called_once_with(
                IndexName='GSI1',
                KeyConditionExpression='GSI1PK = :pk',
                ExpressionAttributeValues={':pk': 'CUSTOMER'}
            )
            assert result == expected_items
    
    def test_query_by_gsi_with_limit(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test querying by GSI with limit"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            expected_items = [{'PK': 'CUSTOMER#1', 'SK': 'CUSTOMER#1'}]
            
            mock_dynamodb_table.query.return_value = {'Items': expected_items}
            
            result = repo.query_by_gsi(
                gsi_name='GSI1',
                gsi_pk='GSI1PK',
                gsi_pk_value='CUSTOMER',
                limit=5
            )
            
            mock_dynamodb_table.query.assert_called_once_with(
                IndexName='GSI1',
                KeyConditionExpression='GSI1PK = :pk',
                ExpressionAttributeValues={':pk': 'CUSTOMER'},
                Limit=5
            )
            assert result == expected_items
    
    def test_query_by_gsi_error(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test query by GSI with error"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            mock_dynamodb_table.query.side_effect = ClientError(
                {'Error': {'Code': 'ValidationException', 'Message': 'Invalid index'}},
                'Query'
            )
            
            with pytest.raises(ClientError):
                repo.query_by_gsi('GSI1', 'GSI1PK', 'TEST')
    
    def test_update_item_success(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test updating item successfully"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            updated_item = {
                'PK': 'CUSTOMER#123',
                'SK': 'SALE#1',
                'remaining_balance': '50.00'
            }
            
            mock_dynamodb_table.update_item.return_value = {'Attributes': updated_item}
            
            result = repo.update_item(
                pk='CUSTOMER#123',
                sk='SALE#1',
                update_expression='SET remaining_balance = :balance',
                expression_values={':balance': '50.00'}
            )
            
            mock_dynamodb_table.update_item.assert_called_once_with(
                Key={'PK': 'CUSTOMER#123', 'SK': 'SALE#1'},
                UpdateExpression='SET remaining_balance = :balance',
                ExpressionAttributeValues={':balance': '50.00'},
                ReturnValues='ALL_NEW'
            )
            assert result == updated_item
    
    def test_update_item_with_names(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test updating item with expression attribute names"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            updated_item = {'PK': 'TEST', 'SK': 'TEST', 'status': 'active'}
            
            mock_dynamodb_table.update_item.return_value = {'Attributes': updated_item}
            
            result = repo.update_item(
                pk='TEST',
                sk='TEST',
                update_expression='SET #status = :status',
                expression_values={':status': 'active'},
                expression_names={'#status': 'status'}
            )
            
            call_args = mock_dynamodb_table.update_item.call_args[1]
            assert call_args['ExpressionAttributeNames'] == {'#status': 'status'}
            assert result == updated_item
    
    def test_update_item_error(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test update item with error"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            mock_dynamodb_table.update_item.side_effect = ClientError(
                {'Error': {'Code': 'ConditionalCheckFailedException', 'Message': 'Condition failed'}},
                'UpdateItem'
            )
            
            with pytest.raises(ClientError):
                repo.update_item(
                    pk='TEST',
                    sk='TEST',
                    update_expression='SET x = :x',
                    expression_values={':x': 'value'}
                )
    
    def test_delete_item_success(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test deleting item successfully"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            repo.delete_item('CUSTOMER#123', 'CUSTOMER#123')
            
            mock_dynamodb_table.delete_item.assert_called_once_with(
                Key={'PK': 'CUSTOMER#123', 'SK': 'CUSTOMER#123'}
            )
    
    def test_delete_item_error(self, mock_dynamodb_resource, mock_dynamodb_table):
        """Test delete item with error"""
        with patch('boto3.resource', return_value=mock_dynamodb_resource):
            from src.repository import DynamoDBRepository
            
            repo = DynamoDBRepository('test-table')
            
            mock_dynamodb_table.delete_item.side_effect = ClientError(
                {'Error': {'Code': 'ConditionalCheckFailedException', 'Message': 'Condition failed'}},
                'DeleteItem'
            )
            
            with pytest.raises(ClientError):
                repo.delete_item('TEST', 'TEST')
