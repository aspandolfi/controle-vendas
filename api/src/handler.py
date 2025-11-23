"""
Lambda handler for sales control API
"""
import os
from datetime import datetime
from typing import Any, Dict
from uuid import uuid4

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

from models import Customer, Sale, Payment, SaleType
from repository import DynamoDBRepository

# Initialize Powertools
logger = Logger()
tracer = Tracer()
app = APIGatewayRestResolver()

# Initialize repository
table_name = os.environ.get('DYNAMODB_TABLE_NAME', 'controle-vendas')
repository = DynamoDBRepository(table_name)


@app.get("/health")
@tracer.capture_method
def health_check() -> Dict[str, Any]:
    """Health check endpoint"""
    logger.info("Health check called")
    return {
        "status": "healthy",
        "service": "controle-vendas-api",
        "version": "0.0.1"
    }


@app.get("/customers")
@tracer.capture_method
def list_customers() -> Dict[str, Any]:
    """List all customers"""
    logger.info("Listing customers")
    
    # Query all customers by entity type
    items = repository.query_by_gsi(
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
    
    return {
        "customers": customers
    }


@app.post("/customers")
@tracer.capture_method
def create_customer() -> Dict[str, Any]:
    """Create a new customer"""
    data = app.current_event.json_body
    logger.info("Creating customer", extra={"data": data})
    
    # Validate data
    customer_id = str(uuid4())
    customer = Customer(
        id=customer_id,
        name=data.get("name")
    )
    
    # Prepare DynamoDB item
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
    
    # Save to DynamoDB
    repository.put_item(item)
    
    return {
        "message": "Customer created",
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "created_at": customer.created_at.isoformat()
        }
    }


@app.get("/sales")
@tracer.capture_method
def list_sales() -> Dict[str, Any]:
    """List all sales"""
    logger.info("Listing sales")
    
    # Get query parameters
    query_params = app.current_event.query_string_parameters or {}
    customer_id = query_params.get("customer_id")
    
    if customer_id:
        # Query sales for specific customer
        items = repository.query_by_pk(f"CUSTOMER#{customer_id}")
        # Filter only sale items
        items = [item for item in items if item.get("entity_type") == "sale"]
    else:
        # Query all sales by entity type
        items = repository.query_by_gsi(
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
    
    return {
        "sales": sales
    }


@app.post("/sales")
@tracer.capture_method
def create_sale() -> Dict[str, Any]:
    """Create a new sale"""
    data = app.current_event.json_body
    logger.info("Creating sale", extra={"data": data})
    
    # Validate data
    sale_id = str(uuid4())
    customer_id = data.get("customer_id")
    
    # Parse date
    sale_date = datetime.fromisoformat(data.get("date").replace("Z", "+00:00"))
    
    sale = Sale(
        id=sale_id,
        customer_id=customer_id,
        date=sale_date,
        type=SaleType(data.get("type")),
        quantity=data.get("quantity"),
        total_value=data.get("total_value"),
        remaining_balance=data.get("total_value")  # Initially equals total_value
    )
    
    # Prepare DynamoDB item
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
    
    # Save to DynamoDB
    repository.put_item(item)
    
    return {
        "message": "Sale created",
        "sale": {
            "id": sale.id,
            "customer_id": sale.customer_id,
            "date": sale.date.isoformat(),
            "type": sale.type.value,
            "quantity": sale.quantity,
            "total_value": str(sale.total_value),
            "remaining_balance": str(sale.remaining_balance),
            "created_at": sale.created_at.isoformat()
        }
    }


@app.get("/payments")
@tracer.capture_method
def list_payments() -> Dict[str, Any]:
    """List all payments"""
    logger.info("Listing payments")
    
    # Get query parameters
    query_params = app.current_event.query_string_parameters or {}
    customer_id = query_params.get("customer_id")
    
    if customer_id:
        # Query payments for specific customer
        items = repository.query_by_pk(f"CUSTOMER#{customer_id}")
        # Filter only payment items
        items = [item for item in items if item.get("entity_type") == "payment"]
    else:
        # Query all payments by entity type
        items = repository.query_by_gsi(
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
    
    return {
        "payments": payments
    }


@app.post("/payments")
@tracer.capture_method
def create_payment() -> Dict[str, Any]:
    """Create a new payment"""
    data = app.current_event.json_body
    logger.info("Creating payment", extra={"data": data})
    
    # Validate data
    payment_id = str(uuid4())
    customer_id = data.get("customer_id")
    
    # Parse date
    payment_date = datetime.fromisoformat(data.get("date").replace("Z", "+00:00"))
    
    payment = Payment(
        id=payment_id,
        customer_id=customer_id,
        date=payment_date,
        amount=data.get("amount"),
        sale_id=data.get("sale_id")
    )
    
    # Prepare DynamoDB item
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
    
    # Add sale_id if present
    if payment.sale_id:
        item["sale_id"] = payment.sale_id
    
    # Save to DynamoDB
    repository.put_item(item)
    
    # Update sale remaining_balance if sale_id is provided
    if payment.sale_id:
        sale_item = repository.get_item(
            pk=f"CUSTOMER#{customer_id}",
            sk=f"SALE#{payment.sale_id}"
        )
        
        if sale_item:
            from decimal import Decimal
            current_balance = Decimal(str(sale_item.get("remaining_balance", 0)))
            new_balance = current_balance - payment.amount
            
            repository.update_item(
                pk=f"CUSTOMER#{customer_id}",
                sk=f"SALE#{payment.sale_id}",
                update_expression="SET remaining_balance = :balance",
                expression_values={":balance": str(new_balance)}
            )
            
            logger.info(
                "Updated sale balance",
                extra={
                    "sale_id": payment.sale_id,
                    "payment_amount": str(payment.amount),
                    "new_balance": str(new_balance)
                }
            )
    
    return {
        "message": "Payment created",
        "payment": {
            "id": payment.id,
            "customer_id": payment.customer_id,
            "date": payment.date.isoformat(),
            "amount": str(payment.amount),
            "sale_id": payment.sale_id,
            "created_at": payment.created_at.isoformat()
        }
    }


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Lambda handler function
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    return app.resolve(event, context)
