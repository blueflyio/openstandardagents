#!/bin/bash
# Enhanced setup script with self-healing for website

set -e

NAMESPACE="gitlab-runner"
PROJECT_ID="${CI_PROJECT_ID}"

echo "Setting up OSSA website auto-scaling self-healing GitLab runners..."

kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

echo "Getting runner registration token..."
RUNNER_TOKEN=$(curl -s --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "https://gitlab.com/api/v4/projects/${PROJECT_ID}/runners_token" | jq -r '.token')

kubectl create secret generic gitlab-runner-secret \
  --from-literal=runner-token="$RUNNER_TOKEN" \
  -n "$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

# Apply all configurations
kubectl apply -f k8s/gitlab-runner-autoscaler.yaml
kubectl apply -f k8s/gitlab-runner-self-healing.yaml

kubectl wait --for=condition=available --timeout=300s \
  deployment/gitlab-runner-autoscaler -n "$NAMESPACE"

echo "Self-healing auto-scaling runners deployed!"
