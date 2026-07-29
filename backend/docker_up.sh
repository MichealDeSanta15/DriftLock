#!/bin/bash
# Start DriftLock services with Docker Compose
# Usage: ./backend/docker_up.sh

set -e

cd "$(dirname "$0")/.."

echo "🐳 Starting DriftLock services..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    cp backend/.env.example .env
    echo "✓ .env created. Please review and update database credentials if needed."
    echo ""
fi

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker daemon is not running"
    exit 1
fi

# Start services
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check PostgreSQL
echo "Checking PostgreSQL..."
if docker-compose exec -T postgres pg_isready -U driftlock > /dev/null 2>&1; then
    echo "✓ PostgreSQL is ready"
else
    echo "⚠️  PostgreSQL is starting, please wait..."
    sleep 10
fi

# Check Backend
echo "Checking Backend..."
if docker-compose exec -T backend curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓ Backend is ready"
else
    echo "⚠️  Backend is starting, please wait..."
    sleep 10
fi

echo ""
echo "✅ DriftLock services are running!"
echo ""
echo "📋 Service URLs:"
echo "  - Backend API: http://localhost:8000"
echo "  - PostgreSQL:  localhost:5432"
echo ""
echo "📊 Database:"
echo "  - Name: driftlock"
echo "  - User: driftlock"
echo "  - Port: 5432"
echo ""
echo "📝 Available commands:"
echo "  - View logs:   ./backend/docker_logs.sh"
echo "  - Stop:        ./backend/docker_down.sh"
echo "  - Shell:       docker-compose exec backend bash"
echo "  - DB shell:    docker-compose exec postgres psql -U driftlock -d driftlock"
echo ""
echo "🔗 For more info, see QUICKSTART.md"
