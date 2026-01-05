#!/bin/bash
set -e

echo "🚀 Deploying OSSA Monitoring Stack..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Deploy in order
echo "📦 Creating namespace..."
kubectl apply -f 00-namespace.yaml

echo "📊 Deploying Prometheus..."
kubectl apply -f 01-prometheus.yaml

echo "📈 Deploying Grafana..."
kubectl apply -f 02-grafana.yaml

echo ""
echo "✅ Monitoring stack deployed!"
echo ""
echo "📍 Access dashboards:"
echo ""
echo "Prometheus:"
echo "  kubectl port-forward -n monitoring svc/prometheus 9090:9090"
echo "  Then open: http://localhost:9090"
echo ""
echo "Grafana:"
echo "  kubectl port-forward -n monitoring svc/grafana 3000:3000"
echo "  Then open: http://localhost:3000"
echo "  Default credentials: admin/admin"
echo ""
echo "🔍 Check status:"
echo "  kubectl get pods -n monitoring"
echo ""
