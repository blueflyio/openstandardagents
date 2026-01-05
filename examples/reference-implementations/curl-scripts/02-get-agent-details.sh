#!/bin/bash
#
# OSSA API - Get Agent Details Example
#
# Demonstrates retrieving detailed information about agents.
#

set -e

# Configuration
BASE_URL="${OSSA_BASE_URL:-https://registry.openstandardagents.org/api/v1}"
PUBLISHER="${1:-blueflyio}"
AGENT_NAME="${2:-security-scanner}"

echo "📋 OSSA API - Get Agent Details Example"
echo ""

# 1. Get latest version of agent
echo "1️⃣  Get agent details: ${PUBLISHER}/${AGENT_NAME}..."
curl -s "${BASE_URL}/agents/${PUBLISHER}/${AGENT_NAME}" \
  -H "Accept: application/json" \
  | jq '{
      name: .name,
      version: .version,
      publisher: .publisher.name,
      verified: .publisher.verified,
      description: .description,
      license: .license,
      taxonomy: .taxonomy,
      capabilities: .capabilities,
      downloads: .download_stats,
      rating: .rating_info
    }'

echo ""

# 2. List all versions
echo "2️⃣  List all versions of ${PUBLISHER}/${AGENT_NAME}..."
curl -s "${BASE_URL}/agents/${PUBLISHER}/${AGENT_NAME}/versions" \
  -H "Accept: application/json" \
  | jq '.versions[] | {version: .version, published_at: .published_at, downloads: .downloads, deprecated: .deprecated}'

echo ""

# 3. Get specific version
echo "3️⃣  Get specific version details..."
VERSION=$(curl -s "${BASE_URL}/agents/${PUBLISHER}/${AGENT_NAME}/versions" \
  -H "Accept: application/json" \
  | jq -r '.versions[0].version')

if [ -n "$VERSION" ]; then
  curl -s "${BASE_URL}/agents/${PUBLISHER}/${AGENT_NAME}/${VERSION}" \
    -H "Accept: application/json" \
    | jq '{name: .name, version: .version, created_at: .created_at, manifest_url: .manifest_url}'
fi

echo ""

# 4. Get agent dependencies
echo "4️⃣  Get agent dependencies..."
curl -s "${BASE_URL}/agents/${PUBLISHER}/${AGENT_NAME}/dependencies" \
  -H "Accept: application/json" \
  | jq '{agent: .agent, version: .version, dependencies: .dependencies}'

echo ""

# 5. Get download statistics
echo "5️⃣  Get download statistics (last month)..."
curl -s "${BASE_URL}/agents/${PUBLISHER}/${AGENT_NAME}/stats?period=month" \
  -H "Accept: application/json" \
  | jq '{agent: .agent, period: .period, downloads: .downloads.total}'

echo ""
echo "✅ Agent details examples completed!"
