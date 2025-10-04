#!/bin/bash
#
# OSSA Development Environment Startup
# Starts Phoenix, Prometheus, Grafana, Redis, PostgreSQL
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🚀 Starting OSSA Development Environment"
echo "════════════════════════════════════════════════════════════"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop."
  exit 1
fi

# Load development environment
if [ -f ".env.development" ]; then
  echo "📝 Loading .env.development"
  export $(cat .env.development | grep -v '^#' | xargs)
else
  echo "⚠️  No .env.development found, using defaults"
fi

# Start infrastructure services
echo ""
echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check service health
echo ""
echo "🏥 Health Check:"
echo "────────────────────────────────────────────────────────────"

# Phoenix
if curl -s http://localhost:6006 > /dev/null; then
  echo "✅ Phoenix UI:        http://localhost:6006"
else
  echo "⚠️  Phoenix UI:        Starting..."
fi

# Prometheus
if curl -s http://localhost:9090/-/healthy > /dev/null; then
  echo "✅ Prometheus:        http://localhost:9090"
else
  echo "⚠️  Prometheus:        Starting..."
fi

# Grafana
if curl -s http://localhost:3001/api/health > /dev/null; then
  echo "✅ Grafana:           http://localhost:3001 (admin/admin)"
else
  echo "⚠️  Grafana:           Starting..."
fi

# Redis
if docker exec ossa-redis redis-cli ping > /dev/null 2>&1; then
  echo "✅ Redis:             localhost:6379"
else
  echo "⚠️  Redis:             Starting..."
fi

# PostgreSQL
if docker exec ossa-postgres pg_isready -U ossa > /dev/null 2>&1; then
  echo "✅ PostgreSQL:        localhost:5432"
else
  echo "⚠️  PostgreSQL:        Starting..."
fi

echo "────────────────────────────────────────────────────────────"

# Display next steps
echo ""
echo "🎯 Next Steps:"
echo "  1. Build OSSA:       npm run build"
echo "  2. Start API:        npm run dev"
echo "  3. Build graph:      npm run graph:build"
echo "  4. View traces:      http://localhost:6006"
echo ""
echo "📊 Monitoring URLs:"
echo "  • Phoenix:           http://localhost:6006"
echo "  • Prometheus:        http://localhost:9090"
echo "  • Grafana:           http://localhost:3001"
echo ""
echo "🛑 To stop:"
echo "  ./scripts/dev-stop.sh"
echo "  or: docker-compose -f docker-compose.dev.yml down"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Development environment ready!"
