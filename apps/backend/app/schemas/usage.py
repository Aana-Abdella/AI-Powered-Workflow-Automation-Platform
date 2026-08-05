from pydantic import BaseModel


class UsageResponse(BaseModel):
    plan: str
    usedExecutions: int
    freeLimit: int
    successfulExecutions: int
    failedExecutions: int
    usagePercent: float


class AnalyticsPoint(BaseModel):
    label: str
    executions: int
    success: int
    failed: int


class AnalyticsResponse(BaseModel):
    points: list[AnalyticsPoint]
