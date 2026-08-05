from datetime import datetime

from pydantic import BaseModel, Field


class WorkflowCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=160)


class WorkflowUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    isActive: bool | None = None


class WorkflowResponse(BaseModel):
    id: str
    name: str
    webhookKey: str
    webhookUrl: str
    isActive: bool
    createdAt: datetime


class WebhookPayload(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
