"""Tests for caching layer."""
import time
from app.cache import cache_get, cache_set, cache_delete, cache_delete_pattern, _memory_cache


def test_cache_set_and_get():
    _memory_cache.clear()
    cache_set("test:key1", {"value": 42}, ttl=60)
    result = cache_get("test:key1")
    assert result == {"value": 42}


def test_cache_miss():
    _memory_cache.clear()
    result = cache_get("nonexistent:key")
    assert result is None


def test_cache_expiry():
    _memory_cache.clear()
    cache_set("test:expire", "data", ttl=1)
    assert cache_get("test:expire") == "data"
    time.sleep(1.1)
    assert cache_get("test:expire") is None


def test_cache_delete():
    _memory_cache.clear()
    cache_set("test:del", "value", ttl=60)
    assert cache_get("test:del") == "value"
    cache_delete("test:del")
    assert cache_get("test:del") is None


def test_cache_delete_pattern():
    _memory_cache.clear()
    cache_set("analytics:overview", "data1", ttl=60)
    cache_set("analytics:geo", "data2", ttl=60)
    cache_set("dashboard:stats", "data3", ttl=60)
    cache_delete_pattern("analytics")
    assert cache_get("analytics:overview") is None
    assert cache_get("analytics:geo") is None
    assert cache_get("dashboard:stats") == "data3"


def test_cache_overwrite():
    _memory_cache.clear()
    cache_set("test:overwrite", "old", ttl=60)
    cache_set("test:overwrite", "new", ttl=60)
    assert cache_get("test:overwrite") == "new"
