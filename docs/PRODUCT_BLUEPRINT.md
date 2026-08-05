# FlowForge Production Blueprint

## 1) Product Definition
- Multi-tenant AI automation platform for business workflows.
- Tenants are organizations with role-based user memberships.
- Workflows follow `trigger -> steps -> actions` and run asynchronously.
- AI steps support summarization, transformation, extraction.

## 2) UX Architecture

### Global Authenticated Shell
- Top Navbar:
  - Organization switcher
  - Global search
  - Notifications bell
  - User menu: Profile, Settings, Billing, Logout
- Sidebar:
  - Primary: Dashboard, Workflows, Executions, Webhooks, API Keys, Analytics, Billing, Team, Settings
  - Admin-only: System Logs, User Management, Platform Metrics
  - Supports collapse, active highlights, mobile drawer

### Page Inventory
- Onboarding:
  - Signup
  - Email verification
  - Create organization
  - Plan selection (Free / Pro / Enterprise)
  - Quick-start tutorial
  - Create first workflow CTA
- Dashboard:
  - Monthly workflow runs
  - AI tokens
  - Active workflows
  - Failed executions
  - Activity feed
  - System health
- Workflows:
  - List: name, status, last run, trigger, actions count, edit, enable/disable
  - Builder: trigger, action, AI, HTTP, DB block
  - Workflow states: Draft, Active, Archived
  - Actions: test, save draft, publish
  - Versioning backed by `workflow_versions`
- Executions:
  - List: execution id, workflow, status, duration, timestamp, details
  - Detail: payload, step logs, error trace, AI output preview
- Webhooks:
  - Endpoint list, copy URL, regenerate secret, event history, test endpoint
- API Keys:
  - Generate, revoke, masked display, usage insights
- Analytics:
  - Runs/day, token usage, failure rate, latency
- Billing:
  - Plan, usage, estimated cost, upgrade/downgrade, Stripe placeholders
- Team:
  - Members list, invite email, role selection, remove member
- Settings:
  - Org profile, webhook secret rotation, security/session management, delete org
- Admin:
  - System logs, user management, platform metrics

### UI State Standards
- Loading: skeleton blocks and table shimmer rows
- Empty: descriptive copy + CTA
- Error: inline alerts with retry action
- Toasts: success/error info for mutation responses
- Confirmation modals: destructive operations (revoke key, remove member, delete org)
- Pagination: cursor or offset with stable sorting
- Filters: search, status, date range, workflow

## 3) Backend Architecture (Clean Architecture)
- Controllers: parse requests/responses
- Services: business workflows and cross-cutting logic
- Repositories: persistence abstraction boundary (incremental adoption)
- Middleware:
  - auth/JWT
  - RBAC
  - rate limit
  - request validation
  - CSRF strategy (session endpoints)
  - central error handling
- Workers:
  - queue consumers for workflow execution
  - retries/backoff/timeouts
  - AI failure handling and metrics
- DTO validation:
  - zod-based contracts at API edges
- Logging/audit:
  - structured logs + audit log events for security-sensitive actions

## 4) Runtime Services
- API Service: stateless HTTP service
- Worker Service: asynchronous execution engine
- PostgreSQL: system of record
- Redis: queue backend + transient cache
- Nginx: edge reverse proxy / TLS termination

## 5) Security Model
- Helmet headers
- Strict CORS allowlist
- JWT access + refresh rotation
- RBAC per organization membership role
- Request validation for all mutating endpoints
- SQL injection prevention via Prisma parameterized queries
- Webhook signature validation with HMAC SHA-256
- API key hashing at rest (`keyHash`) + masked prefix display
- Rate limiting (API/auth/webhook)
- Encrypted secrets and scoped env vars
- Session management and revocation support
- Audit logging for auth/admin/billing actions

## 6) Worker Execution Flow
- `Webhook/Event -> API -> Redis Queue -> Worker`
- Worker pipeline:
  - mark execution RUNNING
  - run each step with timeout guard
  - persist step output
  - aggregate AI token/cost metrics
  - mark SUCCESS/FAILED/TIMEOUT
  - emit usage updates
- Failure strategy:
  - queue retries exponential backoff
  - dead-letter tracking by failed jobs
  - structured error trace persisted to `executions`

## 7) Scalability Strategy
- Horizontal API scale behind load balancer
- Dedicated worker autoscaling by queue depth
- PostgreSQL connection pooling + read replicas (future)
- Redis caching for hot reads and rate-limit counters
- Tenant-aware indexing (`organization_id`, timestamps)
- Partition execution tables as volume grows
- Async-first external I/O calls in worker

## 8) DevOps and Operations
- Dockerized services: API, Worker, Redis, PostgreSQL, Nginx
- Compose for local development
- Multi-stage production Dockerfiles
- CI pipeline:
  - lint
  - type-check
  - build
  - container build
- Health endpoints:
  - `/health`
  - `/api/health/live`
  - `/api/health/ready`
- Centralized logging strategy with JSON logs
- Environment variable schema validation at startup

## 9) Non-Functional Targets
- Availability target: 99.9%+
- P95 API latency target: < 250ms (non-worker endpoints)
- Queue delay target: < 5s under nominal load
- RPO: 15 minutes (managed backups)
- RTO: 30 minutes

## 10) Future Enhancements
- SSO (SAML/OIDC)
- Usage-based billing with Stripe metered billing
- Connector marketplace
- Workflow templates and cloning
- Multi-region active/passive deployment
- OpenTelemetry distributed tracing
