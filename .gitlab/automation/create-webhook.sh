#!/bin/bash
# Create GitLab webhook via API
# Uses existing service accounts

set -e

GITLAB_URL="${CI_SERVER_URL:-https://gitlab.com}"
PROJECT_ID="${CI_PROJECT_ID}"
TOKEN="${SERVICE_ACCOUNT_RELEASE_COORDINATOR_TOKEN:-${GITLAB_TOKEN}}"
WEBHOOK_URL="${PLATFORM_AGENTS_API_URL:-https://api.blueflyagents.com}/api/webhooks/gitlab"
WEBHOOK_SECRET="${WEBHOOK_SECRET}"

if [ -z "$TOKEN" ] || [ -z "$PROJECT_ID" ] || [ -z "$WEBHOOK_SECRET" ]; then
  echo "ERROR: GITLAB_TOKEN, CI_PROJECT_ID, and WEBHOOK_SECRET required"
  exit 1
fi

echo "Creating GitLab webhook..."
echo ""

curl -X POST \
  "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/hooks" \
  -H "PRIVATE-TOKEN: ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"token\": \"${WEBHOOK_SECRET}\",
    \"enable_ssl_verification\": true,
    \"push_events\": false,
    \"issues_events\": true,
    \"confidential_issues_events\": true,
    \"merge_requests_events\": true,
    \"tag_push_events\": true,
    \"pipeline_events\": true,
    \"releases_events\": true
  }" | jq '.'

echo ""
echo "Webhook created successfully"
