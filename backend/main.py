import os
import socket
import uuid
import time
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status, Request, Response

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

# --- Metrics Collection for Prometheus & Observability ---
METRICS_DATA = {
    "requests_total": {},
    "request_duration_sum": 0.0,
    "request_duration_count": 0,
    "start_time": time.time()
}

from database import engine, Base, get_db
import models
import schemas

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cloud-Native E-Commerce API",
    description="Scalable Microservice backend with Hybrid Cloud & Kubernetes support",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Metrics Middleware for Prometheus
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start

    path = request.url.path
    if path.startswith("/api/products/"):
        metric_path = "/api/products/{id}"
    elif path.startswith("/api/orders/"):
        metric_path = "/api/orders/{id}"
    else:
        metric_path = path

    key = (request.method, metric_path, str(response.status_code))
    METRICS_DATA["requests_total"][key] = METRICS_DATA["requests_total"].get(key, 0) + 1
    METRICS_DATA["request_duration_sum"] += duration
    METRICS_DATA["request_duration_count"] += 1
    return response

# Environment metadata (useful for Hybrid Cloud demo)
ENVIRONMENT = os.getenv("ENVIRONMENT", "local-development")
CLOUD_TIER = os.getenv("CLOUD_TIER", "Local / Private Node")
HOSTNAME = socket.gethostname()

# Seed default products if DB is brand new
@app.on_event("startup")
def seed_database():
    db = next(get_db())
    if db.query(models.Product).count() == 0:
        sample_products = [
            models.Product(
                title="CloudBook Pro 15",
                description="Ultra-fast cloud developer laptop with M3 chip and 32GB unified memory.",
                price=1499.99,
                category="Laptops",
                stock=18,
                image_url="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80"
            ),
            models.Product(
                title="Aura ANC Wireless Headphones",
                description="Studio-grade noise cancelling headphones with 40-hour battery life.",
                price=249.99,
                category="Audio",
                stock=45,
                image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
            ),
            models.Product(
                title="Mechanical Cloud Keyboard",
                description="Hot-swappable RGB mechanical keyboard with custom linear switches.",
                price=129.50,
                category="Peripherals",
                stock=30,
                image_url="https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80"
            ),
            models.Product(
                title="UltraWide Curved Monitor 34\"",
                description="WQHD 165Hz IPS curved display for multi-tasking and cloud observability.",
                price=499.00,
                category="Displays",
                stock=12,
                image_url="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80"
            ),
            models.Product(
                title="Smart Home IoT Hub",
                description="Zigbee and Matter enabled smart home bridge with edge computing engine.",
                price=89.99,
                category="Smart Home",
                stock=5,
                image_url="https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80"
            ),
            models.Product(
                title="Ergonomic Cloud Mesh Chair",
                description="Engineered for long remote dev sessions with lumbar and posture support.",
                price=320.00,
                category="Furniture",
                stock=8,
                image_url="https://images.unsplash.com/photo-1580481077195-7170e5d95d10?auto=format&fit=crop&w=600&q=80"
            ),
        ]
        db.add_all(sample_products)
        db.commit()
    db.close()

# --- Health & Kubernetes Probes ---
@app.get("/health", tags=["Monitoring & Cloud"])
@app.get("/ready", tags=["Monitoring & Cloud"])
def health_check():
    """Liveness & Readiness probe for Kubernetes"""
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "hostname": HOSTNAME,
        "environment": ENVIRONMENT,
        "cloud_tier": CLOUD_TIER
    }

@app.get("/api/info", response_model=schemas.SystemInfo, tags=["Monitoring & Cloud"])
def get_system_info():
    """Returns deployment metadata to demonstrate Hybrid Cloud & Multi-node routing"""
    return {
        "app_name": "Cloud-Native E-Commerce Hub",
        "status": "online",
        "environment": ENVIRONMENT,
        "hostname": HOSTNAME,
        "cloud_tier": CLOUD_TIER,
        "database": os.getenv("DATABASE_URL", "sqlite3").split(":")[0],
        "active_pods": os.getenv("POD_NAME", HOSTNAME)
    }

@app.get("/metrics", tags=["Monitoring & Cloud"])
def get_prometheus_metrics(db: Session = Depends(get_db)):
    """Exposes native Prometheus metrics for scraping by Prometheus & Grafana"""
    uptime = time.time() - METRICS_DATA["start_time"]
    orders_count = db.query(models.Order).count()
    total_revenue = sum(o.total_amount for o in db.query(models.Order).all())
    products_count = db.query(models.Product).count()

    lines = [
        "# HELP app_uptime_seconds Total runtime of this pod in seconds",
        "# TYPE app_uptime_seconds counter",
        f"app_uptime_seconds {uptime:.2f}",
        "",
        "# HELP http_requests_total Total HTTP requests served",
        "# TYPE http_requests_total counter",
    ]
    for (method, path, status_code), count in METRICS_DATA["requests_total"].items():
        lines.append(f'http_requests_total{{method="{method}",endpoint="{path}",status="{status_code}"}} {count}')

    avg_duration = METRICS_DATA["request_duration_sum"] / max(METRICS_DATA["request_duration_count"], 1)
    lines.extend([
        "",
        "# HELP http_request_duration_seconds_avg Average request latency",
        "# TYPE http_request_duration_seconds_avg gauge",
        f"http_request_duration_seconds_avg {avg_duration:.4f}",
        "",
        "# HELP ecommerce_orders_total Total customer orders processed",
        "# TYPE ecommerce_orders_total counter",
        f"ecommerce_orders_total {orders_count}",
        "",
        "# HELP ecommerce_revenue_usd Total gross revenue in USD",
        "# TYPE ecommerce_revenue_usd gauge",
        f"ecommerce_revenue_usd {total_revenue:.2f}",
        "",
        "# HELP ecommerce_products_catalog Total active SKUs",
        "# TYPE ecommerce_products_catalog gauge",
        f"ecommerce_products_catalog {products_count}",
    ])

    return Response(content="\n".join(lines) + "\n", media_type="text/plain; version=0.0.4; charset=utf-8")

# --- Products Endpoints ---
@app.get("/api/products", response_model=List[schemas.ProductResponse], tags=["Products"])
def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product)
    if category and category.lower() != "all":
        query = query.filter(models.Product.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(
            (models.Product.title.ilike(f"%{search}%")) |
            (models.Product.description.ilike(f"%{search}%"))
        )
    return query.order_by(models.Product.id.desc()).all()

@app.get("/api/products/{product_id}", response_model=schemas.ProductResponse, tags=["Products"])
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/api/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED, tags=["Admin - Products"])
def create_product(product_in: schemas.ProductCreate, db: Session = Depends(get_db)):
    new_product = models.Product(**product_in.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.put("/api/products/{product_id}", response_model=schemas.ProductResponse, tags=["Admin - Products"])
def update_product(product_id: int, update_in: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = update_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(product, field, val)
    
    db.commit()
    db.refresh(product)
    return product

@app.delete("/api/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin - Products"])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None

# --- Orders Endpoints ---
@app.post("/api/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED, tags=["Orders"])
def place_order(order_in: schemas.OrderCreate, db: Session = Depends(get_db)):
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total_amount = 0.0
    items_to_create = []

    # Verify inventory and calculate total
    for item_data in order_in.items:
        product = db.query(models.Product).filter(models.Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID {item_data.product_id} not found")
        if product.stock < item_data.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.title}'. Only {product.stock} items remaining."
            )
        
        # Deduct stock
        product.stock -= item_data.quantity
        subtotal = product.price * item_data.quantity
        total_amount += subtotal

        order_item = models.OrderItem(
            product_id=product.id,
            product_title=product.title,
            price=product.price,
            quantity=item_data.quantity
        )
        items_to_create.append(order_item)

    order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    new_order = models.Order(
        order_number=order_number,
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        customer_address=order_in.customer_address,
        total_amount=round(total_amount, 2),
        status="Pending",
        items=items_to_create
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

@app.get("/api/orders", response_model=List[schemas.OrderResponse], tags=["Admin - Orders"])
def list_orders(email: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Order)
    if email:
        query = query.filter(models.Order.customer_email.ilike(f"%{email}%"))
    return query.order_by(models.Order.id.desc()).all()

@app.get("/api/orders/{order_number}", response_model=schemas.OrderResponse, tags=["Orders"])
def track_order(order_number: str, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.order_number == order_number.upper()).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found. Please verify your order number.")
    return order

@app.patch("/api/orders/{order_id}/status", response_model=schemas.OrderResponse, tags=["Admin - Orders"])
def update_order_status(order_id: int, status_update: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status_update.status
    db.commit()
    db.refresh(order)
    return order

# --- Admin Dashboard Metrics ---
@app.get("/api/admin/metrics", response_model=schemas.DashboardMetrics, tags=["Admin - Metrics"])
def get_admin_metrics(db: Session = Depends(get_db)):
    total_products = db.query(models.Product).count()
    low_stock_count = db.query(models.Product).filter(models.Product.stock <= 5).count()
    orders = db.query(models.Order).all()
    
    total_orders = len(orders)
    total_revenue = sum(o.total_amount for o in orders)
    pending_orders = sum(1 for o in orders if o.status in ["Pending", "Processing"])

    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "total_products": total_products,
        "low_stock_count": low_stock_count,
        "pending_orders": pending_orders
    }

# --- Static Frontend Delivery (SPA) ---
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

@app.get("/", include_in_schema=False)
def serve_root():
    index_file = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Cloud-Native E-Commerce API is running"}

@app.get("/{filename:path}", include_in_schema=False)
def serve_frontend_files(filename: str):
    if filename.startswith("api/") or filename.startswith("docs") or filename.startswith("openapi"):
        raise HTTPException(status_code=404, detail="Not Found")
    
    file_path = os.path.join(frontend_dir, filename)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    index_file = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="File Not Found")
