#!/bin/bash
#
# OSSA API - Discovery Example
#
# Demonstrates agent discovery by taxonomy, capabilities, and compliance.
#

set -e

# Configuration
BASE_URL="${OSSA_BASE_URL:-https://registry.openstandardagents.org/api/v1}"

echo "🔎 OSSA API - Discovery Example"
echo ""

# 1. List taxonomies
echo "1️⃣  List available taxonomies..."
curl -s "${BASE_URL}/specification/taxonomies" \
  -H "Accept: application/json" \
  | jq '.taxonomies[] | {domain: .domain, subdomains: (.subdomains | keys)}'

echo ""

# 2. List capabilities
echo "2️⃣  List capabilities in security domain..."
curl -s "${BASE_URL}/specification/capabilities?domain=security" \
  -H "Accept: application/json" \
  | jq '.capabilities[] | {name: .name, description: .description, domain: .domain}'

echo ""

# 3. Get capability details
echo "3️⃣  Get capability details: vulnerability-detection..."
curl -s "${BASE_URL}/specification/capabilities/vulnerability-detection" \
  -H "Accept: application/json" \
  | jq '{name: .name, description: .description, example_agents: .example_agents}'

echo ""

# 4. List compliance profiles
echo "4️⃣  List compliance profiles..."
curl -s "${BASE_URL}/specification/compliance" \
  -H "Accept: application/json" \
  | jq '.profiles[] | {id: .id, name: .name, agent_count: .agent_count}'

echo ""

# 5. Discover agents by taxonomy
echo "5️⃣  Discover agents: domain=security, subdomain=vulnerability..."
curl -s "${BASE_URL}/agents/discover/taxonomy?domain=security&subdomain=vulnerability" \
  -H "Accept: application/json" \
  | jq '{taxonomy: .taxonomy, total: .total, agents: .agents[] | {publisher: .publisher, name: .name, rating: .rating}}'

echo ""

# 6. Discover by compliance
echo "6️⃣  Discover agents with FedRAMP and HIPAA compliance..."
curl -s "${BASE_URL}/agents/discover/compliance?profiles=fedramp-moderate,hipaa" \
  -H "Accept: application/json" \
  | jq '{
      compliance_profiles: .compliance_profiles,
      total: .total,
      agents: .agents[] | {name: .name, compliance_profiles: .compliance_profiles}
    }'

echo ""

# 7. Get recommendations
echo "7️⃣  Get agent recommendations..."
RECOMMENDATION_REQUEST=$(cat <<'EOF'
{
  "use_case": "I need to scan my web application for security vulnerabilities",
  "requirements": {
    "compliance": ["fedramp-moderate"],
    "budget": "$100/month",
    "performance": "high"
  },
  "preferences": {
    "verified_only": true,
    "min_rating": 4.0
  }
}
EOF
)

curl -s "${BASE_URL}/agents/recommend" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "${RECOMMENDATION_REQUEST}" \
  | jq '.recommendations[] | {
      agent: .agent,
      score: .score,
      reasoning: .reasoning,
      compliance_match: .compliance_match
    }'

echo ""
echo "✅ Discovery examples completed!"
