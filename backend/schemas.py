from pydantic import BaseModel, Field
from typing import List, Optional
import datetime

# --- Product Schemas ---
class ProductBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    category: str = "Electronics"
    stock: int = Field(default=0, ge=0)
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    stock: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Order Item Schemas ---
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int]
    product_title: str
    price: float
    quantity: int

    class Config:
        from_attributes = True

# --- Order Schemas ---
class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    customer_address: str
    items: List[OrderItemCreate]

class OrderStatusUpdate(BaseModel):
    status: str

class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_name: str
    customer_email: str
    customer_address: str
    total_amount: float
    status: str
    created_at: datetime.datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

# --- Admin & System Schemas ---
class DashboardMetrics(BaseModel):
    total_revenue: float
    total_orders: int
    total_products: int
    low_stock_count: int
    pending_orders: int

class SystemInfo(BaseModel):
    app_name: str
    status: str
    environment: str
    hostname: str
    cloud_tier: str
    database: str
    active_pods: Optional[str] = None
