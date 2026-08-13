"""Gamification service — hearts, XP, streak, gems (server-authoritative)."""
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models.gamification import UserStats


def get_or_create_stats(db: Session, user_id: int) -> UserStats:
    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    if not stats:
        settings = get_settings()
        stats = UserStats(
            user_id=user_id,
            hearts=settings.MAX_HEARTS,
            max_hearts=settings.MAX_HEARTS,
            daily_xp_goal=settings.DAILY_XP_GOAL_DEFAULT,
        )
        db.add(stats)
        db.flush()
    return stats


def apply_heart_regen(stats: UserStats) -> None:
    """Regenerate hearts based on time elapsed since last regen."""
    settings = get_settings()
    if stats.hearts >= stats.max_hearts:
        return
    now = datetime.now(timezone.utc)
    if stats.last_heart_regen_at is None:
        stats.last_heart_regen_at = now.date()
        return
    elapsed = now - datetime.combine(stats.last_heart_regen_at, datetime.min.time(), tzinfo=timezone.utc)
    regen_count = int(elapsed.total_seconds() // (settings.HEART_REGEN_MINUTES * 60))
    if regen_count > 0:
        stats.hearts = min(stats.max_hearts, stats.hearts + regen_count)
        stats.last_heart_regen_at = now.date()


def lose_heart(db: Session, user_id: int) -> int:
    stats = get_or_create_stats(db, user_id)
    apply_heart_regen(stats)
    if stats.hearts > 0:
        stats.hearts -= 1
    db.flush()
    return stats.hearts


def refill_hearts_with_gems(db: Session, user_id: int) -> UserStats:
    settings = get_settings()
    stats = get_or_create_stats(db, user_id)
    if stats.hearts >= stats.max_hearts:
        return stats
    if stats.gems < settings.HEART_REFILL_GEM_COST:
        from app.core.exceptions import bad_request
        raise bad_request("Not enough gems to refill hearts")
    stats.gems -= settings.HEART_REFILL_GEM_COST
    stats.hearts = stats.max_hearts
    stats.last_heart_regen_at = date.today()
    db.flush()
    return stats


def reset_daily_xp_if_needed(stats: UserStats) -> None:
    today = date.today()
    if stats.today_date != today:
        stats.today_xp = 0
        stats.today_date = today


def award_xp(db: Session, user_id: int, amount: int) -> UserStats:
    stats = get_or_create_stats(db, user_id)
    reset_daily_xp_if_needed(stats)
    stats.total_xp += amount
    stats.today_xp += amount
    db.flush()
    return stats


def update_streak(db: Session, user_id: int) -> UserStats:
    stats = get_or_create_stats(db, user_id)
    today = date.today()
    if stats.last_activity_date == today:
        return stats
    if stats.last_activity_date == today - timedelta(days=1):
        stats.current_streak += 1
    elif stats.last_activity_date is None or stats.last_activity_date < today - timedelta(days=1):
        stats.current_streak = 1
    stats.last_activity_date = today
    stats.longest_streak = max(stats.longest_streak, stats.current_streak)
    db.flush()
    return stats
