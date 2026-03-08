"""
Integration tests for Sale and Payment operations
"""
import pytest
from datetime import datetime
from decimal import Decimal


class TestSaleIntegration:
    """Integration tests for Sale CRUD operations"""
    
    def test_create_sale(self, repository, customer_service):
        """Test creating a sale in DynamoDB"""
        from service import SaleService
        
        # Create customer first
        customer = customer_service.create_customer(name="João Silva")
        customer_id = customer["id"]
        
        # Create sale service
        sale_service = SaleService(repository)
        
        # Create sale
        sale = sale_service.create_sale(
            customer_id=customer_id,
            date=datetime.now().isoformat(),
            sale_type="PRAZO",
            quantity=10,
            total_value=Decimal("100.50")
        )
        
        # Assertions
        assert sale is not None
        assert sale["id"] is not None
        assert sale["customer_id"] == customer_id
        assert sale["type"] == "PRAZO"
        assert sale["quantity"] == 10
        assert Decimal(sale["total_value"]) == Decimal("100.50")
        assert Decimal(sale["remaining_balance"]) == Decimal("100.50")
        assert "created_at" in sale
    
    def test_list_sales_empty(self, repository):
        """Test listing sales when table is empty"""
        from service import SaleService
        
        sale_service = SaleService(repository)
        sales = sale_service.list_sales()
        
        assert sales == []
    
    def test_list_sales_by_customer(self, repository, customer_service):
        """Test listing sales for a specific customer"""
        from service import SaleService
        
        # Create customers
        customer1 = customer_service.create_customer(name="João Silva")
        customer2 = customer_service.create_customer(name="Maria Santos")
        
        sale_service = SaleService(repository)
        
        # Create sales for customer1
        sale1 = sale_service.create_sale(
            customer_id=customer1["id"],
            date=datetime.now().isoformat(),
            sale_type="PRAZO",
            quantity=10,
            total_value=Decimal("100.00")
        )
        
        sale2 = sale_service.create_sale(
            customer_id=customer1["id"],
            date=datetime.now().isoformat(),
            sale_type="AVULSO",
            quantity=5,
            total_value=Decimal("50.00")
        )
        
        # Create sale for customer2
        sale3 = sale_service.create_sale(
            customer_id=customer2["id"],
            date=datetime.now().isoformat(),
            sale_type="PRAZO",
            quantity=15,
            total_value=Decimal("150.00")
        )
        
        # List sales for customer1
        customer1_sales = sale_service.list_sales(customer_id=customer1["id"])
        
        # Assertions
        assert len(customer1_sales) == 2
        sale_ids = [s["id"] for s in customer1_sales]
        assert sale1["id"] in sale_ids
        assert sale2["id"] in sale_ids
        assert sale3["id"] not in sale_ids
    
    def test_update_sale_balance(self, repository, customer_service):
        """Test updating sale balance after payment"""
        from service import SaleService
        
        # Create customer and sale
        customer = customer_service.create_customer(name="João Silva")
        sale_service = SaleService(repository)
        
        sale = sale_service.create_sale(
            customer_id=customer["id"],
            date=datetime.now().isoformat(),
            sale_type="PRAZO",
            quantity=10,
            total_value=Decimal("100.00")
        )
        
        # Update balance
        result = sale_service.update_sale_balance(
            customer_id=customer["id"],
            sale_id=sale["id"],
            payment_amount=Decimal("30.00")
        )
        
        # Assertions
        assert result["sale_id"] == sale["id"]
        assert Decimal(result["previous_balance"]) == Decimal("100.00")
        assert Decimal(result["payment_amount"]) == Decimal("30.00")
        assert Decimal(result["new_balance"]) == Decimal("70.00")
    
    def test_create_cash_sale(self, repository, customer_service):
        """Test creating a cash (AVULSO) sale"""
        from service import SaleService
        
        customer = customer_service.create_customer(name="Pedro Oliveira")
        sale_service = SaleService(repository)
        
        sale = sale_service.create_sale(
            customer_id=customer["id"],
            date=datetime.now().isoformat(),
            sale_type="AVULSO",
            quantity=5,
            total_value=Decimal("75.25")
        )
        
        assert sale["type"] == "AVULSO"
        assert Decimal(sale["total_value"]) == Decimal("75.25")
    
    def test_create_credit_sale(self, repository, customer_service):
        """Test creating a credit (PRAZO) sale"""
        from service import SaleService
        
        customer = customer_service.create_customer(name="Ana Costa")
        sale_service = SaleService(repository)
        
        sale = sale_service.create_sale(
            customer_id=customer["id"],
            date=datetime.now().isoformat(),
            sale_type="PRAZO",
            quantity=20,
            total_value=Decimal("250.00")
        )
        
        assert sale["type"] == "PRAZO"
        assert Decimal(sale["remaining_balance"]) == Decimal("250.00")


class TestPaymentIntegration:
    """Integration tests for Payment operations"""
    
    def test_create_payment_with_sale(self, repository, customer_service):
        """Test creating a payment linked to a sale"""
        from service import SaleService, PaymentService
        
        # Create customer and sale
        customer = customer_service.create_customer(name="João Silva")
        sale_service = SaleService(repository)
        payment_service = PaymentService(repository, sale_service)
        
        sale = sale_service.create_sale(
            customer_id=customer["id"],
            date=datetime.now().isoformat(),
            sale_type="PRAZO",
            quantity=10,
            total_value=Decimal("100.00")
        )
        
        # Create payment
        payment = payment_service.create_payment(
            customer_id=customer["id"],
            date=datetime.now().isoformat(),
            amount=Decimal("40.00"),
            sale_id=sale["id"]
        )
        
        # Assertions
        assert payment is not None
        assert payment["id"] is not None
        assert payment["customer_id"] == customer["id"]
        assert Decimal(payment["amount"]) == Decimal("40.00")
        assert payment["sale_id"] == sale["id"]
        assert "created_at" in payment
    
    def test_create_payment_without_sale(self, repository, customer_service):
        """Test creating a payment not linked to specific sale"""
        from service import SaleService, PaymentService
        
        customer = customer_service.create_customer(name="Maria Santos")
        sale_service = SaleService(repository)
        payment_service = PaymentService(repository, sale_service)
        
        # Create payment without sale_id
        payment = payment_service.create_payment(
            customer_id=customer["id"],
            date=datetime.now().isoformat(),
            amount=Decimal("50.00"),
            sale_id=None
        )
        
        # Assertions
        assert payment is not None
        assert Decimal(payment["amount"]) == Decimal("50.00")
        assert payment.get("sale_id") is None
    
    def test_list_payments_by_customer(self, repository, customer_service):
        """Test listing payments for a specific customer"""
        from service import SaleService, PaymentService
        
        # Create customers
        customer1 = customer_service.create_customer(name="João Silva")
        customer2 = customer_service.create_customer(name="Maria Santos")
        
        sale_service = SaleService(repository)
        payment_service = PaymentService(repository, sale_service)
        
        # Create payments for customer1
        payment1 = payment_service.create_payment(
            customer_id=customer1["id"],
            date=datetime.now().isoformat(),
            amount=Decimal("30.00"),
            sale_id=None
        )
        
        payment2 = payment_service.create_payment(
            customer_id=customer1["id"],
            date=datetime.now().isoformat(),
            amount=Decimal("20.00"),
            sale_id=None
        )
        
        # Create payment for customer2
        payment3 = payment_service.create_payment(
            customer_id=customer2["id"],
            date=datetime.now().isoformat(),
            amount=Decimal("50.00"),
            sale_id=None
        )
        
        # List payments for customer1
        customer1_payments = payment_service.list_payments(customer_id=customer1["id"])
        
        # Assertions
        assert len(customer1_payments) == 2
        payment_ids = [p["id"] for p in customer1_payments]
        assert payment1["id"] in payment_ids
        assert payment2["id"] in payment_ids
        assert payment3["id"] not in payment_ids
    
    def test_payment_updates_sale_balance(self, repository, customer_service):
        """Test that payment updates the sale balance correctly"""
        from service import SaleService, PaymentService
        
        # Create customer and sale
        customer = customer_service.create_customer(name="Pedro Oliveira")
        sale_service = SaleService(repository)
        payment_service = PaymentService(repository, sale_service)
        
        sale = sale_service.create_sale(
            customer_id=customer["id"],
            date=datetime.now().isoformat(),
            sale_type="PRAZO",
            quantity=10,
            total_value=Decimal("100.00")
        )
        
        # Create payment
        payment = payment_service.create_payment(
            customer_id=customer["id"],
            date=datetime.now().isoformat(),
            amount=Decimal("60.00"),
            sale_id=sale["id"]
        )
        
        # Verify sale balance was updated
        sale_item = repository.get_item(
            pk=f"CUSTOMER#{customer['id']}",
            sk=f"SALE#{sale['id']}"
        )
        
        assert Decimal(sale_item["remaining_balance"]) == Decimal("40.00")
    
    def test_multiple_payments_on_same_sale(self, repository, customer_service):
        """Test multiple payments on the same sale"""
        from service import SaleService, PaymentService
        
        customer = customer_service.create_customer(name="Ana Costa")
        sale_service = SaleService(repository)
        payment_service = PaymentService(repository, sale_service)
        
        sale = sale_service.create_sale(
            customer_id=customer["id"],
            date=datetime.now().isoformat(),
            sale_type="PRAZO",
            quantity=20,
            total_value=Decimal("200.00")
        )
        
        # First payment
        payment1 = payment_service.create_payment(
            customer_id=customer["id"],
            date=datetime.now().isoformat(),
            amount=Decimal("50.00"),
            sale_id=sale["id"]
        )
        
        # Second payment
        payment2 = payment_service.create_payment(
            customer_id=customer["id"],
            date=datetime.now().isoformat(),
            amount=Decimal("75.00"),
            sale_id=sale["id"]
        )
        
        # Third payment
        payment3 = payment_service.create_payment(
            customer_id=customer["id"],
            date=datetime.now().isoformat(),
            amount=Decimal("25.00"),
            sale_id=sale["id"]
        )
        
        # Verify final balance
        sale_item = repository.get_item(
            pk=f"CUSTOMER#{customer['id']}",
            sk=f"SALE#{sale['id']}"
        )
        
        # 200 - 50 - 75 - 25 = 50
        assert Decimal(sale_item["remaining_balance"]) == Decimal("50.00")
