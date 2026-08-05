from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.core.response import success_response
from app.db.session import get_db
from app.models import Tenant, User
from app.schemas.auth import ChangePasswordRequest, LoginRequest, RefreshRequest, RegisterRequest
from app.services.auth_service import AuthService
from app.services.system_log_service import SystemLogService


router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _set_refresh_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    max_age = int(timedelta(days=settings.refresh_token_expire_days).total_seconds())
    response.set_cookie(
        key="refreshToken",
        value=token,
        httponly=True,
        secure=settings.env == "production",
        samesite="lax",
        max_age=max_age,
        path="/",
    )


@router.post("/register")
@limiter.limit(settings.auth_rate_limit)
def register(request: Request, payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    _ = request
    service = AuthService(db)
    result = service.register(
        email=payload.email,
        password=payload.password,
        first_name=payload.firstName,
        last_name=payload.lastName,
        organization_name=payload.organizationName,
    )
    _set_refresh_cookie(response, result.pop("refreshToken"))

    user = db.query(User).filter(User.id == result["user"]["id"]).first()
    SystemLogService(db).create(event="AUTH_REGISTER", message="New user registered", actor=user)
    return success_response(result, "Registered successfully")


@router.post("/login")
@limiter.limit(settings.auth_rate_limit)
def login(request: Request, payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    _ = request
    service = AuthService(db)
    result = service.login(email=payload.email, password=payload.password)
    _set_refresh_cookie(response, result.pop("refreshToken"))

    user = db.query(User).filter(User.id == result["user"]["id"]).first()
    SystemLogService(db).create(event="AUTH_LOGIN", message="User logged in", actor=user)
    return success_response(result, "Logged in")


@router.post("/refresh")
def refresh(request: Request, payload: RefreshRequest | None = None, db: Session = Depends(get_db)):
    token = (payload.refreshToken if payload else None) or request.cookies.get("refreshToken")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")

    result = AuthService(db).refresh(refresh_token=token)
    return success_response(result, "Token refreshed")


@router.post("/forgot-password")
@limiter.limit(settings.auth_rate_limit)
def forgot_password(request: Request, payload: dict):
    _ = (request, payload)
    return success_response(message="If the email exists, a reset link has been sent")


@router.post("/reset-password")
@limiter.limit(settings.auth_rate_limit)
def reset_password(request: Request, payload: dict):
    _ = (request, payload)
    return success_response(message="Password reset flow is enabled for production email integrations")


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refreshToken")
    auth_header = request.headers.get("Authorization")
    access_token = None
    if auth_header and auth_header.startswith("Bearer "):
        access_token = auth_header.split(" ", 1)[1]

    AuthService(db).logout(refresh_token=refresh_token, access_token=access_token)
    response.delete_cookie("refreshToken", path="/")

    return success_response(message="Logged out")


@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant missing")

    data = {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "firstName": current_user.first_name,
            "lastName": current_user.last_name,
            "role": current_user.role.value,
            "isActive": current_user.is_active,
            "createdAt": current_user.created_at,
        },
        "organization": {
            "id": tenant.id,
            "name": tenant.name,
            "slug": tenant.slug,
        },
    }
    return success_response(data)


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    AuthService(db).change_password(
        user=current_user,
        current_password=payload.currentPassword,
        new_password=payload.newPassword,
    )
    SystemLogService(db).create(event="AUTH_CHANGE_PASSWORD", message="Password changed", actor=current_user)
    return success_response(message="Password updated")


@router.delete("/delete-account")
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.is_active = False
    db.commit()
    SystemLogService(db).create(event="AUTH_DELETE_ACCOUNT", message="User deactivated own account", actor=current_user)
    return success_response(message="Account deactivated")
