"""Authenticated WebSocket chat — friend-only messaging.

PROTOCOL:
  Client → {"type": "message", "recipient_id": 2, "content": "Hola!"}
  Server → {"type": "message", "id": 1, "sender_id": 1, "content": "...", "created_at": "..."}
  Client → {"type": "ping"}
  Server → {"type": "pong"}
"""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import get_settings
from app.core.rate_limit import check_rate_limit
from app.core.security import safe_decode_token
from app.db.database import SessionLocal
from app.db.models.base import FriendshipStatus
from app.db.models.social import ChatMessage, Friendship
from app.db.models.user import User
from app.websocket.manager import manager

router = APIRouter()


def _get_user_from_token(token: str) -> User | None:
    payload = safe_decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    db = SessionLocal()
    try:
        return db.query(User).filter(User.id == int(payload["sub"])).first()
    finally:
        db.close()


def _are_friends(user_id: int, other_id: int) -> bool:
    db = SessionLocal()
    try:
        f = (
            db.query(Friendship)
            .filter(
                Friendship.status == FriendshipStatus.ACCEPTED.value,
                ((Friendship.requester_id == user_id) & (Friendship.addressee_id == other_id))
                | ((Friendship.requester_id == other_id) & (Friendship.addressee_id == user_id)),
            )
            .first()
        )
        return f is not None
    finally:
        db.close()


@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket, token: str):
    user = _get_user_from_token(token)
    if not user:
        await websocket.close(code=4001)
        return

    await manager.connect(user.id, websocket)
    settings = get_settings()

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if msg_type == "message":
                recipient_id = data.get("recipient_id")
                content = (data.get("content") or "").strip()
                if not recipient_id or not content:
                    await websocket.send_json({"type": "error", "message": "Invalid message"})
                    continue
                if len(content) > settings.CHAT_MAX_MESSAGE_LENGTH:
                    await websocket.send_json({"type": "error", "message": "Message too long"})
                    continue
                if not _are_friends(user.id, recipient_id):
                    await websocket.send_json({"type": "error", "message": "Not friends"})
                    continue

                check_rate_limit(f"chat:{user.id}", settings.RATE_LIMIT_CHAT)

                db = SessionLocal()
                try:
                    msg = ChatMessage(sender_id=user.id, recipient_id=recipient_id, content=content)
                    db.add(msg)
                    db.commit()
                    db.refresh(msg)
                    payload = {
                        "type": "message",
                        "id": msg.id,
                        "sender_id": user.id,
                        "recipient_id": recipient_id,
                        "content": content,
                        "created_at": msg.created_at.isoformat() if msg.created_at else datetime.now(timezone.utc).isoformat(),
                    }
                    await manager.send_to_user(recipient_id, payload)
                    await websocket.send_json({**payload, "status": "sent"})
                    manager.publish_message(f"chat:{recipient_id}", payload)
                finally:
                    db.close()
    except WebSocketDisconnect:
        manager.disconnect(user.id, websocket)
