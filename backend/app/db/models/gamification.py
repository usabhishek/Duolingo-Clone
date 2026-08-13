"""Gamification: XP, hearts, streak, gems, achievements."""
from datetime import date

from sqlalchemy import JSON, Boolean, Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.models.base import TimestampMixin


class UserStats(Base, TimestampMixin):
    """Single row per user — authoritative gamification state."""
    __tablename__ = "user_stats"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    gems: Mapped[int] = mapped_column(Integer, default=500)
    hearts: Mapped[int] = mapped_column(Integer, default=5)
    max_hearts: Mapped[int] = mapped_column(Integer, default=5)
    last_heart_regen_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    daily_xp_goal: Mapped[int] = mapped_column(Integer, default=50)
    today_xp: Mapped[int] = mapped_column(Integer, default=0)
    today_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)
    perfect_lessons: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="stats")


class Achievement(Base, TimestampMixin):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(String(50), default="trophy")
    category: Mapped[str] = mapped_column(String(50), default="general")
    xp_threshold: Mapped[int | None] = mapped_column(Integer, nullable=True)
    streak_threshold: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lesson_threshold: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gem_reward: Mapped[int] = mapped_column(Integer, default=0)


class UserAchievement(Base, TimestampMixin):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id", ondelete="CASCADE"), index=True)
    earned_at: Mapped[date | None] = mapped_column(Date, nullable=True)

    user: Mapped["User"] = relationship(back_populates="achievements")
    achievement: Mapped[Achievement] = relationship()


class PracticeSession(Base, TimestampMixin):
    __tablename__ = "practice_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    session_type: Mapped[str] = mapped_column(String(30))
    exercise_ids: Mapped[list] = mapped_column(JSON)
    score: Mapped[int] = mapped_column(Integer, default=0)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    time_limit_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)


class LegendaryAttempt(Base, TimestampMixin):
    __tablename__ = "legendary_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    score: Mapped[int] = mapped_column(Integer, default=0)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
