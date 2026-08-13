"""Lesson attempt endpoints — core lesson loop."""
from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.core.rate_limit import check_rate_limit
from app.schemas.course import AnswerRequest, AnswerResponse, CompleteLessonResponse, StartLessonResponse
from app.services.lesson import complete_lesson, start_lesson, submit_answer

router = APIRouter(tags=["lessons"])


@router.post("/lessons/{lesson_id}/attempts", response_model=StartLessonResponse)
def create_lesson_attempt(lesson_id: int, user: CurrentUser, db: DbSession):
    return start_lesson(db, user.id, lesson_id)


@router.post("/lesson-attempts/{attempt_id}/answer", response_model=AnswerResponse)
def answer_exercise(attempt_id: int, data: AnswerRequest, user: CurrentUser, db: DbSession):
    check_rate_limit(f"answer:{user.id}", get_settings().RATE_LIMIT_LESSON_ANSWER)
    return submit_answer(db, user.id, attempt_id, data.exercise_id, data.user_answer)


@router.post("/lesson-attempts/{attempt_id}/complete", response_model=CompleteLessonResponse)
def finish_lesson(attempt_id: int, user: CurrentUser, db: DbSession):
    return complete_lesson(db, user.id, attempt_id)
