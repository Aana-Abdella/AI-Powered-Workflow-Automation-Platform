from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.core.response import success_response
from app.db.session import get_db
from app.schemas.workflow import WebhookPayload
from app.services.workflow_service import WorkflowService


router = APIRouter(tags=["webhook"])
settings = get_settings()


@router.post("/webhook/{workflow_key}")
@limiter.limit(settings.webhook_rate_limit)
def webhook_entry(
    request: Request,
    workflow_key: str,
    payload: WebhookPayload,
    db: Session = Depends(get_db),
):
    _ = request
    result = WorkflowService(db).enqueue_webhook(workflow_key=workflow_key, text=payload.text)
    return success_response(result, "Webhook accepted")


@router.post("/workflows/webhook/{workflow_key}")
@limiter.limit(settings.webhook_rate_limit)
def webhook_alias(
    request: Request,
    workflow_key: str,
    payload: WebhookPayload,
    db: Session = Depends(get_db),
):
    _ = request
    result = WorkflowService(db).enqueue_webhook(workflow_key=workflow_key, text=payload.text)
    return success_response(result, "Webhook accepted")
