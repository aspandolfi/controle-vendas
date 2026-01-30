"""
DynamoDB repository for sales control data
"""
import os
from typing import Any, Dict, List, Optional
import boto3
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

logger = Logger(child=True)


class DynamoDBRepository:
    """Repository for DynamoDB operations"""
    
    def __init__(self, table_name: str):
        """
        Initialize DynamoDB repository
        
        Args:
            table_name: DynamoDB table name
        """
        # Support local DynamoDB endpoint for development
        endpoint_url = os.environ.get('DYNAMODB_ENDPOINT')
        
        if endpoint_url:
            logger.info(f"Using DynamoDB endpoint: {endpoint_url}")
            self.dynamodb = boto3.resource('dynamodb', endpoint_url=endpoint_url)
        else:
            self.dynamodb = boto3.resource('dynamodb')
            
        self.table = self.dynamodb.Table(table_name)
        self.table_name = table_name
    
    def put_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Put an item into DynamoDB
        
        Args:
            item: Item to put
            
        Returns:
            Item that was put
        """
        try:
            self.table.put_item(Item=item)
            logger.info(f"Item created in {self.table_name}", extra={"item": item})
            return item
        except ClientError as e:
            logger.error(f"Error putting item: {e}")
            raise
    
    def get_item(self, pk: str, sk: str) -> Optional[Dict[str, Any]]:
        """
        Get an item from DynamoDB
        
        Args:
            pk: Partition key value
            sk: Sort key value
            
        Returns:
            Item if found, None otherwise
        """
        try:
            response = self.table.get_item(
                Key={'PK': pk, 'SK': sk}
            )
            return response.get('Item')
        except ClientError as e:
            logger.error(f"Error getting item: {e}")
            raise
    
    def query_by_pk(self, pk: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Query items by partition key
        
        Args:
            pk: Partition key value
            limit: Optional limit on number of items
            
        Returns:
            List of items
        """
        try:
            query_params = {
                'KeyConditionExpression': 'PK = :pk',
                'ExpressionAttributeValues': {':pk': pk}
            }
            
            if limit:
                query_params['Limit'] = limit
            
            response = self.table.query(**query_params)
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"Error querying items: {e}")
            raise
    
    def query_by_gsi(
        self, 
        gsi_name: str, 
        gsi_pk: str, 
        gsi_pk_value: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Query items by GSI
        
        Args:
            gsi_name: GSI name
            gsi_pk: GSI partition key attribute name
            gsi_pk_value: GSI partition key value
            limit: Optional limit on number of items
            
        Returns:
            List of items
        """
        try:
            query_params = {
                'IndexName': gsi_name,
                'KeyConditionExpression': f'{gsi_pk} = :pk',
                'ExpressionAttributeValues': {':pk': gsi_pk_value}
            }
            
            if limit:
                query_params['Limit'] = limit
            
            response = self.table.query(**query_params)
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"Error querying GSI: {e}")
            raise
    
    def update_item(
        self, 
        pk: str, 
        sk: str, 
        update_expression: str,
        expression_values: Dict[str, Any],
        expression_names: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Update an item in DynamoDB
        
        Args:
            pk: Partition key value
            sk: Sort key value
            update_expression: Update expression
            expression_values: Expression attribute values
            expression_names: Optional expression attribute names
            
        Returns:
            Updated item
        """
        try:
            update_params = {
                'Key': {'PK': pk, 'SK': sk},
                'UpdateExpression': update_expression,
                'ExpressionAttributeValues': expression_values,
                'ReturnValues': 'ALL_NEW'
            }
            
            if expression_names:
                update_params['ExpressionAttributeNames'] = expression_names
            
            response = self.table.update_item(**update_params)
            return response.get('Attributes', {})
        except ClientError as e:
            logger.error(f"Error updating item: {e}")
            raise
    
    def delete_item(self, pk: str, sk: str) -> None:
        """
        Delete an item from DynamoDB
        
        Args:
            pk: Partition key value
            sk: Sort key value
        """
        try:
            self.table.delete_item(Key={'PK': pk, 'SK': sk})
            logger.info(f"Item deleted from {self.table_name}", extra={"pk": pk, "sk": sk})
        except ClientError as e:
            logger.error(f"Error deleting item: {e}")
            raise
