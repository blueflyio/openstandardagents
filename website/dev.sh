#!/bin/bash
# OSSA Website - Dev Server with OrbStack
# Auto-detects worktree and sets unique domain
#
# Usage:
#   cd website && ./dev.sh           # Start dev server
#   cd website && ./dev.sh down      # Stop dev server
#   cd website && ./dev.sh logs      # View logs

set -e

# Detect if we're in a worktree or main repo
# Structure: /worktrees/<worktree-name>/website or /openstandardagents/website
REPO_DIR=$(dirname "$PWD")
REPO_NAME=$(basename "$REPO_DIR")
PARENT_OF_REPO=$(basename "$(dirname "$REPO_DIR")")

# Determine domain based on location
if [ "$PARENT_OF_REPO" = "worktrees" ]; then
  # In a worktree: use worktree name
  DOMAIN="$REPO_NAME"
elif [ "$REPO_NAME" = "openstandardagents.org" ]; then
  # In main repo: ossa.orb.local
  DOMAIN="ossa"
else
  DOMAIN="$REPO_NAME"
fi

export OSSA_DOMAIN="$DOMAIN"

echo "🌐 Domain: https://${DOMAIN}.orb.local"
echo ""

case "${1:-up}" in
  up|start)
    docker compose -f docker-compose.dev.yml up -d
    echo ""
    echo "✅ Dev server starting at https://${DOMAIN}.orb.local"
    echo "   Run './dev.sh logs' to view output"
    ;;
  down|stop)
    docker compose -f docker-compose.dev.yml down
    ;;
  logs)
    docker compose -f docker-compose.dev.yml logs -f
    ;;
  restart)
    docker compose -f docker-compose.dev.yml restart
    ;;
  *)
    echo "Usage: ./dev.sh [up|down|logs|restart]"
    ;;
esac
