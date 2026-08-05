# Folder Structure

```text
.
├── backend-fastapi
│   ├── app
│   │   ├── api
│   │   ├── core
│   │   ├── db
│   │   ├── models
│   │   ├── schemas
│   │   ├── services
│   │   └── worker
│   ├── tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend
│   ├── src/app
│   ├── src/components
│   ├── src/lib
│   └── src/store
├── docs
├── docker-compose.yml
└── README.md
```

## Notes
- `backend-fastapi/app/services` contains business logic (service layer).
- `backend-fastapi/app/api` contains route handlers and request wiring.
- `backend-fastapi/app/worker` contains Celery app/tasks.
- `frontend/src/app/dashboard` contains authenticated SaaS pages.
