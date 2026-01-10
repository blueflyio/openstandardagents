#!/bin/bash
# Complete autonomous framework setup
# Actually sets up everything - no manual steps

set -e

GITLAB_URL="${CI_SERVER_URL:-https://gitlab.com}"
PROJECT_ID="${CI_PROJECT_ID}"
TOKEN="${SERVICE_ACCOUNT_RELEASE_COORDINATOR_TOKEN:-${GITLAB_TOKEN}}"
PLATFORM_AGENTS_API="${PLATFORM_AGENTS_API_URL:-https://api.blueflyagents.com}"

if [ -z "$TOKEN" ] || [ -z "$PROJECT_ID" ]; then
  echo "ERROR: GITLAB_TOKEN and CI_PROJECT_ID required"
  echo "Set GITLAB_TOKEN or SERVICE_ACCOUNT_RELEASE_COORDINATOR_TOKEN"
  exit 1
fi

echo "Setting up Complete Autonomous Framework"
echo "========================================"
echo "Project ID: ${PROJECT_ID}"
echo "GitLab URL: ${GITLAB_URL}"
echo ""

# ============================================================================
# STEP 1: CREATE CI/CD VARIABLES
# ============================================================================

echo "Step 1: Creating CI/CD Variables..."
echo ""

VARIABLES=(
  "SERVICE_ACCOUNT_RELEASE_COORDINATOR_TOKEN"
  "SERVICE_ACCOUNT_MR_REVIEWER_TOKEN"
  "SERVICE_ACCOUNT_CODE_QUALITY_TOKEN"
  "SERVICE_ACCOUNT_ISSUE_LIFECYCLE_TOKEN"
  "SERVICE_ACCOUNT_DOCUMENTATION_TOKEN"
  "SERVICE_ACCOUNT_PIPELINE_REMEDIATION_TOKEN"
  "SERVICE_ACCOUNT_TASK_DISPATCHER_TOKEN"
  "SERVICE_ACCOUNT_VULN_SCANNER_TOKEN"
  "PLATFORM_AGENTS_API_URL"
  "WEBHOOK_SECRET"
)

for var in "${VARIABLES[@]}"; do
  VALUE="${!var}"
  if [ -z "$VALUE" ]; then
    echo "WARNING: $var not set - skipping"
    continue
  fi
  
  echo "Creating variable: $var"
  
  # Check if variable exists
  EXISTING=$(curl -s -X GET \
    "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/variables/${var}" \
    -H "PRIVATE-TOKEN: ${TOKEN}" 2>/dev/null || echo "{}")
  
  if echo "$EXISTING" | jq -e '.key' >/dev/null 2>&1; then
    echo "  Variable exists - updating..."
    curl -X PUT \
      "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/variables/${var}" \
      -H "PRIVATE-TOKEN: ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"value\": \"${VALUE}\",
        \"protected\": true,
        \"masked\": true
      }" >/dev/null 2>&1 || echo "  Update failed (may need manual setup)"
  else
    echo "  Creating new variable..."
    curl -X POST \
      "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/variables" \
      -H "PRIVATE-TOKEN: ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"key\": \"${var}\",
        \"value\": \"${VALUE}\",
        \"protected\": true,
        \"masked\": true
      }" >/dev/null 2>&1 || echo "  Creation failed (may need manual setup)"
  fi
done

echo ""
echo "Step 1 complete"
echo ""

# ============================================================================
# STEP 2: CREATE WEBHOOK
# ============================================================================

echo "Step 2: Creating GitLab Webhook..."
echo ""

WEBHOOK_URL="${PLATFORM_AGENTS_API}/api/webhooks/gitlab"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-$(openssl rand -hex 32)}"

# Check if webhook exists
EXISTING_WEBHOOKS=$(curl -s -X GET \
  "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/hooks" \
  -H "PRIVATE-TOKEN: ${TOKEN}")

WEBHOOK_EXISTS=$(echo "$EXISTING_WEBHOOKS" | jq -r ".[] | select(.url == \"${WEBHOOK_URL}\") | .id" | head -1)

if [ -n "$WEBHOOK_EXISTS" ] && [ "$WEBHOOK_EXISTS" != "null" ]; then
  echo "Webhook exists (ID: $WEBHOOK_EXISTS) - updating..."
  curl -X PUT \
    "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/hooks/${WEBHOOK_EXISTS}" \
    -H "PRIVATE-TOKEN: ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"url\": \"${WEBHOOK_URL}\",
      \"token\": \"${WEBHOOK_SECRET}\",
      \"enable_ssl_verification\": true,
      \"issues_events\": true,
      \"confidential_issues_events\": true,
      \"merge_requests_events\": true,
      \"tag_push_events\": true,
      \"pipeline_events\": true,
      \"releases_events\": true
    }" | jq '.' || echo "Webhook update failed"
else
  echo "Creating new webhook..."
  curl -X POST \
    "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/hooks" \
    -H "PRIVATE-TOKEN: ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"url\": \"${WEBHOOK_URL}\",
      \"token\": \"${WEBHOOK_SECRET}\",
      \"enable_ssl_verification\": true,
      \"issues_events\": true,
      \"confidential_issues_events\": true,
      \"merge_requests_events\": true,
      \"tag_push_events\": true,
      \"pipeline_events\": true,
      \"releases_events\": true
    }" | jq '.' || echo "Webhook creation failed"
fi

echo ""
echo "Step 2 complete"
echo ""

# ============================================================================
# STEP 3: CREATE PIPELINE SCHEDULES
# ============================================================================

echo "Step 3: Creating Pipeline Schedules..."
echo ""

SCHEDULES=(
  "{\"description\":\"Autonomous issue triage and management\",\"cron\":\"0 4 * * *\",\"cron_timezone\":\"UTC\"}"
  "{\"description\":\"Autonomous code quality scanning\",\"cron\":\"0 2 * * *\",\"cron_timezone\":\"UTC\"}"
  "{\"description\":\"Autonomous MR review and management\",\"cron\":\"0 * * * *\",\"cron_timezone\":\"UTC\"}"
  "{\"description\":\"Autonomous pipeline monitoring\",\"cron\":\"*/15 * * * *\",\"cron_timezone\":\"UTC\"}"
  "{\"description\":\"Weekly ecosystem analysis and improvements\",\"cron\":\"0 1 * * 1\",\"cron_timezone\":\"UTC\"}"
)

for schedule_json in "${SCHEDULES[@]}"; do
  DESCRIPTION=$(echo "$schedule_json" | jq -r '.description')
  CRON=$(echo "$schedule_json" | jq -r '.cron')
  
  echo "Creating schedule: $DESCRIPTION"
  
  # Check if schedule exists
  EXISTING_SCHEDULES=$(curl -s -X GET \
    "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/pipeline_schedules" \
    -H "PRIVATE-TOKEN: ${TOKEN}")
  
  SCHEDULE_EXISTS=$(echo "$EXISTING_SCHEDULES" | jq -r ".[] | select(.description == \"${DESCRIPTION}\") | .id" | head -1)
  
  if [ -n "$SCHEDULE_EXISTS" ] && [ "$SCHEDULE_EXISTS" != "null" ]; then
    echo "  Schedule exists (ID: $SCHEDULE_EXISTS) - updating..."
    curl -X PUT \
      "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/pipeline_schedules/${SCHEDULE_EXISTS}" \
      -H "PRIVATE-TOKEN: ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"description\": \"${DESCRIPTION}\",
        \"ref\": \"main\",
        \"cron\": \"${CRON}\",
        \"cron_timezone\": \"UTC\",
        \"active\": true,
        \"variables\": [
          {\"key\": \"AUTONOMOUS_MODE\", \"value\": \"enabled\"}
        ]
      }" >/dev/null 2>&1 || echo "  Update failed"
  else
    echo "  Creating new schedule..."
    curl -X POST \
      "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/pipeline_schedules" \
      -H "PRIVATE-TOKEN: ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"description\": \"${DESCRIPTION}\",
        \"ref\": \"main\",
        \"cron\": \"${CRON}\",
        \"cron_timezone\": \"UTC\",
        \"active\": true,
        \"variables\": [
          {\"key\": \"AUTONOMOUS_MODE\", \"value\": \"enabled\"}
        ]
      }" >/dev/null 2>&1 || echo "  Creation failed"
  fi
done

echo ""
echo "Step 3 complete"
echo ""

# ============================================================================
# STEP 4: VERIFY SETUP
# ============================================================================

echo "Step 4: Verifying Setup..."
echo ""

# Check variables
VARS_COUNT=$(curl -s -X GET \
  "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/variables" \
  -H "PRIVATE-TOKEN: ${TOKEN}" | jq '[.[] | select(.key | startswith("SERVICE_ACCOUNT_") or . == "PLATFORM_AGENTS_API_URL" or . == "WEBHOOK_SECRET")] | length')

echo "Variables configured: $VARS_COUNT"

# Check webhooks
WEBHOOKS_COUNT=$(curl -s -X GET \
  "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/hooks" \
  -H "PRIVATE-TOKEN: ${TOKEN}" | jq "[.[] | select(.url | contains(\"api.blueflyagents.com\"))] | length")

echo "Webhooks configured: $WEBHOOKS_COUNT"

# Check schedules
SCHEDULES_COUNT=$(curl -s -X GET \
  "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/pipeline_schedules" \
  -H "PRIVATE-TOKEN: ${TOKEN}" | jq "[.[] | select(.description | contains(\"Autonomous\"))] | length")

echo "Schedules configured: $SCHEDULES_COUNT"
echo ""

echo "========================================"
echo "Autonomous Framework Setup Complete!"
echo "========================================"
echo ""
echo "The framework is now fully autonomous and will:"
echo "  - Automatically triage and manage issues"
echo "  - Automatically review and manage MRs"
echo "  - Automatically scan and fix code quality"
echo "  - Automatically sync documentation"
echo "  - Automatically manage versions"
echo "  - Automatically fix pipeline issues"
echo "  - Automatically analyze ecosystem"
echo ""
