"""
WebSocket connection manager for real-time notifications.

Broadcast system events to connected clients with:
  - Per-user rooms
  - Organization-wide broadcasts
  - Automatic cleanup on disconnect
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import WebSocket, WebSocketDisconnect, Depends, Query
from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["WebSocket"])


class ConnectionManager:
    """Manages all active WebSocket connections."""

    def __init__(self):
        # user_id -> list of WebSocket connections (supports multi-tab)
        self._user_connections: dict[int, list[WebSocket]] = {}
        # All active connections (for broadcast)
        self._all_connections: list[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: int) -> None:
        await websocket.accept()
        async with self._lock:
            if user_id not in self._user_connections:
                self._user_connections[user_id] = []
            self._user_connections[user_id].append(websocket)
            self._all_connections.append(websocket)
        logger.info(f"WebSocket connected: user_id={user_id}, total={len(self._all_connections)}")

        # Send welcome message
        await self._send_to_socket(websocket, {
            "type": "connected",
            "message": "مرحباً — الاتصال الفوري نشط",
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
        })

    async def disconnect(self, websocket: WebSocket, user_id: int) -> None:
        async with self._lock:
            if user_id in self._user_connections:
                self._user_connections[user_id] = [
                    ws for ws in self._user_connections[user_id] if ws != websocket
                ]
                if not self._user_connections[user_id]:
                    del self._user_connections[user_id]
            if websocket in self._all_connections:
                self._all_connections.remove(websocket)
        logger.info(f"WebSocket disconnected: user_id={user_id}, total={len(self._all_connections)}")

    async def send_to_user(self, user_id: int, message: dict) -> int:
        """Send a message to all connections of a specific user. Returns sent count."""
        sockets = self._user_connections.get(user_id, [])
        sent = 0
        dead = []
        for ws in sockets:
            try:
                await self._send_to_socket(ws, message)
                sent += 1
            except Exception:
                dead.append(ws)
        # Clean up dead connections
        for ws in dead:
            await self.disconnect(ws, user_id)
        return sent

    async def broadcast(self, message: dict, exclude_user: Optional[int] = None) -> int:
        """Broadcast a message to all connected users. Returns sent count."""
        sent = 0
        dead_pairs = []
        for user_id, sockets in list(self._user_connections.items()):
            if exclude_user and user_id == exclude_user:
                continue
            for ws in sockets:
                try:
                    await self._send_to_socket(ws, message)
                    sent += 1
                except Exception:
                    dead_pairs.append((ws, user_id))
        for ws, uid in dead_pairs:
            await self.disconnect(ws, uid)
        return sent

    @staticmethod
    async def _send_to_socket(websocket: WebSocket, message: dict) -> None:
        """Send JSON message to a single WebSocket."""
        await websocket.send_text(json.dumps(message, ensure_ascii=False, default=str))

    def online_count(self) -> int:
        return len(self._user_connections)

    def is_user_online(self, user_id: int) -> bool:
        return user_id in self._user_connections and bool(self._user_connections[user_id])


# Singleton manager — imported everywhere
manager = ConnectionManager()


# ── Notification Helpers ──────────────────────────────────────────────────────

async def notify_user(user_id: int, title: str, body: str, notification_type: str = "info", link: Optional[str] = None) -> None:
    """Helper to send a structured notification to a user."""
    await manager.send_to_user(user_id, {
        "type": "notification",
        "notification_type": notification_type,  # info | success | warning | error
        "title": title,
        "body": body,
        "link": link,
        "timestamp": datetime.utcnow().isoformat(),
    })


async def broadcast_alert(title: str, body: str, level: str = "info") -> None:
    """Broadcast an organization-wide alert."""
    await manager.broadcast({
        "type": "alert",
        "level": level,
        "title": title,
        "body": body,
        "timestamp": datetime.utcnow().isoformat(),
    })


async def notify_data_change(resource: str, action: str, resource_id: Optional[int] = None, changed_by_user_id: Optional[int] = None) -> None:
    """Notify all users that data has changed (for real-time table refresh)."""
    await manager.broadcast(
        {
            "type": "data_change",
            "resource": resource,
            "action": action,  # created | updated | deleted
            "resource_id": resource_id,
            "timestamp": datetime.utcnow().isoformat(),
        },
        exclude_user=changed_by_user_id,
    )


# ── WebSocket Endpoint ────────────────────────────────────────────────────────

@router.websocket("/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for real-time notifications.
    Connect with: ws://host/ws/notifications?token=<JWT_ACCESS_TOKEN>
    """
    # Authenticate via query token
    user_id: Optional[int] = None
    if token:
        try:
            from app.auth import decode_token
            from app.database import SessionLocal
            from app.models import User
            payload = decode_token(token)
            username = payload.get("sub")
            if username:
                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.username == username, User.is_active == True).first()
                    if user:
                        user_id = user.id
                finally:
                    db.close()
        except Exception:
            pass

    if user_id is None:
        await websocket.accept()
        await websocket.send_text(json.dumps({"type": "error", "message": "غير مصرح"}))
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep alive — accept ping from client
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong", "timestamp": datetime.utcnow().isoformat()}))
    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        await manager.disconnect(websocket, user_id)
