#!/bin/bash

set -e

echo "Starting FlowForge development environment..."

if [ ! -f ".env" ]; then
  cp .env.example .env
fi

if [ ! -f "backend-fastapi/.env" ]; then
  cp backend-fastapi/.env.example backend-fastapi/.env
fi

if [ ! -f "frontend/.env" ]; then
  cp frontend/.env.example frontend/.env
fi

docker-compose up -d postgres redis

echo ""
echo "Infrastructure is running."
echo ""
echo "Run these in separate terminals:"
echo "1) cd backend-fastapi && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload --host 0.0.0.0 --port 4000"
echo "2) cd backend-fastapi && source .venv/bin/activate && celery -A app.worker.celery_app.celery_app worker --loglevel=info --concurrency=2"
echo "3) cd frontend && npm install && npm run dev"
echo ""
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:4000"
