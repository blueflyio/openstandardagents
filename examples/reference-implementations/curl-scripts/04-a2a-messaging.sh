#!/bin/bash
#
# OSSA API - Agent-to-Agent Messaging Example
#
# Demonstrates A2A messaging capabilities.
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

echo "💬 OSSA API - A2A Messaging Example"
echo ""

# 1. Send a simple A2A message
echo "1️⃣  Sending A2A message..."
MESSAGE=$(cat <<'EOF'
{
  "from": {
    "publisher": "myorg",
    "name": "my-agent",
    "version": "1.0.0"
  },
  "to": {
    "publisher": "blueflyio",
    "name": "security-scanner",
    "version": "2.0.0"
  },
  "type": "request",
  "capability": "vulnerability-scan",
  "payload": {
    "target": "https://example.com",
    "scan_type": "full",
    "options": {
      "check_ssl": true,
      "check_headers": true
    }
  },
  "metadata": {
    "correlation_id": "scan-12345",
    "priority": "high",
    "ttl": 300
  }
}
EOF
)

RESPONSE=$(curl -s "${BASE_URL}/messaging/send" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "${MESSAGE}")

echo "$RESPONSE" | jq '{message_id: .message_id, status: .status, timestamp: .timestamp}'

MESSAGE_ID=$(echo "$RESPONSE" | jq -r '.message_id')

echo ""

# 2. Check message status
echo "2️⃣  Checking message status..."
sleep 1
curl -s "${BASE_URL}/messaging/messages/${MESSAGE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json" \
  | jq '{message_id: .message_id, status: .status, delivery_attempts: .delivery_attempts}'

echo ""

# 3. Broadcast a message
echo "3️⃣  Broadcasting message to security agents..."
BROADCAST=$(cat <<'EOF'
{
  "message": {
    "from": {
      "publisher": "myorg",
      "name": "my-agent"
    },
    "capability": "security-alert",
    "payload": {
      "alert_type": "vulnerability_detected",
      "severity": "high",
      "details": {
        "cve": "CVE-2024-1234",
        "affected_systems": ["web-server-1", "web-server-2"]
      }
    }
  },
  "filters": {
    "domain": "security",
    "capability": "incident-response"
  }
}
EOF
)

curl -s "${BASE_URL}/messaging/broadcast" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "${BROADCAST}" \
  | jq '{broadcast_id: .broadcast_id, recipients_count: .recipients_count, status: .status}'

echo ""

# 4. Register a webhook
echo "4️⃣  Registering webhook..."
WEBHOOK=$(cat <<'EOF'
{
  "url": "https://example.com/webhooks/ossa",
  "events": ["agent.deployed", "agent.error", "message.received"],
  "filters": {
    "publisher": "blueflyio"
  },
  "headers": {
    "X-Webhook-Secret": "your-secret-key"
  },
  "retry_config": {
    "max_attempts": 3,
    "backoff_strategy": "exponential"
  }
}
EOF
)

WEBHOOK_RESPONSE=$(curl -s "${BASE_URL}/messaging/webhooks" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "${WEBHOOK}")

echo "$WEBHOOK_RESPONSE" | jq '{id: .id, url: .url, events: .events, active: .active}'

WEBHOOK_ID=$(echo "$WEBHOOK_RESPONSE" | jq -r '.id')

echo ""

# 5. List webhooks
echo "5️⃣  Listing webhooks..."
curl -s "${BASE_URL}/messaging/webhooks" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json" \
  | jq '.webhooks[] | {id: .id, url: .url, active: .active}'

echo ""

# 6. Subscribe to events
echo "6️⃣  Subscribing to agent events..."
SUBSCRIPTION=$(cat <<'EOF'
{
  "agent": {
    "publisher": "blueflyio",
    "name": "security-scanner"
  },
  "events": ["scan.completed", "scan.failed"],
  "delivery_mode": "polling"
}
EOF
)

curl -s "${BASE_URL}/messaging/subscriptions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "${SUBSCRIPTION}" \
  | jq '{subscription_id: .subscription_id, status: .status, created_at: .created_at}'

echo ""
echo "✅ A2A messaging examples completed!"
