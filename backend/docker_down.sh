#!/bin/bash
# Stop DriftLock services
# Usage: ./backend/docker_down.sh

set -e

cd "$(dirname "$0")/.."

echo "🛑 Stopping DriftLock services..."

if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

docker-compose down

echo "✅ Services stopped"
echo ""
echo "💡 To remove volumes and clean up completely:"
echo "   docker-compose down -v"
