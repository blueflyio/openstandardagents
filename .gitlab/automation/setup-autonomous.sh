#!/bin/bash
# Setup script for autonomous framework
# Run this to configure all autonomous systems

set -e

echo "Setting up Autonomous Framework"
echo "=============================="
echo ""

# Check required variables
REQUIRED_VARS=(
  "SERVICE_ACCOUNT_RELEASE_COORDINATOR_TOKEN"
  "SERVICE_ACCOUNT_MR_REVIEWER_TOKEN"
  "SERVICE_ACCOUNT_CODE_QUALITY_TOKEN"
  "SERVICE_ACCOUNT_ISSUE_LIFECYCLE_TOKEN"
  "SERVICE_ACCOUNT_DOCUMENTATION_TOKEN"
  "SERVICE_ACCOUNT_PIPELINE_REMEDIATION_TOKEN"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "ERROR: Missing required CI/CD variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "Set these in GitLab: Settings → CI/CD → Variables"
  exit 1
fi

echo "All required variables are set"
echo ""

# Create pipeline schedules
echo "Creating pipeline schedules..."
echo ""
echo "To create schedules in GitLab UI:"
echo "1. Go to CI/CD → Schedules"
echo "2. Create these schedules:"
echo ""
echo "   Name: Daily Issue Scan"
echo "   Description: Autonomous issue triage and management"
echo "   Interval: 0 4 * * * (Daily at 4 AM UTC)"
echo "   Target branch: main"
echo "   Variables: AUTONOMOUS_MODE=enabled"
echo ""
echo "   Name: Daily Code Quality"
echo "   Description: Autonomous code quality scanning"
echo "   Interval: 0 2 * * * (Daily at 2 AM UTC)"
echo "   Target branch: main"
echo "   Variables: AUTONOMOUS_MODE=enabled"
echo ""
echo "   Name: Hourly MR Review"
echo "   Description: Autonomous MR review and management"
echo "   Interval: 0 * * * * (Every hour)"
echo "   Target branch: main"
echo "   Variables: AUTONOMOUS_MODE=enabled"
echo ""
echo "   Name: Weekly Ecosystem Analysis"
echo "   Description: Weekly ecosystem analysis and improvements"
echo "   Interval: 0 1 * * 1 (Monday at 1 AM UTC)"
echo "   Target branch: main"
echo "   Variables: AUTONOMOUS_MODE=enabled"
echo ""

# Webhook configuration
echo "Configuring webhooks..."
echo ""
echo "To configure webhooks in GitLab UI:"
echo "1. Go to Settings → Webhooks"
echo "2. Add webhook with:"
echo "   URL: https://api.blueflyagents.com/api/webhooks/gitlab"
echo "   Secret token: (set WEBHOOK_SECRET variable)"
echo "   Trigger on:"
echo "     - Issues events"
echo "     - Merge request events"
echo "     - Milestone events"
echo "     - Pipeline events"
echo "     - Release events"
echo ""

echo "Autonomous framework setup complete!"
echo ""
echo "The framework will now:"
echo "  - Automatically triage and manage issues"
echo "  - Automatically review and improve code"
echo "  - Automatically sync documentation"
echo "  - Automatically manage versions and releases"
echo "  - Automatically fix pipeline issues"
echo "  - Automatically suggest improvements"
echo ""
