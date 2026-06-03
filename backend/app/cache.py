"""Caching layer with Redis support and in-memory fallback."""
import time
import json
import hashlib
import logging
from typing import Optional, Any
from functools import wraps

logger = logging.getLogger(__name__)

_memory_cache: dict[str, tuple[float, Any]] = {}
_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        from app.config import settings
        redis_url = getattr(settings, "REDIS_URL", "")
        if redis_url:
            import redis
            _redis_client = redis.from_url(redis_url, decode_responses=True)
            _redis_client.ping()
            logger.info("Redis cache connected: %s", redis_url)
            return _redis_client
    except Exception:
        logger.debug("Redis not available, using in-memory cache")
    _redis_client = False
    return None


def _make_key(prefix: str, *args, **kwargs) -> str:
    raw = f"{prefix}:{args}:{sorted(kwargs.items())}"
    return hashlib.md5(raw.encode()).hexdigest()


def cache_get(key: str) -> Optional[Any]:
    r = _get_redis()
    if r:
        try:
            val = r.get(f"hiaos:{key}")
            if val is not None:
                return json.loads(val)
            return None
        except Exception:
            pass

    if key in _memory_cache:
        expires, value = _memory_cache[key]
        if time.time() < expires:
            return value
        del _memory_cache[key]
    return None


def cache_set(key: str, value: Any, ttl: int = 300):
    r = _get_redis()
    if r:
        try:
            r.setex(f"hiaos:{key}", ttl, json.dumps(value, default=str))
            return
        except Exception:
            pass

    _memory_cache[key] = (time.time() + ttl, value)


def cache_delete(key: str):
    r = _get_redis()
    if r:
        try:
            r.delete(f"hiaos:{key}")
            return
        except Exception:
            pass
    _memory_cache.pop(key, None)


def cache_delete_pattern(pattern: str):
    r = _get_redis()
    if r:
        try:
            for k in r.scan_iter(f"hiaos:*{pattern}*"):
                r.delete(k)
            return
        except Exception:
            pass

    keys_to_delete = [k for k in _memory_cache if pattern in k]
    for k in keys_to_delete:
        del _memory_cache[k]


def cached(prefix: str, ttl: int = 300):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = _make_key(prefix, *args, **kwargs)
            result = cache_get(key)
            if result is not None:
                return result
            result = func(*args, **kwargs)
            cache_set(key, result, ttl)
            return result
        return wrapper
    return decorator
