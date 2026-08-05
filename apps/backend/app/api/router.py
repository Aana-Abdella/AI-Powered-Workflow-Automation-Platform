from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api import admin, analytics, api_keys, auth, executions, organizations, team, webhook, workflows
from app.core.redis_client import redis_client
from app.core.response import success_response
from app.db.session import get_db


api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(workflows.router)
api_router.include_router(webhook.router)
api_router.include_router(executions.router)
api_router.include_router(api_keys.router)
api_router.include_router(analytics.router)
api_router.include_router(organizations.router)
api_router.include_router(team.router)
api_router.include_router(admin.router)


@api_router.get("/health")
def health():
    return success_response({"status": "ok"})


@api_router.get("/health/live")
def live():
    return success_response({"status": "live"})


@api_router.get("/health/ready")
def ready(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    redis_client.ping()
    return success_response({"status": "ready"})
