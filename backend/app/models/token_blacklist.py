"""Token blacklist and login attempt tracking for security."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class TokenBlacklist(Base):
    """Revoked JWT tokens (after logout or refresh rotation)."""
    __tablename__ = "token_blacklist"

    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String(255), unique=True, nullable=False, index=True)
    token_type = Column(String(20), default="access")
    user_id = Column(Integer, index=True)
    revoked_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)


class LoginAttempt(Base):
    """Tracks failed login attempts for account lockout."""
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), nullable=False, index=True)
    ip_address = Column(String(50))
    success = Column(Integer, default=0)
    attempted_at = Column(DateTime, default=datetime.utcnow)
