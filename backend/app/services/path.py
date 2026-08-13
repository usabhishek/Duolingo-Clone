"""Learning path service — units, skills, lock/unlock states."""
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import not_found
from app.db.models.base import SkillState
from app.db.models.course import Course, Lesson, Skill, Unit
from app.db.models.progress import UserSkillProgress


def get_path(db: Session, user_id: int, course_id: int | None = None) -> dict:
    from app.db.models.user import User

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise not_found("User")

    cid = course_id or user.active_course_id
    if not cid:
        course = db.query(Course).order_by(Course.id).first()
        if not course:
            raise not_found("Course")
        cid = course.id
        user.active_course_id = cid
        db.flush()
    else:
        course = db.query(Course).filter(Course.id == cid).first()
        if not course:
            raise not_found("Course")

    progress_map = {
        p.skill_id: p
        for p in db.query(UserSkillProgress).filter(UserSkillProgress.user_id == user_id).all()
    }

    units = (
        db.query(Unit)
        .options(joinedload(Unit.skills).joinedload(Skill.lessons))
        .filter(Unit.course_id == course.id)
        .order_by(Unit.order)
        .all()
    )

    units_out = []
    for unit in units:
        skills_out = []
        for skill in sorted(unit.skills, key=lambda s: s.order):
            prog = progress_map.get(skill.id)
            state = prog.state if prog else SkillState.LOCKED.value
            crown = prog.crown_level if prog else 0

            # First skill of first unit always available for new users
            if unit.order == 1 and skill.order == 1 and not prog:
                state = SkillState.AVAILABLE.value
                if not prog:
                    prog = UserSkillProgress(
                        user_id=user_id, skill_id=skill.id, state=SkillState.AVAILABLE.value
                    )
                    db.add(prog)
                    db.flush()

            lessons_out = []
            for lesson in sorted(skill.lessons, key=lambda l: l.order):
                lessons_out.append(
                    {
                        "id": lesson.id,
                        "title": lesson.title,
                        "order": lesson.order,
                        "xp_reward": lesson.xp_reward,
                        "is_locked": state == SkillState.LOCKED.value,
                        "is_completed": crown > 0 and lesson.order <= prog.lessons_completed if prog else False,
                    }
                )

            skills_out.append(
                {
                    "id": skill.id,
                    "title": skill.title,
                    "description": skill.description,
                    "order": skill.order,
                    "icon": skill.icon,
                    "crown_level": crown,
                    "max_crowns": skill.max_crowns,
                    "state": state,
                    "lessons": lessons_out,
                }
            )
        units_out.append(
            {
                "id": unit.id,
                "title": unit.title,
                "description": unit.description,
                "order": unit.order,
                "color": unit.color,
                "skills": skills_out,
            }
        )

    db.commit()
    return {
        "course": {
            "id": course.id,
            "slug": course.slug,
            "title": course.title,
            "language_code": course.language_code,
            "source_language": course.source_language,
            "description": course.description,
            "icon": course.icon,
            "color": course.color,
        },
        "units": units_out,
    }
