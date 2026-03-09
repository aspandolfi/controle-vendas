"""
Unit tests for service layer
"""
from decimal import Decimal
from unittest.mock import MagicMock

import pytest


@pytest.fixture
def mock_repository():
    """Mock DynamoDB repository"""
    return MagicMock()


class TestCustomerService:
    """Tests for CustomerService"""
    
    def test_list_customers(self, mock_repository):
        """Test listing customers"""
        from src.service import CustomerService
        
        mock_repository.query_by_gsi.return_value = [
            {
                "SK": "CUSTOMER#123",
                "name": "John Doe",
                "created_at": "2024-01-01T00:00:00"
            },
            {
                "SK": "CUSTOMER#456",
                "name": "Jane Smith",
                "created_at": "2024-01-02T00:00:00"
            }
        ]
        
        service = CustomerService(mock_repository)
        customers = service.list_customers()
        
        assert len(customers) == 2
        assert customers[0]["id"] == "123"
        assert customers[0]["name"] == "John Doe"
        assert customers[1]["id"] == "456"
        assert customers[1]["name"] == "Jane Smith"
        
        mock_repository.query_by_gsi.assert_called_once_with(
            gsi_name='GSI1',
            gsi_pk='GSI1PK',
            gsi_pk_value='CUSTOMER'
        )
    
    def test_create_customer(self, mock_repository):
        """Test creating a customer"""
        from src.service import CustomerService
        
        service = CustomerService(mock_repository)
        customer = service.create_customer(name="Test Customer")
        
        assert customer["name"] == "Test Customer"
        assert "id" in customer
        assert "created_at" in customer
        
        mock_repository.put_item.assert_called_once()
        call_args = mock_repository.put_item.call_args[0][0]
        assert call_args["name"] == "Test Customer"
        assert call_args["entity_type"] == "customer"


class TestSaleService:
    """Tests for SaleService"""
    
    def test_list_all_sales(self, mock_repository):
        """Test listing all sales"""
        from src.service import SaleService
        
        mock_repository.query_by_gsi.return_value = [
            {
                "id": "sale-1",
                "customer_id": "customer-1",
                "date": "2024-01-01T00:00:00",
                "type": "AVULSO",
                "quantity": 10,
                "total_value": "100.00",
                "remaining_balance": "50.00",
                "created_at": "2024-01-01T00:00:00"
            }
        ]
        
        service = SaleService(mock_repository)
        sales = service.list_sales()
        
        assert len(sales) == 1
        assert sales[0]["id"] == "sale-1"
        assert sales[0]["quantity"] == 10
        
        mock_repository.query_by_gsi.assert_called_once()
    
    def test_list_sales_by_customer(self, mock_repository):
        """Test listing sales filtered by customer"""
        from src.service import SaleService
        
        mock_repository.query_by_pk.return_value = [
            {
                "entity_type": "sale",
                "id": "sale-1",
                "customer_id": "customer-1",
                "date": "2024-01-01T00:00:00",
                "type": "AVULSO",
                "quantity": 10,
                "total_value": "100.00",
                "remaining_balance": "50.00",
                "created_at": "2024-01-01T00:00:00"
            },
            {
                "entity_type": "payment",
                "id": "payment-1"
            }
        ]
        
        service = SaleService(mock_repository)
        sales = service.list_sales(customer_id="customer-1")
        
        assert len(sales) == 1
        assert sales[0]["id"] == "sale-1"
        
        mock_repository.query_by_pk.assert_called_once_with("CUSTOMER#customer-1")
    
    def test_create_sale(self, mock_repository):
        """Test creating a sale"""
        from src.service import SaleService
        
        service = SaleService(mock_repository)
        sale = service.create_sale(
            customer_id="customer-123",
            date="2024-01-01T00:00:00Z",
            sale_type="AVULSO",
            quantity=10,
            total_value=Decimal("100.00")
        )
        
        assert sale["customer_id"] == "customer-123"
        assert sale["type"] == "AVULSO"
        assert sale["quantity"] == 10
        assert sale["total_value"] == "100.00"
        assert sale["remaining_balance"] == "100.00"
        assert "id" in sale
        
        mock_repository.put_item.assert_called_once()
        call_args = mock_repository.put_item.call_args[0][0]
        assert call_args["entity_type"] == "sale"
        assert call_args["type"] == "AVULSO"
    
    def test_update_sale_balance(self, mock_repository):
        """Test updating sale balance after payment"""
        from src.service import SaleService
        
        mock_repository.get_item.return_value = {
            "remaining_balance": "100.00"
        }
        
        service = SaleService(mock_repository)
        result = service.update_sale_balance(
            customer_id="customer-123",
            sale_id="sale-123",
            payment_amount=Decimal("30.00")
        )
        
        assert result["sale_id"] == "sale-123"
        assert result["previous_balance"] == "100.00"
        assert result["payment_amount"] == "30.00"
        assert result["new_balance"] == "70.00"
        
        mock_repository.update_item.assert_called_once()
        call_args = mock_repository.update_item.call_args[1]
        assert call_args["expression_values"][":balance"] == "70.00"
    
    def test_update_sale_balance_not_found(self, mock_repository):
        """Test updating sale balance when sale doesn't exist"""
        from src.service import SaleService
        
        mock_repository.get_item.return_value = None
        
        service = SaleService(mock_repository)
        
        with pytest.raises(ValueError, match="Sale .* not found"):
            service.update_sale_balance(
                customer_id="customer-123",
                sale_id="sale-123",
                payment_amount=Decimal("30.00")
            )


class TestPaymentService:
    """Tests for PaymentService"""
    
    def test_list_all_payments(self, mock_repository):
        """Test listing all payments"""
        from src.service import PaymentService, SaleService
        
        mock_repository.query_by_gsi.return_value = [
            {
                "id": "payment-1",
                "customer_id": "customer-1",
                "date": "2024-01-01T00:00:00",
                "amount": "50.00",
                "sale_id": "sale-1",
                "created_at": "2024-01-01T00:00:00"
            }
        ]
        
        sale_service = SaleService(mock_repository)
        service = PaymentService(mock_repository, sale_service)
        payments = service.list_payments()
        
        assert len(payments) == 1
        assert payments[0]["id"] == "payment-1"
        assert payments[0]["amount"] == "50.00"
        
        mock_repository.query_by_gsi.assert_called_once()
    
    def test_list_payments_by_customer(self, mock_repository):
        """Test listing payments filtered by customer"""
        from src.service import PaymentService, SaleService
        
        mock_repository.query_by_pk.return_value = [
            {
                "entity_type": "payment",
                "id": "payment-1",
                "customer_id": "customer-1",
                "date": "2024-01-01T00:00:00",
                "amount": "50.00",
                "created_at": "2024-01-01T00:00:00"
            },
            {
                "entity_type": "sale",
                "id": "sale-1"
            }
        ]
        
        sale_service = SaleService(mock_repository)
        service = PaymentService(mock_repository, sale_service)
        payments = service.list_payments(customer_id="customer-1")
        
        assert len(payments) == 1
        assert payments[0]["id"] == "payment-1"
        
        mock_repository.query_by_pk.assert_called_once_with("CUSTOMER#customer-1")
    
    def test_create_payment_without_sale(self, mock_repository):
        """Test creating a payment not linked to a sale"""
        from src.service import PaymentService, SaleService
        
        sale_service = SaleService(mock_repository)
        service = PaymentService(mock_repository, sale_service)
        
        payment = service.create_payment(
            customer_id="customer-123",
            date="2024-01-01T00:00:00Z",
            amount=Decimal("50.00")
        )
        
        assert payment["customer_id"] == "customer-123"
        assert payment["amount"] == "50.00"
        assert payment["sale_id"] is None
        assert "id" in payment
        
        mock_repository.put_item.assert_called_once()
        mock_repository.get_item.assert_not_called()
    
    def test_create_payment_with_sale(self, mock_repository):
        """Test creating a payment linked to a sale"""
        from src.service import PaymentService, SaleService
        
        mock_repository.get_item.return_value = {
            "remaining_balance": "100.00"
        }
        
        sale_service = SaleService(mock_repository)
        service = PaymentService(mock_repository, sale_service)
        
        payment = service.create_payment(
            customer_id="customer-123",
            date="2024-01-01T00:00:00Z",
            amount=Decimal("50.00"),
            sale_id="sale-123"
        )
        
        assert payment["customer_id"] == "customer-123"
        assert payment["amount"] == "50.00"
        assert payment["sale_id"] == "sale-123"
        
        # Verify both payment creation and sale update
        assert mock_repository.put_item.call_count == 1
        mock_repository.update_item.assert_called_once()
