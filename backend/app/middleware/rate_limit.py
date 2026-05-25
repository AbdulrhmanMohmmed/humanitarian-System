"""Rate limiting configuration using slowapi."""
import sys

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

_testing = "pytest" in sys.modules
_default = ["9999/minute"] if _testing else [settings.RATE_LIMIT_DEFAULT]

limiter = Limiter(key_func=get_remote_address, default_limits=_default, enabled=not _testing)
