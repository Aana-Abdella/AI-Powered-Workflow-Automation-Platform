from datetime import datetime, timezone

from celery import Task

from app.db.session import SessionLocal
from app.models import LogEntry, LogStatusEnum, UsageSummary, Workflow
from app.services.ai_service import AIService
from app.worker.celery_app import celery_app


def _increment_usage(summary: UsageSummary | None, *, success: bool) -> None:
    if not summary:
        return
    summary.total_executions += 1
    if success:
        summary.successful_executions += 1
    else:
        summary.failed_executions += 1


def _run_definition(definition: dict, text: str) -> str:
    """Run the deliberately small Phase 1 action set in declaration order."""
    value = text
    for step in definition.get("steps", []):
        step_type = step.get("type")
        if step_type == "ai":
            operation = step.get("operation", "summarize")
            if operation != "summarize":
                raise ValueError(f"Unsupported AI operation: {operation}")
            value = AIService().summarize(value)
        elif step_type == "http":
            raise ValueError("HTTP actions are reserved for the connector phase")
        else:
            raise ValueError(f"Unsupported workflow step: {step_type}")
    return value


@celery_app.task(bind=True, max_retries=3, default_retry_delay=3, name="process_log_task")
def process_log_task(self: Task, log_id: str) -> None:
    db = SessionLocal()
    try:
        log = db.query(LogEntry).filter(LogEntry.id == log_id).first()
        if not log:
            return

        log.status = LogStatusEnum.PROCESSING
        log.attempts += 1
        db.commit()

        workflow = db.query(Workflow).filter(Workflow.id == log.workflow_id).first()
        if not workflow:
            raise ValueError("Workflow not found")
        summary = _run_definition(workflow.definition, log.input_text)

        log.output_text = summary
        log.status = LogStatusEnum.SUCCESS
        log.error_message = None
        log.updated_at = datetime.now(tz=timezone.utc)

        usage = db.query(UsageSummary).filter(UsageSummary.tenant_id == log.tenant_id).first()
        _increment_usage(usage, success=True)
        db.commit()

    except Exception as exc:
        log = db.query(LogEntry).filter(LogEntry.id == log_id).first()
        if not log:
            raise

        # Retry up to 3 attempts, then mark as failed.
        if self.request.retries < self.max_retries:
            db.commit()
            raise self.retry(exc=exc)

        log.status = LogStatusEnum.FAILED
        log.error_message = str(exc)
        log.updated_at = datetime.now(tz=timezone.utc)

        usage = db.query(UsageSummary).filter(UsageSummary.tenant_id == log.tenant_id).first()
        _increment_usage(usage, success=False)
        db.commit()
    finally:
        db.close()
