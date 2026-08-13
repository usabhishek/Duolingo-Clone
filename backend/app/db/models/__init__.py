"""Import all models so Alembic and Base.metadata see every table."""
from app.db.models.user import OAuthAccount, User
from app.db.models.course import Course, Exercise, Lesson, Skill, Unit
from app.db.models.progress import ExerciseAttempt, LessonAttempt, MistakeRecord, UserSkillProgress
from app.db.models.gamification import (
    Achievement,
    LegendaryAttempt,
    PracticeSession,
    UserAchievement,
    UserStats,
)
from app.db.models.social import ChatMessage, FriendActivity, Friendship

__all__ = [
    "User",
    "OAuthAccount",
    "Course",
    "Unit",
    "Skill",
    "Lesson",
    "Exercise",
    "UserSkillProgress",
    "LessonAttempt",
    "ExerciseAttempt",
    "MistakeRecord",
    "UserStats",
    "Achievement",
    "UserAchievement",
    "PracticeSession",
    "LegendaryAttempt",
    "Friendship",
    "ChatMessage",
    "FriendActivity",
]
