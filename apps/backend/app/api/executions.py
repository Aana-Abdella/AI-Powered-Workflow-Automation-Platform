from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.response import success_response
from app.db.session import get_db
from app.models import LogEntry, LogStatusEnum, User, Workflow
from app.services.log_service import LogService


router = APIRouter(prefix="/executions", tags=["executions"])


@router.get("")
def list_executions(
    organizationId: str | None = Query(default=None),
    workflowId: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    result = LogService(db).list_logs(user=current_user, workflow_id=workflowId, limit=limit, offset=offset)
    if status_filter:
        result["items"] = [item for item in result["items"] if item["status"] == status_filter]
        result["total"] = len(result["items"])
    return success_response(result)


@router.get("/stats")
def execution_stats(
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId

    query = db.query(LogEntry)
    if current_user.role != "ADMIN":
        query = query.filter(LogEntry.tenant_id == current_user.tenant_id)

    total = query.count()
    success_count = query.filter(LogEntry.status == LogStatusEnum.SUCCESS).count()
    failed_count = query.filter(LogEntry.status == LogStatusEnum.FAILED).count()
    pending_count = query.filter(LogEntry.status.in_([LogStatusEnum.PENDING, LogStatusEnum.PROCESSING])).count()
    success_rate = round((success_count / total) * 100, 2) if total else 0

    data = {
        "totalExecutions": total,
        "successCount": success_count,
        "failedCount": failed_count,
        "pendingCount": pending_count,
        "successRate": success_rate,
    }
    return success_response(data)


@router.get("/{execution_id}")
def get_execution(
    execution_id: str,
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    try:
        data = LogService(db).get_log(user=current_user, log_id=execution_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return success_response(data)


@router.post("/{execution_id}/retry")
def retry_execution(
    execution_id: str,
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId

    log = db.query(LogEntry).filter(LogEntry.id == execution_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found")

    workflow = db.query(Workflow).filter(Workflow.id == log.workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")

    if current_user.role != "ADMIN" and log.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found")

    log.status = LogStatusEnum.PENDING
    log.error_message = None
    db.commit()

    from app.worker.tasks import process_log_task

    process_log_task.delay(log.id)
    return success_response({"id": log.id, "status": log.status.value}, "Execution retried")


@router.post("/{execution_id}/cancel")
def cancel_execution(
    execution_id: str,
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId

    log = db.query(LogEntry).filter(LogEntry.id == execution_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found")

    if current_user.role != "ADMIN" and log.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found")

    if log.status == LogStatusEnum.SUCCESS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Completed execution cannot be cancelled")

    log.status = LogStatusEnum.FAILED
    log.error_message = "Cancelled by user"
    db.commit()
    return success_response({"id": log.id, "status": log.status.value}, "Execution cancelled")
