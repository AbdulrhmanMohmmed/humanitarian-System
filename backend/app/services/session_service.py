"""User session management — view, track, and terminate active sessions."""
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.security import UserSession


def create_session(
    db: Session, user_id: int, jti: str, ip_address: str = "", user_agent: str = "", expires_at: datetime | None = None
) -> UserSession:
    device = _parse_device(user_agent)
    session = UserSession(
        user_id=user_id,
        jti=jti,
        ip_address=ip_address,
        user_agent=user_agent[:500] if user_agent else "",
        device_info=device,
        expires_at=expires_at,
    )
    db.add(session)
    db.commit()
    return session


def list_active_sessions(db: Session, user_id: int) -> list[dict]:
    sessions = (
        db.query(UserSession)
        .filter(UserSession.user_id == user_id, UserSession.is_active == True)
        .order_by(UserSession.last_activity.desc())
        .all()
    )
    return [
        {
            "id": s.id,
            "ip_address": s.ip_address,
            "device_info": s.device_info,
            "created_at": str(s.created_at),
            "last_activity": str(s.last_activity),
        }
        for s in sessions
    ]


def terminate_session(db: Session, session_id: int, user_id: int) -> bool:
    session = db.query(UserSession).filter(
        UserSession.id == session_id, UserSession.user_id == user_id
    ).first()
    if not session:
        return False
    session.is_active = False
    db.commit()
    return True


def terminate_all_sessions(db: Session, user_id: int, exclude_jti: str | None = None) -> int:
    query = db.query(UserSession).filter(
        UserSession.user_id == user_id, UserSession.is_active == True
    )
    if exclude_jti:
        query = query.filter(UserSession.jti != exclude_jti)
    count = query.update({"is_active": False})
    db.commit()
    return count


def _parse_device(user_agent: str) -> str:
    ua = (user_agent or "").lower()
    if "mobile" in ua or "android" in ua or "iphone" in ua:
        return "Mobile"
    if "tablet" in ua or "ipad" in ua:
        return "Tablet"
    return "Desktop"
