from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.redis_client import redis_client
from app.models import LogEntry, LogStatusEnum, SystemLog, User, Workflow


class AdminService:
    def __init__(self, db: Session):
        self.db = db

    def list_users(self, *, limit: int, offset: int) -> dict:
        total = self.db.query(func.count(User.id)).scalar() or 0
        users = self.db.query(User).order_by(User.created_at.desc()).offset(offset).limit(limit).all()
        return {
            "items": [
                {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role.value,
                    "isActive": user.is_active,
                    "createdAt": user.created_at,
                    "tenantId": user.tenant_id,
                }
                for user in users
            ],
            "total": total,
        }

    def set_user_active(self, *, user_id: str, active: bool) -> dict | None:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        user.is_active = active
        self.db.commit()
        self.db.refresh(user)
        return {
            "id": user.id,
            "email": user.email,
            "role": user.role.value,
            "isActive": user.is_active,
            "createdAt": user.created_at,
            "tenantId": user.tenant_id,
        }

    def system_metrics(self) -> dict:
        total_users = self.db.query(func.count(User.id)).scalar() or 0
        total_executions = self.db.query(func.count(LogEntry.id)).scalar() or 0
        active_workflows = self.db.query(func.count(Workflow.id)).filter(Workflow.is_active.is_(True)).scalar() or 0
        failed_jobs = self.db.query(func.count(LogEntry.id)).filter(LogEntry.status == LogStatusEnum.FAILED).scalar() or 0

        simulated_revenue = round((max(total_executions - 1000, 0) * 0.05) + (total_users * 9.0), 2)

        return {
            "totalUsers": total_users,
            "totalExecutions": total_executions,
            "activeWorkflows": active_workflows,
            "failedJobs": failed_jobs,
            "simulatedRevenue": simulated_revenue,
        }

    def system_logs(self, *, limit: int, offset: int) -> dict:
        total = self.db.query(func.count(SystemLog.id)).scalar() or 0
        logs = self.db.query(SystemLog).order_by(SystemLog.created_at.desc()).offset(offset).limit(limit).all()
        return {
            "items": [
                {
                    "id": item.id,
                    "level": item.level,
                    "event": item.event,
                    "message": item.message,
                    "tenantId": item.tenant_id,
                    "createdAt": item.created_at,
                }
                for item in logs
            ],
            "total": total,
        }

    def health(self) -> dict:
        database_status = "up"
        redis_status = "up"

        try:
            self.db.execute(func.now())
        except Exception:
            database_status = "down"

        try:
            redis_client.ping()
        except Exception:
            redis_status = "down"

        status_value = "healthy" if database_status == "up" and redis_status == "up" else "degraded"
        return {
            "status": status_value,
            "database": database_status,
            "redis": redis_status,
        }
