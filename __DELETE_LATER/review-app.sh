#!/bin/bash
# OSSA Review App Manager
# Builds and deploys MR branches to OrbStack for local review
#
# Usage:
#   ./scripts/review-app.sh start [branch]  - Start review app (current or specified branch)
#   ./scripts/review-app.sh stop            - Stop review app
#   ./scripts/review-app.sh rebuild         - Rebuild and restart
#   ./scripts/review-app.sh logs            - View logs
#   ./scripts/review-app.sh status          - Check status

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONTAINER_NAME="ossa-review"
REVIEW_URL="http://ossa-review.orb.local"

cd "$PROJECT_DIR"

case "${1:-start}" in
  start)
    BRANCH="${2:-$(git branch --show-current)}"
    echo "🚀 Starting OSSA review app for branch: $BRANCH"

    # Checkout branch if specified and different
    CURRENT=$(git branch --show-current)
    if [[ "$BRANCH" != "$CURRENT" ]]; then
      echo "📦 Checking out branch: $BRANCH"
      git fetch origin "$BRANCH" 2>/dev/null || true
      git checkout "$BRANCH"
    fi

    # Stop existing container
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

    # Build and start
    echo "🔨 Building review app..."
    docker compose up -d --build

    # Wait for healthy
    echo "⏳ Waiting for app to be ready..."
    for i in {1..30}; do
      if curl -s -o /dev/null -w "%{http_code}" "$REVIEW_URL" | grep -q "200\|301\|302"; then
        echo ""
        echo "✅ Review app ready!"
        echo "🌐 Open: $REVIEW_URL"
        exit 0
      fi
      printf "."
      sleep 1
    done

    echo ""
    echo "⚠️  App may still be starting. Check logs with: $0 logs"
    echo "🌐 URL: $REVIEW_URL"
    ;;

  stop)
    echo "🛑 Stopping OSSA review app..."
    docker compose down
    echo "✅ Stopped"
    ;;

  rebuild)
    echo "🔄 Rebuilding OSSA review app..."
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    echo "✅ Rebuilt and started"
    echo "🌐 Open: $REVIEW_URL"
    ;;

  logs)
    docker compose logs -f
    ;;

  status)
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
      echo "✅ OSSA review app is running"
      echo "🌐 URL: $REVIEW_URL"
      echo ""
      docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Status}}\t{{.Ports}}"
    else
      echo "❌ OSSA review app is not running"
      echo "Start with: $0 start"
    fi
    ;;

  *)
    echo "OSSA Review App Manager"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  start [branch]  Start review app (default: current branch)"
    echo "  stop            Stop review app"
    echo "  rebuild         Rebuild and restart"
    echo "  logs            View container logs"
    echo "  status          Check if running"
    echo ""
    echo "Examples:"
    echo "  $0 start                           # Start with current branch"
    echo "  $0 start feature/new-page          # Start with specific branch"
    echo "  $0 start 27-update-website         # Start with MR branch"
    ;;
esac
