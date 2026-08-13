"""Lesson engine — start attempt, answer, complete.

LESSON LIFECYCLE:
  POST /lessons/{id}/attempts → LessonAttempt + exercises (no answers)
  POST /lesson-attempts/{id}/answer → validate, update hearts, record attempt
  POST /lesson-attempts/{id}/complete → XP, streak, crowns, achievements, unlocks
"""
from datetime import datetime, timezone

from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.core.exceptions import bad_request, forbidden, not_found
from app.db.models.course import Exercise, Lesson
from app.db.models.progress import ExerciseAttempt, LessonAttempt, MistakeRecord, UserSkillProgress
from app.db.models.base import SkillState
from app.services.achievements import evaluate_achievements
from app.services.exercise_validator import sanitize_payload_for_client, validate_answer
from app.services.gamification import award_xp, get_or_create_stats, lose_heart, update_streak


def start_lesson(db: Session, user_id: int, lesson_id: int) -> dict:
    lesson = db.query(Lesson).options(joinedload(Lesson.exercises)).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise not_found("Lesson")

    settings = get_settings()
    stats = get_or_create_stats(db, user_id)
    if stats.hearts <= 0:
        raise bad_request("No hearts remaining. Wait for regen or refill with gems.")

    # Prevent duplicate active attempts
    active = (
        db.query(LessonAttempt)
        .filter(
            LessonAttempt.user_id == user_id,
            LessonAttempt.lesson_id == lesson_id,
            LessonAttempt.is_completed == False,  # noqa: E712
            LessonAttempt.is_failed == False,  # noqa: E712
        )
        .first()
    )
    if active:
        attempt = active
    else:
        attempt = LessonAttempt(
            user_id=user_id,
            lesson_id=lesson_id,
            hearts_remaining=stats.hearts,
        )
        db.add(attempt)
        db.flush()

    exercises_public = []
    for ex in sorted(lesson.exercises, key=lambda e: e.order):
        safe_payload = sanitize_payload_for_client(ex.type, ex.payload)
        exercises_public.append(
            {
                "id": ex.id,
                "order": ex.order,
                "type": ex.type,
                "prompt": ex.prompt,
                "payload": safe_payload,
                "audio_text": ex.audio_text,
                "language": ex.language,
            }
        )

    db.commit()
    return {
        "attempt_id": attempt.id,
        "lesson_id": lesson_id,
        "exercises": exercises_public,
        "hearts_remaining": attempt.hearts_remaining,
        "total_exercises": len(exercises_public),
    }


def submit_answer(db: Session, user_id: int, attempt_id: int, exercise_id: int, user_answer) -> dict:
    attempt = db.query(LessonAttempt).filter(LessonAttempt.id == attempt_id).first()
    if not attempt:
        raise not_found("Lesson attempt")
    if attempt.user_id != user_id:
        raise forbidden()
    if attempt.is_completed or attempt.is_failed:
        raise bad_request("Attempt already finished")

    exercise = db.query(Exercise).filter(Exercise.id == exercise_id, Exercise.lesson_id == attempt.lesson_id).first()
    if not exercise:
        raise bad_request("Exercise not part of this lesson")

    # Prevent re-answering same exercise
    existing = (
        db.query(ExerciseAttempt)
        .filter(
            ExerciseAttempt.lesson_attempt_id == attempt_id,
            ExerciseAttempt.exercise_id == exercise_id,
            ExerciseAttempt.is_correct.isnot(None),
        )
        .first()
    )
    if existing:
        raise bad_request("Exercise already answered")

    is_correct, correct_answer = validate_answer(exercise.type, user_answer, exercise.payload)

    ea = ExerciseAttempt(
        lesson_attempt_id=attempt_id,
        exercise_id=exercise_id,
        user_answer=user_answer,
        is_correct=is_correct,
        correct_answer=correct_answer if not is_correct else None,
    )
    db.add(ea)

    lesson_failed = False
    feedback = "Great job!" if is_correct else "Not quite."

    if is_correct:
        attempt.correct_count += 1
    else:
        attempt.incorrect_count += 1
        hearts = lose_heart(db, user_id)
        attempt.hearts_remaining = hearts
        feedback = f"The correct answer is: {correct_answer}"
        _record_mistake(db, user_id, exercise, user_answer, correct_answer)
        if hearts <= 0:
            attempt.is_failed = True
            lesson_failed = True
            feedback = "Out of hearts! Lesson failed."

    answered_count = (
        db.query(ExerciseAttempt)
        .filter(ExerciseAttempt.lesson_attempt_id == attempt_id, ExerciseAttempt.is_correct.isnot(None))
        .count()
    )
    total = db.query(Exercise).filter(Exercise.lesson_id == attempt.lesson_id).count()
    db.commit()

    return {
        "is_correct": is_correct,
        "correct_answer": correct_answer if not is_correct else None,
        "hearts_remaining": attempt.hearts_remaining,
        "lesson_failed": lesson_failed,
        "feedback": feedback,
        "exercises_remaining": max(0, total - answered_count),
    }


def _record_mistake(db: Session, user_id: int, exercise: Exercise, user_answer, correct_answer) -> None:
    lesson = exercise.lesson
    record = (
        db.query(MistakeRecord)
        .filter(MistakeRecord.user_id == user_id, MistakeRecord.exercise_id == exercise.id)
        .first()
    )
    if record:
        record.mistake_count += 1
        record.user_answer = user_answer
        record.correct_answer = correct_answer
        record.last_mistake_at = datetime.now(timezone.utc)
    else:
        db.add(
            MistakeRecord(
                user_id=user_id,
                exercise_id=exercise.id,
                skill_id=lesson.skill_id,
                lesson_id=lesson.id,
                exercise_type=exercise.type,
                user_answer=user_answer,
                correct_answer=correct_answer,
            )
        )


def complete_lesson(db: Session, user_id: int, attempt_id: int) -> dict:
    attempt = (
        db.query(LessonAttempt)
        .options(joinedload(LessonAttempt.exercises))
        .filter(LessonAttempt.id == attempt_id)
        .first()
    )
    if not attempt:
        raise not_found("Lesson attempt")
    if attempt.user_id != user_id:
        raise forbidden()
    if attempt.is_completed:
        raise bad_request("Lesson already completed")
    if attempt.is_failed:
        raise bad_request("Cannot complete a failed lesson")

    lesson = db.query(Lesson).filter(Lesson.id == attempt.lesson_id).first()
    total_exercises = db.query(Exercise).filter(Exercise.lesson_id == lesson.id).count()
    answered = (
        db.query(ExerciseAttempt)
        .filter(ExerciseAttempt.lesson_attempt_id == attempt_id, ExerciseAttempt.is_correct.isnot(None))
        .count()
    )
    if answered < total_exercises:
        raise bad_request("Not all exercises completed")

    settings = get_settings()
    perfect = attempt.incorrect_count == 0
    xp = lesson.xp_reward + (settings.PERFECT_LESSON_BONUS_XP if perfect else 0)

    attempt.is_completed = True
    attempt.completed_at = datetime.now(timezone.utc)
    attempt.xp_earned = xp

    stats = award_xp(db, user_id, xp)
    stats = update_streak(db, user_id)
    stats.lessons_completed += 1
    if perfect:
        stats.perfect_lessons += 1

    # Skill progress
    progress = (
        db.query(UserSkillProgress)
        .filter(UserSkillProgress.user_id == user_id, UserSkillProgress.skill_id == lesson.skill_id)
        .first()
    )
    if not progress:
        progress = UserSkillProgress(
            user_id=user_id, skill_id=lesson.skill_id, state=SkillState.AVAILABLE.value
        )
        db.add(progress)
        db.flush()

    progress.lessons_completed += 1
    if progress.crown_level < 5:
        progress.crown_level = min(5, progress.crown_level + 1)
    skill_completed = progress.crown_level >= 5
    if skill_completed:
        progress.state = SkillState.COMPLETED.value

    unlocked = _unlock_next_skills(db, user_id, lesson.skill_id)

    newly_earned = evaluate_achievements(
        db,
        user_id,
        lesson_completed=True,
        perfect_lesson=perfect,
        skill_completed=skill_completed,
    )

    db.commit()

    return {
        "xp_earned": xp,
        "total_xp": stats.total_xp,
        "gems_earned": sum(a.get("gem_reward", 0) for a in newly_earned),
        "skill_progress": {"skill_id": lesson.skill_id, "lessons_completed": progress.lessons_completed},
        "crown_level": progress.crown_level,
        "unlocked_skills": unlocked,
        "streak": stats.current_streak,
        "daily_goal": {
            "goal": stats.daily_xp_goal,
            "today_xp": stats.today_xp,
            "met": stats.today_xp >= stats.daily_xp_goal,
        },
        "newly_earned_achievements": newly_earned,
        "perfect_lesson": perfect,
    }


def _unlock_next_skills(db: Session, user_id: int, skill_id: int) -> list[int]:
    from app.db.models.course import Skill, Unit

    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        return []

    unlocked_ids: list[int] = []
    next_skill = (
        db.query(Skill)
        .filter(Skill.unit_id == skill.unit_id, Skill.order == skill.order + 1)
        .first()
    )
    if next_skill:
        unlocked_ids.extend(_ensure_skill_available(db, user_id, next_skill.id))

    # Unlock first skill of next unit if last skill in unit completed
    unit_skills = db.query(Skill).filter(Skill.unit_id == skill.unit_id).order_by(Skill.order.desc()).first()
    if unit_skills and unit_skills.id == skill_id:
        unit = db.query(Unit).filter(Unit.id == skill.unit_id).first()
        next_unit_first = (
            db.query(Skill)
            .join(Unit)
            .filter(Unit.course_id == unit.course_id, Unit.order == unit.order + 1, Skill.order == 1)
            .first()
        )
        if next_unit_first:
            unlocked_ids.extend(_ensure_skill_available(db, user_id, next_unit_first.id))
    return unlocked_ids


def _ensure_skill_available(db: Session, user_id: int, skill_id: int) -> list[int]:
    progress = (
        db.query(UserSkillProgress)
        .filter(UserSkillProgress.user_id == user_id, UserSkillProgress.skill_id == skill_id)
        .first()
    )
    if progress and progress.state != SkillState.LOCKED.value:
        return []
    if not progress:
        progress = UserSkillProgress(user_id=user_id, skill_id=skill_id, state=SkillState.AVAILABLE.value)
        db.add(progress)
    else:
        progress.state = SkillState.AVAILABLE.value
    db.flush()
    return [skill_id]
