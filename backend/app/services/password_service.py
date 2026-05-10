"""Password history service — prevents reuse of recent passwords."""
from sqlalchemy.orm import Session
from app.auth import pwd_context
from app.models.security import PasswordHistory

MAX_HISTORY = 5


def check_password_reuse(db: Session, user_id: int, new_password: str) -> bool:
    """Return True if password was recently used (blocked)."""
    recent = (
        db.query(PasswordHistory)
        .filter(PasswordHistory.user_id == user_id)
        .order_by(PasswordHistory.created_at.desc())
        .limit(MAX_HISTORY)
        .all()
    )
    return any(pwd_context.verify(new_password, h.hashed_password) for h in recent)


def record_password(db: Session, user_id: int, hashed_password: str) -> None:
    db.add(PasswordHistory(user_id=user_id, hashed_password=hashed_password))
    db.commit()
