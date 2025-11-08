#!/bin/bash
# Create GitLab labels using GitLab API
# Usage: ./create-labels.sh [GITLAB_TOKEN] [PROJECT_ID]

set -e

GITLAB_TOKEN="${1:-${GITLAB_TOKEN}}"
PROJECT_ID="${2:-${CI_PROJECT_ID}}"
GITLAB_URL="${GITLAB_URL:-https://gitlab.bluefly.io}"

if [ -z "$GITLAB_TOKEN" ]; then
  echo "Error: GITLAB_TOKEN required"
  echo "Usage: $0 [GITLAB_TOKEN] [PROJECT_ID]"
  exit 1
fi

if [ -z "$PROJECT_ID" ]; then
  echo "Error: PROJECT_ID required"
  echo "Usage: $0 [GITLAB_TOKEN] [PROJECT_ID]"
  exit 1
fi

API_URL="${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/labels"

# Component labels (Blue shades)
declare -A COMPONENT_LABELS=(
  ["component:spec"]="#428BCA"
  ["component:cli"]="#5CB85C"
  ["component:examples"]="#5BC0DE"
  ["component:docs"]="#337AB7"
  ["component:validation"]="#31B0D5"
  ["component:migration"]="#46B8DA"
  ["component:types"]="#5F9EA0"
  ["component:build"]="#2E86AB"
)

# Type labels (Green shades)
declare -A TYPE_LABELS=(
  ["type:bug"]="#D9534F"
  ["type:feature"]="#5CB85C"
  ["type:enhancement"]="#5BC0DE"
  ["type:documentation"]="#337AB7"
  ["type:question"]="#F0AD4E"
  ["type:discussion"]="#9E9E9E"
)

# Priority labels (Red/Orange/Yellow)
declare -A PRIORITY_LABELS=(
  ["priority:p0"]="#D9534F"
  ["priority:p1"]="#F0AD4E"
  ["priority:p2"]="#FFC107"
  ["priority:p3"]="#5BC0DE"
)

# Status labels (Gray/Purple)
declare -A STATUS_LABELS=(
  ["status:needs-triage"]="#999999"
  ["status:needs-info"]="#9E9E9E"
  ["status:in-progress"]="#9C27B0"
  ["status:blocked"]="#D32F2F"
  ["status:ready-for-review"]="#4CAF50"
)

# Audience labels (Purple/Teal)
declare -A AUDIENCE_LABELS=(
  ["audience:students"]="#9C27B0"
  ["audience:developers"]="#009688"
  ["audience:architects"]="#673AB7"
  ["audience:enterprises"]="#607D8B"
)

create_label() {
  local name=$1
  local color=$2
  local description=$3

  echo "Creating label: $name"
  
  response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}" \
    --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
    --header "Content-Type: application/json" \
    --data "{
      \"name\": \"${name}\",
      \"color\": \"${color}\",
      \"description\": \"${description}\"
    }")
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -eq 201 ]; then
    echo "  ✓ Created: $name"
  elif [ "$http_code" -eq 400 ] && echo "$body" | grep -q "already been taken"; then
    echo "  ⊙ Already exists: $name"
  else
    echo "  ✗ Failed: $name (HTTP $http_code)"
    echo "  Response: $body"
  fi
}

echo "Creating component labels..."
for label in "${!COMPONENT_LABELS[@]}"; do
  description="Component: ${label#component:}"
  create_label "$label" "${COMPONENT_LABELS[$label]}" "$description"
done

echo ""
echo "Creating type labels..."
for label in "${!TYPE_LABELS[@]}"; do
  description="Issue type: ${label#type:}"
  create_label "$label" "${TYPE_LABELS[$label]}" "$description"
done

echo ""
echo "Creating priority labels..."
for label in "${!PRIORITY_LABELS[@]}"; do
  description="Priority: ${label#priority:}"
  create_label "$label" "${PRIORITY_LABELS[$label]}" "$description"
done

echo ""
echo "Creating status labels..."
for label in "${!STATUS_LABELS[@]}"; do
  description="Status: ${label#status:}"
  create_label "$label" "${STATUS_LABELS[$label]}" "$description"
done

echo ""
echo "Creating audience labels..."
for label in "${!AUDIENCE_LABELS[@]}"; do
  description="Target audience: ${label#audience:}"
  create_label "$label" "${AUDIENCE_LABELS[$label]}" "$description"
done

echo ""
echo "Label creation complete!"

