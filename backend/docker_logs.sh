#!/bin/bash
# View logs from DriftLock services
# Usage: ./backend/docker_logs.sh [service]
# Examples:
#   ./backend/docker_logs.sh          # All services
#   ./backend/docker_logs.sh backend   # Backend only
#   ./backend/docker_logs.sh postgres  # PostgreSQL only

set -e

cd "$(dirname "$0")/.."

SERVICE=${1:-.}

if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

echo "📋 Logs from DriftLock services (press Ctrl+C to exit)..."
echo ""

docker-compose logs -f $SERVICE
