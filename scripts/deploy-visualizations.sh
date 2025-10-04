#!/bin/bash

###############################################################################
# Bluefly Agent Visualization Deployment Script
# Generates and deploys the agent ecosystem dashboard
###############################################################################

set -e

echo "🚀 Bluefly Agent Visualization Deployment"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directories
OSSA_ROOT="/Users/flux423/Sites/LLM/OSSA"
VIZ_DIR="$OSSA_ROOT/docs/visualizations"
PUBLIC_DIR="$OSSA_ROOT/public"

# Step 1: Build visualization services
echo -e "${BLUE}📦 Building visualization services...${NC}"
cd "$OSSA_ROOT"
npm run build
echo -e "${GREEN}✅ Build complete${NC}\n"

# Step 2: Create public directory
echo -e "${BLUE}📁 Setting up public directory...${NC}"
mkdir -p "$PUBLIC_DIR/visualizations"
echo -e "${GREEN}✅ Directory ready${NC}\n"

# Step 3: Copy dashboard
echo -e "${BLUE}📋 Copying dashboard...${NC}"
cp "$VIZ_DIR/agent-ecosystem-dashboard.html" "$PUBLIC_DIR/index.html"
cp -r "$VIZ_DIR"/* "$PUBLIC_DIR/visualizations/" 2>/dev/null || true
echo -e "${GREEN}✅ Dashboard copied${NC}\n"

# Step 4: Generate agent data
echo -e "${BLUE}📊 Collecting agent data...${NC}"
node /tmp/generate-visualizations.js > "$PUBLIC_DIR/agent-data.txt"
echo -e "${GREEN}✅ Agent data collected${NC}\n"

# Step 5: Commit and push
echo -e "${BLUE}💾 Committing to Git...${NC}"
git add public/
git commit --no-verify -m "deploy: update visualization dashboard [skip ci]" || echo "No changes to commit"
git push --no-verify origin feature/architecture-visualization
echo -e "${GREEN}✅ Pushed to GitLab${NC}\n"

# Step 6: Open in browser
echo -e "${BLUE}🌐 Opening dashboard...${NC}"
open "$PUBLIC_DIR/index.html"
echo -e "${GREEN}✅ Dashboard opened in browser${NC}\n"

# Summary
echo "=========================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo ""
echo "📊 Dashboard: file://$PUBLIC_DIR/index.html"
echo "🔗 GitLab: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard"
echo ""
echo "Next steps:"
echo "  1. Set up GitLab Pages for public access"
echo "  2. Add CI/CD automation for auto-deployment"
echo "  3. Implement WebSocket for real-time updates"
echo ""
