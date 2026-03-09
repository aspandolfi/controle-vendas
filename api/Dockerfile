# API Dockerfile (Python Lambda Local Development)
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install additional dependencies for local development
RUN pip install --no-cache-dir \
    mangum \
    uvicorn[standard] \
    python-dotenv

# Copy source code
COPY src/ ./src/

# Create __init__.py if it doesn't exist
RUN touch __init__.py

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV AWS_DEFAULT_REGION=sa-east-1
ENV POWERTOOLS_SERVICE_NAME=controle-vendas-api
ENV LOG_LEVEL=INFO

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with uvicorn
CMD ["uvicorn", "src.local_server:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
