from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.response import success_response
from app.db.session import get_db
from app.models import Tenant, User
from app.services.admin_service import AdminService
from app.services.system_log_service import SystemLogService


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
def list_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    data = AdminService(db).list_users(limit=limit, offset=offset)
    return success_response(data)


@router.get("/users/{user_id}")
def get_user(user_id: str, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    data = {
        "id": user.id,
        "email": user.email,
        "role": user.role.value,
        "isActive": user.is_active,
        "createdAt": user.created_at,
        "tenantId": user.tenant_id,
    }
    return success_response(data)


@router.patch("/users/{user_id}")
def update_user(
    user_id: str,
    payload: dict,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    active = payload.get("isActive")
    if active is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="isActive is required")

    data = AdminService(db).set_user_active(user_id=user_id, active=bool(active))
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    SystemLogService(db).create(
        event="ADMIN_USER_STATUS",
        message=f"Set user {user_id} active={active}",
        actor=admin_user,
    )
    return success_response(data, "User updated")


@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = False
    db.commit()
    SystemLogService(db).create(event="ADMIN_USER_DELETE", message=f"Suspended user {user_id}", actor=admin_user)
    return success_response(message="User suspended")


@router.get("/organizations")
def list_organizations(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    total = db.query(Tenant).count()
    tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).offset(offset).limit(limit).all()
    data = {
        "items": [
            {
                "id": tenant.id,
                "name": tenant.name,
                "slug": tenant.slug,
                "createdAt": tenant.created_at,
            }
            for tenant in tenants
        ],
        "total": total,
    }
    return success_response(data)


@router.get("/logs")
def system_logs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    type: str | None = Query(default=None),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _ = type
    offset = (page - 1) * limit
    data = AdminService(db).system_logs(limit=limit, offset=offset)
    return success_response(data)


@router.get("/health")
def health(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    data = AdminService(db).health()
    return success_response(data)


@router.get("/metrics")
def metrics(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    data = AdminService(db).system_metrics()
    return success_response(data)
