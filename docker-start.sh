#!/bin/bash

set -e

echo "🚀 Starting FlowForge with Docker..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file from example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your OpenAI API key!"
    echo "   OPENAI_API_KEY=sk-your-key-here"
    echo ""
    read -p "Press Enter after you've added your API key to .env..."
fi

# Check for OpenAI API key
if ! grep -q "sk-" .env 2>/dev/null; then
    echo "❌ ERROR: OpenAI API key not found in .env"
    echo "   Please edit .env and add: OPENAI_API_KEY=sk-your-key"
    exit 1
fi

echo "📦 Starting infrastructure services (PostgreSQL & Redis)..."
docker-compose up -d postgres redis

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔨 Building application images..."
docker-compose build api worker frontend

echo "🚀 Starting all services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 15

echo "🗄️  Running database migrations..."
docker-compose exec -T api npx prisma migrate deploy || {
    echo "⚠️  Migration failed, trying again..."
    sleep 5
    docker-compose exec -T api npx prisma migrate deploy
}

echo ""
echo "✅ FlowForge is running!"
echo ""
echo "📝 Access points:"
echo "   - Frontend: http://localhost:3000"
echo "   - API: http://localhost:4000"
echo "   - Health: http://localhost:4000/api/health"
echo ""
echo "📊 View logs:"
echo "   $ docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   $ docker-compose down"
echo ""
