from datetime import datetime

from pydantic import BaseModel


class LogResponse(BaseModel):
    id: str
    workflowId: str
    workflowName: str
    inputText: str
    outputText: str | None
    status: str
    errorMessage: str | None
    attempts: int
    createdAt: datetime


class PaginatedLogsResponse(BaseModel):
    items: list[LogResponse]
    total: int
