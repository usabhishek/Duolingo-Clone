"""Weakness analyzer and personalized recommendations — deterministic, no ML.

FORMULA (documented in docs/ARCHITECTURE.md):
  weakness_score = mistake_frequency × recency_weight × difficulty_weight

  recency_weight = 1 / (1 + days_since_last_mistake)
  difficulty_weight = 1 + (1 - skill_accuracy)
"""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.db.models.course import Exercise, Skill
from app.db.models.progress import ExerciseAttempt, MistakeRecord


def compute_skill_accuracy(db: Session, user_id: int, skill_id: int) -> float:
    attempts = (
        db.query(ExerciseAttempt)
        .join(Exercise)
        .join(ExerciseAttempt.lesson_attempt)
        .filter(
            ExerciseAttempt.lesson_attempt.has(user_id=user_id),
            Exercise.skill.has(id=skill_id),
        )
        .all()
    )
    if not attempts:
        return 1.0
    correct = sum(1 for a in attempts if a.is_correct)
    return correct / len(attempts) if attempts else 1.0


def compute_weakness_scores(db: Session, user_id: int) -> list[dict]:
    mistakes = db.query(MistakeRecord).filter(MistakeRecord.user_id == user_id).all()
    now = datetime.now(timezone.utc)
    skill_scores: dict[int, dict] = {}

    for m in mistakes:
        try:
            # tolerate missing timestamps
            if not getattr(m, 'last_mistake_at', None):
                days = 0
            else:
                days = max(0, (now - m.last_mistake_at.replace(tzinfo=timezone.utc)).days)
            recency_weight = 1 / (1 + days)

            # tolerate missing skill_id
            if not getattr(m, 'skill_id', None):
                continue

            accuracy = compute_skill_accuracy(db, user_id, m.skill_id)
            difficulty_weight = 1 + (1 - accuracy)
            score = (m.mistake_count or 0) * recency_weight * difficulty_weight

            if m.skill_id not in skill_scores or score > skill_scores[m.skill_id]["weakness_score"]:
                skill = db.query(Skill).filter(Skill.id == m.skill_id).first()
                skill_scores[m.skill_id] = {
                    "skill_id": m.skill_id,
                    "skill_title": skill.title if skill else "Unknown",
                    "weakness_score": round(score, 3),
                    "mistake_count": m.mistake_count,
                    "exercise_type": m.exercise_type,
                    "reason": f"Frequent mistakes in {skill.title if skill else 'this skill'}",
                }
        except Exception:
            # skip any problematic record but continue processing others
            continue

    return sorted(skill_scores.values(), key=lambda x: x["weakness_score"], reverse=True)


def get_recommendations(db: Session, user_id: int) -> dict:
    weaknesses = compute_weakness_scores(db, user_id)
    if not weaknesses:
        first_skill = db.query(Skill).order_by(Skill.id).first()
        return {
            "recommended_skill": {"id": first_skill.id, "title": first_skill.title} if first_skill else None,
            "reason": "Continue your learning path",
            "weakness_score": 0,
            "recommended_exercises": [],
        }

    top = weaknesses[0]
    exercises = (
        db.query(Exercise)
        .filter(Exercise.id.in_(
            [m.exercise_id for m in db.query(MistakeRecord).filter(
                MistakeRecord.user_id == user_id, MistakeRecord.skill_id == top["skill_id"]
            ).limit(5).all()]
        ))
        .limit(5)
        .all()
    )
    return {
        "recommended_skill": {"id": top["skill_id"], "title": top["skill_title"]},
        "reason": top["reason"],
        "weakness_score": top["weakness_score"],
        "recommended_exercises": [{"id": e.id, "type": e.type, "prompt": e.prompt} for e in exercises],
    }


def compute_learning_health(db: Session, user_id: int) -> dict:
    """Score 0-100 from explainable factors."""
    from app.db.models.gamification import UserStats
    from app.db.models.progress import LessonAttempt

    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    attempts = db.query(ExerciseAttempt).join(ExerciseAttempt.lesson_attempt).filter(
        ExerciseAttempt.lesson_attempt.has(user_id=user_id)
    ).all()

    accuracy = sum(1 for a in attempts if a.is_correct) / len(attempts) if attempts else 0.5
    consistency = min(1.0, (stats.current_streak if stats else 0) / 7)
    coverage = min(1.0, (stats.lessons_completed if stats else 0) / 20)
    mistakes = db.query(MistakeRecord).filter(MistakeRecord.user_id == user_id).count()
    recovery = max(0, 1 - mistakes / 50)

    score = int((accuracy * 30 + consistency * 25 + coverage * 25 + recovery * 20))
    score = max(0, min(100, score))

    weaknesses = compute_weakness_scores(db, user_id)
    category = "Excellent" if score >= 80 else "Good" if score >= 60 else "Needs Practice"

    return {
        "score": score,
        "category": category,
        "strengths": ["Consistency"] if consistency > 0.5 else ["Getting started"],
        "weaknesses": [w["skill_title"] for w in weaknesses[:3]],
        "explanation": f"Based on {len(attempts)} exercise attempts, {int(accuracy*100)}% accuracy, and {stats.current_streak if stats else 0}-day streak.",
    }


def get_analytics(db: Session, user_id: int) -> dict:
    from app.db.models.gamification import UserStats

    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    attempts = db.query(ExerciseAttempt).join(ExerciseAttempt.lesson_attempt).filter(
        ExerciseAttempt.lesson_attempt.has(user_id=user_id)
    ).all()

    correct = sum(1 for a in attempts if a.is_correct)
    incorrect = sum(1 for a in attempts if a.is_correct is False)
    total = len(attempts)

    type_stats: dict[str, dict] = {}
    for a in attempts:
        ex = db.query(Exercise).filter(Exercise.id == a.exercise_id).first()
        if not ex:
            continue
        if ex.type not in type_stats:
            type_stats[ex.type] = {"correct": 0, "total": 0}
        type_stats[ex.type]["total"] += 1
        if a.is_correct:
            type_stats[ex.type]["correct"] += 1

    health = compute_learning_health(db, user_id)
    weaknesses = compute_weakness_scores(db, user_id)

    return {
        "total_exercises": total,
        "correct_answers": correct,
        "incorrect_answers": incorrect,
        "accuracy": round(correct / total, 3) if total else 0,
        "lessons_completed": stats.lessons_completed if stats else 0,
        "strongest_exercise_type": max(type_stats, key=lambda k: type_stats[k]["correct"] / max(1, type_stats[k]["total"]), default="none"),
        "weakest_exercise_type": min(type_stats, key=lambda k: type_stats[k]["correct"] / max(1, type_stats[k]["total"]), default="none") if type_stats else "none",
        "weakest_skill": weaknesses[0]["skill_title"] if weaknesses else None,
        "learning_health": health,
    }
