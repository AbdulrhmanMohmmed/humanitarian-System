"""API Key service for machine-to-machine authentication."""
import hashlib
import secrets
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.security import APIKey


def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def create_api_key(
    db: Session, user_id: int, name: str, scopes: str = "read", expires_at: datetime | None = None
) -> dict:
    raw_key = f"hiaos_{secrets.token_urlsafe(32)}"
    prefix = raw_key[:8]
    key_hash = _hash_key(raw_key)

    api_key = APIKey(
        name=name,
        key_hash=key_hash,
        key_prefix=prefix,
        user_id=user_id,
        scopes=scopes,
        expires_at=expires_at,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    return {"id": api_key.id, "key": raw_key, "prefix": prefix, "name": name, "scopes": scopes}


def validate_api_key(db: Session, raw_key: str) -> APIKey | None:
    key_hash = _hash_key(raw_key)
    api_key = db.query(APIKey).filter(
        APIKey.key_hash == key_hash,
        APIKey.is_active == True,
    ).first()
    if not api_key:
        return None
    if api_key.expires_at and api_key.expires_at < datetime.utcnow():
        return None
    api_key.last_used_at = datetime.utcnow()
    db.commit()
    return api_key


def list_api_keys(db: Session, user_id: int) -> list[dict]:
    keys = db.query(APIKey).filter(APIKey.user_id == user_id).order_by(APIKey.created_at.desc()).all()
    return [
        {
            "id": k.id,
            "name": k.name,
            "prefix": k.key_prefix,
            "scopes": k.scopes,
            "is_active": k.is_active,
            "last_used_at": str(k.last_used_at) if k.last_used_at else None,
            "expires_at": str(k.expires_at) if k.expires_at else None,
            "created_at": str(k.created_at),
        }
        for k in keys
    ]


def revoke_api_key(db: Session, key_id: int, user_id: int) -> bool:
    api_key = db.query(APIKey).filter(APIKey.id == key_id, APIKey.user_id == user_id).first()
    if not api_key:
        return False
    api_key.is_active = False
    db.commit()
    return True
