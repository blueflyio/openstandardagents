#!/bin/bash
# Create GitLab pipeline schedules via API
# Uses existing service accounts

set -e

GITLAB_URL="${CI_SERVER_URL:-https://gitlab.com}"
PROJECT_ID="${CI_PROJECT_ID}"
TOKEN="${SERVICE_ACCOUNT_RELEASE_COORDINATOR_TOKEN:-${GITLAB_TOKEN}}"

if [ -z "$TOKEN" ] || [ -z "$PROJECT_ID" ]; then
  echo "ERROR: GITLAB_TOKEN and CI_PROJECT_ID required"
  exit 1
fi

echo "Creating pipeline schedules..."
echo ""

# Daily Issue Scan
curl -X POST \
  "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/pipeline_schedules" \
  -H "PRIVATE-TOKEN: ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Autonomous issue triage and management\",
    \"ref\": \"main\",
    \"cron\": \"0 4 * * *\",
    \"cron_timezone\": \"UTC\",
    \"active\": true,
    \"variables\": [
      {\"key\": \"AUTONOMOUS_MODE\", \"value\": \"enabled\"}
    ]
  }" | jq '.'

# Daily Code Quality
curl -X POST \
  "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/pipeline_schedules" \
  -H "PRIVATE-TOKEN: ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Autonomous code quality scanning\",
    \"ref\": \"main\",
    \"cron\": \"0 2 * * *\",
    \"cron_timezone\": \"UTC\",
    \"active\": true,
    \"variables\": [
      {\"key\": \"AUTONOMOUS_MODE\", \"value\": \"enabled\"}
    ]
  }" | jq '.'

# Hourly MR Review
curl -X POST \
  "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/pipeline_schedules" \
  -H "PRIVATE-TOKEN: ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Autonomous MR review and management\",
    \"ref\": \"main\",
    \"cron\": \"0 * * * *\",
    \"cron_timezone\": \"UTC\",
    \"active\": true,
    \"variables\": [
      {\"key\": \"AUTONOMOUS_MODE\", \"value\": \"enabled\"}
    ]
  }" | jq '.'

# Weekly Ecosystem Analysis
curl -X POST \
  "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/pipeline_schedules" \
  -H "PRIVATE-TOKEN: ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Weekly ecosystem analysis and improvements\",
    \"ref\": \"main\",
    \"cron\": \"0 1 * * 1\",
    \"cron_timezone\": \"UTC\",
    \"active\": true,
    \"variables\": [
      {\"key\": \"AUTONOMOUS_MODE\", \"value\": \"enabled\"}
    ]
  }" | jq '.'

echo ""
echo "Pipeline schedules created successfully"
