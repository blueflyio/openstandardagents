#!/bin/bash
# Deploy all OSSA runner configurations
# Comprehensive deployment script

set -e

NAMESPACE="gitlab-runner"
PROJECT_ID="${CI_PROJECT_ID:-76265294}"

echo "Deploying complete OSSA runner infrastructure..."

# Create namespace
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Get runner token
RUNNER_TOKEN=$(curl -s --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "https://gitlab.com/api/v4/projects/${PROJECT_ID}/runners_token" | jq -r '.token')

# Create secrets
kubectl create secret generic gitlab-runner-secret \
  --from-literal=runner-token="$RUNNER_TOKEN" \
  --from-literal=s3-cache-server="${S3_CACHE_SERVER:-}" \
  --from-literal=s3-cache-access-key="${S3_CACHE_ACCESS_KEY:-}" \
  --from-literal=s3-cache-secret-key="${S3_CACHE_SECRET_KEY:-}" \
  -n "$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

# Deploy in order
echo "1. Deploying base infrastructure..."
kubectl apply -f .gitlab/runners/k8s-autoscaler-deployment.yaml

echo "2. Deploying self-healing..."
kubectl apply -f .gitlab/runners/self-healing-config.yaml
kubectl apply -f .gitlab/runners/circuit-breaker.yaml

echo "3. Deploying monitoring..."
kubectl apply -f .gitlab/runners/monitoring-alerts.yaml
kubectl apply -f .gitlab/runners/observability-stack.yaml

echo "4. Deploying backup system..."
kubectl apply -f .gitlab/runners/backup-recovery.yaml

echo "5. Deploying advanced features..."
kubectl apply -f .gitlab/runners/advanced-features.yaml
kubectl apply -f .gitlab/runners/security-hardening.yaml
kubectl apply -f .gitlab/runners/cost-optimization.yaml

echo "6. Deploying performance tuning..."
kubectl apply -f .gitlab/runners/performance-tuning.yaml

# Wait for deployment
kubectl wait --for=condition=available --timeout=300s \
  deployment/gitlab-runner-autoscaler -n "$NAMESPACE"

echo ""
echo "OSSA runner infrastructure deployed!"
echo ""
echo "Components:"
echo "  - Auto-scaling runners (1-10 replicas)"
echo "  - Self-healing system"
echo "  - Circuit breaker"
echo "  - Monitoring & alerting"
echo "  - Backup & recovery"
echo "  - Security hardening"
echo "  - Cost optimization"
echo "  - Performance tuning"
echo ""
echo "Check status:"
echo "  kubectl get all -n $NAMESPACE"
echo "  kubectl get hpa -n $NAMESPACE"
echo "  kubectl get cronjob -n $NAMESPACE"
