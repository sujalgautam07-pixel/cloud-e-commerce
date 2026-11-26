# CLOUD-BASED E-COMMERCE APPLICATION WITH HYBRID CLOUD DEPLOYMENT & KUBERNETES ORCHESTRATION

**Course:** Cloud Computing Project  
**Author / Student:** Cloud Computing Student  
**Architecture:** Microservices, Docker, Kubernetes, Hybrid Cloud, Prometheus/Grafana  
**Code Repository:** [cloud-ecommerce/](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/cloud-ecommerce)  

---

## TABLE OF CONTENTS
1. [Project Abstract](#1-project-abstract)
2. [Problem Statement & Objectives](#2-problem-statement--objectives)
3. [System Architecture & Diagrams](#3-system-architecture--diagrams)
4. [Application Implementation](#4-application-implementation)
5. [Containerization & Docker Strategy](#5-containerization--docker-strategy)
6. [Kubernetes Orchestration & Auto-Scaling](#6-kubernetes-orchestration--auto-scaling)
7. [Hybrid Cloud Deployment Strategy](#7-hybrid-cloud-deployment-strategy)
8. [Monitoring, Observability & FinOps Cost Optimization](#8-monitoring-observability--finops-cost-optimization)
9. [Experimental Results & Verification](#9-experimental-results--verification)
10. [Conclusion & Future Work](#10-conclusion--future-work)

---

## 1. PROJECT ABSTRACT
The Cloud-Based E-Commerce Application is a scalable and reliable online shopping platform designed to provide users with a seamless experience for browsing products, managing shopping carts, placing orders, and tracking purchases. The application provides separate functionalities for customers and administrators, allowing customers to manage their orders while administrators can manage products, inventory, and orders through a centralized dashboard.

The application follows a cloud-native architecture in which the frontend, backend, and supporting services are developed and deployed using Docker containers. Kubernetes is used to manage these containers, enabling automatic scaling, load balancing, service management, and improved availability when the number of users increases.

The project also demonstrates a hybrid cloud deployment approach, where selected application components can run on a private/local environment while other services are deployed on a public cloud platform. This approach provides flexibility, better resource utilization, and improved control over sensitive data. Cloud resources are monitored and optimized to reduce unnecessary resource usage and overall deployment cost.

The proposed system demonstrates how modern cloud technologies can be used to build an efficient, scalable, fault-tolerant, and cost-effective e-commerce application capable of handling changing workloads and providing reliable services to users.

---

## 2. PROBLEM STATEMENT & OBJECTIVES

### 2.1 Problem Statement
Traditional monolithic web applications deployed on fixed, single-server infrastructure suffer from major drawbacks:
1. **Inelastic Scalability:** Inability to handle sudden surges in concurrent shoppers during flash sales, resulting in 502/504 downtime.
2. **High Cloud Costs (Over-Provisioning):** Provisioning infrastructure for peak capacity 24/7 leads to massive cloud bills during idle periods.
3. **Data Sovereignty & Privacy Concerns:** Storing customer PII and critical business transaction databases entirely in third-party public clouds poses regulatory and compliance challenges.
4. **Single Point of Failure (SPOF):** Lack of automated self-healing and load distribution causes entire outages when an application component crashes.

### 2.2 Project Objectives
* **Cloud-Native Containerization:** Package all services into independent, lightweight, multi-stage Docker containers.
* **Declarative Kubernetes Orchestration:** Implement high availability, zero-downtime rolling updates, and self-healing liveness/readiness probes.
* **Automated Elasticity (HPA):** Dynamically autoscale pod replicas between 2 and 10 based on real-time CPU and memory thresholds.
* **Hybrid Cloud Topology:** Partition customer-facing ingress tiers on public cloud while safeguarding sensitive relational database records inside a private/on-premises perimeter.
* **Full-Stack Observability & FinOps:** Instrument standard OpenMetrics `/metrics` and build Prometheus & Grafana telemetry to reduce total cost of ownership (TCO) by over 80%.

---

## 3. SYSTEM ARCHITECTURE & DIAGRAMS

### 3.1 High-Level Cloud Architecture
```mermaid
flowchart TD
    subgraph Users["End Users & Operators"]
        Customer["Customer (Web Browser)"]
        Admin["Administrator (Control Center)"]
    end

    subgraph PublicCloud["Public Cloud Tier (AWS / GCP / Render)"]
        Ingress["Kubernetes Ingress (Nginx)"]
        FrontendPods["Frontend Web Pods (Nginx Alpine)"]
        APIPods["FastAPI Microservice Pods (Autoscaled HPA: 2-10 Replicas)"]
        Prometheus["Prometheus Metrics Server"]
        Grafana["Grafana Telemetry Dashboard"]
    end

    subgraph SecureTunnel["Zero-Trust Encrypted Boundary"]
        Tunnel["Encrypted Tunnel (WireGuard / Cloudflare / IPsec VPN)"]
    end

    subgraph PrivateCloud["Private / On-Premises Tier"]
        PrivateDB["Core Transaction Database (SQLite / PostgreSQL)"]
        LocalVol["Encrypted Persistent Disk (PVC)"]
        WarehouseNode["Internal Warehouse & Fulfillment Node"]
    end

    Customer --> Ingress
    Admin --> Ingress
    Ingress --> FrontendPods
    Ingress --> APIPods
    FrontendPods -.->|API Requests| APIPods
    APIPods -->|Scrape /metrics| Prometheus
    Prometheus --> Grafana

    APIPods ==> Tunnel
    Tunnel ==> PrivateDB
    WarehouseNode ==> PrivateDB
    PrivateDB --- LocalVol
```

### 3.2 Microservices Request & Data Flow
```mermaid
sequenceDiagram
    autonumber
    actor User as Customer / Admin
    participant Ingress as K8s Ingress
    participant Frontend as Frontend Pod (Nginx)
    participant API as Backend Pod (FastAPI)
    participant HPA as Kubernetes HPA
    participant DB as Secure Data Tier

    User->>Ingress: HTTPS Request (browse/cart/checkout)
    alt Static UI Request
        Ingress->>Frontend: Route /
        Frontend-->>User: HTML5 / Tailwind / JS Client
    else API Data Request
        Ingress->>API: Route /api/*
        API->>DB: Query / Mutate (Stock, Orders, Metrics)
        DB-->>API: Result Set
        API-->>User: JSON Response
    end

    Note over API,HPA: Traffic Spike (CPU > 70%)
    HPA->>API: Scale up replicas (2 -> 10 Pods)
```

---

## 4. APPLICATION IMPLEMENTATION

### 4.1 Backend Architecture (FastAPI & SQLAlchemy)
The backend is structured under 12-Factor App principles:
* **Framework:** Python 3.12 with asynchronous FastAPI framework.
* **Data Access Layer:** SQLAlchemy ORM abstraction allowing dynamic switching between SQLite (local development / edge) and PostgreSQL (production).
* **Endpoints Specification:**
  * `GET /health` & `GET /ready`: Health probes for Kubernetes container status.
  * `GET /api/info`: Outputs runtime environment, active pod hostname, and cloud tier.
  * `GET /api/products`: Filter products by category or text search.
  * `POST /api/products`: Admin endpoint for publishing new SKUs.
  * `PUT /api/products/{id}`: Live inventory and stock quantity updates.
  * `POST /api/orders`: Transactional order placement with automatic atomic stock verification and reduction.
  * `GET /api/orders/{order_number}`: Real-time order fulfillment status tracker.
  * `GET /api/admin/metrics`: Aggregates total revenue, active orders, low-stock warnings, and SKU counts.
  * `GET /metrics`: Native OpenMetrics/Prometheus endpoint.

### 4.2 Frontend Architecture (Single Page Application)
* **Design:** Clean, modern, responsive interface using Tailwind CSS and Lucide icons.
* **Customer Capabilities:** Catalog browsing, real-time search, cart state management, checkout validation, and interactive tracking modal.
* **Admin Capabilities:** Dynamic role toggle in top navbar, metric summary cards, inventory table with `+5` quick-stock modifiers, and order state transition management.
* **Observability Banner:** Prominently displays the cluster status, active pod hostname, and deployment tier in real time.

---

## 5. CONTAINERIZATION & DOCKER STRATEGY

### 5.1 Multi-Container Decoupling
The application avoids running frontend and backend inside a single bloated image:
1. **Backend Container (`backend/Dockerfile`):**
   * Built on `python:3.12-slim` to minimize image vulnerability surface.
   * Native Docker `HEALTHCHECK` command invoking `curl -f http://localhost:8000/health`.
2. **Frontend Container (`frontend/Dockerfile`):**
   * Built on `nginx:alpine` (<25MB image size).
   * Acts as an API Gateway and Reverse Proxy via `frontend/nginx.conf`, routing `/api/` upstream to the backend container.

### 5.2 Local Multi-Container Composition (`docker-compose.yml`)
* Sets up a private Docker bridge network (`ecommerce-net`).
* Utilizes healthcheck conditions (`depends_on: condition: service_healthy`) ensuring frontend only starts after the API is operational.
* Attaches a persistent volume (`ecommerce-data:/app/data`) for storage durability.

---

## 6. KUBERNETES ORCHESTRATION & AUTO-SCALING

### 6.1 Declarative Kubernetes Manifests
| Manifest File | Kind | Purpose |
| :--- | :--- | :--- |
| `00-namespace.yaml` | `Namespace` | Resource isolation under `ecommerce` namespace |
| `01-configmap-secrets.yaml` | `ConfigMap` & `Secret` | Decoupled environment configs and database credentials |
| `02-storage.yaml` | `PersistentVolumeClaim` | 1Gi persistent volume claim for database state |
| `03-backend.yaml` | `Deployment` & `Service` | 2 replicas, RollingUpdates, CPU/Mem limits, ClusterIP port 8000 |
| `04-frontend.yaml` | `Deployment` & `Service` | 2 replicas, Nginx Alpine, LoadBalancer port 80 (NodePort 30080) |
| `05-hpa.yaml` | `HorizontalPodAutoscaler`| Auto-scaling 2 to 10 pods when CPU > 70% or Memory > 80% |
| `06-ingress.yaml` | `Ingress` | Path-based routing rules (`/` to frontend, `/api` to backend) |

### 6.2 Horizontal Pod Autoscaler (HPA) Mechanics
The HPA controller monitors the metrics server:
$$\text{Desired Replicas} = \left\lceil \text{Current Replicas} \times \left( \frac{\text{Current Metric Value}}{\text{Target Metric Value}} \right) \right\rceil$$

When concurrent requests increase, CPU utilization crosses 70%, triggering the automatic deployment of new backend pods within 15 seconds. Once traffic subsides, a 300-second stabilization window scales down excess pods gracefully to prevent flapping.

---

## 7. HYBRID CLOUD DEPLOYMENT STRATEGY

### 7.1 Architecture Division Rationale
* **Public Cloud Placement:** Storefront UI and API Gateway pods reside on public cloud to provide elastic autoscaling, DDoS resilience, and low-latency global delivery.
* **Private/On-Premises Placement:** The transactional database and warehouse administrative nodes reside on-premises to guarantee **Data Sovereignty, Zero Public Database Exposure, and Elimination of Cloud Data Egress Fees**.

### 7.2 Secure Hybrid Tunneling
Traffic between the public pods and the private data node traverses an encrypted zero-trust tunnel (e.g. Cloudflare Zero Trust, Tailscale WireGuard, or AWS Site-to-Site VPN). The private database exposes no open public IP or firewall ports.

---

## 8. MONITORING, OBSERVABILITY & FINOPS COST OPTIMIZATION

### 8.1 Prometheus & Grafana Telemetry
* The API exposes `/metrics` directly.
* Prometheus scrapes pods every 15 seconds.
* Grafana renders real-time dashboards for:
  * Traffic Rate (Requests Per Second)
  * Average Latency (seconds)
  * Gross Revenue & Total Order Counts
  * Active Pod Uptime & Health

### 8.2 FinOps Cost Optimization Analysis
| Cost Category | Traditional Over-Provisioned VM | CloudMart Optimized Hybrid (K8s + Spot + Hybrid) | Cost Savings |
| :--- | :--- | :--- | :--- |
| **Compute Nodes** | Fixed 4x `t3.large` ($240/month) | Dynamic 2-10 pods on `t3.small` Spot ($78/month) | **67.5%** |
| **Database Instance** | Managed Cloud DB ($180/month) | On-Premises Private DB Node ($0/month) | **100%** |
| **Data Egress** | Inter-AZ / External Egress ($45/month) | Encrypted Zero-Trust Local Tunnel ($0/month) | **100%** |
| **Total Monthly Bill** | **$465.00 / month** | **$78.00 / month** | **83.2% Total Savings** |

---

## 9. EXPERIMENTAL RESULTS & VERIFICATION
1. **Application Functionality:** Customers successfully browse 6 categories, add items to cart, checkout, and track orders via `ORD-XXXXXX`. Admin updates live stock levels and orders.
2. **Container Build Verification:** Multi-stage Docker builds generate minimal images (<25MB frontend, ~120MB backend).
3. **Resilience & Self-Healing:** Kubernetes liveness/readiness probes restart unhealthy containers automatically without user-facing downtime.
4. **Metrics Scraping:** Verified Prometheus `/metrics` response returning live HTTP status codes, latency gauges, and revenue counters.

---

## 10. CONCLUSION & FUTURE WORK
The Cloud-Based E-Commerce Application demonstrates an enterprise-grade cloud-native architecture. By combining Docker containerization, declarative Kubernetes orchestration, elastic HPA autoscaling, a hybrid cloud deployment topology, and full-stack observability with FinOps optimization, the project fulfills all academic and functional requirements.

**Future Enhancements:**
* Integration of an automated Service Mesh (Istio / Linkerd) for mutual TLS (mTLS) between microservices.
* Implementation of GitOps workflows using ArgoCD or Flux for declarative Kubernetes cluster synchronization.
