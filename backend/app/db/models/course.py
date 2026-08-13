"""Course content hierarchy: Course → Unit → Skill → Lesson → Exercise."""
from sqlalchemy import ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.models.base import ExerciseType, TimestampMixin


class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(100))
    language_code: Mapped[str] = mapped_column(String(10))  # es, de, en
    source_language: Mapped[str] = mapped_column(String(10), default="en")
    description: Mapped[str] = mapped_column(Text, default="")
    icon: Mapped[str] = mapped_column(String(50), default="flag")
    color: Mapped[str] = mapped_column(String(20), default="#58CC02")

    units: Mapped[list["Unit"]] = relationship(back_populates="course", order_by="Unit.order")


class Unit(Base, TimestampMixin):
    __tablename__ = "units"
    __table_args__ = (UniqueConstraint("course_id", "order", name="uq_unit_course_order"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, default="")
    order: Mapped[int] = mapped_column(Integer)
    color: Mapped[str] = mapped_column(String(20), default="#1CB0F6")

    course: Mapped[Course] = relationship(back_populates="units")
    skills: Mapped[list["Skill"]] = relationship(back_populates="unit", order_by="Skill.order")


class Skill(Base, TimestampMixin):
    __tablename__ = "skills"
    __table_args__ = (UniqueConstraint("unit_id", "order", name="uq_skill_unit_order"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, default="")
    order: Mapped[int] = mapped_column(Integer)
    icon: Mapped[str] = mapped_column(String(50), default="star")
    max_crowns: Mapped[int] = mapped_column(Integer, default=5)

    unit: Mapped[Unit] = relationship(back_populates="skills")
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="skill", order_by="Lesson.order")


class Lesson(Base, TimestampMixin):
    __tablename__ = "lessons"
    __table_args__ = (UniqueConstraint("skill_id", "order", name="uq_lesson_skill_order"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(100))
    order: Mapped[int] = mapped_column(Integer)
    xp_reward: Mapped[int] = mapped_column(Integer, default=10)

    skill: Mapped[Skill] = relationship(back_populates="lessons")
    exercises: Mapped[list["Exercise"]] = relationship(back_populates="lesson", order_by="Exercise.order")


class Exercise(Base, TimestampMixin):
    __tablename__ = "exercises"
    __table_args__ = (UniqueConstraint("lesson_id", "order", name="uq_exercise_lesson_order"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    order: Mapped[int] = mapped_column(Integer)
    type: Mapped[ExerciseType] = mapped_column(String(30))
    prompt: Mapped[str] = mapped_column(Text)
    # payload stores options, pairs, blanks, images — correct answers live here (never sent to client pre-submit)
    payload: Mapped[dict] = mapped_column(JSON)
    audio_text: Mapped[str | None] = mapped_column(String(500), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="es-ES")
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    lesson: Mapped[Lesson] = relationship(back_populates="exercises")
