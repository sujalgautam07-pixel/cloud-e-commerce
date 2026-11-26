# Secure Hybrid Cloud Interconnect Guide

To establish secure communication between the **Public Cloud Pods** and the **Private On-Premises Core Database**, the architecture relies on an encrypted Zero-Trust overlay tunnel.

---

## Method 1: Cloudflare Tunnel / Tailscale (Recommended & Free)
This approach requires **zero open inbound firewall ports** on the private/local machine.

1. **Install Cloudflare Tunnel or Tailscale** on the private on-premises host:
   ```bash
   cloudflared tunnel create ecommerce-hybrid-tunnel
   ```
2. **Route the private service**:
   ```yaml
   ingress:
     - hostname: private-db.yourdomain.com
       service: http://localhost:8000
   ```
3. **Configure Public Cloud Pods**:
   In `hybrid/public-tier.yaml`, set the `DATABASE_URL` or API upstream to:
   `https://private-db.yourdomain.com`

---

## Method 2: Tailscale Kubernetes Operator
Connects both clusters (local Minikube/on-prem node and Public EKS/GKE cluster) into an encrypted mesh network via WireGuard:
```bash
# Install Tailscale operator on both clusters
helm repo add tailscale https://pkgs.tailscale.com/helmcharts
helm install tailscale-operator tailscale/tailscale-operator
```
This enables public pods to address private pods directly via private virtual IPs without traversing the open internet.

---

## Method 3: Enterprise AWS / Azure Hybrid VPN (Academic Viva Defense)
If your faculty asks: *"How would this be deployed in a corporate bank or large retailer?"*

- **AWS Site-to-Site VPN / Direct Connect:** A dedicated physical 1Gbps/10Gbps fiber connection between the private corporate data center and the AWS Virtual Private Cloud (VPC).
- **Transit Gateway (TGW):** Routes encrypted BGP traffic securely from public subnets into the on-premises corporate subnet.
- **Security Group Rules:** Ingress to the private database port is strictly allow-listed to the CIDR block of the public Kubernetes VPC.
