#!/usr/bin/env bash
set -euo pipefail

# Deploy a swarm of OSSA agents and enable tracing.
#
# Usage:
#   ./ossa_deploy_swarm.sh [COUNT] [MODEL] [BASE_NAME] [TOOLS]
#
# Defaults:
#   COUNT=50
#   MODEL=gpt-4o
#   BASE_NAME=openai-swarm
#   TOOLS=code_interpreter,file_search
#
# Env vars respected:
#   OPENAI_API_KEY           - Required for OpenAI-backed agents
#   OSSA_AGENT_MODE          - Defaults to 'openai'
#   OSSA_PYTHON_BRIDGE_PORT  - Defaults to 8001
#   TRACELOOP_API_KEY        - Optional (Traceloop/OpenLLMetry)
#   LANGFUSE_PUBLIC_KEY      - Optional (Langfuse)
#   LANGFUSE_SECRET_KEY      - Optional (Langfuse)
#   LANGFUSE_BASE_URL        - Optional (Langfuse, default cloud)
#   OTEL_EXPORTER_OTLP_ENDPOINT - Optional OTLP endpoint
#   OTEL_SERVICE_NAME        - Defaults to 'ossa-agent'

COUNT=${1:-50}
MODEL=${2:-gpt-4o}
BASE=${3:-openai-swarm}
TOOLS=${4:-code_interpreter,file_search}

OSSA_BIN=${OSSA_BIN:-ossa}
MODE=${OSSA_AGENT_MODE:-openai}
PY_PORT=${OSSA_PYTHON_BRIDGE_PORT:-8001}
OTEL_SERVICE_NAME=${OTEL_SERVICE_NAME:-ossa-agent}

if [[ -z "${OPENAI_API_KEY:-}" && "$MODE" == "openai" ]]; then
  echo "ERROR: OPENAI_API_KEY not set (required for mode 'openai')" >&2
  exit 1
fi

STAMP=$(date +%Y%m%d-%H%M%S)
OUT_DIR="OSSA/data/agent-spawns/${STAMP}"
mkdir -p "$OUT_DIR"

echo "==> Spawning $COUNT agents (model=$MODEL, tools=$TOOLS, mode=$MODE)"
echo "==> Logs: $OUT_DIR"

NAMES=()
for i in $(seq 1 "$COUNT"); do
  NAME="${BASE}-${i}"
  NAMES+=("$NAME")
done

# Concurrency control
MAX_JOBS=${MAX_JOBS:-10}
running=0

spawn_one() {
  local name="$1"
  local logfile="$OUT_DIR/${name}.log"
  echo "Spawning $name ..."
  # shellcheck disable=SC2086
  ${OSSA_BIN} agent spawn "$name" \
    --model ${MODEL} \
    --tools ${TOOLS} \
    --instructions "You are a resilient autonomous agent in an OSSA swarm. Work cooperatively and log rich telemetry." \
    2>&1 | tee "$logfile"
}

for name in "${NAMES[@]}"; do
  spawn_one "$name" &
  running=$((running+1))
  if [[ $running -ge $MAX_JOBS ]]; then
    wait -n || true
    running=$((running-1))
  fi
done
wait || true

LIST_FILE="$OUT_DIR/agents.txt"
printf "%s\n" "${NAMES[@]}" > "$LIST_FILE"
echo "==> Spawn complete. Names written to $LIST_FILE"

echo "==> Example orchestration command:"
CSV=$(IFS=, ; echo "${NAMES[*]}")
echo "${OSSA_BIN} orchestrate create swarm-${STAMP} --agents ${CSV} --mode parallel --merge-strategy consensus"

echo "==> Tail logs for one agent:"
echo "${OSSA_BIN} logs agent --name ${NAMES[0]} --tail 200"

echo "==> Telemetry env used:"
echo "MODE=$MODE PY_BRIDGE_PORT=$PY_PORT OTEL_SERVICE_NAME=$OTEL_SERVICE_NAME"
echo "TRACELOOP_API_KEY=${TRACELOOP_API_KEY:+set} LANGFUSE_PUBLIC_KEY=${LANGFUSE_PUBLIC_KEY:+set} LANGFUSE_SECRET_KEY=${LANGFUSE_SECRET_KEY:+set}"

echo "Done."
