"""Course and learning path schemas."""
from typing import Any, Optional

from pydantic import BaseModel


class CourseOut(BaseModel):
    id: int
    slug: str
    title: str
    language_code: str
    source_language: str
    description: str
    icon: str
    color: str

    model_config = {"from_attributes": True}


class ExercisePublic(BaseModel):
    """Exercise without correct answers — safe for client before submission."""
    id: int
    order: int
    type: str
    prompt: str
    payload: dict[str, Any]
    audio_text: Optional[str] = None
    language: str


class LessonOut(BaseModel):
    id: int
    title: str
    order: int
    xp_reward: int
    is_locked: bool = False
    is_completed: bool = False


class SkillOut(BaseModel):
    id: int
    title: str
    description: str
    order: int
    icon: str
    crown_level: int = 0
    max_crowns: int = 5
    state: str
    lessons: list[LessonOut] = []


class UnitOut(BaseModel):
    id: int
    title: str
    description: str
    order: int
    color: str
    skills: list[SkillOut] = []


class PathResponse(BaseModel):
    course: CourseOut
    units: list[UnitOut]


class StartLessonResponse(BaseModel):
    attempt_id: int
    lesson_id: int
    exercises: list[ExercisePublic]
    hearts_remaining: int
    total_exercises: int


class AnswerRequest(BaseModel):
    exercise_id: int
    user_answer: Any


class AnswerResponse(BaseModel):
    is_correct: bool
    correct_answer: Any = None
    hearts_remaining: int
    lesson_failed: bool
    feedback: str
    exercises_remaining: int


class CompleteLessonResponse(BaseModel):
    xp_earned: int
    total_xp: int
    gems_earned: int
    skill_progress: dict
    crown_level: int
    unlocked_skills: list[int]
    streak: int
    daily_goal: dict
    newly_earned_achievements: list[dict]
    perfect_lesson: bool
