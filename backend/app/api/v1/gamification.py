"""Gamification endpoints — stats, hearts, gems."""
from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.auth import UserStatsResponse
from app.services.gamification import apply_heart_regen, get_or_create_stats, refill_hearts_with_gems

router = APIRouter(tags=["gamification"])


@router.get("/stats", response_model=UserStatsResponse)
def get_stats(user: CurrentUser, db: DbSession):
    stats = get_or_create_stats(db, user.id)
    apply_heart_regen(stats)
    db.commit()
    return UserStatsResponse(
        total_xp=stats.total_xp,
        gems=stats.gems,
        hearts=stats.hearts,
        max_hearts=stats.max_hearts,
        current_streak=stats.current_streak,
        longest_streak=stats.longest_streak,
        daily_xp_goal=stats.daily_xp_goal,
        today_xp=stats.today_xp,
        daily_goal_met=stats.today_xp >= stats.daily_xp_goal,
        lessons_completed=stats.lessons_completed,
        perfect_lessons=stats.perfect_lessons,
    )


@router.post("/hearts/refill")
def refill_hearts(user: CurrentUser, db: DbSession):
    stats = refill_hearts_with_gems(db, user.id)
    db.commit()
    return {"hearts": stats.hearts, "gems": stats.gems}
