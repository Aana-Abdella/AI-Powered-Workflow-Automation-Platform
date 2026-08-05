from datetime import datetime

from pydantic import BaseModel, EmailStr


class AdminUserResponse(BaseModel):
    id: str
    email: EmailStr
    role: str
    isActive: bool
    createdAt: datetime
    tenantId: str


class SystemHealthResponse(BaseModel):
    status: str
    database: str
    redis: str


class SystemMetricsResponse(BaseModel):
    totalUsers: int
    totalExecutions: int
    activeWorkflows: int
    failedJobs: int
    simulatedRevenue: float
