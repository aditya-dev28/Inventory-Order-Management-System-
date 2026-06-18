"""Pydantic schemas for request/response validation."""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
import re


# ---------- Product ----------
class ProductBase(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=255)
    sku_code: str = Field(..., min_length=1, max_length=100)
    price: Decimal = Field(..., ge=0)
    quantity_in_stock: int = Field(..., ge=0)

    @field_validator("product_name", "sku_code")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be empty")
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku_code: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[Decimal] = Field(None, ge=0)
    quantity_in_stock: Optional[int] = Field(None, ge=0)


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Customer ----------
PHONE_RE = re.compile(r"^[0-9+\-\s()]{7,20}$")


def _validate_phone_value(v: str) -> str:
    v = v.strip()
    if not PHONE_RE.match(v):
        raise ValueError("invalid phone number")
    digit_count = sum(1 for c in v if c.isdigit())
    if digit_count < 10:
        raise ValueError("phone number must contain at least 10 digits")
    return v


class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone_number: str = Field(..., min_length=7, max_length=20)
    address_line1: str = Field(..., min_length=1, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    postal_code: str = Field(..., min_length=3, max_length=20)

    @field_validator("full_name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("full_name must not be empty")
        return v

    @field_validator("phone_number")
    @classmethod
    def _validate_phone(cls, v: str) -> str:
        return _validate_phone_value(v)

    @field_validator("address_line1", "city", "state", "postal_code")
    @classmethod
    def _strip_required(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be empty")
        return v

    @field_validator("address_line2")
    @classmethod
    def _strip_optional(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, min_length=7, max_length=20)
    address_line1: Optional[str] = Field(None, min_length=1, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=1, max_length=100)
    postal_code: Optional[str] = Field(None, min_length=3, max_length=20)

    @field_validator("full_name")
    @classmethod
    def _strip_name(cls, v):
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("full_name must not be empty")
        return v

    @field_validator("phone_number")
    @classmethod
    def _validate_phone(cls, v):
        if v is None:
            return v
        return _validate_phone_value(v)

    @field_validator("address_line1", "city", "state", "postal_code")
    @classmethod
    def _strip_required(cls, v):
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("must not be empty")
        return v

    @field_validator("address_line2")
    @classmethod
    def _strip_optional(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ---------- Order ----------
class OrderItemIn(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0)
    items: List[OrderItemIn] = Field(..., min_length=1)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    product_name: str
    sku_code: str
    quantity: int
    price_at_purchase: Decimal
    line_total: Decimal


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_id: int
    customer_name: str
    customer_email: str
    total_amount: Decimal
    created_at: datetime
    items: List[OrderItemOut]


class OrderListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_id: int
    customer_name: str
    total_amount: Decimal
    item_count: int
    created_at: datetime


# ---------- Dashboard ----------
class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: int
    low_stock_threshold: int
