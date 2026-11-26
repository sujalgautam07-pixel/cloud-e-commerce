# Cloud-Native Hybrid E-Commerce Application

A scalable, reliable, and containerized online shopping platform designed for cloud deployment (Docker, Kubernetes, and Hybrid Cloud).

## Project Structure
```
cloud-ecommerce/
├── backend/
│   ├── main.py            # FastAPI REST API & cloud metadata probes
│   ├── database.py        # SQLAlchemy database engine (SQLite / PostgreSQL)
│   ├── models.py          # Relational data models (Products, Orders, Items)
│   ├── schemas.py         # Pydantic validation schemas
│   ├── Dockerfile         # Python 3.12-slim container definition
│   └── requirements.txt   # Python dependencies
├── frontend/
│   ├── index.html         # Responsive Customer & Admin dashboard UI
│   ├── app.js             # Client state, cart, order tracking, admin controls
│   ├── nginx.conf         # Nginx reverse proxy & API gateway config
│   └── Dockerfile         # Nginx Alpine container definition
├── k8s/
│   ├── 00-namespace.yaml         # Dedicated 'ecommerce' namespace
│   ├── 01-configmap-secrets.yaml # Cloud configs & secrets
│   ├── 02-storage.yaml           # PersistentVolumeClaim for DB
│   ├── 03-backend.yaml           # Backend Deployment & ClusterIP Service
│   ├── 04-frontend.yaml          # Frontend Deployment & LoadBalancer Service
│   ├── 05-hpa.yaml               # Horizontal Pod Autoscaler (Auto-scaling)
│   ├── 06-ingress.yaml           # Path-based Ingress Controller rules
│   ├── kustomization.yaml        # Single-command bundle
│   └── deploy.ps1                # Automated deployment script
├── docker-compose.yml     # Multi-container local orchestration
└── README.md
```

## Features Implemented

### 1. Customer Capabilities
- **Product Catalog:** Category filtering (Laptops, Audio, Displays, etc.), search bar, and dynamic stock badges (In Stock / Low Stock / Out of Stock).
- **Shopping Cart & Checkout:** Real-time quantity adjustments, tax calculations, and instant stock deduction.
- **Live Order Tracker:** Lookup orders using unique identifiers (`ORD-XXXXXXXX`) to see real-time fulfillment status.

### 2. Administrator Dashboard
- **Centralized Metrics:** Total Revenue, Total Orders, Active SKUs, Low Stock alerts, and Pending orders.
- **Product & Inventory Management:** Add new products, update stock inline, edit details, or remove products.
- **Order Processing:** Update order fulfillment stages (`Pending` → `Processing` → `Shipped` → `Delivered`).

### 3. Cloud & Kubernetes Native Readiness
- **Health Probes:** `/health` and `/ready` endpoints for Kubernetes liveness & readiness checks.
- **Hybrid Cloud Observability:** `/api/info` returns runtime environment, pod hostname, and cloud tier.

## How to Run Locally (Phase 1)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Open your browser at `http://127.0.0.1:8000` to interact with the application.
