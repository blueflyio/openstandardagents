#!/bin/bash
# =============================================================================
# Setup Review Apps for OSSA Website
# =============================================================================
# This script configures your OrbStack K8s cluster for review apps
#
# Prerequisites:
#   - OrbStack running with Kubernetes
#   - kubectl configured to use OrbStack context
#   - glab CLI installed and authenticated
#
# What it does:
#   1. Creates the ossa-review namespace
#   2. Sets up nginx ingress for *.orb.local
#   3. Generates KUBE_CONFIG_B64 for GitLab CI
#   4. Adds the CI variable to the project
#   5. Updates /etc/hosts for local DNS
# =============================================================================

set -e

NAMESPACE="ossa-review"
PROJECT_PATH="blueflyio/openstandardagents.org"
ORBSTACK_INGRESS_IP="192.168.139.2"

echo "=============================================="
echo "  OSSA Review Apps Setup"
echo "=============================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v kubectl &> /dev/null; then
  echo "❌ kubectl not found. Please install kubectl."
  exit 1
fi

if ! command -v glab &> /dev/null; then
  echo "⚠️  glab not found. Install with: brew install glab"
  echo "   Will skip CI variable setup"
  SKIP_GLAB=true
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

# Step 2: Check ingress controller
echo "🌐 Checking nginx ingress controller..."
if kubectl get svc -n ingress-nginx ingress-nginx-controller &> /dev/null; then
  INGRESS_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "$ORBSTACK_INGRESS_IP")
  echo "✅ Ingress controller found at: ${INGRESS_IP}"
else
  echo "⚠️  Nginx ingress not found. Installing..."
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.4/deploy/static/provider/cloud/deploy.yaml
  sleep 10
  INGRESS_IP="$ORBSTACK_INGRESS_IP"
fi
echo ""

# Step 3: Generate KUBE_CONFIG_B64
echo "🔐 Generating KUBE_CONFIG_B64..."
KUBE_CONFIG_B64=$(kubectl config view --raw --minify | base64)
echo "✅ Generated (${#KUBE_CONFIG_B64} chars)"
echo ""

# Step 4: Add CI variable
if [ "$SKIP_GLAB" != "true" ]; then
  echo "🔧 Adding KUBE_CONFIG_B64 to GitLab CI..."

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
  echo ""
else
  echo "📋 Manual step required:"
  echo "   1. Go to: https://gitlab.com/${PROJECT_PATH}/-/settings/ci_cd"
  echo "   2. Expand 'Variables'"
  echo "   3. Add variable: KUBE_CONFIG_B64"
  echo "   4. Value (base64 encoded kubeconfig):"
  echo ""
  echo "   Run this command to get the value:"
  echo "   kubectl config view --raw --minify | base64 | pbcopy"
  echo ""
fi

# Step 5: Update /etc/hosts
echo "📝 DNS Configuration"
echo ""
echo "Add these entries to /etc/hosts:"
echo ""
echo "  ${INGRESS_IP}  ossa-staging.orb.local"
echo "  ${INGRESS_IP}  ossa-mr-1.orb.local"
echo "  ${INGRESS_IP}  ossa-mr-2.orb.local"
echo "  ${INGRESS_IP}  ossa-mr-3.orb.local"
echo ""
echo "Or for all review apps:"
echo "  ${INGRESS_IP}  ossa-staging.orb.local ossa-mr-1.orb.local ossa-mr-2.orb.local ossa-mr-3.orb.local"
echo ""

# Check if we can add to /etc/hosts
if [ -w /etc/hosts ]; then
  read -p "Add entries to /etc/hosts now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Remove old entries
    sudo sed -i '' '/ossa-.*\.orb\.local/d' /etc/hosts
    # Add new entries
    echo "${INGRESS_IP}  ossa-staging.orb.local ossa-mr-1.orb.local ossa-mr-2.orb.local ossa-mr-3.orb.local" | sudo tee -a /etc/hosts
    echo "✅ /etc/hosts updated"
  fi
else
  echo "⚠️  Cannot write to /etc/hosts. Please add entries manually."
fi

echo ""
echo "=============================================="
echo "✅ Setup Complete!"
echo "=============================================="
echo ""
echo "Review Apps Flow:"
echo "  1. Feature MR → release/* : Deploys to http://ossa-mr-<MR_ID>.orb.local"
echo "  2. Release MR → main      : Deploys to http://ossa-staging.orb.local"
echo "  3. Merge to main          : Click 'pages' job to deploy to production"
echo ""
echo "Test locally:"
echo "  curl http://ossa-staging.orb.local"
echo ""
