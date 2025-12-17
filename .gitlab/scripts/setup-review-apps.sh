#!/bin/bash
# =============================================================================
# Setup Review Apps for OSSA Website
# =============================================================================
# This script configures GitLab CI/CD variable for OrbStack K8s review apps
#
# Prerequisites:
#   - OrbStack running with Kubernetes
#   - kubectl configured to use OrbStack context
#   - glab CLI installed and authenticated
#
# What it does:
#   1. Verifies OrbStack K8s is running
#   2. Creates the ossa-review namespace
#   3. Installs nginx-ingress if missing
#   4. Generates KUBE_CONFIG_B64 for GitLab CI
#   5. Adds the CI variable to the project
#
# DNS: Uses nip.io - NO /etc/hosts configuration needed!
#      Review apps will be accessible at: *.{INGRESS_IP}.nip.io
# =============================================================================

set -e

NAMESPACE="ossa-review"
PROJECT_PATH="blueflyio/openstandardagents.org"

echo "=============================================="
echo "  OSSA Review Apps Setup (nip.io)"
echo "=============================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v kubectl &> /dev/null; then
  echo "❌ kubectl not found. Please install kubectl."
  exit 1
fi

if ! kubectl cluster-info &> /dev/null; then
  echo "❌ Cannot connect to Kubernetes cluster."
  echo "   Make sure OrbStack is running and kubectl is configured."
  exit 1
fi

echo "✅ Prerequisites OK"
echo ""

# Step 1: Create namespace
echo "📦 Creating namespace: ${NAMESPACE}"
kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
echo "✅ Namespace created"
echo ""

# Step 2: Check/install ingress controller
echo "🌐 Checking nginx ingress controller..."
if kubectl get svc -n ingress-nginx ingress-nginx-controller &> /dev/null; then
  INGRESS_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
  echo "✅ Ingress controller found at: ${INGRESS_IP}"
else
  echo "⚠️  Nginx ingress not found. Installing..."
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.4/deploy/static/provider/cloud/deploy.yaml
  echo "⏳ Waiting for ingress controller to be ready..."
  kubectl wait --namespace ingress-nginx \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=120s
  INGRESS_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
  echo "✅ Ingress controller installed at: ${INGRESS_IP}"
fi
echo ""

# Step 3: Generate KUBE_CONFIG_B64
echo "🔐 Generating KUBE_CONFIG_B64..."
KUBE_CONFIG_B64=$(kubectl config view --raw --minify | base64)
echo "✅ Generated (${#KUBE_CONFIG_B64} chars)"
echo ""

# Step 4: Add CI variable
echo "🔧 Adding KUBE_CONFIG_B64 to GitLab CI..."
if command -v glab &> /dev/null; then
  # Check if variable exists
  if glab variable list --repo "$PROJECT_PATH" 2>/dev/null | grep -q "KUBE_CONFIG_B64"; then
    echo "   Variable exists, updating..."
    glab variable update KUBE_CONFIG_B64 \
      --value "$KUBE_CONFIG_B64" \
      --repo "$PROJECT_PATH" \
      --masked \
      --protected 2>/dev/null || echo "   ⚠️  Update failed (may need manual update)"
  else
    echo "   Creating new variable..."
    glab variable create KUBE_CONFIG_B64 \
      --value "$KUBE_CONFIG_B64" \
      --repo "$PROJECT_PATH" \
      --masked \
      --protected 2>/dev/null || echo "   ⚠️  Create failed (may need manual update)"
  fi
else
  echo "⚠️  glab not found. Install with: brew install glab"
  echo ""
  echo "📋 Manual step required:"
  echo "   1. Go to: https://gitlab.com/${PROJECT_PATH}/-/settings/ci_cd"
  echo "   2. Expand 'Variables'"
  echo "   3. Add variable: KUBE_CONFIG_B64"
  echo "   4. Paste this value:"
  echo ""
  echo "   Run: kubectl config view --raw --minify | base64 | pbcopy"
  echo ""
fi
echo ""

echo "=============================================="
echo "✅ Setup Complete!"
echo "=============================================="
echo ""
echo "📍 Ingress IP: ${INGRESS_IP}"
echo ""
echo "🌐 DNS: Using nip.io (automatic, no /etc/hosts needed)"
echo ""
echo "Review Apps Flow:"
echo "  1. Feature MR → release/* : http://ossa-mr-<MR_ID>.${INGRESS_IP}.nip.io"
echo "  2. Release MR → main      : http://ossa-staging.${INGRESS_IP}.nip.io"
echo "  3. Merge to main          : Click 'pages' job for GitLab Pages"
echo ""
echo "Test now:"
echo "  curl http://ossa-staging.${INGRESS_IP}.nip.io"
echo ""
