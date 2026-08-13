"""Shared enums and mixins for ORM models."""
import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ExerciseType(str, enum.Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    WORD_BANK = "word_bank"
    MATCH_PAIRS = "match_pairs"
    FILL_BLANK = "fill_blank"
    TYPE_ANSWER = "type_answer"
    AUDIO = "audio"
    SPEECH = "speech"
    IMAGE_CHOICE = "image_choice"


class FriendshipStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    BLOCKED = "blocked"


class SkillState(str, enum.Enum):
    LOCKED = "locked"
    AVAILABLE = "available"
    COMPLETED = "completed"


class ActivityType(str, enum.Enum):
    LESSON_COMPLETED = "lesson_completed"
    ACHIEVEMENT_EARNED = "achievement_earned"
    STREAK_MILESTONE = "streak_milestone"
    SKILL_COMPLETED = "skill_completed"
