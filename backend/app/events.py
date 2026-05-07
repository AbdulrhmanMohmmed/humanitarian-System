"""
Lightweight in-process event bus for decoupled module communication.

Usage:
    from app.events import event_bus

    # Subscribe (typically in a service or startup hook)
    @event_bus.on("beneficiary.created")
    def handle_new_beneficiary(payload: dict):
        ...

    # Publish (from any service)
    event_bus.emit("beneficiary.created", {"id": 1, "name": "Ahmed"})
"""

import asyncio
import logging
from collections import defaultdict
from typing import Any, Callable

logger = logging.getLogger(__name__)

Listener = Callable[[dict[str, Any]], None]


class EventBus:
    """Simple synchronous event bus with optional async support."""

    def __init__(self) -> None:
        self._listeners: dict[str, list[Listener]] = defaultdict(list)

    # ── Registration ──────────────────────────────────────────────────────────

    def on(self, event_name: str) -> Callable:
        """Decorator to register a listener for an event."""

        def decorator(fn: Listener) -> Listener:
            self._listeners[event_name].append(fn)
            return fn

        return decorator

    def subscribe(self, event_name: str, fn: Listener) -> None:
        """Programmatic subscription (non-decorator form)."""
        self._listeners[event_name].append(fn)

    def unsubscribe(self, event_name: str, fn: Listener) -> None:
        self._listeners[event_name] = [
            f for f in self._listeners[event_name] if f is not fn
        ]

    # ── Emission ──────────────────────────────────────────────────────────────

    def emit(self, event_name: str, payload: dict[str, Any] | None = None) -> None:
        """Fire an event synchronously to all registered listeners."""
        payload = payload or {}
        for listener in self._listeners.get(event_name, []):
            try:
                listener(payload)
            except Exception:
                logger.exception(
                    "Error in event listener %s for event '%s'",
                    listener.__name__,
                    event_name,
                )

    async def emit_async(
        self, event_name: str, payload: dict[str, Any] | None = None
    ) -> None:
        """Fire an event, awaiting async listeners and calling sync ones."""
        payload = payload or {}
        for listener in self._listeners.get(event_name, []):
            try:
                result = listener(payload)
                if asyncio.iscoroutine(result):
                    await result
            except Exception:
                logger.exception(
                    "Error in async event listener %s for event '%s'",
                    listener.__name__,
                    event_name,
                )

    # ── Introspection ─────────────────────────────────────────────────────────

    def list_events(self) -> list[str]:
        return list(self._listeners.keys())

    def listener_count(self, event_name: str) -> int:
        return len(self._listeners.get(event_name, []))


# Singleton instance used across the application
event_bus = EventBus()


# ── Standard Event Names (for type-safety and discoverability) ────────────────

class Events:
    BENEFICIARY_CREATED = "beneficiary.created"
    BENEFICIARY_UPDATED = "beneficiary.updated"
    BENEFICIARY_DELETED = "beneficiary.deleted"
    PROJECT_CREATED = "project.created"
    PROJECT_UPDATED = "project.updated"
    PROJECT_DELETED = "project.deleted"
    TRANSACTION_CREATED = "transaction.created"
    GRANT_CREATED = "grant.created"
    USER_LOGIN = "user.login"
    USER_CREATED = "user.created"
