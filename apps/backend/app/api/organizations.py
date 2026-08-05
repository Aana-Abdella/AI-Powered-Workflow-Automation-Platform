from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.response import success_response
from app.db.session import get_db
from app.models import Tenant, User
from app.services.system_log_service import SystemLogService
from app.services.utils import slugify


router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("")
def list_orgs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "ADMIN":
        tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).all()
    else:
        tenants = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).all()

    data = [{"id": tenant.id, "name": tenant.name, "slug": tenant.slug} for tenant in tenants]
    return success_response(data)


@router.get("/{org_id}")
def get_org(org_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.id == org_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    if current_user.role != "ADMIN" and tenant.id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    return success_response({"id": tenant.id, "name": tenant.name, "slug": tenant.slug})


@router.post("")
def create_org(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = payload.get("name")
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="name is required")

    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")

    slug_base = slugify(name)
    slug = slug_base
    idx = 1
    while db.query(Tenant).filter(Tenant.slug == slug).first():
        idx += 1
        slug = f"{slug_base}-{idx}"

    tenant = Tenant(name=name, slug=slug)
    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    SystemLogService(db).create(event="ORG_CREATE", message=f"Created org {tenant.name}", actor=current_user)
    return success_response({"id": tenant.id, "name": tenant.name, "slug": tenant.slug}, "Organization created")


@router.patch("/{org_id}")
def update_org(org_id: str, payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.id == org_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    if current_user.role != "ADMIN" and tenant.id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    name = payload.get("name")
    if name:
        tenant.name = name
    db.commit()
    db.refresh(tenant)

    return success_response({"id": tenant.id, "name": tenant.name, "slug": tenant.slug}, "Organization updated")
