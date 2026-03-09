"""
Local development server for Lambda handler
Wraps APIGatewayRestResolver for local ASGI server
"""
import os
import sys

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Set local DynamoDB endpoint if not already set
if not os.environ.get("DYNAMODB_ENDPOINT"):
    os.environ["DYNAMODB_ENDPOINT"] = "http://localhost:8001"

from mangum import Mangum
from src.handler import app as lambda_app

# Create ASGI application using Mangum adapter
app = Mangum(lambda_app, lifespan="off")

# For direct uvicorn usage
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.local_server:app", host="0.0.0.0", port=8000, reload=True)
