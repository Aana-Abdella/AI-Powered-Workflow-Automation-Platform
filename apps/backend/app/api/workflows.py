from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.response import success_response
from app.db.session import get_db
from app.models import User
from app.schemas.workflow import WorkflowCreateRequest, WorkflowUpdateRequest
from app.services.log_service import LogService
from app.services.system_log_service import SystemLogService
from app.services.workflow_service import WorkflowService


router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("")
def create_workflow(
    payload: WorkflowCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workflow = WorkflowService(db).create(user=current_user, name=payload.name, definition=payload.definition)
    SystemLogService(db).create(event="WORKFLOW_CREATE", message=f"Workflow created: {payload.name}", actor=current_user)
    return success_response(workflow, "Workflow created")


@router.get("")
def list_workflows(
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    items = WorkflowService(db).list(user=current_user)
    return success_response(items)


@router.get("/{workflow_id}")
def get_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workflow = WorkflowService(db).get(user=current_user, workflow_id=workflow_id)
    return success_response(workflow)


@router.patch("/{workflow_id}")
def update_workflow(
    workflow_id: str,
    payload: WorkflowUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workflow = WorkflowService(db).update(
        user=current_user,
        workflow_id=workflow_id,
        name=payload.name,
        is_active=payload.isActive,
        definition=payload.definition,
    )
    return success_response(workflow, "Workflow updated")


@router.delete("/{workflow_id}")
def delete_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    WorkflowService(db).delete(user=current_user, workflow_id=workflow_id)
    SystemLogService(db).create(event="WORKFLOW_DELETE", message=f"Workflow deleted: {workflow_id}", actor=current_user)
    return success_response(message="Workflow deleted")


@router.post("/{workflow_id}/enable")
def enable_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workflow = WorkflowService(db).set_active(user=current_user, workflow_id=workflow_id, active=True)
    return success_response(workflow, "Workflow enabled")


@router.post("/{workflow_id}/disable")
def disable_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workflow = WorkflowService(db).set_active(user=current_user, workflow_id=workflow_id, active=False)
    return success_response(workflow, "Workflow disabled")


@router.get("/{workflow_id}/executions")
def workflow_logs(
    workflow_id: str,
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Ensure user can access workflow before returning logs.
    WorkflowService(db).get(user=current_user, workflow_id=workflow_id)
    result = LogService(db).list_logs(user=current_user, workflow_id=workflow_id, limit=limit, offset=offset)
    return success_response(result)
