"""Backend test suite."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.seed import run_seed

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "test@test.com", "username": "testuser", "password": "password123", "display_name": "Test"},
    )
    resp = client.post("/api/v1/auth/login", data={"username": "test@test.com", "password": "password123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    assert client.get("/health").status_code == 200


def test_register_login(client):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": "a@b.com", "username": "abuser", "password": "password123", "display_name": "AB"},
    )
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_seed_and_courses(client, db):
    from app.db.seed import seed_course, seed_achievements, COURSE_DEFS
    seed_course(db, COURSE_DEFS[0])
    seed_achievements(db)
    db.commit()
    r = client.get("/api/v1/courses")
    assert r.status_code == 200


def test_lesson_flow(client, db, auth_headers):
    from app.db.seed import seed_course, COURSE_DEFS
    from app.db.models.course import Lesson

    seed_course(db, COURSE_DEFS[0])
    db.commit()
    lesson = db.query(Lesson).first()
    start = client.post(f"/api/v1/lessons/{lesson.id}/attempts", headers=auth_headers)
    assert start.status_code == 200
    data = start.json()
    assert "attempt_id" in data
    assert len(data["exercises"]) > 0

    ex = data["exercises"][0]
    # Wrong answer first to test hearts
    ans = client.post(
        f"/api/v1/lesson-attempts/{data['attempt_id']}/answer",
        headers=auth_headers,
        json={"exercise_id": ex["id"], "user_answer": "wrong"},
    )
    assert ans.status_code == 200

    # Answer remaining exercises correctly
    from app.db.models.course import Exercise
    for exercise in db.query(Exercise).filter(Exercise.lesson_id == lesson.id).all():
        payload = exercise.payload
        correct = (
            payload.get("correct_option_id")
            or payload.get("correct_sequence")
            or payload.get("pairs")
            or payload.get("correct_answer")
        )
        client.post(
            f"/api/v1/lesson-attempts/{data['attempt_id']}/answer",
            headers=auth_headers,
            json={"exercise_id": exercise.id, "user_answer": correct},
        )

    complete = client.post(f"/api/v1/lesson-attempts/{data['attempt_id']}/complete", headers=auth_headers)
    assert complete.status_code == 200
    assert complete.json()["xp_earned"] > 0


def test_leaderboard(client, db, auth_headers):
    from app.db.seed import seed_course, seed_users, COURSE_DEFS
    course = seed_course(db, COURSE_DEFS[0])
    seed_users(db, course)
    db.commit()
    r = client.get("/api/v1/leaderboard", headers=auth_headers)
    assert r.status_code == 200
    assert "entries" in r.json()


def test_idor_attempt(client, db, auth_headers):
    from app.db.seed import seed_course, COURSE_DEFS
    from app.db.models.course import Lesson

    seed_course(db, COURSE_DEFS[0])
    db.commit()
    lesson = db.query(Lesson).first()
    start = client.post(f"/api/v1/lessons/{lesson.id}/attempts", headers=auth_headers)
    attempt_id = start.json()["attempt_id"]

    # Register second user
    client.post(
        "/api/v1/auth/register",
        json={"email": "b@b.com", "username": "buser", "password": "password123", "display_name": "B"},
    )
    resp2 = client.post("/api/v1/auth/login", data={"username": "b@b.com", "password": "password123"})
    headers2 = {"Authorization": f"Bearer {resp2.json()['access_token']}"}

    r = client.post(
        f"/api/v1/lesson-attempts/{attempt_id}/complete",
        headers=headers2,
    )
    assert r.status_code == 403
