#!/usr/bin/env bash
# Auto-migrate all agents to unified LLM schema
# Replaces hardcoded models with runtime-configurable env vars

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Migrating agents to unified LLM schema..."

# Find all agent YAML files
find "$REPO_ROOT" -type f \( -name "*.ossa.yaml" -o -name "agent.yaml" -o -name "agent.yml" \) | while read -r file; do
  echo "  Processing: $file"
  
  # Backup original
  cp "$file" "$file.backup"
  
  # Replace hardcoded provider
  sed -i.tmp 's/provider: anthropic/provider: ${LLM_PROVIDER:-anthropic}/g' "$file"
  sed -i.tmp 's/provider: openai/provider: ${LLM_PROVIDER:-openai}/g' "$file"
  sed -i.tmp 's/provider: google/provider: ${LLM_PROVIDER:-google}/g' "$file"
  
  # Replace hardcoded models
  sed -i.tmp 's/model: claude-sonnet-4.*/model: ${LLM_MODEL:-claude-sonnet}/g' "$file"
  sed -i.tmp 's/model: gpt-4o.*/model: ${LLM_MODEL:-gpt-4o}/g' "$file"
  sed -i.tmp 's/model: gemini.*/model: ${LLM_MODEL:-gemini-2.0-flash}/g' "$file"
  
  # Add profile if missing
  if ! grep -q "profile:" "$file"; then
    sed -i.tmp '/model: \${LLM_MODEL/a\    profile: ${LLM_PROFILE:-balanced}' "$file"
  fi
  
  # Add execution_profile if missing
  if ! grep -q "execution_profile:" "$file"; then
    cat >> "$file" << 'PROFILE'

  execution_profile:
    default: ${LLM_PROFILE:-balanced}
    profiles:
      fast:
        maxTokens: 4000
        temperature: 0.0
      balanced:
        maxTokens: 16000
        temperature: 0.1
      deep:
        maxTokens: 32000
        temperature: 0.2
      safe:
        temperature: 0.0
        validation_required: true
PROFILE
  fi
  
  # Add runtime if missing
  if ! grep -q "runtime:" "$file"; then
    cat >> "$file" << 'RUNTIME'

  runtime:
    type: ${AGENT_RUNTIME:-unified}
    supports:
      - google-a2a
      - gitlab-duo
      - ossa-mesh
      - mcp
      - local-execution
RUNTIME
  fi
  
  # Clean up temp files
  rm -f "$file.tmp"
  
  echo "    ✅ Migrated"
done

echo "✅ Migration complete!"
echo "📝 Backups saved with .backup extension"
echo "🧪 Run: ossa validate examples/ to verify"
