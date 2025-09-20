#!/bin/bash
# Launch OpenAPI Documentation Portal with OrbStack/Docker
# Provides comprehensive API documentation for all LLM projects

set -e

echo "🚀 Launching OpenAPI Documentation Portal"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="../../docker-compose.yml"
PROJECT_NAME="ossa"

# Change to script directory
cd "$(dirname "$0")"

# Check Docker/OrbStack
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker/OrbStack is not running${NC}"
    echo "Please start OrbStack and try again"
    exit 1
fi

echo -e "${BLUE}📦 Starting services...${NC}"

# Start services
docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 5

# Check service status
echo -e "${BLUE}📊 Service Status:${NC}"
docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps

# Display access URLs
echo ""
echo -e "${GREEN}✅ OpenAPI Documentation Portal is ready!${NC}"
echo ""
echo -e "${BLUE}🌐 Access your API documentation:${NC}"
echo ""
echo "  📘 Swagger UI (Interactive):"
echo "     http://localhost:8080"
echo ""
echo "  📕 Redocly (Beautiful Docs):"
echo "     http://localhost:8081"
echo ""
echo "  🌐 API Portal (All Projects):"
echo "     http://localhost:8082"
echo ""
echo "  🔧 Mock API Server:"
echo "     http://localhost:4010"
echo ""
echo "  🛡️ API Validation Proxy:"
echo "     http://localhost:4011"
echo ""
echo -e "${YELLOW}📋 Available APIs:${NC}"
echo "  • OSSA Specification API"
echo "  • Orchestration API"
echo "  • Clean Architecture API"
echo "  • MCP Infrastructure"
echo "  • Voice Agent API"
echo ""
echo -e "${CYAN}💡 Tips:${NC}"
echo "  • Switch between APIs using the dropdown in Swagger UI"
echo "  • Test endpoints directly from the documentation"
echo "  • Use the mock server for development without a backend"
echo ""
echo -e "${YELLOW}To stop services:${NC}"
echo "  docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down"
echo ""