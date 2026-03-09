"""
Data models for the sales control API
"""
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class SaleType(str, Enum):
    """Sale type enum"""
    CASH = "AVULSO"
    CREDIT = "PRAZO"


class Customer(BaseModel):
    """Customer model"""
    id: str = Field(..., description="Customer ID")
    name: str = Field(..., description="Customer name")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Sale(BaseModel):
    """Sale model"""
    id: str = Field(..., description="Sale ID")
    customer_id: str = Field(..., description="Customer ID")
    date: datetime = Field(..., description="Sale date")
    type: SaleType = Field(..., description="Sale type (AVULSO or PRAZO)")
    quantity: int = Field(..., gt=0, description="Quantity sold")
    total_value: Decimal = Field(..., gt=0, description="Total sale value")
    remaining_balance: Decimal = Field(..., ge=0, description="Remaining balance")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Payment(BaseModel):
    """Payment model"""
    id: str = Field(..., description="Payment ID")
    customer_id: str = Field(..., description="Customer ID")
    date: datetime = Field(..., description="Payment date")
    amount: Decimal = Field(..., gt=0, description="Payment amount")
    sale_id: Optional[str] = Field(None, description="Sale ID (optional)")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class User(BaseModel):
    """User model"""
    id: str = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    password_hash: str = Field(..., description="Password hash")
    role: str = Field(..., description="User role (ADMIN or USER)")
    pin: Optional[str] = Field(None, description="PIN for sensitive operations")
    active: bool = Field(default=True, description="User active status")
    created_at: datetime = Field(default_factory=datetime.utcnow)
