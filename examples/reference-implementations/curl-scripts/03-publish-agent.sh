#!/bin/bash
#
# OSSA API - Publish Agent Example
#
# Demonstrates publishing an agent to the registry.
# Requires OSSA_TOKEN environment variable.
#

set -e

# Configuration
BASE_URL="${OSSA_BASE_URL:-https://registry.openstandardagents.org/api/v1}"
TOKEN="${OSSA_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: OSSA_TOKEN environment variable is required"
  echo "   Run: export OSSA_TOKEN=ossa_tok_xxx"
  exit 1
fi

echo "📦 OSSA API - Publish Agent Example"
echo ""

# Prepare the publish request
PUBLISH_REQUEST=$(cat <<'EOF'
{
  "manifest": {
    "apiVersion": "ossa/v0.3.0",
    "kind": "Agent",
    "metadata": {
      "name": "example-curl-agent",
      "version": "1.0.0",
      "description": "Example agent published via curl",
      "labels": {
        "environment": "production",
        "team": "devops"
      }
    },
    "spec": {
      "taxonomy": {
        "domain": "infrastructure",
        "subdomain": "monitoring",
        "capability": "health-check"
      },
      "role": "Infrastructure health monitoring agent",
      "llm": {
        "provider": "anthropic",
        "model": "claude-sonnet-4",
        "temperature": 0.3,
        "maxTokens": 4000
      },
      "capabilities": [
        {
          "name": "check_health",
          "description": "Perform health check on infrastructure",
          "input_schema": {
            "type": "object",
            "required": ["target"],
            "properties": {
              "target": {
                "type": "string",
                "description": "Target URL or hostname"
              }
            }
          },
          "output_schema": {
            "type": "object",
            "properties": {
              "status": {
                "type": "string",
                "enum": ["healthy", "degraded", "unhealthy"]
              },
              "checks": {
                "type": "array"
              }
            }
          }
        }
      ],
      "runtime": {
        "type": "serverless",
        "config": {
          "timeout": 60,
          "memory": "256Mi"
        }
      }
    }
  },
  "package": {
    "tarball_url": "https://example.com/agents/example-curl-agent-1.0.0.tgz",
    "shasum": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "size_bytes": 102400
  },
  "documentation": {
    "readme": "https://github.com/example/example-curl-agent#readme",
    "repository": "https://github.com/example/example-curl-agent"
  },
  "license": "Apache-2.0",
  "keywords": ["monitoring", "health-check", "infrastructure"]
}
EOF
)

# Publish the agent
echo "1️⃣  Publishing agent..."
RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/agents" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "${PUBLISH_REQUEST}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 201 ]; then
  echo "✅ Agent published successfully!"
  echo ""
  echo "$BODY" | jq '{
    status: .status,
    agent: {
      name: .agent.name,
      version: .agent.version,
      publisher: .agent.publisher,
      published_at: .agent.published_at,
      registry_url: .agent.registry_url
    },
    verification: .verification
  }'
else
  echo "❌ Publishing failed with HTTP $HTTP_CODE"
  echo "$BODY" | jq '.'
  exit 1
fi

echo ""
echo "✅ Publish example completed!"
