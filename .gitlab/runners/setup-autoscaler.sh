#!/bin/bash
# Enhanced setup script with self-healing configuration

set -e

NAMESPACE="gitlab-runner"
PROJECT_ID="${CI_PROJECT_ID:-76265294}"

echo "Setting up OSSA auto-scaling self-healing GitLab runners..."

# Create namespace
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Get runner registration token
echo "Getting runner registration token..."
RUNNER_TOKEN=$(curl -s --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "https://gitlab.com/api/v4/projects/${PROJECT_ID}/runners_token" | jq -r '.token')

if [ -z "$RUNNER_TOKEN" ] || [ "$RUNNER_TOKEN" = "null" ]; then
  echo "ERROR: Failed to get runner token"
  exit 1
fi

# Create secret
kubectl create secret generic gitlab-runner-secret \
  --from-literal=runner-token="$RUNNER_TOKEN" \
  --from-literal=s3-cache-server="${S3_CACHE_SERVER:-}" \
  --from-literal=s3-cache-access-key="${S3_CACHE_ACCESS_KEY:-}" \
  --from-literal=s3-cache-secret-key="${S3_CACHE_SECRET_KEY:-}" \
  -n "$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

# Apply all configurations
echo "Applying runner configurations..."
kubectl apply -f .gitlab/runners/k8s-autoscaler-deployment.yaml
kubectl apply -f .gitlab/runners/self-healing-config.yaml
kubectl apply -f .gitlab/runners/circuit-breaker.yaml
kubectl apply -f .gitlab/runners/monitoring-alerts.yaml
kubectl apply -f .gitlab/runners/backup-recovery.yaml
kubectl apply -f .gitlab/runners/advanced-features.yaml

# Wait for deployment
echo "Waiting for runner deployment..."
kubectl wait --for=condition=available --timeout=300s \
  deployment/gitlab-runner-autoscaler -n "$NAMESPACE"

echo "OSSA self-healing auto-scaling runners deployed!"
echo ""
echo "Features enabled:"
echo "  - Auto-scaling (1-10 replicas)"
echo "  - Self-healing (health checks, auto-restart)"
echo "  - Circuit breaker (failure protection)"
echo "  - Monitoring & alerts (Prometheus)"
echo "  - Backup & recovery (every 6 hours)"
echo "  - Resource quotas & limits"
echo "  - Network policies"
echo ""
echo "Check status:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl get hpa -n $NAMESPACE"
echo "  kubectl get cronjob -n $NAMESPACE"
echo ""
echo "View logs:"
echo "  kubectl logs -f deployment/gitlab-runner-autoscaler -n $NAMESPACE"
