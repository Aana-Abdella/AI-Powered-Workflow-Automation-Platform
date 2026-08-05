from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.response import success_response
from app.db.session import get_db
from app.models import User
from app.schemas.api_key import ApiKeyCreateRequest
from app.services.api_key_service import ApiKeyService


router = APIRouter(prefix="/api-keys", tags=["api-keys"])


@router.post("")
def create_key(
    payload: ApiKeyCreateRequest,
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    data = ApiKeyService(db).create(user=current_user, _name=payload.name)
    return success_response(data, "API key created")


@router.get("")
def list_keys(
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    data = ApiKeyService(db).list(user=current_user)
    return success_response(data)


@router.post("/{api_key_id}/revoke")
def revoke_key(
    api_key_id: str,
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    ApiKeyService(db).revoke(user=current_user, api_key_id=api_key_id)
    return success_response(message="API key revoked")


@router.delete("/{api_key_id}")
def delete_key(
    api_key_id: str,
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    ApiKeyService(db).revoke(user=current_user, api_key_id=api_key_id)
    return success_response(message="API key deleted")


@router.get("/{api_key_id}")
def get_key(
    api_key_id: str,
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    items = ApiKeyService(db).list(user=current_user)
    item = next((entry for entry in items if entry["id"] == api_key_id), None)
    if not item:
        return success_response(None)
    return success_response(item)


@router.post("/{api_key_id}/regenerate")
def regenerate_key(
    api_key_id: str,
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    service = ApiKeyService(db)
    service.revoke(user=current_user, api_key_id=api_key_id)
    data = service.create(user=current_user, _name="Regenerated")
    return success_response(data, "API key regenerated")
