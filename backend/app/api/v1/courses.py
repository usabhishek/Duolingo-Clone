"""Learning path and course endpoints."""
from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.db.models.course import Course
from app.schemas.auth import SetActiveCourseRequest
from app.services.path import get_path

router = APIRouter(tags=["courses"])


@router.get("/courses")
def list_courses(db: DbSession):
    courses = db.query(Course).all()
    return [
        {
            "id": c.id,
            "slug": c.slug,
            "title": c.title,
            "language_code": c.language_code,
            "description": c.description,
            "color": c.color,
            "icon": c.icon,
        }
        for c in courses
    ]


@router.get("/path")
def learning_path(user: CurrentUser, db: DbSession, course_id: int | None = Query(None)):
    return get_path(db, user.id, course_id)


@router.post("/users/active-course")
def set_active_course(data: SetActiveCourseRequest, user: CurrentUser, db: DbSession):
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        from app.core.exceptions import not_found
        raise not_found("Course")
    user.active_course_id = data.course_id
    db.commit()
    return {"active_course_id": data.course_id}
