# Deployment Guide

## Overview
This project is split into:
- `frontend` (Next.js)
- `backend-fastapi` (FastAPI API)
- `backend-fastapi` Celery worker
- PostgreSQL
- Redis

## Local Docker Deployment

### 1. Configure env files
```bash
cp .env.example .env
cp backend-fastapi/.env.example backend-fastapi/.env
cp frontend/.env.example frontend/.env
```

### 2. Start stack
```bash
docker-compose up --build
```

### 3. Validate health
```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/health
curl http://localhost:4000/api/health/live
curl http://localhost:4000/api/health/ready
```

## Production Deployment Targets

### Frontend: Vercel
- Root directory: `frontend`
- Build command: `npm run build`
- Output: `.next`
- Required env:
  - `NEXT_PUBLIC_API_URL=https://<api-domain>`
  - `NEXT_PUBLIC_APP_URL=https://<frontend-domain>`

### Backend API + Worker: Render / Fly.io
Deploy two services from `backend-fastapi`:
1. API service
   - Start command:
     - `uvicorn app.main:app --host 0.0.0.0 --port 4000 --workers 2`
2. Worker service
   - Start command:
     - `celery -A app.worker.celery_app.celery_app worker --loglevel=info --concurrency=2`

Required env:
- `ENV=production`
- `DATABASE_URL=postgresql+psycopg://...`
- `REDIS_URL=redis://...`
- `JWT_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `OPENAI_API_KEY=...`
- `CORS_ORIGINS=https://<frontend-domain>`
- `BACKEND_PUBLIC_URL=https://<api-domain>`

### PostgreSQL: Neon
- Create DB in Neon
- Use pooled connection string in `DATABASE_URL`
- Enable connection limits appropriate for worker + API concurrency

### Redis: Upstash
- Use Redis endpoint as `REDIS_URL`
- Ensure TLS/secure URL format if provider requires it

## Security Checklist
- Enforce HTTPS at edge/load balancer
- Set strong JWT secrets (>= 32 chars)
- Restrict CORS to frontend domain
- Keep `OPENAI_API_KEY` server-only
- Enable platform-level request/traffic logs

## Scaling Notes
- API can scale horizontally (stateless JWT auth)
- Worker scales independently by queue depth
- Postgres bottlenecks usually appear before API bottlenecks; monitor connection pool and query timings
- For high volume, partition execution logs by date/tenant

## Rollback Strategy
- Keep immutable image tags per release
- Roll back API + worker together to avoid schema drift
- Keep backward-compatible DB changes when possible
