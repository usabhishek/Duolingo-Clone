"""Analytics, recommendations, mistakes, practice."""
import random
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import CurrentUser, DbSession
from app.db.models.course import Exercise
from app.db.models.gamification import PracticeSession
from app.db.models.progress import MistakeRecord
from app.services.analytics import compute_learning_health, get_analytics, get_recommendations
from app.services.exercise_validator import sanitize_payload_for_client, validate_answer
from app.services.gamification import award_xp

router = APIRouter(tags=["analytics"])


@router.get("/recommendations")
def recommendations(user: CurrentUser, db: DbSession):
    return get_recommendations(db, user.id)


@router.get("/analytics")
def analytics(user: CurrentUser, db: DbSession):
    return get_analytics(db, user.id)


@router.get("/analytics/learning-health")
def learning_health(user: CurrentUser, db: DbSession):
    return compute_learning_health(db, user.id)


@router.get("/mistakes")
def mistakes(user: CurrentUser, db: DbSession):
    records = (
        db.query(MistakeRecord, Exercise)
        .join(Exercise, Exercise.id == MistakeRecord.exercise_id)
        .filter(MistakeRecord.user_id == user.id)
        .order_by(MistakeRecord.last_mistake_at.desc())
        .all()
    )
    return [
        {
            "exercise_id": r.exercise_id,
            "skill_id": r.skill_id,
            "lesson_id": r.lesson_id,
            "exercise_type": r.exercise_type,
            "prompt": e.prompt,
            "user_answer": r.user_answer,
            "correct_answer": r.correct_answer,
            "mistake_count": r.mistake_count,
            "last_mistake_at": str(r.last_mistake_at),
        }
        for r, e in records
    ]


class PracticeAnswer(BaseModel):
    exercise_id: int
    user_answer: object


@router.post("/practice/personalized")
def personalized_practice(user: CurrentUser, db: DbSession):
    rec = get_recommendations(db, user.id)
    exercise_ids = [e["id"] for e in rec.get("recommended_exercises", [])]
    if not exercise_ids:
        exercises = db.query(Exercise).limit(5).all()
        exercise_ids = [e.id for e in exercises]

    session = PracticeSession(
        user_id=user.id,
        session_type="personalized",
        exercise_ids=exercise_ids,
        time_limit_seconds=300,
    )
    db.add(session)
    db.flush()

    exercises_out = []
    for eid in exercise_ids:
        ex = db.query(Exercise).filter(Exercise.id == eid).first()
        if ex:
            exercises_out.append(
                {
                    "id": ex.id,
                    "type": ex.type,
                    "prompt": ex.prompt,
                    "payload": sanitize_payload_for_client(ex.type, ex.payload),
                    "audio_text": ex.audio_text,
                    "language": ex.language,
                }
            )

    db.commit()
    # XP capped at 5 per personalized session to prevent farming
    return {"session_id": session.id, "exercises": exercises_out, "max_xp": 5}


@router.post("/practice/{session_id}/complete")
def complete_practice(session_id: int, answers: list[PracticeAnswer], user: CurrentUser, db: DbSession):
    session = db.query(PracticeSession).filter(PracticeSession.id == session_id).first()
    if not session or session.user_id != user.id:
        from app.core.exceptions import not_found
        raise not_found("Practice session")
    if session.is_completed:
        from app.core.exceptions import bad_request
        raise bad_request("Session already completed")

    correct = 0
    for ans in answers:
        ex = db.query(Exercise).filter(Exercise.id == ans.exercise_id).first()
        if ex:
            ok, _ = validate_answer(ex.type, ans.user_answer, ex.payload)
            if ok:
                correct += 1

    session.score = correct
    session.is_completed = True
    xp = min(5, correct * 2)  # capped XP for practice
    session.xp_earned = xp
    award_xp(db, user.id, xp)
    db.commit()
    return {"score": correct, "total": len(answers), "xp_earned": xp}


@router.post("/legendary/{skill_id}/start")
def start_legendary(skill_id: int, user: CurrentUser, db: DbSession):
    from app.db.models.gamification import LegendaryAttempt

    from app.db.models.course import Lesson

    exercises = (
        db.query(Exercise)
        .join(Lesson, Exercise.lesson_id == Lesson.id)
        .filter(Lesson.skill_id == skill_id)
        .limit(10)
        .all()
    )
    if not exercises:
        exercises = db.query(Exercise).limit(10).all()

    attempt = LegendaryAttempt(user_id=user.id, skill_id=skill_id)
    db.add(attempt)
    db.flush()

    return {
        "attempt_id": attempt.id,
        "time_limit_seconds": 120,
        "exercises": [
            {
                "id": e.id,
                "type": e.type,
                "prompt": e.prompt,
                "payload": sanitize_payload_for_client(e.type, e.payload),
            }
            for e in exercises
        ],
    }


@router.post("/legendary/{attempt_id}/complete")
def complete_legendary(attempt_id: int, score: int, user: CurrentUser, db: DbSession):
    from app.db.models.gamification import LegendaryAttempt

    attempt = db.query(LegendaryAttempt).filter(LegendaryAttempt.id == attempt_id).first()
    if not attempt or attempt.user_id != user.id:
        from app.core.exceptions import not_found
        raise not_found("Legendary attempt")
    if attempt.is_completed:
        from app.core.exceptions import bad_request
        raise bad_request("Already completed")

    passed = score >= 8
    xp = 20 if passed else 5
    attempt.score = min(score, 10)
    attempt.passed = passed
    attempt.is_completed = True
    attempt.xp_earned = xp
    award_xp(db, user.id, xp)
    db.commit()
    return {"passed": passed, "xp_earned": xp, "score": attempt.score}
