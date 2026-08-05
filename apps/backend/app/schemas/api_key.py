from datetime import datetime

from pydantic import BaseModel, Field


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)


class ApiKeyResponse(BaseModel):
    id: str
    keyPrefix: str
    isActive: bool
    createdAt: datetime


class ApiKeyCreateResponse(ApiKeyResponse):
    key: str
