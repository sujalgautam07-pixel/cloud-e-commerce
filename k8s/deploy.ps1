# CloudMart Kubernetes Deployment Script (PowerShell)
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Deploying CloudMart to Kubernetes Cluster " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Apply all manifests in order
Write-Host "`n[1/4] Creating namespace, configs & secrets..." -ForegroundColor Yellow
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap-secrets.yaml
kubectl apply -f 02-storage.yaml

Write-Host "`n[2/4] Deploying Backend & Frontend Microservices..." -ForegroundColor Yellow
kubectl apply -f 03-backend.yaml
kubectl apply -f 04-frontend.yaml

Write-Host "`n[3/4] Enabling Horizontal Pod Autoscaler (HPA) & Ingress..." -ForegroundColor Yellow
kubectl apply -f 05-hpa.yaml
kubectl apply -f 06-ingress.yaml

Write-Host "`n[4/4] Checking Cluster Status..." -ForegroundColor Yellow
kubectl get all -n ecommerce
kubectl get hpa -n ecommerce

Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
Write-Host "To access your frontend: kubectl get svc frontend-service -n ecommerce" -ForegroundColor White
