# Hybrid Cloud Architecture Specification

## 1. Executive Summary & Design Rationale
As outlined in the project abstract, our application employs a **Hybrid Cloud Architecture** combining:
1. **Public Cloud Infrastructure** (Elastic, customer-facing tier)
2. **Private / On-Premises Infrastructure** (Secure data tier & internal admin services)

This topology balances **infinite elasticity** with **data governance, compliance, and cloud cost minimization**.

---

## 2. Component Distribution Matrix

| Component | Deployment Location | Technology | Rationale |
| :--- | :--- | :--- | :--- |
| **Storefront Web UI** | **Public Cloud** | Nginx / CDN / Container | Handles unpredictable public internet traffic; requires global caching and high uptime. |
| **API Gateway / Read Cache** | **Public Cloud** | FastAPI (Autoscaled) | Elastic auto-scaling (HPA) absorbs flash sales and traffic spikes without crashing. |
| **Customer Order & PII DB** | **Private / On-Premises** | SQLite / PostgreSQL | **Data Sovereignty & Privacy**: Customer addresses, transaction records, and payment data stay inside private boundary. |
| **Inventory Management** | **Private / On-Premises** | Internal Core Service | Direct integration with warehouse systems; eliminates high cloud egress database costs. |

---

## 3. High-Level Hybrid Data Flow Diagram

```
[Public Internet Customers]
             │
             ▼ (HTTPS / TLS 1.3)
┌───────────────────────────────────────────────────────────┐
│               PUBLIC CLOUD (AWS / GCP / Render)           │
│                                                           │
│   ┌────────────────────────┐   ┌───────────────────────┐  │
│   │ Frontend Nginx Pods    │   │ API Worker Pods (HPA) │  │
│   │ (2 - 6 Replicas)       │──▶│ (2 - 10 Replicas)     │  │
│   └────────────────────────┘   └───────────┬───────────┘  │
└────────────────────────────────────────────┼──────────────┘
                                             │
             ┌───────────────────────────────┴───────────────────────────────┐
             │ SECURE HYBRID ENCRYPTED TUNNEL (TLS / WireGuard / Cloudflare) │
             └───────────────────────────────┬───────────────────────────────┘
                                             │
┌────────────────────────────────────────────▼──────────────┐
│             PRIVATE / LOCAL CLUSTER (On-Premises)         │
│                                                           │
│   ┌────────────────────────┐   ┌───────────────────────┐  │
│   │ Secure Database Pod    │   │ Warehouse Admin Node  │  │
│   │ (Encrypted Volume)     │◀──│ (Restricted Access)   │  │
│   └────────────────────────┘   └───────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

---

## 4. Security & Compliance Benefits
1. **Zero Public DB Exposure:** The database has no public IP address and accepts connections solely through the encrypted tunnel from authenticated public worker pods.
2. **Cost Optimization:** Database storage and high-volume internal syncs incur **zero cloud egress fees** because they execute inside the private cluster.
3. **Fault Tolerance:** If public cloud connectivity degrades, local warehouse operations and inventory fulfillment continue uninterrupted on-premises.
