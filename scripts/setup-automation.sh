#!/bin/bash
# =============================================================================
# Setup OSSA Website Automation
# =============================================================================

set -e

PROJECT_ID="blueflyio%2Fopenstandardagents.org"
GITLAB_API="https://gitlab.com/api/v4"

# Check for GitLab token
if [ -z "$GITLAB_TOKEN" ]; then
  echo "❌ GITLAB_TOKEN not set"
  echo "   Export your GitLab personal access token:"
  echo "   export GITLAB_TOKEN=glpat-xxxxxxxxxxxx"
  exit 1
fi

echo "🚀 Setting up OSSA website automation..."

# 1. Create scheduled pipeline (every 6 hours)
echo "📅 Creating scheduled pipeline..."
SCHEDULE_RESPONSE=$(curl -s --request POST \
  --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "${GITLAB_API}/projects/${PROJECT_ID}/pipeline_schedules" \
  --data "description=Auto-sync OSSA spec every 6 hours" \
  --data "ref=development" \
  --data "cron=0 */6 * * *" \
  --data "cron_timezone=UTC" \
  --data "active=true")

SCHEDULE_ID=$(echo "$SCHEDULE_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$SCHEDULE_ID" ]; then
  echo "✅ Scheduled pipeline created (ID: $SCHEDULE_ID)"
else
  echo "⚠️  Schedule may already exist or creation failed"
  echo "   Response: $SCHEDULE_RESPONSE"
fi

# 2. Create pipeline trigger token
echo "🔑 Creating pipeline trigger token..."
TRIGGER_RESPONSE=$(curl -s --request POST \
  --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "${GITLAB_API}/projects/${PROJECT_ID}/triggers" \
  --data "description=OSSA package release webhook")

TRIGGER_TOKEN=$(echo "$TRIGGER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TRIGGER_TOKEN" ]; then
  echo "✅ Trigger token created"
  echo ""
  echo "📋 Add this to OSSA package repo's CI/CD variables:"
  echo "   Variable: WEBSITE_TRIGGER_TOKEN"
  echo "   Value: $TRIGGER_TOKEN"
  echo "   Protected: Yes"
  echo ""
else
  echo "⚠️  Trigger may already exist or creation failed"
fi

# 3. Verify CI/CD configuration
echo "🔍 Verifying CI/CD configuration..."
if [ -f ".gitlab-ci.yml" ]; then
  if grep -q "stage: sync" .gitlab-ci.yml; then
    echo "✅ Sync stage configured"
  else
    echo "❌ Sync stage missing in .gitlab-ci.yml"
    exit 1
  fi
else
  echo "❌ .gitlab-ci.yml not found"
  exit 1
fi

# 4. Test sync job locally (dry run)
echo "🧪 Testing sync scripts..."
cd website
if npm run fetch-spec > /dev/null 2>&1; then
  echo "✅ fetch-spec works"
else
  echo "❌ fetch-spec failed"
  exit 1
fi

if npm run fetch-versions > /dev/null 2>&1; then
  echo "✅ fetch-versions works"
else
  echo "❌ fetch-versions failed"
  exit 1
fi

echo ""
echo "✅ Automation setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Commit and push .gitlab-ci.yml changes"
echo "   2. Add WEBSITE_TRIGGER_TOKEN to OSSA repo"
echo "   3. Monitor first scheduled run in 6 hours"
echo ""
echo "📖 Documentation: AUTOMATION.md"
