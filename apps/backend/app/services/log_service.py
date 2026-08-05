from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models import LogEntry, User, Workflow


class LogService:
    def __init__(self, db: Session):
        self.db = db

    def list_logs(
        self,
        *,
        user: User,
        workflow_id: str | None,
        limit: int,
        offset: int,
    ) -> dict:
        query = self.db.query(LogEntry, Workflow.name.label("workflow_name")).join(
            Workflow, Workflow.id == LogEntry.workflow_id
        )

        if user.role != "ADMIN":
            query = query.filter(LogEntry.tenant_id == user.tenant_id)

        if workflow_id:
            query = query.filter(LogEntry.workflow_id == workflow_id)

        total = query.with_entities(func.count(LogEntry.id)).scalar() or 0
        rows = (
            query.order_by(desc(LogEntry.created_at)).offset(offset).limit(limit).all()
        )

        items = [
            {
                "id": log.id,
                "workflowId": log.workflow_id,
                "workflowName": workflow_name,
                "inputText": log.input_text,
                "outputText": log.output_text,
                "status": log.status.value,
                "errorMessage": log.error_message,
                "attempts": log.attempts,
                "createdAt": log.created_at,
            }
            for log, workflow_name in rows
        ]
        return {"items": items, "total": total}

    def get_log(self, *, user: User, log_id: str) -> dict:
        row = (
            self.db.query(LogEntry, Workflow.name.label("workflow_name"))
            .join(Workflow, Workflow.id == LogEntry.workflow_id)
            .filter(LogEntry.id == log_id)
            .first()
        )
        if not row:
            raise ValueError("Log not found")

        log, workflow_name = row
        if user.role != "ADMIN" and log.tenant_id != user.tenant_id:
            raise ValueError("Log not found")

        return {
            "id": log.id,
            "workflowId": log.workflow_id,
            "workflowName": workflow_name,
            "inputText": log.input_text,
            "outputText": log.output_text,
            "status": log.status.value,
            "errorMessage": log.error_message,
            "attempts": log.attempts,
            "createdAt": log.created_at,
        }
