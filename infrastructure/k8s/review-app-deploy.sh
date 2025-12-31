#!/bin/bash
# Deploy Review App to OrbStack Kubernetes
# Usage: ./k8s/review-app-deploy.sh <MR_ID> <IMAGE_TAG>

set -e

MR_ID="${1}"
IMAGE_TAG="${2}"

if [ -z "$MR_ID" ] || [ -z "$IMAGE_TAG" ]; then
  echo "Usage: $0 <MR_ID> <IMAGE_TAG>"
  echo "Example: $0 169 registry.gitlab.com/blueflyio/openstandardagents.org:abc123"
  exit 1
fi

REVIEW_NAMESPACE="review-${MR_ID}"
REVIEW_URL="ossa-mr-${MR_ID}.ossa.orb.local"

echo "Deploying review app for MR !${MR_ID}"
echo "Namespace: ${REVIEW_NAMESPACE}"
echo "URL: http://${REVIEW_URL}"
echo "Image: ${IMAGE_TAG}"

# Export variables for envsubst
export MR_ID
export IMAGE_TAG

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

# Apply manifests with variable substitution
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
envsubst < "${SCRIPT_DIR}/review-app.yaml" | kubectl apply -f -

echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/ossa-review -n ${REVIEW_NAMESPACE} --timeout=5m

echo ""
echo "Review app deployed successfully!"
echo "Access at: http://${REVIEW_URL}"
echo ""
echo "To check status:"
echo "  kubectl get pods -n ${REVIEW_NAMESPACE}"
echo "  kubectl get ingress -n ${REVIEW_NAMESPACE}"
echo ""
echo "To view logs:"
echo "  kubectl logs -f -n ${REVIEW_NAMESPACE} -l app=ossa-review"
echo ""
echo "To stop:"
echo "  kubectl delete namespace ${REVIEW_NAMESPACE}"
