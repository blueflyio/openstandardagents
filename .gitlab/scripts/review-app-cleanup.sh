#!/bin/bash
# =============================================================================
# Review App Cleanup Script
# =============================================================================
# Removes review app resources when MR is closed/merged
#
# Usage: ./review-app-cleanup.sh <app-name> <namespace>
# =============================================================================

set -e

REVIEW_APP_NAME="${1:-}"
NAMESPACE="${2:-ossa-review}"

if [ -z "$REVIEW_APP_NAME" ]; then
  echo "Usage: $0 <app-name> [namespace]"
  exit 1
fi

echo "🧹 Cleaning up review app: ${REVIEW_APP_NAME} in namespace: ${NAMESPACE}"

# Delete all resources for this review app
kubectl delete deployment "${REVIEW_APP_NAME}" -n "${NAMESPACE}" --ignore-not-found=true
kubectl delete service "${REVIEW_APP_NAME}" -n "${NAMESPACE}" --ignore-not-found=true
kubectl delete ingress "${REVIEW_APP_NAME}" -n "${NAMESPACE}" --ignore-not-found=true

echo "✅ Review app ${REVIEW_APP_NAME} cleaned up"
