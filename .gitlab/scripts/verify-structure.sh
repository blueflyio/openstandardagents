#!/bin/bash
# Verify all wiki content and structure files exist
# Usage: ./verify-structure.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
GITLAB_DIR="$PROJECT_ROOT/.gitlab"

echo "Verifying OSSA GitLab structure..."
echo ""

# Check wiki content
echo "Checking wiki content..."
WIKI_FILES=(
  "wiki-content/00-HOME.md"
  "wiki-content/Getting-Started/5-Minute-Overview.md"
  "wiki-content/Getting-Started/Installation.md"
  "wiki-content/Getting-Started/Hello-World.md"
  "wiki-content/Getting-Started/First-Agent.md"
  "wiki-content/For-Audiences/Students-Researchers.md"
  "wiki-content/For-Audiences/Developers.md"
  "wiki-content/For-Audiences/Architects.md"
  "wiki-content/For-Audiences/Enterprises.md"
  "wiki-content/Examples/Migration-Guides.md"
)

MISSING=0
for file in "${WIKI_FILES[@]}"; do
  if [ -f "$GITLAB_DIR/$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ MISSING: $file"
    MISSING=$((MISSING + 1))
  fi
done

# Check issue templates
echo ""
echo "Checking issue templates..."
TEMPLATE_FILES=(
  "issue_templates/Bug-Report.md"
  "issue_templates/Feature-Request.md"
  "issue_templates/Documentation-Improvement.md"
  "issue_templates/Migration-Guide-Request.md"
  "issue_templates/Example-Request.md"
)

for file in "${TEMPLATE_FILES[@]}"; do
  if [ -f "$GITLAB_DIR/$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ MISSING: $file"
    MISSING=$((MISSING + 1))
  fi
done

# Check milestone docs
echo ""
echo "Checking milestone documentation..."
MILESTONE_FILES=(
  "milestones/v0.2.3-Documentation-Examples.md"
  "milestones/v0.3.0-Gamma.md"
  "milestones/v1.0.0-Genesis.md"
)

for file in "${MILESTONE_FILES[@]}"; do
  if [ -f "$GITLAB_DIR/$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ MISSING: $file"
    MISSING=$((MISSING + 1))
  fi
done

# Check documentation files
echo ""
echo "Checking documentation files..."
DOC_FILES=(
  "WIKI-MIGRATION-GUIDE.md"
  "CROSS-REFERENCES.md"
  "AUDIT-SUMMARY.md"
  "labels-structure.md"
  "IMPLEMENTATION-COMPLETE.md"
)

for file in "${DOC_FILES[@]}"; do
  if [ -f "$GITLAB_DIR/$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ MISSING: $file"
    MISSING=$((MISSING + 1))
  fi
done

# Check scripts
echo ""
echo "Checking scripts..."
SCRIPT_FILES=(
  "scripts/create-labels.sh"
  "scripts/verify-structure.sh"
)

for file in "${SCRIPT_FILES[@]}"; do
  if [ -f "$GITLAB_DIR/$file" ]; then
    echo "  ✓ $file"
    chmod +x "$GITLAB_DIR/$file" 2>/dev/null || true
  else
    echo "  ✗ MISSING: $file"
    MISSING=$((MISSING + 1))
  fi
done

# Summary
echo ""
if [ $MISSING -eq 0 ]; then
  echo "✓ All files verified successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Review .gitlab/IMPLEMENTATION-COMPLETE.md"
  echo "2. Follow .gitlab/WIKI-MIGRATION-GUIDE.md for wiki migration"
  echo "3. Run .gitlab/scripts/create-labels.sh to create GitLab labels"
  echo "4. Create/update milestones in GitLab"
  echo "5. Add issue templates in GitLab settings"
  exit 0
else
  echo "✗ Found $MISSING missing file(s)"
  exit 1
fi

