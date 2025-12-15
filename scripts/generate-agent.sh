#!/usr/bin/env bash
set -euo pipefail

AGENT_NAME="${1:-}"
AGENT_TYPE="${2:-worker}"

if [ -z "$AGENT_NAME" ]; then
  echo "Usage: $0 <agent-name> [type]"
  exit 1
fi

OUTPUT_DIR="examples/generated"
mkdir -p "$OUTPUT_DIR"
AGENT_FILE="$OUTPUT_DIR/${AGENT_NAME}.ossa.yaml"

echo "🚀 Generating agent: $AGENT_NAME"

cat > "$AGENT_FILE" << 'AGENT_EOF'
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: AGENT_NAME_PLACEHOLDER
  version: 1.0.0
  description: Auto-generated agent
spec:
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet}
    profile: ${LLM_PROFILE:-balanced}
    temperature: ${LLM_TEMPERATURE:-0.1}
    maxTokens: ${LLM_MAX_TOKENS:-16000}
    fallback_models:
      - provider: ${LLM_FALLBACK_PROVIDER_1:-openai}
        model: ${LLM_FALLBACK_MODEL_1:-gpt-4o}
  runtime:
    type: ${AGENT_RUNTIME:-unified}
    supports: [google-a2a, gitlab-duo, ossa-mesh, mcp]
  role: "You are an agent."
AGENT_EOF

sed -i.tmp "s/AGENT_NAME_PLACEHOLDER/$AGENT_NAME/g" "$AGENT_FILE"
rm -f "$AGENT_FILE.tmp"

echo "✅ Generated: $AGENT_FILE"
