from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.response import success_response
from app.db.session import get_db
from app.models import User
from app.services.usage_service import UsageService


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/usage")
def usage(
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    data = UsageService(db).get_usage(user=current_user)
    return success_response(data)


@router.get("/executions")
def executions(
    organizationId: str | None = Query(default=None),
    startDate: str | None = Query(default=None),
    endDate: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = (organizationId, startDate, endDate)
    data = UsageService(db).get_analytics(user=current_user)
    return success_response(data)


@router.get("/billing")
def billing(
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = organizationId
    settings = get_settings()
    usage_data = UsageService(db).get_usage(user=current_user)
    overage = max(usage_data["usedExecutions"] - settings.free_plan_limit, 0)
    data = {
        **usage_data,
        "estimatedBill": round(overage * 0.05, 2),
        "plans": {
            "free": {"name": "Free", "limit": settings.free_plan_limit, "price": 0},
            "pro": {"name": "Pro", "limit": "Unlimited", "price": 49},
        },
    }
    return success_response(data)


@router.get("/plans")
def plans():
    data = [
        {
            "id": "free",
            "name": "Free",
            "price": 0,
            "limit": 100,
            "features": ["100 executions", "Basic logs", "Single tenant"],
        },
        {
            "id": "pro",
            "name": "Pro (Simulated)",
            "price": 49,
            "limit": "Unlimited",
            "features": ["Unlimited executions", "Advanced analytics", "Admin controls"],
        },
    ]
    return success_response(data)
