from sqlalchemy.orm import Session

from app.models import SystemLog, User


class SystemLogService:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        *,
        event: str,
        message: str,
        level: str = "INFO",
        actor: User | None = None,
        tenant_id: str | None = None,
    ) -> None:
        entry = SystemLog(
            event=event,
            message=message,
            level=level,
            actor_user_id=actor.id if actor else None,
            tenant_id=tenant_id or (actor.tenant_id if actor else None),
        )
        self.db.add(entry)
        self.db.commit()
