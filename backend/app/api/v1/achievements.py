"""Achievements and leaderboard."""
from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.db.models.gamification import Achievement, UserAchievement, UserStats
from app.db.models.user import User

router = APIRouter(tags=["achievements"])


@router.get("/achievements")
def list_achievements(user: CurrentUser, db: DbSession):
    earned = {ua.achievement_id: ua for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()}
    achievements = db.query(Achievement).all()
    return [
        {
            "id": a.id,
            "slug": a.slug,
            "title": a.title,
            "description": a.description,
            "icon": a.icon,
            "category": a.category,
            "gem_reward": a.gem_reward,
            "unlocked": a.id in earned,
            "earned_at": str(earned[a.id].earned_at) if a.id in earned else None,
        }
        for a in achievements
    ]


@router.get("/leaderboard")
def leaderboard(user: CurrentUser, db: DbSession, limit: int = 20):
    rows = (
        db.query(User, UserStats)
        .join(UserStats, User.id == UserStats.user_id)
        .order_by(UserStats.total_xp.desc())
        .limit(limit)
        .all()
    )
    result = []
    current_rank = None
    for rank, (u, stats) in enumerate(rows, 1):
        entry = {
            "rank": rank,
            "user_id": u.id,
            "username": u.username,
            "display_name": u.display_name,
            "avatar_url": u.avatar_url,
            "total_xp": stats.total_xp,
            "is_current_user": u.id == user.id,
        }
        if u.id == user.id:
            current_rank = rank
        result.append(entry)

    if current_rank is None:
        stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()
        higher = db.query(UserStats).filter(UserStats.total_xp > (stats.total_xp if stats else 0)).count()
        current_rank = higher + 1

    return {"entries": result, "current_user_rank": current_rank}
