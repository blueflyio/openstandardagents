#!/bin/bash

# FEDERATED LEARNING ACTIVATION MONITOR

echo "🔍 MONITORING FEDERATED LEARNING ACTIVATION..."

# Check Qdrant status
echo "📊 Qdrant Status:"
if curl -f http://localhost:6333/health >/dev/null 2>&1; then
    echo "✅ Qdrant is running on http://localhost:6333"
    echo "📈 Collections:"
    curl -s http://localhost:6333/collections | jq '.result.collections[] | .name' 2>/dev/null || echo "   No collections yet"
else
    echo "❌ Qdrant is not ready yet"
fi

echo ""

# Check Docker containers
echo "🐳 Docker Status:"
docker ps --filter "name=qdrant-federated" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""

# Check for log files
echo "📝 Activation Logs:"
ls -la /Users/flux423/Sites/LLM/OSSA/logs/federated-activation-*.log 2>/dev/null || echo "   No log files yet"

echo ""

# Check OSSA agents
echo "🤖 OSSA Agent Status:"
cd /Users/flux423/Sites/LLM/OSSA
node dist/cli/ossa-cli.js status 2>/dev/null || echo "   OSSA CLI not ready"

echo ""

# Check agent-brain build status
echo "🧠 Agent-Brain Status:"
if [ -f "/Users/flux423/Sites/LLM/common_npm/agent-brain/dist/index.js" ]; then
    echo "✅ Agent-Brain is built"
else
    echo "⚠️ Agent-Brain needs building"
fi

echo ""
echo "🔄 Run this script again to check progress: ./scripts/monitor-activation.sh"