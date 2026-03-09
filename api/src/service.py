"""
Business logic services for sales control API
"""
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import uuid4

from aws_lambda_powertools import Logger

from models import Customer, Payment, Sale, SaleType
from repository import DynamoDBRepository

logger = Logger()


class CustomerService:
    """Service for customer business logic"""
    
    def __init__(self, repository: DynamoDBRepository):
        self.repository = repository
    
    def list_customers(self) -> List[Dict[str, Any]]:
        """
        List all customers
        
        Returns:
            List of customer dictionaries
        """
        logger.info("Service: Listing customers")
        
        items = self.repository.query_by_gsi(
            gsi_name='GSI1',
            gsi_pk='GSI1PK',
            gsi_pk_value='CUSTOMER'
        )
        
        customers = []
        for item in items:
            customers.append({
                "id": item["SK"].replace("CUSTOMER#", ""),
                "name": item.get("name", ""),
                "created_at": item.get("created_at", "")
            })
        
        return customers
    
    def create_customer(self, name: str) -> Dict[str, Any]:
        """
        Create a new customer
        
        Args:
            name: Customer name
            
        Returns:
            Created customer dictionary
        """
        logger.info("Service: Creating customer", extra={"customer_name": name})
        
        customer_id = str(uuid4())
        customer = Customer(id=customer_id, name=name)
        
        item = {
            "PK": f"CUSTOMER#{customer_id}",
            "SK": f"CUSTOMER#{customer_id}",
            "GSI1PK": "CUSTOMER",
            "GSI1SK": customer.created_at.isoformat(),
            "entity_type": "customer",
            "id": customer_id,
            "name": customer.name,
            "created_at": customer.created_at.isoformat()
        }
        
        self.repository.put_item(item)
        
        return {
            "id": customer.id,
            "name": customer.name,
            "created_at": customer.created_at.isoformat()
        }


class SaleService:
    """Service for sale business logic"""
    
    def __init__(self, repository: DynamoDBRepository):
        self.repository = repository
    
    def list_sales(self, customer_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List sales, optionally filtered by customer
        
        Args:
            customer_id: Optional customer ID to filter by
            
        Returns:
            List of sale dictionaries
        """
        logger.info("Service: Listing sales", extra={"customer_id": customer_id})
        
        if customer_id:
            items = self.repository.query_by_pk(f"CUSTOMER#{customer_id}")
            items = [item for item in items if item.get("entity_type") == "sale"]
        else:
            items = self.repository.query_by_gsi(
                gsi_name='GSI1',
                gsi_pk='GSI1PK',
                gsi_pk_value='SALE'
            )
        
        sales = []
        for item in items:
            sales.append({
                "id": item.get("id", ""),
                "customer_id": item.get("customer_id", ""),
                "date": item.get("date", ""),
                "type": item.get("type", ""),
                "quantity": item.get("quantity", 0),
                "total_value": str(item.get("total_value", 0)),
                "remaining_balance": str(item.get("remaining_balance", 0)),
                "created_at": item.get("created_at", "")
            })
        
        return sales
    
    def create_sale(
        self,
        customer_id: str,
        date: str,
        sale_type: str,
        quantity: int,
        total_value: Decimal
    ) -> Dict[str, Any]:
        """
        Create a new sale
        
        Args:
            customer_id: Customer ID
            date: Sale date in ISO format
            sale_type: Type of sale (cash or credit)
            quantity: Quantity sold
            total_value: Total value of the sale
            
        Returns:
            Created sale dictionary
        """
        logger.info(
            "Service: Creating sale",
            extra={
                "customer_id": customer_id,
                "sale_type": sale_type,
                "quantity": quantity
            }
        )
        
        sale_id = str(uuid4())
        sale_date = datetime.fromisoformat(date.replace("Z", "+00:00"))
        
        sale = Sale(
            id=sale_id,
            customer_id=customer_id,
            date=sale_date,
            type=SaleType(sale_type),
            quantity=quantity,
            total_value=total_value,
            remaining_balance=total_value
        )
        
        item = {
            "PK": f"CUSTOMER#{customer_id}",
            "SK": f"SALE#{sale_id}",
            "GSI1PK": "SALE",
            "GSI1SK": sale.date.isoformat(),
            "GSI2PK": f"SALE#DATE#{sale.date.strftime('%Y-%m')}",
            "GSI2SK": sale.date.isoformat(),
            "entity_type": "sale",
            "id": sale_id,
            "customer_id": customer_id,
            "date": sale.date.isoformat(),
            "type": sale.type.value,
            "quantity": sale.quantity,
            "total_value": str(sale.total_value),
            "remaining_balance": str(sale.remaining_balance),
            "created_at": sale.created_at.isoformat()
        }
        
        self.repository.put_item(item)
        
        return {
            "id": sale.id,
            "customer_id": sale.customer_id,
            "date": sale.date.isoformat(),
            "type": sale.type.value,
            "quantity": sale.quantity,
            "total_value": str(sale.total_value),
            "remaining_balance": str(sale.remaining_balance),
            "created_at": sale.created_at.isoformat()
        }
    
    def update_sale_balance(
        self,
        customer_id: str,
        sale_id: str,
        payment_amount: Decimal
    ) -> Dict[str, Any]:
        """
        Update sale remaining balance after a payment
        
        Args:
            customer_id: Customer ID
            sale_id: Sale ID
            payment_amount: Amount paid
            
        Returns:
            Updated balance information
        """
        logger.info(
            "Service: Updating sale balance",
            extra={
                "customer_id": customer_id,
                "sale_id": sale_id,
                "payment_amount": str(payment_amount)
            }
        )
        
        sale_item = self.repository.get_item(
            pk=f"CUSTOMER#{customer_id}",
            sk=f"SALE#{sale_id}"
        )
        
        if not sale_item:
            raise ValueError(f"Sale {sale_id} not found for customer {customer_id}")
        
        current_balance = Decimal(str(sale_item.get("remaining_balance", 0)))
        new_balance = current_balance - payment_amount
        
        self.repository.update_item(
            pk=f"CUSTOMER#{customer_id}",
            sk=f"SALE#{sale_id}",
            update_expression="SET remaining_balance = :balance",
            expression_values={":balance": str(new_balance)}
        )
        
        logger.info(
            "Sale balance updated",
            extra={
                "sale_id": sale_id,
                "previous_balance": str(current_balance),
                "payment_amount": str(payment_amount),
                "new_balance": str(new_balance)
            }
        )
        
        return {
            "sale_id": sale_id,
            "previous_balance": str(current_balance),
            "payment_amount": str(payment_amount),
            "new_balance": str(new_balance)
        }


class PaymentService:
    """Service for payment business logic"""
    
    def __init__(self, repository: DynamoDBRepository, sale_service: SaleService):
        self.repository = repository
        self.sale_service = sale_service
    
    def list_payments(self, customer_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List payments, optionally filtered by customer
        
        Args:
            customer_id: Optional customer ID to filter by
            
        Returns:
            List of payment dictionaries
        """
        logger.info("Service: Listing payments", extra={"customer_id": customer_id})
        
        if customer_id:
            items = self.repository.query_by_pk(f"CUSTOMER#{customer_id}")
            items = [item for item in items if item.get("entity_type") == "payment"]
        else:
            items = self.repository.query_by_gsi(
                gsi_name='GSI1',
                gsi_pk='GSI1PK',
                gsi_pk_value='PAYMENT'
            )
        
        payments = []
        for item in items:
            payments.append({
                "id": item.get("id", ""),
                "customer_id": item.get("customer_id", ""),
                "date": item.get("date", ""),
                "amount": str(item.get("amount", 0)),
                "sale_id": item.get("sale_id"),
                "created_at": item.get("created_at", "")
            })
        
        return payments
    
    def create_payment(
        self,
        customer_id: str,
        date: str,
        amount: Decimal,
        sale_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new payment and update related sale if applicable
        
        Args:
            customer_id: Customer ID
            date: Payment date in ISO format
            amount: Payment amount
            sale_id: Optional sale ID to apply payment to
            
        Returns:
            Created payment dictionary
        """
        logger.info(
            "Service: Creating payment",
            extra={
                "customer_id": customer_id,
                "amount": amount,
                "sale_id": sale_id
            }
        )
        
        payment_id = str(uuid4())
        payment_date = datetime.fromisoformat(date.replace("Z", "+00:00"))
        
        payment = Payment(
            id=payment_id,
            customer_id=customer_id,
            date=payment_date,
            amount=amount,
            sale_id=sale_id
        )
        
        item = {
            "PK": f"CUSTOMER#{customer_id}",
            "SK": f"PAYMENT#{payment_id}",
            "GSI1PK": "PAYMENT",
            "GSI1SK": payment.date.isoformat(),
            "GSI2PK": f"PAYMENT#DATE#{payment.date.strftime('%Y-%m')}",
            "GSI2SK": payment.date.isoformat(),
            "entity_type": "payment",
            "id": payment_id,
            "customer_id": customer_id,
            "date": payment.date.isoformat(),
            "amount": str(payment.amount),
            "created_at": payment.created_at.isoformat()
        }
        
        if payment.sale_id:
            item["sale_id"] = payment.sale_id
        
        self.repository.put_item(item)
        
        # Update sale balance if sale_id is provided
        if payment.sale_id:
            self.sale_service.update_sale_balance(
                customer_id=customer_id,
                sale_id=payment.sale_id,
                payment_amount=payment.amount
            )
        
        return {
            "id": payment.id,
            "customer_id": payment.customer_id,
            "date": payment.date.isoformat(),
            "amount": str(payment.amount),
            "sale_id": payment.sale_id,
            "created_at": payment.created_at.isoformat()
        }
