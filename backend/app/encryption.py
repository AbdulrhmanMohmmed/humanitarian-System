"""
Field-level AES-256 encryption for PII (Personally Identifiable Information).

Usage:
    from app.encryption import pii_encrypt, pii_decrypt, EncryptedString

    # Encrypt before storing
    stored = pii_encrypt("محمد علي")

    # Decrypt when reading
    plain  = pii_decrypt(stored)

    # SQLAlchemy TypeDecorator — used in models
    class Beneficiary(Base):
        first_name = Column(EncryptedString(255))
"""

import base64
import os
import logging
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import String
from sqlalchemy.types import TypeDecorator

from app.config import settings

logger = logging.getLogger(__name__)

# ── Key Setup ─────────────────────────────────────────────────────────────────

def _get_fernet() -> Optional[Fernet]:
    """Return a Fernet instance if a valid key is configured, else None."""
    key = settings.PII_ENCRYPTION_KEY
    if not key:
        return None
    try:
        return Fernet(key.encode() if isinstance(key, str) else key)
    except Exception:
        logger.warning(
            "PII_ENCRYPTION_KEY is set but invalid. "
            "PII data will be stored unencrypted. "
            "Generate a valid key with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
        return None


_fernet: Optional[Fernet] = _get_fernet()

ENCRYPTION_PREFIX = "enc:"  # Marks encrypted values in the DB


# ── Encrypt / Decrypt ─────────────────────────────────────────────────────────

def pii_encrypt(value: Optional[str]) -> Optional[str]:
    """Encrypt a plaintext string. Returns None for None input."""
    if value is None:
        return None
    if _fernet is None:
        return value  # Encryption not configured — store as-is
    if value.startswith(ENCRYPTION_PREFIX):
        return value  # Already encrypted

    try:
        encrypted_bytes = _fernet.encrypt(value.encode("utf-8"))
        return ENCRYPTION_PREFIX + base64.urlsafe_b64encode(encrypted_bytes).decode("ascii")
    except Exception as e:
        logger.error(f"PII encryption failed: {e}")
        return value  # Fallback: store plaintext rather than crash


def pii_decrypt(value: Optional[str]) -> Optional[str]:
    """Decrypt an encrypted string. Returns None for None input."""
    if value is None:
        return None
    if not isinstance(value, str) or not value.startswith(ENCRYPTION_PREFIX):
        return value  # Not encrypted or wrong type — return as-is

    if _fernet is None:
        return value  # Can't decrypt without key

    try:
        encrypted_bytes = base64.urlsafe_b64decode(value[len(ENCRYPTION_PREFIX):])
        return _fernet.decrypt(encrypted_bytes).decode("utf-8")
    except (InvalidToken, Exception) as e:
        logger.error(f"PII decryption failed: {e}")
        return value  # Fallback: return ciphertext rather than crash


def is_encryption_enabled() -> bool:
    """Check if PII encryption is active."""
    return _fernet is not None


# ── SQLAlchemy TypeDecorator ──────────────────────────────────────────────────

class EncryptedString(TypeDecorator):
    """
    A SQLAlchemy column type that transparently encrypts/decrypts values.

    Example::
        first_name = Column(EncryptedString(255))
    """
    impl = String
    cache_ok = True

    def __init__(self, length: int = 500, *args, **kwargs):
        super().__init__(length, *args, **kwargs)

    def process_bind_param(self, value, dialect):
        """Called before writing to DB — encrypt."""
        return pii_encrypt(value)

    def process_result_value(self, value, dialect):
        """Called after reading from DB — decrypt."""
        return pii_decrypt(value)
