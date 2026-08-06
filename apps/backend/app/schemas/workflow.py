from datetime import datetime

from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


class WorkflowCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    definition: "WorkflowDefinition | None" = None


class WorkflowTrigger(BaseModel):
    type: Literal["webhook"] = "webhook"
    config: dict[str, Any] = Field(default_factory=dict)


class WorkflowStep(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    type: Literal["ai", "http"]
    operation: str | None = None
    config: dict[str, Any] = Field(default_factory=dict)


class WorkflowDefinition(BaseModel):
    trigger: WorkflowTrigger = Field(default_factory=WorkflowTrigger)
    steps: list[WorkflowStep] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def validate_steps(self):
        if len({step.id for step in self.steps}) != len(self.steps):
            raise ValueError("Workflow step ids must be unique")
        return self


class WorkflowUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    isActive: bool | None = None
    definition: WorkflowDefinition | None = None


class WorkflowResponse(BaseModel):
    id: str
    name: str
    webhookKey: str
    webhookUrl: str
    isActive: bool
    createdAt: datetime
    definition: WorkflowDefinition


class WebhookPayload(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
