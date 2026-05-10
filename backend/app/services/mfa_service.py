"""MFA/TOTP service for two-factor authentication."""
import hashlib
import json
import secrets
from datetime import datetime

import pyotp
from sqlalchemy.orm import Session

from app.models.security import UserMFA


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def get_totp_uri(secret: str, username: str, issuer: str = "HIAOS") -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(name=username, issuer_name=issuer)


def verify_totp(secret: str, code: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)


def _hash_backup(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def generate_backup_codes(count: int = 8) -> tuple[list[str], list[str]]:
    """Returns (plain_codes, hashed_codes)."""
    plain = [secrets.token_hex(4).upper() for _ in range(count)]
    hashed = [_hash_backup(c) for c in plain]
    return plain, hashed


def setup_mfa(db: Session, user_id: int) -> dict:
    existing = db.query(UserMFA).filter(UserMFA.user_id == user_id).first()
    secret = generate_totp_secret()
    plain_codes, hashed_codes = generate_backup_codes()

    if existing:
        existing.totp_secret = secret
        existing.is_enabled = False
        existing.backup_codes = json.dumps(hashed_codes)
        existing.updated_at = datetime.utcnow()
    else:
        existing = UserMFA(
            user_id=user_id,
            totp_secret=secret,
            is_enabled=False,
            backup_codes=json.dumps(hashed_codes),
        )
        db.add(existing)

    db.commit()
    return {"secret": secret, "backup_codes": plain_codes}


def confirm_mfa(db: Session, user_id: int, code: str) -> bool:
    mfa = db.query(UserMFA).filter(UserMFA.user_id == user_id).first()
    if not mfa:
        return False
    if not verify_totp(mfa.totp_secret, code):
        return False
    mfa.is_enabled = True
    mfa.updated_at = datetime.utcnow()
    db.commit()
    return True


def disable_mfa(db: Session, user_id: int) -> bool:
    mfa = db.query(UserMFA).filter(UserMFA.user_id == user_id).first()
    if not mfa:
        return False
    mfa.is_enabled = False
    mfa.updated_at = datetime.utcnow()
    db.commit()
    return True


def verify_mfa_login(db: Session, user_id: int, code: str) -> bool:
    mfa = db.query(UserMFA).filter(UserMFA.user_id == user_id, UserMFA.is_enabled == True).first()
    if not mfa:
        return True  # MFA not enabled, allow login

    if verify_totp(mfa.totp_secret, code):
        return True

    # Check backup codes
    hashed = json.loads(mfa.backup_codes) if mfa.backup_codes else []
    code_hash = _hash_backup(code)
    if code_hash in hashed:
        hashed.remove(code_hash)
        mfa.backup_codes = json.dumps(hashed)
        db.commit()
        return True

    return False


def is_mfa_enabled(db: Session, user_id: int) -> bool:
    mfa = db.query(UserMFA).filter(UserMFA.user_id == user_id, UserMFA.is_enabled == True).first()
    return mfa is not None
