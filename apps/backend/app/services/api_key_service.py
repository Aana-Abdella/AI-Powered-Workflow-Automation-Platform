from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models import ApiKey, User
from app.services.utils import generate_api_key, sha256


class ApiKeyService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, *, user: User, _name: str) -> dict:
        raw_key = generate_api_key()
        key_hash = sha256(raw_key)
        key_prefix = raw_key[:12]

        record = ApiKey(
            tenant_id=user.tenant_id,
            user_id=user.id,
            key_prefix=key_prefix,
            key_hash=key_hash,
            is_active=True,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        return {
            "id": record.id,
            "key": raw_key,
            "keyPrefix": key_prefix,
            "isActive": record.is_active,
            "createdAt": record.created_at,
        }

    def list(self, *, user: User) -> list[dict]:
        query = self.db.query(ApiKey).order_by(desc(ApiKey.created_at))
        if user.role != "ADMIN":
            query = query.filter(ApiKey.tenant_id == user.tenant_id, ApiKey.user_id == user.id)
        keys = query.all()
        return [
            {
                "id": item.id,
                "keyPrefix": item.key_prefix,
                "isActive": item.is_active,
                "createdAt": item.created_at,
            }
            for item in keys
        ]

    def revoke(self, *, user: User, api_key_id: str) -> None:
        query = self.db.query(ApiKey).filter(ApiKey.id == api_key_id)
        if user.role != "ADMIN":
            query = query.filter(ApiKey.tenant_id == user.tenant_id, ApiKey.user_id == user.id)
        record = query.first()
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
        record.is_active = False
        self.db.commit()
