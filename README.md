# FlowForge

AI-powered multi-tenant workflow automation SaaS demo with production-style architecture.

## Project Status
- Production-ready demo scaffold (deployable)
- Primary backend: FastAPI (`backend-fastapi/`)
- Legacy backend: Express/Prisma (`backend/`) retained for reference

## System Requirements
- Docker + Docker Compose (recommended)
- Node.js 18+ (frontend)
- Python 3.11+ (backend)
- PostgreSQL 15+ and Redis 7+ (if not using Docker)

## What This Project Delivers
- Secure auth with JWT access/refresh token flow
- Multi-tenant user/workflow isolation
- Webhook-driven async AI summarization pipeline
- Execution logs with real-time polling
- Usage monitoring + billing simulation
- RBAC (`USER`, `ADMIN`)
- Dockerized services for API, worker, Postgres, and Redis
- Responsive Next.js dashboard with loading, toasts, confirmation modals, and error boundaries

## Product Tour (5-Minute Demo)
1. Register a new user from the UI or via `POST /api/auth/register`.
2. Copy your `organizationId` from `GET /api/auth/me` (the UI does this automatically).
3. Create a workflow and note the generated webhook key.
4. Send a webhook request with `{ "text": "..." }`.
5. Watch the execution logs and analytics update.
6. Log in as an admin to view system logs, users, and simulated billing.

## Tech Stack
- Frontend: Next.js 14, React, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Celery, Redis
- Database: PostgreSQL
- AI: OpenAI API (with fallback summarizer)
- Infra: Docker Compose

## Architecture
`User -> Next.js UI -> FastAPI API -> Redis Queue -> Celery Worker -> OpenAI -> PostgreSQL -> Dashboard`

Detailed flow:
1. Webhook request hits `/api/webhook/{workflow_key}`.
2. API validates workflow and persists a `PENDING` execution.
3. Job is enqueued to Redis for the worker.
4. Celery worker summarizes text using OpenAI (or fallback).
5. Execution is updated to `SUCCESS` or `FAILED`.
6. UI polls every 5 seconds to refresh logs and analytics.

## Service Ports
- Frontend: `http://localhost:3000`
- API: `http://localhost:4000`
- PostgreSQL: `http://localhost:5432`
- Redis: `http://localhost:6379`

## Folder Structure
- `frontend/`: Next.js app
- `backend-fastapi/`: FastAPI API + Celery worker + tests
- `docker-compose.yml`: local full-stack orchestration
- `docs/`: architecture, deployment, and product docs

## Quick Start
1. Copy env templates:
   - `cp .env.example .env`
   - `cp backend-fastapi/.env.example backend-fastapi/.env`
   - `cp frontend/.env.example frontend/.env`
2. Start with Docker:
   - `docker-compose up --build`
3. Open:
   - Frontend: `http://localhost:3000`
   - API: `http://localhost:4000`
4. Health checks:
   - `curl http://localhost:4000/health`
   - `curl http://localhost:4000/api/health`

## Demo Admin Seed
An admin user is auto-created at startup when `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` are set.
Default Docker values:
- `admin@flowforge.local`
- `Admin@12345`
Change these in production.

## Local Development (Without Docker)
1. Start Postgres + Redis.
2. Backend:
   - `cd backend-fastapi`
   - `python -m venv .venv && source .venv/bin/activate`
   - `pip install -r requirements.txt`
   - `uvicorn app.main:app --reload --host 0.0.0.0 --port 4000`
3. Worker:
   - `cd backend-fastapi`
   - `source .venv/bin/activate`
   - `celery -A app.worker.celery_app.celery_app worker --loglevel=info --concurrency=2`
4. Frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

## Database Notes
- Tables are auto-created at startup via SQLAlchemy `create_all` for local/demo use.
- For production, add Alembic migrations and apply them during deploy.

## Useful Commands
- `make setup` to generate `.env` files
- `make docker-up` to run the stack
- `make dev-backend` to run FastAPI locally
- `make dev-worker` to run Celery locally
- `make dev-frontend` to run Next.js locally

## Environment Variables
### Root (`.env`)
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`

### Backend (`backend-fastapi/.env`)
- `ENV`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `CORS_ORIGINS`
- `BACKEND_PUBLIC_URL`
- `FREE_PLAN_LIMIT`
- `AUTH_RATE_LIMIT`
- `WEBHOOK_RATE_LIMIT`
- `API_RATE_LIMIT`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`

## Environment Variable Reference
### Frontend
| Variable | Purpose | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL for API requests | `https://api.example.com` |
| `NEXT_PUBLIC_APP_URL` | Public URL of the frontend | `https://app.example.com` |

### Backend
| Variable | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string | `postgresql+psycopg://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://default:pass@host:6379` |
| `JWT_SECRET` | Access token signing secret | `change-me` |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | `change-me` |
| `CORS_ORIGINS` | Comma-separated allowlist | `https://app.example.com,https://admin.example.com` |
| `BACKEND_PUBLIC_URL` | Public API base URL | `https://api.example.com` |
| `OPENAI_API_KEY` | Enables OpenAI summarization | `sk-...` |
| `OPENAI_MODEL` | Model name for summarization | `gpt-4o-mini` |
| `FREE_PLAN_LIMIT` | Free plan execution cap | `100` |
| `AUTH_RATE_LIMIT` | Auth rate limit | `10/minute` |
| `WEBHOOK_RATE_LIMIT` | Webhook rate limit | `60/minute` |
| `API_RATE_LIMIT` | General API rate limit | `120/minute` |
| `ADMIN_SEED_EMAIL` | Initial admin email | `admin@flowforge.local` |
| `ADMIN_SEED_PASSWORD` | Initial admin password | `Admin@12345` |

## Core API Endpoints
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`

### Workflows + Webhooks
- `POST /api/workflows`
- `GET /api/workflows`
- `PATCH /api/workflows/{id}`
- `POST /api/workflows/{id}/enable`
- `POST /api/workflows/{id}/disable`
- `POST /api/webhook/{workflow_key}`

### Logs / Analytics / Billing
- `GET /api/executions`
- `GET /api/executions/{id}`
- `GET /api/executions/stats`
- `GET /api/analytics/usage`
- `GET /api/analytics/executions`
- `GET /api/analytics/billing`

### Admin
- `GET /api/admin/users`
- `PATCH /api/admin/users/{id}`
- `GET /api/admin/logs`
- `GET /api/admin/health`
- `GET /api/admin/metrics`

### Organizations / Team / API Keys
- `GET /api/organizations`
- `POST /api/organizations`
- `GET /api/team/members`
- `POST /api/team/members`
- `PATCH /api/team/members/{id}`
- `POST /api/api-keys`
- `GET /api/api-keys`
- `POST /api/api-keys/{id}/revoke`

Detailed examples: [`docs/API_REFERENCE.md`](/home/aneman/Desktop/personal/AI-Powered SaaS/docs/API_REFERENCE.md)

## Auth Flow (JWT + Refresh Cookie)
1. `POST /api/auth/login` returns an access token and sets an HttpOnly `refreshToken` cookie.
2. Use the access token in `Authorization: Bearer <token>` for API calls.
3. When access expires, call `POST /api/auth/refresh` (cookie or payload) to get a new access token.
4. `POST /api/auth/logout` revokes refresh + access tokens via token blacklist.

## Example Usage (Quick Smoke Test)
### Register
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@acme.com","password":"Strong@1234","firstName":"Demo","lastName":"User"}'
```

### Create Workflow
```bash
curl -X POST http://localhost:4000/api/workflows \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Support Summaries","organizationId":"<ORG_ID>","trigger":{"type":"webhook","config":{}},"actions":[{"type":"ai","config":{"operation":"summarize"}}]}'
```

### Trigger Webhook
```bash
curl -X POST http://localhost:4000/api/webhook/<WEBHOOK_KEY> \
  -H "Content-Type: application/json" \
  -d '{"text":"Long paragraph to summarize..."}'
```

### View Logs
```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  "http://localhost:4000/api/executions?organizationId=<ORG_ID>"
```

### List Users (Admin)
```bash
curl -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  "http://localhost:4000/api/admin/users?page=1&limit=20"
```

## Multi-Tenant Model
- Each user belongs to a tenant (organization).
- Tenant scoping is enforced on all data access.
- `organizationId` is accepted for UI compatibility, while the token remains the source of truth.

## Roles and Access
- `USER`: manage own workflows, logs, API keys, and settings.
- `ADMIN`: includes user management, system logs, and platform metrics.

## Billing Simulation
- Each execution increments usage.
- Free tier limit is set by `FREE_PLAN_LIMIT`.
- Billing estimates are shown in analytics and calculated server-side.

## Data Model (Key Tables)
| Table | Purpose |
| --- | --- |
| `users` | User identities, roles, and status |
| `tenants` | Organizations for multi-tenant isolation |
| `workflows` | Webhook workflows tied to a tenant |
| `logs` | Execution records and summaries |
| `api_keys` | Generated API keys for integrations |
| `refresh_tokens` | Refresh token storage |
| `token_blacklist` | Revoked access tokens |
| `usage_summary` | Aggregated usage metrics |
| `system_logs` | Admin audit and system events |

## Security Notes
- Password hashing via bcrypt
- Access token expiry: 15 minutes
- Refresh token expiry: 7 days
- Refresh token persistence and revocation
- Token blacklist support for logout invalidation
- Tenant-scoped data access checks
- Rate limiting on auth and webhook routes
- CORS allowlist and env-based configuration

## AI Summarization
- OpenAI is used when `OPENAI_API_KEY` is provided.
- A built-in fallback summarizer is used when OpenAI is not available.

## Observability
- Structured JSON logging for API errors and events
- Admin system logs page for audit visibility
- Health endpoints for liveness/readiness probes

## Testing
Backend tests are in `backend-fastapi/tests`:
- Auth flow tests
- Workflow isolation tests
- Webhook validation tests
- Protected route tests

Run:
- `cd backend-fastapi && pytest -q`

## CI/CD
GitHub Actions pipeline exists in `.github/workflows/ci-cd.yml` with lint/type/build steps.

## Deployment
Full deployment guide: [`docs/DEPLOYMENT.md`](/home/aneman/Desktop/personal/AI-Powered SaaS/docs/DEPLOYMENT.md)

Summary:
- Frontend: Vercel (`frontend/`)
- Backend API + Worker: Render or Fly.io (`backend-fastapi/`)
- PostgreSQL: Neon
- Redis: Upstash

## Deployment Steps (Minimal)
### Vercel (Frontend)
1. Import the repo and set the project root to `frontend/`.
2. Set `NEXT_PUBLIC_API_URL` to your API domain.
3. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain.
4. Deploy and verify `/` renders.

### Render or Fly.io (API + Worker)
1. Deploy `backend-fastapi/` twice: one web service and one worker.
2. Use the same environment variables for both services.
3. Set `ENV=production`, `BACKEND_PUBLIC_URL`, and `CORS_ORIGINS`.
4. Web service start command: `uvicorn app.main:app --host 0.0.0.0 --port 4000 --workers 2`
5. Worker command: `celery -A app.worker.celery_app.celery_app worker --loglevel=info --concurrency=2`

### Neon (Postgres)
1. Create a database and copy the connection string.
2. Set `DATABASE_URL` for both API and worker.

### Upstash (Redis)
1. Create a Redis database and copy the URL.
2. Set `REDIS_URL` for both API and worker.

## Production Checklist
- `ENV=production`
- Rotate `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Set strong `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD`
- `CORS_ORIGINS` matches your frontend domains
- `BACKEND_PUBLIC_URL` is the public API domain
- HTTPS enforced at the edge (Vercel, Render, Fly, or Nginx)
- `OPENAI_API_KEY` set for real AI summarization
- Logs and metrics are available to admins

## Scaling Notes
- Increase Uvicorn workers and Celery concurrency under load.
- Add additional Celery workers for bursty webhook traffic.
- Use managed Postgres/Redis with automated backups.

## Deployment Targets
- Frontend: Vercel
- Backend/Worker: Render or Fly.io
- PostgreSQL: Neon
- Redis: Upstash

No localhost hardcoding in application logic; runtime base URLs are env-driven.

## Troubleshooting
- `401` after login: ensure cookies are enabled and `JWT_SECRET` matches across API/worker.
- Workflows not loading: verify `organizationId` is present in the auth payload (`/api/auth/me`).
- AI summaries empty: check `OPENAI_API_KEY` and worker logs.
- Build errors in restricted networks: use local font stacks and avoid dynamic package installs.
- Password reset: the API currently stubs email delivery and returns a success message.
- Empty analytics: ensure at least one execution has completed successfully.

## Future Improvements
- Stripe metered billing integration
- OpenTelemetry distributed tracing
- SSO (OIDC/SAML)
- Advanced retry + DLQ dashboards
- Full charting with Recharts once package install is available in restricted environments
