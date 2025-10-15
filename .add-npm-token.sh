#!/bin/bash

# Add NPM_TOKEN to GitLab CI/CD Variables
# Usage: ./add-npm-token.sh YOUR_GITLAB_TOKEN

GITLAB_TOKEN=$1
PROJECT_ID="244"  # openapi-ai-agents-standard project ID
NPM_TOKEN="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"

if [ -z "$GITLAB_TOKEN" ]; then
    echo "❌ Error: GitLab personal access token required"
    echo ""
    echo "Usage: ./add-npm-token.sh YOUR_GITLAB_TOKEN"
    echo ""
    echo "Get your token from: https://gitlab.bluefly.io/-/profile/personal_access_tokens"
    echo "Required scopes: api"
    exit 1
fi

echo "🔐 Adding NPM_TOKEN to GitLab CI/CD Variables..."

curl --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --form "key=NPM_TOKEN" \
  --form "value=$NPM_TOKEN" \
  --form "protected=true" \
  --form "masked=true" \
  "https://gitlab.bluefly.io/api/v4/projects/$PROJECT_ID/variables"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ NPM_TOKEN added successfully!"
    echo ""
    echo "🚀 Now trigger the release:"
    echo "   1. Go to: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/pipelines"
    echo "   2. Watch the main branch pipeline complete"
    echo "   3. Release will auto-publish to npm!"
else
    echo ""
    echo "❌ Failed to add token. Add it manually:"
    echo "   https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/settings/ci_cd"
fi

