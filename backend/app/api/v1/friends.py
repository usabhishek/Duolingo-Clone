"""Friends and friend activity endpoints."""
from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.core.exceptions import bad_request, forbidden, not_found
from app.core.rate_limit import check_rate_limit
from app.db.models.base import FriendshipStatus
from app.db.models.social import FriendActivity, Friendship
from app.db.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/friends", tags=["friends"])


class FriendRequestBody(BaseModel):
    user_id: int


@router.get("")
def list_friends(user: CurrentUser, db: DbSession):
    friendships = (
        db.query(Friendship)
        .filter(
            Friendship.status == FriendshipStatus.ACCEPTED.value,
            (Friendship.requester_id == user.id) | (Friendship.addressee_id == user.id),
        )
        .all()
    )
    friend_ids = [
        f.addressee_id if f.requester_id == user.id else f.requester_id for f in friendships
    ]
    friends = db.query(User).filter(User.id.in_(friend_ids)).all() if friend_ids else []
    return [{"id": f.id, "username": f.username, "display_name": f.display_name, "avatar_url": f.avatar_url} for f in friends]


@router.get("/pending")
def pending_requests(user: CurrentUser, db: DbSession):
    incoming = (
        db.query(Friendship, User)
        .join(User, User.id == Friendship.requester_id)
        .filter(Friendship.addressee_id == user.id, Friendship.status == FriendshipStatus.PENDING.value)
        .all()
    )
    return [
        {"friendship_id": f.id, "user": {"id": u.id, "username": u.username, "avatar_url": u.avatar_url}}
        for f, u in incoming
    ]


@router.post("/request")
def send_request(data: FriendRequestBody, user: CurrentUser, db: DbSession):
    check_rate_limit(f"friend:{user.id}", get_settings().RATE_LIMIT_FRIEND_REQUEST)
    if data.user_id == user.id:
        raise bad_request("Cannot friend yourself")
    target = db.query(User).filter(User.id == data.user_id).first()
    if not target:
        raise not_found("User")
    existing = (
        db.query(Friendship)
        .filter(
            ((Friendship.requester_id == user.id) & (Friendship.addressee_id == data.user_id))
            | ((Friendship.requester_id == data.user_id) & (Friendship.addressee_id == user.id))
        )
        .first()
    )
    if existing:
        raise bad_request("Friend request already exists")
    f = Friendship(requester_id=user.id, addressee_id=data.user_id)
    db.add(f)
    db.commit()
    return {"status": "pending"}


@router.post("/{friendship_id}/accept")
def accept_request(friendship_id: int, user: CurrentUser, db: DbSession):
    f = db.query(Friendship).filter(Friendship.id == friendship_id).first()
    if not f:
        raise not_found("Friendship")
    if f.addressee_id != user.id:
        raise forbidden()
    f.status = FriendshipStatus.ACCEPTED.value
    db.commit()
    return {"status": "accepted"}


@router.post("/{friendship_id}/reject")
def reject_request(friendship_id: int, user: CurrentUser, db: DbSession):
    f = db.query(Friendship).filter(Friendship.id == friendship_id).first()
    if not f:
        raise not_found("Friendship")
    if f.addressee_id != user.id:
        raise forbidden()
    f.status = FriendshipStatus.REJECTED.value
    db.commit()
    return {"status": "rejected"}


@router.delete("/{friendship_id}")
def remove_friend(friendship_id: int, user: CurrentUser, db: DbSession):
    f = db.query(Friendship).filter(Friendship.id == friendship_id).first()
    if not f:
        raise not_found("Friendship")
    if user.id not in (f.requester_id, f.addressee_id):
        raise forbidden()
    db.delete(f)
    db.commit()
    return {"status": "removed"}


@router.get("/activity")
def friend_activity(user: CurrentUser, db: DbSession):
    friendships = (
        db.query(Friendship)
        .filter(
            Friendship.status == FriendshipStatus.ACCEPTED.value,
            (Friendship.requester_id == user.id) | (Friendship.addressee_id == user.id),
        )
        .all()
    )
    friend_ids = [
        f.addressee_id if f.requester_id == user.id else f.requester_id for f in friendships
    ]
    if not friend_ids:
        return []
    activities = (
        db.query(FriendActivity, User)
        .join(User, User.id == FriendActivity.user_id)
        .filter(FriendActivity.user_id.in_(friend_ids))
        .order_by(FriendActivity.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {"user": u.display_name, "activity_type": a.activity_type, "message": a.message, "created_at": str(a.created_at)}
        for a, u in activities
    ]
