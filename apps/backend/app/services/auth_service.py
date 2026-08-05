from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    get_password_hash,
    verify_password,
)
from app.models import RefreshToken, RoleEnum, Tenant, TokenBlacklist, UsageSummary, User
from app.services.utils import sha256, slugify


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()

    def _build_user_payload(self, user: User) -> dict:
        return {
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "role": user.role.value,
            "isActive": user.is_active,
            "createdAt": user.created_at,
        }

    @staticmethod
    def _as_utc(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    def _build_org_payload(self, tenant: Tenant) -> dict:
        return {
            "id": tenant.id,
            "name": tenant.name,
            "slug": tenant.slug,
        }

    def _persist_refresh_token(self, user_id: str, refresh_token: str) -> None:
        payload = decode_refresh_token(refresh_token)
        expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        record = RefreshToken(
            user_id=user_id,
            token_hash=sha256(refresh_token),
            expires_at=expires_at,
        )
        self.db.add(record)
        self.db.commit()

    def register(
        self,
        *,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        organization_name: str | None,
    ) -> dict:
        existing = self.db.query(User).filter(User.email == email.lower().strip()).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

        tenant_name = organization_name or f"{first_name}'s Workspace"
        tenant_slug_base = slugify(tenant_name)
        tenant_slug = tenant_slug_base
        suffix = 1
        while self.db.query(Tenant).filter(Tenant.slug == tenant_slug).first():
            suffix += 1
            tenant_slug = f"{tenant_slug_base}-{suffix}"

        tenant = Tenant(name=tenant_name, slug=tenant_slug)
        self.db.add(tenant)
        self.db.flush()

        user = User(
            tenant_id=tenant.id,
            email=email.lower().strip(),
            password_hash=get_password_hash(password),
            first_name=first_name,
            last_name=last_name,
        )
        self.db.add(user)
        self.db.flush()

        usage = UsageSummary(tenant_id=tenant.id)
        self.db.add(usage)
        self.db.commit()
        self.db.refresh(user)
        self.db.refresh(tenant)

        access_token = create_access_token(user_id=user.id, tenant_id=tenant.id, role=user.role.value)
        refresh_token = create_refresh_token(user_id=user.id)
        self._persist_refresh_token(user.id, refresh_token)

        return {
            "user": self._build_user_payload(user),
            "organization": self._build_org_payload(tenant),
            "accessToken": access_token,
            "refreshToken": refresh_token,
        }

    def login(self, *, email: str, password: str) -> dict:
        user = self.db.query(User).filter(User.email == email.lower().strip()).first()
        if not user or not user.is_active or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        tenant = self.db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
        if not tenant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

        access_token = create_access_token(user_id=user.id, tenant_id=user.tenant_id, role=user.role.value)
        refresh_token = create_refresh_token(user_id=user.id)
        self._persist_refresh_token(user.id, refresh_token)

        return {
            "user": self._build_user_payload(user),
            "organization": self._build_org_payload(tenant),
            "accessToken": access_token,
            "refreshToken": refresh_token,
        }

    def refresh(self, *, refresh_token: str) -> dict:
        try:
            payload = decode_refresh_token(refresh_token)
        except jwt.InvalidTokenError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

        token_hash = sha256(refresh_token)
        token_record = self.db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
        if not token_record or token_record.revoked_at is not None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked")

        if self._as_utc(token_record.expires_at) < datetime.now(tz=timezone.utc):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

        user = self.db.query(User).filter(User.id == payload.get("sub")).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive")

        access_token = create_access_token(user_id=user.id, tenant_id=user.tenant_id, role=user.role.value)
        return {"accessToken": access_token}

    def logout(self, *, refresh_token: str | None, access_token: str | None) -> None:
        now = datetime.now(tz=timezone.utc)

        if refresh_token:
            token_hash = sha256(refresh_token)
            token_record = self.db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
            if token_record and token_record.revoked_at is None:
                token_record.revoked_at = now

        if access_token:
            try:
                payload = decode_access_token(access_token)
                exp_ts = payload.get("exp")
                jti = payload.get("jti")
                if exp_ts and jti:
                    expires_at = datetime.fromtimestamp(exp_ts, tz=timezone.utc)
                    existing = self.db.query(TokenBlacklist).filter(TokenBlacklist.jti == jti).first()
                    if not existing:
                        self.db.add(TokenBlacklist(jti=jti, expires_at=expires_at))
            except jwt.InvalidTokenError:
                pass

        self.db.commit()

    def change_password(self, *, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

        user.password_hash = get_password_hash(new_password)

        # Revoke all refresh tokens after password change.
        for token in self.db.query(RefreshToken).filter(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None)).all():
            token.revoked_at = datetime.now(tz=timezone.utc)

        self.db.commit()

    def issue_admin_bootstrap(self) -> None:
        email = self.settings.admin_seed_email
        existing = self.db.query(User).filter(User.email == email).first()
        if existing:
            return

        tenant = Tenant(name="Platform Admin", slug="platform-admin")
        self.db.add(tenant)
        self.db.flush()
        self.db.add(UsageSummary(tenant_id=tenant.id))

        admin = User(
            tenant_id=tenant.id,
            email=email,
            password_hash=get_password_hash(self.settings.admin_seed_password),
            first_name="Platform",
            last_name="Admin",
            role=RoleEnum.ADMIN,
        )
        self.db.add(admin)
        self.db.commit()
