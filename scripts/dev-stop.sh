#!/bin/bash
#
# OSSA Development Environment Stop
# Stops all development services
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🛑 Stopping OSSA Development Environment"
echo "════════════════════════════════════════════════════════════"

# Stop Docker services
docker-compose -f docker-compose.dev.yml down

echo ""
echo "✅ All services stopped"
echo ""
echo "💡 To preserve data, volumes are kept"
echo "   To remove volumes: docker-compose -f docker-compose.dev.yml down -v"
echo ""
