#!/bin/bash

set -e

echo "Starting FlowForge with Docker..."

if [ ! -f ".env" ]; then
  cp .env.example .env
fi

if [ ! -f "backend-fastapi/.env" ]; then
  cp backend-fastapi/.env.example backend-fastapi/.env
fi

if [ ! -f "frontend/.env" ]; then
  cp frontend/.env.example frontend/.env
fi

docker-compose up -d --build

echo ""
echo "FlowForge is running"
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:4000"
echo "API Health: http://localhost:4000/api/health"
echo ""
echo "Stop with: docker-compose down"
