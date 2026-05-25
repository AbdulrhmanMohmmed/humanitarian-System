"""Security services: token blacklist and account lockout."""

from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models.token_blacklist import LoginAttempt, TokenBlacklist

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 30


def blacklist_token(
    db: Session, jti: str, user_id: int, token_type: str = "access",
    expires_at: Optional[datetime] = None,
):
    """Add a token to the blacklist (on logout or refresh rotation)."""
    entry = TokenBlacklist(
        jti=jti, user_id=user_id, token_type=token_type, expires_at=expires_at,
    )
    db.add(entry)
    db.commit()


def is_token_blacklisted(db: Session, jti: str) -> bool:
    """Check if a token JTI has been revoked."""
    return db.query(TokenBlacklist).filter(TokenBlacklist.jti == jti).first() is not None


def cleanup_expired_tokens(db: Session):
    """Remove expired tokens from blacklist to keep table small."""
    db.query(TokenBlacklist).filter(
        TokenBlacklist.expires_at < datetime.now(timezone.utc),
    ).delete()
    db.commit()


def record_login_attempt(
    db: Session, username: str, ip_address: str, success: bool,
):
    """Record a login attempt."""
    attempt = LoginAttempt(
        username=username,
        ip_address=ip_address,
        success=1 if success else 0,
    )
    db.add(attempt)
    db.commit()

    if success:
        db.query(LoginAttempt).filter(
            LoginAttempt.username == username,
            LoginAttempt.success == 0,
        ).delete()
        db.commit()


def is_account_locked(db: Session, username: str) -> bool:
    """Check if account is locked due to too many failed attempts."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=LOCKOUT_DURATION_MINUTES)
    failed_count = (
        db.query(LoginAttempt)
        .filter(
            LoginAttempt.username == username,
            LoginAttempt.success == 0,
            LoginAttempt.attempted_at >= cutoff,
        )
        .count()
    )
    return failed_count >= MAX_FAILED_ATTEMPTS


def get_remaining_lockout_seconds(db: Session, username: str) -> int:
    """Get seconds remaining on account lockout, or 0 if not locked."""
    if not is_account_locked(db, username):
        return 0
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=LOCKOUT_DURATION_MINUTES)
    oldest_in_window = (
        db.query(LoginAttempt)
        .filter(
            LoginAttempt.username == username,
            LoginAttempt.success == 0,
            LoginAttempt.attempted_at >= cutoff,
        )
        .order_by(LoginAttempt.attempted_at.asc())
        .first()
    )
    if oldest_in_window:
        unlock_at = oldest_in_window.attempted_at + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
        remaining = (unlock_at - datetime.now(timezone.utc)).total_seconds()
        return max(0, int(remaining))
    return 0
