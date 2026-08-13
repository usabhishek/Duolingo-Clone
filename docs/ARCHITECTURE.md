# Architecture

## Overview
```
Browser (Next.js) ──HTTP/WS──► FastAPI ──► SQLite (persistent)
                                  │
                                  └──► Redis (rate limits, WS pub/sub)
```

## Request Lifecycle (FastAPI)
```
HTTP Request
  → Router (api/v1/*.py)
  → Dependency (get_current_user, get_db)
  → Service (lesson.py, gamification.py, etc.)
  → SQLAlchemy ORM
  → SQLite
  → Pydantic Response Schema
```

## Lesson Lifecycle
```
POST /lessons/{id}/attempts     → Create LessonAttempt, return exercises (no answers)
POST /lesson-attempts/{id}/answer → Validate via exercise_validator, update hearts
POST /lesson-attempts/{id}/complete → Award XP, streak, crowns, achievements, unlock skills
```

## Authentication Flow
```
Register → bcrypt hash → User + UserStats rows → JWT access + refresh tokens
Login → verify password → JWT
Protected route → OAuth2PasswordBearer → decode JWT → load User → authorize
```

## WebSocket Flow
```
Client connects /ws/chat?token=JWT
  → Validate JWT, extract user_id (never trust client sender_id)
  → Friend-only check via Friendship table
  → Rate limit via Redis
  → Persist ChatMessage in SQLite
  → Publish via Redis pub/sub to recipient connections
```

## Personalized Learning Flow
```
ExerciseAttempt (wrong answers)
  → MistakeRecord (persistent journal)
  → Weakness analyzer (deterministic formula)
  → GET /recommendations
  → POST /practice/personalized (capped XP)
```

## Weakness Formula (no ML)
```
weakness_score = mistake_frequency × recency_weight × difficulty_weight

recency_weight = 1 / (1 + days_since_last_mistake)
difficulty_weight = 1 + (1 - skill_accuracy)
```

## Learning Health Score (0-100)
```
accuracy × 30 + consistency × 25 + coverage × 25 + recovery × 20
```

## Security Architecture
- JWT auth on all protected endpoints
- IDOR prevention: attempt.user_id == current_user.id
- No correct answers in exercise payload before submission
- XP/hearts/gems never accepted from client body
- Rate limiting on login, register, chat, answers
- OAuth secrets server-side only

## Multi-Language Design
`Course.language_code` (es/de/en) — add courses without schema changes.
