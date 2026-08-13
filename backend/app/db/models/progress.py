"""Learner progress: skill crowns, lesson attempts, exercise attempts."""
from sqlalchemy import Boolean, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.models.base import SkillState, TimestampMixin, utcnow
from sqlalchemy import DateTime


class UserSkillProgress(Base, TimestampMixin):
    __tablename__ = "user_skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    crown_level: Mapped[int] = mapped_column(Integer, default=0)
    state: Mapped[str] = mapped_column(String(20), default=SkillState.LOCKED.value)
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="skill_progress")


class LessonAttempt(Base, TimestampMixin):
    __tablename__ = "lesson_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    hearts_remaining: Mapped[int] = mapped_column(Integer)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_failed: Mapped[bool] = mapped_column(Boolean, default=False)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    incorrect_count: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    exercises: Mapped[list["ExerciseAttempt"]] = relationship(back_populates="lesson_attempt")


class ExerciseAttempt(Base, TimestampMixin):
    __tablename__ = "exercise_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_attempt_id: Mapped[int] = mapped_column(
        ForeignKey("lesson_attempts.id", ondelete="CASCADE"), index=True
    )
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id", ondelete="CASCADE"), index=True)
    user_answer: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    correct_answer: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    lesson_attempt: Mapped[LessonAttempt] = relationship(back_populates="exercises")


class MistakeRecord(Base, TimestampMixin):
    """Persistent mistake journal derived from wrong ExerciseAttempts."""
    __tablename__ = "mistake_records"
    __table_args__ = (UniqueConstraint("user_id", "exercise_id", name="uq_user_exercise_mistake"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id", ondelete="CASCADE"), index=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    exercise_type: Mapped[str] = mapped_column(String(30))
    user_answer: Mapped[dict] = mapped_column(JSON)
    correct_answer: Mapped[dict] = mapped_column(JSON)
    mistake_count: Mapped[int] = mapped_column(Integer, default=1)
    last_mistake_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_correct_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
