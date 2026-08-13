"""User and OAuth account models."""
from sqlalchemy import Boolean, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.models.base import TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str] = mapped_column(String(100))
    avatar_url: Mapped[str] = mapped_column(String(500), default="/avatars/default.svg")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    active_course_id: Mapped[int | None] = mapped_column(ForeignKey("courses.id"), nullable=True)

    stats: Mapped["UserStats"] = relationship(back_populates="user", uselist=False)
    oauth_accounts: Mapped[list["OAuthAccount"]] = relationship(back_populates="user")
    skill_progress: Mapped[list["UserSkillProgress"]] = relationship(back_populates="user")
    achievements: Mapped[list["UserAchievement"]] = relationship(back_populates="user")


class OAuthAccount(Base, TimestampMixin):
    __tablename__ = "oauth_accounts"
    __table_args__ = (UniqueConstraint("provider", "provider_user_id", name="uq_oauth_provider_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str] = mapped_column(String(50))
    provider_user_id: Mapped[str] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255))

    user: Mapped[User] = relationship(back_populates="oauth_accounts")
