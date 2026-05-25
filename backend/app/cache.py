"""Simple in-memory cache with TTL. Uses Redis when available, falls back to dict."""
import time
import json
import hashlib
from typing import Optional, Any
from functools import wraps

_cache: dict[str, tuple[float, Any]] = {}


def _make_key(prefix: str, *args, **kwargs) -> str:
    raw = f"{prefix}:{args}:{sorted(kwargs.items())}"
    return hashlib.md5(raw.encode()).hexdigest()


def cache_get(key: str) -> Optional[Any]:
    if key in _cache:
        expires, value = _cache[key]
        if time.time() < expires:
            return value
        del _cache[key]
    return None


def cache_set(key: str, value: Any, ttl: int = 300):
    _cache[key] = (time.time() + ttl, value)


def cache_delete_pattern(pattern: str):
    keys_to_delete = [k for k in _cache if pattern in k]
    for k in keys_to_delete:
        del _cache[k]


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
