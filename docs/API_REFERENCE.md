# API Reference

Base URL: `https://<api-domain>/api`

## Authentication

### Register
`POST /auth/register`

Request:
```json
{
  "email": "user@example.com",
  "password": "Strong@1234",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

Response:
```json
{
  "success": true,
  "message": "Registered successfully",
  "data": {
    "user": { "id": "...", "email": "user@example.com" },
    "organization": { "id": "...", "name": "Jane's Workspace" },
    "accessToken": "<jwt>"
  }
}
```

### Login
`POST /auth/login`

### Refresh Token
`POST /auth/refresh`

### Logout
`POST /auth/logout`

## Workflows

### Create Workflow
`POST /workflows`

Request:
```json
{
  "name": "Support Summary"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Support Summary",
    "webhookKey": "...",
    "webhookUrl": "https://<api-domain>/api/webhook/...",
    "isActive": true
  }
}
```

### Trigger Webhook
`POST /webhook/{workflow_key}`

Request:
```json
{
  "text": "Long paragraph to summarize"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "jobId": "...",
    "status": "PENDING"
  }
}
```

## Executions

### List Logs
`GET /executions?limit=10&offset=0`

### Get Execution
`GET /executions/{execution_id}`

## Analytics

### Usage
`GET /analytics/usage`

Example:
```json
{
  "success": true,
  "data": {
    "plan": "FREE",
    "usedExecutions": 76,
    "freeLimit": 100,
    "usagePercent": 76
  }
}
```

## Admin

### List Users
`GET /admin/users?page=1&limit=20`

### System Health
`GET /admin/health`

### Platform Metrics
`GET /admin/metrics`
