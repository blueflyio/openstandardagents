#!/bin/bash
#
# OSSA API - Search Agents Example
#
# Demonstrates searching for agents using various filters.
#

set -e

# Configuration
BASE_URL="${OSSA_BASE_URL:-https://registry.openstandardagents.org/api/v1}"
TOKEN="${OSSA_TOKEN:-}"

echo "🔍 OSSA API - Search Agents Example"
echo ""

# 1. Search for security agents
echo "1️⃣  Search for security agents..."
curl -s "${BASE_URL}/agents?domain=security&limit=5&sort=downloads" \
  -H "Accept: application/json" \
  | jq '.agents[] | {name: .name, publisher: .publisher, version: .version, rating: .rating, downloads: .downloads}'

echo ""

# 2. Search with full-text query
echo "2️⃣  Full-text search for 'vulnerability scanner'..."
curl -s "${BASE_URL}/agents?q=vulnerability+scanner&limit=3" \
  -H "Accept: application/json" \
  | jq '.agents[] | {name: .name, description: .description}'

echo ""

# 3. Filter by capability
echo "3️⃣  Filter by capability: vulnerability-detection..."
curl -s "${BASE_URL}/agents?capability=vulnerability-detection&limit=3" \
  -H "Accept: application/json" \
  | jq '.agents[] | {name: .name, capabilities: .capabilities}'

echo ""

# 4. Filter by verified publishers only
echo "4️⃣  Verified publishers only with minimum rating 4.0..."
curl -s "${BASE_URL}/agents?verified=true&min_rating=4.0&limit=5" \
  -H "Accept: application/json" \
  | jq '.agents[] | {name: .name, publisher: .publisher, verified: .verified, rating: .rating}'

echo ""

# 5. Filter by compliance profile
echo "5️⃣  Agents with FedRAMP moderate compliance..."
curl -s "${BASE_URL}/agents?compliance=fedramp-moderate&limit=3" \
  -H "Accept: application/json" \
  | jq '.agents[] | {name: .name, compliance_profiles: .compliance_profiles}'

echo ""

# 6. Pagination example
echo "6️⃣  Pagination - First page (10 results)..."
curl -s "${BASE_URL}/agents?limit=10&offset=0" \
  -H "Accept: application/json" \
  | jq '{total: .total, limit: .limit, offset: .offset, count: (.agents | length)}'

echo ""

# 7. Combined filters
echo "7️⃣  Combined filters: domain=security, license=Apache-2.0, min_rating=3.5..."
curl -s "${BASE_URL}/agents?domain=security&license=Apache-2.0&min_rating=3.5" \
  -H "Accept: application/json" \
  | jq '.agents[] | {name: .name, license: .license, rating: .rating}'

echo ""
echo "✅ Search examples completed!"
