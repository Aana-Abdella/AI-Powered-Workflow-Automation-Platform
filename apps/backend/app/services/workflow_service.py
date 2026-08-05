from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import LogEntry, LogStatusEnum, UsageSummary, User, Workflow
from app.services.utils import generate_webhook_key


class WorkflowService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()

    def _ensure_access(self, *, user: User, workflow: Workflow) -> None:
        if user.role == "ADMIN":
            return
        if workflow.tenant_id != user.tenant_id or workflow.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")

    def _build_response(self, workflow: Workflow) -> dict:
        return {
            "id": workflow.id,
            "name": workflow.name,
            "webhookKey": workflow.webhook_key,
            "webhookUrl": f"{self.settings.backend_public_url}/api/webhook/{workflow.webhook_key}",
            "isActive": workflow.is_active,
            "createdAt": workflow.created_at,
        }

    def create(self, *, user: User, name: str) -> dict:
        workflow = Workflow(
            tenant_id=user.tenant_id,
            user_id=user.id,
            name=name,
            webhook_key=generate_webhook_key(),
            is_active=True,
        )
        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)
        return self._build_response(workflow)

    def list(self, *, user: User) -> list[dict]:
        query = self.db.query(Workflow).order_by(desc(Workflow.created_at))
        if user.role != "ADMIN":
            query = query.filter(Workflow.tenant_id == user.tenant_id, Workflow.user_id == user.id)
        workflows = query.all()
        return [self._build_response(workflow) for workflow in workflows]

    def get(self, *, user: User, workflow_id: str) -> dict:
        workflow = self.db.query(Workflow).filter(Workflow.id == workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
        self._ensure_access(user=user, workflow=workflow)
        return self._build_response(workflow)

    def update(self, *, user: User, workflow_id: str, name: str | None, is_active: bool | None) -> dict:
        workflow = self.db.query(Workflow).filter(Workflow.id == workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
        self._ensure_access(user=user, workflow=workflow)

        if name is not None:
            workflow.name = name
        if is_active is not None:
            workflow.is_active = is_active

        workflow.updated_at = datetime.now(tz=timezone.utc)
        self.db.commit()
        self.db.refresh(workflow)
        return self._build_response(workflow)

    def delete(self, *, user: User, workflow_id: str) -> None:
        workflow = self.db.query(Workflow).filter(Workflow.id == workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
        self._ensure_access(user=user, workflow=workflow)
        self.db.delete(workflow)
        self.db.commit()

    def set_active(self, *, user: User, workflow_id: str, active: bool) -> dict:
        return self.update(user=user, workflow_id=workflow_id, name=None, is_active=active)

    def enqueue_webhook(self, *, workflow_key: str, text: str) -> dict:
        workflow = self.db.query(Workflow).filter(Workflow.webhook_key == workflow_key).first()
        if not workflow or not workflow.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found or disabled")

        usage = self.db.query(UsageSummary).filter(UsageSummary.tenant_id == workflow.tenant_id).first()
        if usage and usage.plan == "FREE" and usage.total_executions >= self.settings.free_plan_limit:
            raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Free plan limit reached")

        log = LogEntry(
            tenant_id=workflow.tenant_id,
            workflow_id=workflow.id,
            input_text=text,
            status=LogStatusEnum.PENDING,
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)

        from app.worker.tasks import process_log_task

        process_log_task.delay(log.id)

        return {
            "jobId": log.id,
            "status": log.status.value,
        }
