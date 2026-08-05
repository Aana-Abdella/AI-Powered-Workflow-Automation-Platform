from datetime import datetime, timedelta, timezone
import secrets
from typing import Any, Dict

import jwt
from passlib.context import CryptContext

from app.core.config import get_settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def _build_payload(subject: Dict[str, Any], expires_delta: timedelta, token_type: str) -> Dict[str, Any]:
    now = datetime.now(tz=timezone.utc)
    return {
        **subject,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
        "jti": secrets.token_urlsafe(16),
        "typ": token_type,
    }


def create_access_token(*, user_id: str, tenant_id: str, role: str) -> str:
    settings = get_settings()
    payload = _build_payload(
        {"sub": user_id, "tenant_id": tenant_id, "role": role},
        timedelta(minutes=settings.access_token_expire_minutes),
        "access",
    )
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def create_refresh_token(*, user_id: str) -> str:
    settings = get_settings()
    payload = _build_payload(
        {"sub": user_id},
        timedelta(days=settings.refresh_token_expire_days),
        "refresh",
    )
    return jwt.encode(payload, settings.jwt_refresh_secret, algorithm="HS256")


def decode_access_token(token: str) -> Dict[str, Any]:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])


def decode_refresh_token(token: str) -> Dict[str, Any]:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_refresh_secret, algorithms=["HS256"])
