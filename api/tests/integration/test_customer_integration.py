"""
Integration tests for Customer operations
"""
import pytest
from decimal import Decimal


class TestCustomerIntegration:
    """Integration tests for Customer CRUD operations"""
    
    def test_create_customer(self, customer_service, sample_customer_data):
        """Test creating a customer in DynamoDB"""
        # Create customer
        customer = customer_service.create_customer(
            name=sample_customer_data["name"]
        )
        
        # Assertions
        assert customer is not None
        assert customer["id"] is not None
        assert customer["name"] == sample_customer_data["name"]
        assert "created_at" in customer
    
    def test_list_customers_empty(self, customer_service):
        """Test listing customers when table is empty"""
        customers = customer_service.list_customers()
        
        assert customers == []
    
    def test_list_customers_with_data(self, customer_service, sample_customer_data):
        """Test listing customers with data"""
        # Create multiple customers
        customer1 = customer_service.create_customer(name="João Silva")
        customer2 = customer_service.create_customer(name="Maria Santos")
        customer3 = customer_service.create_customer(name="Pedro Oliveira")
        
        # List customers
        customers = customer_service.list_customers()
        
        # Assertions
        assert len(customers) == 3
        
        customer_names = [c["name"] for c in customers]
        assert "João Silva" in customer_names
        assert "Maria Santos" in customer_names
        assert "Pedro Oliveira" in customer_names
    
    def test_create_customer_with_special_characters(self, customer_service):
        """Test creating customer with special characters in name"""
        customer = customer_service.create_customer(
            name="José da Silva & Filhos Ltda."
        )
        
        assert customer is not None
        assert customer["name"] == "José da Silva & Filhos Ltda."
    
    def test_repository_get_item(self, repository, customer_service):
        """Test getting specific customer from repository"""
        # Create customer
        customer = customer_service.create_customer(name="Test Customer")
        customer_id = customer["id"]
        
        # Get item directly from repository
        pk = f"CUSTOMER#{customer_id}"
        sk = f"CUSTOMER#{customer_id}"
        item = repository.get_item(pk, sk)
        
        # Assertions
        assert item is not None
        assert item["id"] == customer_id
        assert item["name"] == "Test Customer"
        assert item["entity_type"] == "customer"
    
    def test_repository_query_by_pk(self, repository, customer_service):
        """Test querying customer by partition key"""
        # Create customer
        customer = customer_service.create_customer(name="Query Test Customer")
        customer_id = customer["id"]
        
        # Query by PK
        pk = f"CUSTOMER#{customer_id}"
        items = repository.query_by_pk(pk)
        
        # Assertions
        assert len(items) == 1
        assert items[0]["id"] == customer_id
        assert items[0]["name"] == "Query Test Customer"


class TestCustomerRepositoryIntegration:
    """Integration tests for DynamoDB Repository customer operations"""
    
    def test_put_and_get_customer_item(self, repository):
        """Test putting and getting a customer item"""
        # Prepare item
        customer_id = "test-customer-123"
        item = {
            "PK": f"CUSTOMER#{customer_id}",
            "SK": f"CUSTOMER#{customer_id}",
            "GSI1PK": "CUSTOMER",
            "GSI1SK": "2024-01-01T00:00:00",
            "entity_type": "customer",
            "id": customer_id,
            "name": "Repository Test Customer",
            "created_at": "2024-01-01T00:00:00"
        }
        
        # Put item
        result = repository.put_item(item)
        assert result == item
        
        # Get item
        retrieved = repository.get_item(
            f"CUSTOMER#{customer_id}",
            f"CUSTOMER#{customer_id}"
        )
        
        assert retrieved is not None
        assert retrieved["id"] == customer_id
        assert retrieved["name"] == "Repository Test Customer"
    
    def test_query_customers_by_gsi(self, repository):
        """Test querying all customers using GSI"""
        # Create multiple customer items
        for i in range(5):
            customer_id = f"customer-{i}"
            item = {
                "PK": f"CUSTOMER#{customer_id}",
                "SK": f"CUSTOMER#{customer_id}",
                "GSI1PK": "CUSTOMER",
                "GSI1SK": f"2024-01-{i+1:02d}T00:00:00",
                "entity_type": "customer",
                "id": customer_id,
                "name": f"Customer {i}",
                "created_at": f"2024-01-{i+1:02d}T00:00:00"
            }
            repository.put_item(item)
        
        # Query by GSI
        items = repository.query_by_gsi(
            gsi_name='GSI1',
            gsi_pk='GSI1PK',
            gsi_pk_value='CUSTOMER'
        )
        
        # Assertions
        assert len(items) == 5
        
        # Verify all items are customers
        for item in items:
            assert item["entity_type"] == "customer"
            assert "Customer" in item["name"]
    
    def test_query_with_limit(self, repository):
        """Test querying with limit"""
        # Create multiple customer items
        for i in range(10):
            customer_id = f"customer-{i}"
            item = {
                "PK": f"CUSTOMER#{customer_id}",
                "SK": f"CUSTOMER#{customer_id}",
                "GSI1PK": "CUSTOMER",
                "GSI1SK": f"2024-01-{i+1:02d}T00:00:00",
                "entity_type": "customer",
                "id": customer_id,
                "name": f"Customer {i}",
                "created_at": f"2024-01-{i+1:02d}T00:00:00"
            }
            repository.put_item(item)
        
        # Query with limit
        pk = f"CUSTOMER#customer-5"
        items = repository.query_by_pk(pk, limit=1)
        
        # Assertions
        assert len(items) <= 1
