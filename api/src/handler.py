"""
Lambda handler for sales control API
"""
from typing import Any, Dict

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

from container import get_container
from service import CustomerService, PaymentService, SaleService

# Initialize Powertools
logger = Logger()
tracer = Tracer()
app = APIGatewayRestResolver()

# Initialize dependency injection container
container = get_container()


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
    customer_service = container.resolve(CustomerService)
    customers = customer_service.list_customers()
    return {"customers": customers}


@app.post("/customers")
@tracer.capture_method
def create_customer() -> Dict[str, Any]:
    """Create a new customer"""
    data = app.current_event.json_body
    logger.info("Creating customer", extra={"data": data})
    
    customer_service = container.resolve(CustomerService)
    customer = customer_service.create_customer(name=data.get("name"))
    
    return {
        "message": "Customer created",
        "customer": customer
    }


@app.get("/sales")
@tracer.capture_method
def list_sales() -> Dict[str, Any]:
    """List all sales"""
    logger.info("Listing sales")
    
    query_params = app.current_event.query_string_parameters or {}
    customer_id = query_params.get("customer_id")
    
    sale_service = container.resolve(SaleService)
    sales = sale_service.list_sales(customer_id=customer_id)
    return {"sales": sales}


@app.post("/sales")
@tracer.capture_method
def create_sale() -> Dict[str, Any]:
    """Create a new sale"""
    data = app.current_event.json_body
    logger.info("Creating sale", extra={"data": data})
    
    sale_service = container.resolve(SaleService)
    sale = sale_service.create_sale(
        customer_id=data.get("customer_id"),
        date=data.get("date"),
        sale_type=data.get("type"),
        quantity=data.get("quantity"),
        total_value=data.get("total_value")
    )
    
    return {
        "message": "Sale created",
        "sale": sale
    }


@app.get("/payments")
@tracer.capture_method
def list_payments() -> Dict[str, Any]:
    """List all payments"""
    logger.info("Listing payments")
    
    query_params = app.current_event.query_string_parameters or {}
    customer_id = query_params.get("customer_id")
    
    payment_service = container.resolve(PaymentService)
    payments = payment_service.list_payments(customer_id=customer_id)
    return {"payments": payments}


@app.post("/payments")
@tracer.capture_method
def create_payment() -> Dict[str, Any]:
    """Create a new payment"""
    data = app.current_event.json_body
    logger.info("Creating payment", extra={"data": data})
    
    payment_service = container.resolve(PaymentService)
    payment = payment_service.create_payment(
        customer_id=data.get("customer_id"),
        date=data.get("date"),
        amount=data.get("amount"),
        sale_id=data.get("sale_id")
    )
    
    return {
        "message": "Payment created",
        "payment": payment
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