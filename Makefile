.PHONY: help setup dev docker-up docker-down logs clean install

help: ## Show this help message
	@echo "FlowForge - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

setup: ## Initial setup (create .env files)
	@echo "Setting up FlowForge..."
	@cp -n .env.example .env || true
	@cp -n backend-fastapi/.env.example backend-fastapi/.env || true
	@cp -n frontend/.env.example frontend/.env || true
	@echo "✅ Environment files created. Please edit .env with your OpenAI API key"

install: ## Install dependencies
	@echo "Installing FastAPI backend dependencies..."
	@cd backend-fastapi && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "✅ Dependencies installed"

docker-up: ## Start all services with Docker
	@echo "Starting FlowForge with Docker..."
	@docker-compose up -d postgres redis
	@echo "Waiting for database..."
	@sleep 10
	@docker-compose build api worker frontend
	@docker-compose up -d
	@echo "Waiting for services..."
	@sleep 15
	@echo "✅ FlowForge is running!"
	@echo "   Frontend: http://localhost:3000"
	@echo "   API: http://localhost:4000"

docker-down: ## Stop all Docker services
	@docker-compose down

docker-restart: ## Restart Docker services
	@docker-compose restart

logs: ## View Docker logs
	@docker-compose logs -f

logs-api: ## View API logs
	@docker-compose logs -f api

logs-worker: ## View worker logs
	@docker-compose logs -f worker

logs-frontend: ## View frontend logs
	@docker-compose logs -f frontend

dev-infra: ## Start only infrastructure (PostgreSQL, Redis)
	@docker-compose up -d postgres redis
	@echo "✅ Infrastructure started"

dev-backend: ## Run backend in development mode
	@cd backend-fastapi && . .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 4000

dev-worker: ## Run worker in development mode
	@cd backend-fastapi && . .venv/bin/activate && celery -A app.worker.celery_app.celery_app worker --loglevel=info --concurrency=2

dev-frontend: ## Run frontend in development mode
	@cd frontend && npm run dev

db-migrate: ## Create database tables via app startup
	@cd backend-fastapi && . .venv/bin/activate && python -c "from app.db.base import Base; from app.db.session import engine; import app.models; Base.metadata.create_all(bind=engine)"

db-studio: ## Not used in FastAPI stack
	@echo "No Prisma studio in FastAPI stack"

db-reset: ## Reset database tables (⚠️  destructive)
	@cd backend-fastapi && . .venv/bin/activate && python -c "from app.db.base import Base; from app.db.session import engine; Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine)"

clean: ## Clean up (remove node_modules, build files)
	@echo "Cleaning up..."
	@rm -rf backend-fastapi/.venv backend-fastapi/__pycache__ backend-fastapi/.pytest_cache backend-fastapi/test.db
	@rm -rf frontend/node_modules frontend/.next
	@echo "✅ Cleaned"

clean-docker: ## Remove Docker volumes (⚠️  destructive)
	@docker-compose down -v
	@echo "✅ Docker volumes removed"

test-backend: ## Run backend tests
	@cd backend-fastapi && . .venv/bin/activate && pytest -q

test-frontend: ## Run frontend tests
	@cd frontend && npm test

build-backend: ## Build backend
	@cd backend-fastapi && . .venv/bin/activate && python -m compileall app

build-frontend: ## Build frontend
	@cd frontend && npm run build

health: ## Check service health
	@echo "Checking services..."
	@curl -s http://localhost:4000/api/health || echo "❌ API not responding"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend is up" || echo "❌ Frontend not responding"
