from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import get_password_hash
from app.core.response import success_response
from app.db.session import get_db
from app.models import RoleEnum, User
from app.services.system_log_service import SystemLogService


router = APIRouter(prefix="/team", tags=["team"])


def _require_tenant_admin(user: User) -> None:
    if user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


@router.get("/members")
def members(
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    users = db.query(User).filter(User.tenant_id == current_user.tenant_id).order_by(User.created_at.desc()).all()
    data = [
        {
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "role": user.role.value,
            "isActive": user.is_active,
            "createdAt": user.created_at,
        }
        for user in users
    ]
    return success_response(data)


@router.post("/members")
def invite_member(
    payload: dict,
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    _require_tenant_admin(current_user)

    email = payload.get("email")
    role = payload.get("role", "USER")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="email is required")

    existing = db.query(User).filter(User.email == email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    member = User(
        tenant_id=current_user.tenant_id,
        email=email.lower().strip(),
        password_hash=get_password_hash("Temp@12345"),
        first_name="Team",
        last_name="Member",
        role=RoleEnum.ADMIN if role == "ADMIN" else RoleEnum.USER,
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    SystemLogService(db).create(event="TEAM_INVITE", message=f"Invited {member.email}", actor=current_user)
    data = {
        "id": member.id,
        "email": member.email,
        "firstName": member.first_name,
        "lastName": member.last_name,
        "role": member.role.value,
        "isActive": member.is_active,
        "createdAt": member.created_at,
    }
    return success_response(data, "Member invited")


@router.patch("/members/{user_id}")
def update_member(
    user_id: str,
    payload: dict,
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    _require_tenant_admin(current_user)

    member = db.query(User).filter(User.id == user_id, User.tenant_id == current_user.tenant_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    role = payload.get("role")
    if role:
        member.role = RoleEnum.ADMIN if role == "ADMIN" else RoleEnum.USER

    db.commit()
    db.refresh(member)
    return success_response(
        {
            "id": member.id,
            "email": member.email,
            "role": member.role.value,
            "isActive": member.is_active,
            "createdAt": member.created_at,
        },
        "Member updated",
    )


@router.delete("/members/{user_id}")
def remove_member(
    user_id: str,
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    _require_tenant_admin(current_user)

    member = db.query(User).filter(User.id == user_id, User.tenant_id == current_user.tenant_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    member.is_active = False
    db.commit()

    return success_response(message="Member removed")


@router.post("/leave")
def leave_org(
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    current_user.is_active = False
    db.commit()
    return success_response(message="You left the organization")
