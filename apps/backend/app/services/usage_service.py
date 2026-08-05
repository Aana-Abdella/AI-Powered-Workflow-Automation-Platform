from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import LogEntry, LogStatusEnum, UsageSummary, User


class UsageService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()

    def get_usage(self, *, user: User) -> dict:
        summary = self.db.query(UsageSummary).filter(UsageSummary.tenant_id == user.tenant_id).first()
        if not summary:
            summary = UsageSummary(tenant_id=user.tenant_id)
            self.db.add(summary)
            self.db.commit()
            self.db.refresh(summary)

        percent = 0.0
        if summary.plan == "FREE":
            percent = min(100.0, (summary.total_executions / max(self.settings.free_plan_limit, 1)) * 100)

        return {
            "plan": summary.plan.value,
            "usedExecutions": summary.total_executions,
            "freeLimit": self.settings.free_plan_limit,
            "successfulExecutions": summary.successful_executions,
            "failedExecutions": summary.failed_executions,
            "usagePercent": round(percent, 2),
        }

    def get_analytics(self, *, user: User, days: int = 14) -> dict:
        since = datetime.now(tz=timezone.utc) - timedelta(days=days)
        logs = (
            self.db.query(LogEntry)
            .filter(LogEntry.tenant_id == user.tenant_id, LogEntry.created_at >= since)
            .all()
        )

        grouped: dict[str, dict[str, int]] = defaultdict(lambda: {"executions": 0, "success": 0, "failed": 0})
        for log in logs:
            key = log.created_at.strftime("%Y-%m-%d")
            grouped[key]["executions"] += 1
            if log.status == LogStatusEnum.SUCCESS:
                grouped[key]["success"] += 1
            if log.status == LogStatusEnum.FAILED:
                grouped[key]["failed"] += 1

        points = [
            {
                "label": key,
                "executions": value["executions"],
                "success": value["success"],
                "failed": value["failed"],
            }
            for key, value in sorted(grouped.items(), key=lambda item: item[0])
        ]
        return {"points": points}
