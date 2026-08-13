"""Achievement evaluation service."""
from datetime import date

from sqlalchemy.orm import Session

from app.db.models.gamification import Achievement, UserAchievement, UserStats


def get_user_achievement_ids(db: Session, user_id: int) -> set[int]:
    rows = db.query(UserAchievement.achievement_id).filter(UserAchievement.user_id == user_id).all()
    return {r[0] for r in rows}


def evaluate_achievements(
    db: Session,
    user_id: int,
    *,
    lesson_completed: bool = False,
    perfect_lesson: bool = False,
    skill_completed: bool = False,
) -> list[dict]:
    """Check and award new achievements. Returns list of newly earned achievement dicts."""
    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    if not stats:
        return []

    earned_ids = get_user_achievement_ids(db, user_id)
    all_achievements = db.query(Achievement).all()
    newly_earned: list[dict] = []

    for ach in all_achievements:
        if ach.id in earned_ids:
            continue
        earned = False
        if ach.slug == "first_lesson" and lesson_completed and stats.lessons_completed >= 1:
            earned = True
        elif ach.xp_threshold and stats.total_xp >= ach.xp_threshold:
            earned = True
        elif ach.streak_threshold and stats.current_streak >= ach.streak_threshold:
            earned = True
        elif ach.lesson_threshold and stats.lessons_completed >= ach.lesson_threshold:
            earned = True
        elif ach.slug == "perfect_lesson" and perfect_lesson:
            earned = True
        elif ach.slug == "skill_master" and skill_completed:
            earned = True

        if earned:
            ua = UserAchievement(user_id=user_id, achievement_id=ach.id, earned_at=date.today())
            db.add(ua)
            if ach.gem_reward:
                stats.gems += ach.gem_reward
            newly_earned.append(
                {
                    "id": ach.id,
                    "slug": ach.slug,
                    "title": ach.title,
                    "description": ach.description,
                    "icon": ach.icon,
                    "gem_reward": ach.gem_reward,
                }
            )
    db.flush()
    return newly_earned
