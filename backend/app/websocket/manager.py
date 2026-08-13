"""WebSocket connection manager with Redis pub/sub."""
import json
from typing import Dict, Set

from fastapi import WebSocket

from app.core.rate_limit import get_redis


class ConnectionManager:
    """Tracks active WebSocket connections per user."""

    def __init__(self):
        self.active: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active.setdefault(user_id, set()).add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active:
            self.active[user_id].discard(websocket)
            if not self.active[user_id]:
                del self.active[user_id]

    async def send_to_user(self, user_id: int, message: dict):
        for ws in self.active.get(user_id, set()):
            await ws.send_json(message)

    def publish_message(self, channel: str, message: dict):
        try:
            get_redis().publish(channel, json.dumps(message))
        except Exception:
            pass


manager = ConnectionManager()
