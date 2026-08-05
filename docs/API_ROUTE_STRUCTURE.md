# API Route Structure (FastAPI)

Base URL: `/api`

## Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/change-password`
- `DELETE /auth/delete-account`

## Workflows
- `POST /workflows`
- `GET /workflows`
- `GET /workflows/{workflow_id}`
- `PATCH /workflows/{workflow_id}`
- `DELETE /workflows/{workflow_id}`
- `POST /workflows/{workflow_id}/enable`
- `POST /workflows/{workflow_id}/disable`
- `GET /workflows/{workflow_id}/executions`

## Webhooks
- `POST /webhook/{workflow_key}`
- `POST /workflows/webhook/{workflow_key}`

## Executions
- `GET /executions`
- `GET /executions/stats`
- `GET /executions/{execution_id}`
- `POST /executions/{execution_id}/retry`
- `POST /executions/{execution_id}/cancel`

## API Keys
- `POST /api-keys`
- `GET /api-keys`
- `GET /api-keys/{api_key_id}`
- `POST /api-keys/{api_key_id}/revoke`
- `POST /api-keys/{api_key_id}/regenerate`
- `DELETE /api-keys/{api_key_id}`

## Analytics / Billing
- `GET /analytics/usage`
- `GET /analytics/executions`
- `GET /analytics/billing`
- `GET /analytics/plans`

## Organizations / Team
- `GET /organizations`
- `GET /organizations/{org_id}`
- `POST /organizations`
- `PATCH /organizations/{org_id}`
- `GET /team/members`
- `POST /team/members`
- `PATCH /team/members/{user_id}`
- `DELETE /team/members/{user_id}`
- `POST /team/leave`

## Admin
- `GET /admin/users`
- `GET /admin/users/{user_id}`
- `PATCH /admin/users/{user_id}`
- `DELETE /admin/users/{user_id}`
- `GET /admin/organizations`
- `GET /admin/logs`
- `GET /admin/health`
- `GET /admin/metrics`

## Health
- `GET /health`
- `GET /health/live`
- `GET /health/ready`
