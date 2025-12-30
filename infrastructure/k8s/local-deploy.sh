#!/bin/bash
# Deploy OSSA Website to OrbStack Kubernetes (Local Development)
# This deploys the main site to http://ossa.orb.local

set -e

echo "Deploying OSSA website to OrbStack Kubernetes..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
  echo "ERROR: kubectl not found. Please install kubectl or ensure OrbStack is running."
  exit 1
fi

# Check if we can connect to cluster
if ! kubectl cluster-info &> /dev/null; then
  echo "ERROR: Cannot connect to Kubernetes cluster."
  echo "Make sure OrbStack is running and kubectl is configured."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Apply deployment
kubectl apply -f "${SCRIPT_DIR}/deployment.yaml"

echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/ossa-website -n default --timeout=5m

echo ""
echo "Website deployed successfully!"
echo "Access at: http://ossa.orb.local"
echo ""
echo "To check status:"
echo "  kubectl get pods -n default | grep ossa"
echo "  kubectl get ingress -n default | grep ossa"
echo ""
echo "To view logs:"
echo "  kubectl logs -f deployment/ossa-website -n default"
