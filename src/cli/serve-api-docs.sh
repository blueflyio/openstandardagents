#!/bin/bash
# Serve OSSA API Documentation with Redocly

echo "🚀 Starting OSSA API Documentation Server"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Redocly CLI is installed
if ! npm list @redocly/cli >/dev/null 2>&1; then
    echo -e "${YELLOW}Installing Redocly CLI...${NC}"
    npm install --save-dev @redocly/cli
fi

# Build latest documentation
echo -e "${BLUE}Building API documentation...${NC}"
npm run api:docs:build

# Serve the documentation
echo -e "${GREEN}✅ API Documentation available at:${NC}"
echo -e "${GREEN}   http://localhost:8080${NC}"
echo ""
echo "Available endpoints:"
echo "  - OSSA Complete API"
echo "  - Core Specification" 
echo "  - ACDL Specification"
echo "  - Clean Architecture API"
echo "  - MCP Infrastructure"
echo ""
echo "Press Ctrl+C to stop the server"

# Start simple HTTP server
npx serve dist/api-docs -l 8080