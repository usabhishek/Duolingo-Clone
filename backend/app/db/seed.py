"""
Idempotent database seed — Spanish, German, and English courses.

WHY: Provides demo content for assignment evaluation without manual setup.
HOW: Checks slug/email uniqueness before insert; safe to run twice.

Run: python -m app.db.seed
"""
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.database import SessionLocal, engine, Base
from app.db import models  # noqa
from app.db.models.base import SkillState
from app.db.models.course import Course, Exercise, Lesson, Skill, Unit
from app.db.models.gamification import Achievement, UserAchievement, UserStats
from app.db.models.progress import UserSkillProgress
from app.db.models.social import FriendActivity, Friendship
from app.db.models.user import User

AVATARS = [
    "/avatars/avatar-1.png",
    "/avatars/avatar-2.png",
    "/avatars/avatar-3.png",
    "/avatars/avatar-4.png",
    "/avatars/avatar-5.png",
]


def _exercise_templates(lang: str) -> list[dict]:
    """Reusable exercise templates per language."""
    if lang == "es":
        return [
            {
                "type": "multiple_choice",
                "prompt": "What does 'Hola' mean?",
                "payload": {
                    "options": [{"id": "a", "text": "Hello"}, {"id": "b", "text": "Goodbye"}, {"id": "c", "text": "Thanks"}],
                    "correct_option_id": "a",
                },
                "audio_text": "Hola",
                "language": "es-ES",
            },
            {
                "type": "word_bank",
                "prompt": "Translate: Good morning",
                "payload": {
                    "word_bank": ["Buenos", "días", "Buenas", "noches"],
                    "correct_sequence": ["Buenos", "días"],
                },
                "language": "es-ES",
            },
            {
                "type": "match_pairs",
                "prompt": "Match the pairs",
                "payload": {
                    "left_items": ["perro", "gato", "pájaro"],
                    "right_items": ["dog", "cat", "bird"],
                    "pairs": {"perro": "dog", "gato": "cat", "pájaro": "bird"},
                },
                "language": "es-ES",
            },
            {
                "type": "fill_blank",
                "prompt": "Fill in the blank",
                "payload": {"sentence": "Me llamo ___", "correct_answer": "Ana", "hint": "A name"},
                "language": "es-ES",
            },
            {
                "type": "type_answer",
                "prompt": "Type the translation for 'Thank you'",
                "payload": {"correct_answer": "Gracias", "acceptable_answers": ["gracias", "Gracias"]},
                "language": "es-ES",
            },
            {
                "type": "audio",
                "prompt": "Type what you hear",
                "payload": {"correct_answer": "Adiós", "acceptable_answers": ["adios", "adiós", "Adiós"]},
                "audio_text": "Adiós",
                "language": "es-ES",
            },
            {
                "type": "speech",
                "prompt": "Say 'Por favor'",
                "payload": {"correct_answer": "por favor", "acceptable_answers": ["por favor", "Por favor"]},
                "audio_text": "Por favor",
                "language": "es-ES",
            },
            {
                "type": "image_choice",
                "prompt": "What is 'perro'?",
                "payload": {
                    "options": [
                        {"id": "dog", "text": "Dog", "image": "/images/dog.svg"},
                        {"id": "cat", "text": "Cat", "image": "/images/cat.svg"},
                    ],
                    "correct_option_id": "dog",
                },
                "language": "es-ES",
            },
        ]
    if lang == "de":
        return [
            {
                "type": "multiple_choice",
                "prompt": "What does 'Hallo' mean?",
                "payload": {
                    "options": [{"id": "a", "text": "Hello"}, {"id": "b", "text": "Bye"}],
                    "correct_option_id": "a",
                },
                "audio_text": "Hallo",
                "language": "de-DE",
            },
            {
                "type": "word_bank",
                "prompt": "Translate: Good morning",
                "payload": {"word_bank": ["Guten", "Morgen", "Tag"], "correct_sequence": ["Guten", "Morgen"]},
                "language": "de-DE",
            },
            {
                "type": "match_pairs",
                "prompt": "Match pairs",
                "payload": {
                    "left_items": ["Hund", "Katze"],
                    "right_items": ["dog", "cat"],
                    "pairs": {"Hund": "dog", "Katze": "cat"},
                },
                "language": "de-DE",
            },
            {
                "type": "fill_blank",
                "prompt": "Fill blank",
                "payload": {"sentence": "Ich heiße ___", "correct_answer": "Anna"},
                "language": "de-DE",
            },
            {
                "type": "type_answer",
                "prompt": "Type 'Thank you' in German",
                "payload": {"correct_answer": "Danke", "acceptable_answers": ["danke", "Danke"]},
                "language": "de-DE",
            },
            {
                "type": "audio",
                "prompt": "Type what you hear",
                "payload": {"correct_answer": "Tschüss", "acceptable_answers": ["tschüss", "Tschüss", "tschuss"]},
                "audio_text": "Tschüss",
                "language": "de-DE",
            },
            {
                "type": "speech",
                "prompt": "Say 'Bitte'",
                "payload": {"correct_answer": "bitte", "acceptable_answers": ["bitte", "Bitte"]},
                "audio_text": "Bitte",
                "language": "de-DE",
            },
            {
                "type": "image_choice",
                "prompt": "What is 'Hund'?",
                "payload": {
                    "options": [{"id": "dog", "text": "Dog", "image": "/images/dog.svg"}, {"id": "cat", "text": "Cat", "image": "/images/cat.svg"}],
                    "correct_option_id": "dog",
                },
                "language": "de-DE",
            },
        ]
    # English for non-native speakers
    return [
        {
            "type": "multiple_choice",
            "prompt": "Choose the correct greeting",
            "payload": {"options": [{"id": "a", "text": "Hello"}, {"id": "b", "text": "Hola"}], "correct_option_id": "a"},
            "audio_text": "Hello",
            "language": "en-US",
        },
        {
            "type": "word_bank",
            "prompt": "Build: How are you?",
            "payload": {"word_bank": ["How", "are", "you", "What"], "correct_sequence": ["How", "are", "you"]},
            "language": "en-US",
        },
        {
            "type": "match_pairs",
            "prompt": "Match",
            "payload": {"left_items": ["dog", "cat"], "right_items": ["animal pet", "feline"], "pairs": {"dog": "animal pet", "cat": "feline"}},
            "language": "en-US",
        },
        {
            "type": "fill_blank",
            "prompt": "Fill blank",
            "payload": {"sentence": "My name is ___", "correct_answer": "John"},
            "language": "en-US",
        },
        {
            "type": "type_answer",
            "prompt": "Type a polite word",
            "payload": {"correct_answer": "Please", "acceptable_answers": ["please", "Please"]},
            "language": "en-US",
        },
        {
            "type": "audio",
            "prompt": "Type what you hear",
            "payload": {"correct_answer": "Goodbye", "acceptable_answers": ["goodbye", "Goodbye"]},
            "audio_text": "Goodbye",
            "language": "en-US",
        },
        {
            "type": "speech",
            "prompt": "Say 'Thank you'",
            "payload": {"correct_answer": "thank you", "acceptable_answers": ["thank you", "Thank you"]},
            "audio_text": "Thank you",
            "language": "en-US",
        },
        {
            "type": "image_choice",
            "prompt": "Which is a dog?",
            "payload": {
                "options": [{"id": "dog", "text": "Dog", "image": "/images/dog.svg"}, {"id": "cat", "text": "Cat", "image": "/images/cat.svg"}],
                "correct_option_id": "dog",
            },
            "language": "en-US",
        },
    ]


COURSE_DEFS = [
    {"slug": "spanish", "title": "Spanish", "language_code": "es", "color": "#58CC02", "icon": "🇪🇸"},
    {"slug": "german", "title": "German", "language_code": "de", "color": "#FF9600", "icon": "🇩🇪"},
    {"slug": "english", "title": "English", "language_code": "en", "color": "#1CB0F6", "icon": "🇬🇧"},
]

UNIT_TITLES = [
    ("Basics 1", "Learn essential words and phrases"),
    ("Basics 2", "Expand your vocabulary"),
    ("Greetings", "Say hello and introduce yourself"),
    ("Travel", "Useful phrases for traveling"),
]

SKILL_TITLES = [
    ("Greetings", "Say hello"),
    ("People", "Talk about people"),
    ("Food", "Order food"),
]


def seed_course(db: Session, course_def: dict) -> Course:
    existing = db.query(Course).filter(Course.slug == course_def["slug"]).first()
    if existing:
        return existing

    course = Course(
        slug=course_def["slug"],
        title=course_def["title"],
        language_code=course_def["language_code"],
        source_language="en",
        description=f"Learn {course_def['title']} from scratch",
        icon=course_def["icon"],
        color=course_def["color"],
    )
    db.add(course)
    db.flush()

    templates = _exercise_templates(course_def["language_code"])
    for u_idx, (u_title, u_desc) in enumerate(UNIT_TITLES, 1):
        unit = Unit(course_id=course.id, title=u_title, description=u_desc, order=u_idx)
        db.add(unit)
        db.flush()
        for s_idx, (s_title, s_desc) in enumerate(SKILL_TITLES, 1):
            skill = Skill(unit_id=unit.id, title=s_title, description=s_desc, order=s_idx)
            db.add(skill)
            db.flush()
            for l_idx in range(1, 3):
                lesson = Lesson(skill_id=skill.id, title=f"Lesson {l_idx}", order=l_idx, xp_reward=10)
                db.add(lesson)
                db.flush()
                for e_idx, tmpl in enumerate(templates[:5], 1):
                    db.add(
                        Exercise(
                            lesson_id=lesson.id,
                            order=e_idx,
                            type=tmpl["type"],
                            prompt=tmpl["prompt"],
                            payload=tmpl["payload"],
                            audio_text=tmpl.get("audio_text"),
                            language=tmpl.get("language", "en-US"),
                        )
                    )
    db.flush()
    return course


def seed_achievements(db: Session):
    achievements = [
        ("first_lesson", "First Steps", "Complete your first lesson", 0, None, 1, 10),
        ("xp_100", "Century Club", "Earn 100 XP", 100, None, None, 20),
        ("xp_500", "XP Hunter", "Earn 500 XP", 500, None, None, 50),
        ("streak_3", "On Fire", "3-day streak", None, 3, None, 15),
        ("streak_7", "Week Warrior", "7-day streak", None, 7, None, 30),
        ("perfect_lesson", "Perfectionist", "Complete a perfect lesson", None, None, None, 25),
        ("lessons_10", "Dedicated", "Complete 10 lessons", None, None, 10, 20),
        ("skill_master", "Skill Master", "Complete a skill", None, None, None, 40),
    ]
    for slug, title, desc, xp_t, streak_t, lesson_t, gems in achievements:
        if not db.query(Achievement).filter(Achievement.slug == slug).first():
            db.add(
                Achievement(
                    slug=slug,
                    title=title,
                    description=desc,
                    xp_threshold=xp_t,
                    streak_threshold=streak_t,
                    lesson_threshold=lesson_t,
                    gem_reward=gems,
                )
            )


def seed_users(db: Session, spanish_course: Course):
    demo_users = [
        ("demo@linguaquest.com", "demo", "Demo Learner", 450, 5, 7, 0),
        ("maria@linguaquest.com", "maria", "Maria Garcia", 1200, 5, 14, 1),
        ("hans@linguaquest.com", "hans", "Hans Mueller", 890, 4, 10, 2),
        ("emma@linguaquest.com", "emma", "Emma Wilson", 650, 5, 5, 3),
        ("carlos@linguaquest.com", "carlos", "Carlos Ruiz", 320, 3, 3, 4),
    ]
    users = []
    for email, username, name, xp, crowns, streak, avatar_idx in demo_users:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                username=username,
                hashed_password=hash_password("password123"),
                display_name=name,
                avatar_url=AVATARS[avatar_idx % len(AVATARS)],
                active_course_id=spanish_course.id,
            )
            db.add(user)
            db.flush()
            stats = UserStats(
                user_id=user.id,
                total_xp=xp,
                gems=500,
                hearts=5,
                current_streak=streak,
                longest_streak=streak,
                last_activity_date=date.today(),
                lessons_completed=xp // 10,
                today_xp=min(50, xp % 50 + 20),
                today_date=date.today(),
            )
            db.add(stats)
        users.append(user)

    # Demo user progress on first skills
    demo = users[0]
    skills = db.query(Skill).join(Unit).filter(Unit.course_id == spanish_course.id).limit(3).all()
    for i, skill in enumerate(skills):
        if not db.query(UserSkillProgress).filter(UserSkillProgress.user_id == demo.id, UserSkillProgress.skill_id == skill.id).first():
            db.add(
                UserSkillProgress(
                    user_id=demo.id,
                    skill_id=skill.id,
                    crown_level=min(5, i + 2),
                    state=SkillState.COMPLETED.value if i == 0 else SkillState.AVAILABLE.value,
                    lessons_completed=2 if i == 0 else 1,
                )
            )

    # Friendships
    if len(users) >= 3 and not db.query(Friendship).first():
        db.add(Friendship(requester_id=users[0].id, addressee_id=users[1].id, status="accepted"))
        db.add(Friendship(requester_id=users[0].id, addressee_id=users[2].id, status="accepted"))
        db.add(Friendship(requester_id=users[3].id, addressee_id=users[0].id, status="pending"))

    # Friend activity
    if not db.query(FriendActivity).first():
        db.add(FriendActivity(user_id=users[1].id, activity_type="lesson_completed", message="Maria completed a lesson!"))
        db.add(FriendActivity(user_id=users[2].id, activity_type="streak_milestone", message="Hans reached a 10-day streak!"))

    db.flush()
    return users


def run_seed():
    import os
    os.makedirs("data", exist_ok=True)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        courses = [seed_course(db, c) for c in COURSE_DEFS]
        seed_achievements(db)
        seed_users(db, courses[0])
        db.commit()
        print("Seed completed successfully (idempotent).")
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
