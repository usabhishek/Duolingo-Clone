# LinguaQuest — Complete Project Guide

**Version:** 1.0  
**Project Path:** `C:\Users\HP\Projects\linguaquest`  
**Purpose:** Duolingo-inspired full-stack language learning application (SDE Fullstack Assignment)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [File & Folder Structure](#3-file--folder-structure)
4. [Environment Variables (.env)](#4-environment-variables-env)
5. [How to Run Locally (Step-by-Step)](#5-how-to-run-locally-step-by-step)
6. [High-Level Design (HLD)](#6-high-level-design-hld)
7. [Low-Level Design (LLD)](#7-low-level-design-lld)
8. [System Design & Scaling](#8-system-design--scaling)
9. [Database Design](#9-database-design)
10. [API Reference Summary](#10-api-reference-summary)
11. [Authentication Flow](#11-authentication-flow)
12. [Lesson Engine Flow](#12-lesson-engine-flow)
13. [Gamification System](#13-gamification-system)
14. [WebSocket Chat Flow](#14-websocket-chat-flow)
15. [Audio & Speech System](#15-audio--speech-system)
16. [Personalized Learning Engine](#16-personalized-learning-engine)
17. [Frontend Architecture](#17-frontend-architecture)
18. [Security Architecture](#18-security-architecture)
19. [Docker Deployment](#19-docker-deployment)
20. [AWS / Production Deployment](#20-aws--production-deployment)
21. [Testing](#21-testing)
22. [Demo Accounts & Seed Data](#22-demo-accounts--seed-data)
23. [Interview Preparation](#23-interview-preparation)
24. [Known Limitations](#24-known-limitations)

---

## 1. Project Overview

LinguaQuest is a **monorepo** containing:

| Part | Technology | Port |
|------|-----------|------|
| Frontend | Next.js 14, React, TypeScript, Tailwind | 3000 |
| Backend | FastAPI, Python, SQLAlchemy | 8000 |
| Cache/PubSub | Redis | 6379 |
| Database | SQLite (dev) | file-based |

### What the app does
- Duolingo-style **learning path** with units, skills, lessons
- **8 exercise types** with immediate server-validated feedback
- **Gamification**: XP, hearts, streak, gems, crowns, daily goal
- **3 language tracks**: Spanish, German, English
- **Social**: friends, real-time chat (WebSocket)
- **Personalized learning**: mistake journal, weakness analyzer, recommendations

### Core design principle
> **The backend is authoritative.** The frontend never decides XP, hearts, correctness, or progress.

---

## 2. Technology Stack

### Frontend
| Tool | Why we use it |
|------|---------------|
| Next.js 14 (App Router) | File-based routing, SSR/SSG, production-ready |
| TypeScript | Type safety matching backend schemas |
| Tailwind CSS | Duolingo-style utility-first styling |
| TanStack Query | Server state caching (path, stats, leaderboard) |
| Framer Motion | Lesson feedback animations |
| Zustand | Available; lesson UI uses local React state instead |

### Backend
| Tool | Why we use it |
|------|---------------|
| FastAPI | Async, auto OpenAPI docs, Pydantic validation |
| SQLAlchemy 2.x | ORM with relationships, migrations-ready |
| Pydantic v2 | Request/response validation |
| SQLite | Zero-config for assignment/demo |
| Redis | Rate limiting, WebSocket pub/sub |
| JWT (python-jose) | Stateless authentication |
| bcrypt (passlib) | Secure password hashing |
| pytest | Backend test suite |

### Infrastructure
| Tool | Purpose |
|------|---------|
| Docker + docker-compose | Containerized local/production deploy |
| Environment variables | Config separation (dev/staging/prod) |

---

## 3. File & Folder Structure

```
linguaquest/
├── README.md                    # Quick start guide
├── docker-compose.yml           # Multi-service orchestration
├── .gitignore
│
├── backend/
│   ├── .env.example             # ← COPY TO .env (backend secrets)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── data/
│   │   └── linguaquest.db       # SQLite database (auto-created)
│   │
│   ├── app/
│   │   ├── main.py              # FastAPI entry point, CORS, routers
│   │   │
│   │   ├── core/
│   │   │   ├── config.py        # All env vars (Settings class)
│   │   │   ├── security.py      # JWT + password hashing
│   │   │   ├── exceptions.py    # HTTP error helpers
│   │   │   └── rate_limit.py    # Redis rate limiting
│   │   │
│   │   ├── db/
│   │   │   ├── database.py      # Engine, SessionLocal, Base
│   │   │   ├── seed.py          # Idempotent seed (ES/DE/EN + demo users)
│   │   │   └── models/
│   │   │       ├── user.py      # User, OAuthAccount
│   │   │       ├── course.py    # Course, Unit, Skill, Lesson, Exercise
│   │   │       ├── progress.py  # UserSkillProgress, LessonAttempt, MistakeRecord
│   │   │       ├── gamification.py  # UserStats, Achievement, PracticeSession
│   │   │       └── social.py    # Friendship, ChatMessage, FriendActivity
│   │   │
│   │   ├── schemas/             # Pydantic request/response models
│   │   │   ├── auth.py
│   │   │   └── course.py
│   │   │
│   │   ├── services/            # Business logic (THE MOST IMPORTANT LAYER)
│   │   │   ├── lesson.py        # Start/answer/complete lesson
│   │   │   ├── exercise_validator.py  # Per-type answer validation
│   │   │   ├── gamification.py  # Hearts, XP, streak
│   │   │   ├── achievements.py  # Achievement evaluation
│   │   │   ├── path.py          # Learning path with lock states
│   │   │   └── analytics.py     # Weakness, recommendations, health score
│   │   │
│   │   ├── api/
│   │   │   ├── deps.py          # get_current_user, get_db dependencies
│   │   │   └── v1/
│   │   │       ├── auth.py      # register, login, me
│   │   │       ├── courses.py   # courses, path
│   │   │       ├── lessons.py   # lesson attempt loop
│   │   │       ├── gamification.py
│   │   │       ├── achievements.py
│   │   │       ├── friends.py
│   │   │       └── analytics.py # mistakes, recommendations, practice
│   │   │
│   │   └── websocket/
│   │       ├── chat.py          # WS /ws/chat endpoint
│   │       └── manager.py       # Connection manager + Redis pub/sub
│   │
│   └── tests/
│       ├── conftest.py
│       └── test_main.py         # 6 integration tests
│
├── frontend/
│   ├── .env.example             # ← COPY TO .env.local (public URLs only)
│   ├── .env.local               # Your local frontend config (create this)
│   ├── Dockerfile
│   ├── package.json
│   │
│   ├── app/                     # Next.js App Router pages
│   │   ├── page.tsx             # Home — learning path + course selector
│   │   ├── layout.tsx           # Root layout
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── lesson/[id]/page.tsx # Lesson player
│   │   ├── profile/page.tsx
│   │   ├── leaderboard/page.tsx
│   │   ├── achievements/page.tsx
│   │   ├── friends/page.tsx
│   │   ├── chat/page.tsx
│   │   ├── practice/page.tsx
│   │   ├── mistakes/page.tsx
│   │   └── analytics/page.tsx
│   │
│   ├── components/
│   │   ├── layout/AppShell.tsx  # Bottom nav + TopBar wrapper
│   │   ├── gamification/TopBar.tsx
│   │   ├── learning/LearningPath.tsx
│   │   ├── lesson/              # Exercise type UIs
│   │   ├── audio/AudioButton.tsx
│   │   └── common/ThemeProvider.tsx
│   │
│   ├── lib/
│   │   ├── api/client.ts        # Centralized HTTP client
│   │   ├── api/index.ts         # Feature API modules
│   │   └── auth/tokens.ts       # JWT localStorage (NOT XP/hearts)
│   │
│   ├── types/index.ts           # TypeScript interfaces
│   └── public/
│       ├── avatars/             # Generated Duolingo-style avatars
│       └── images/              # SVG illustrations (dog, cat)
│
└── docs/
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── API.md
    ├── SECURITY.md
    ├── DEPLOYMENT.md
    ├── FRONTEND_ARCHITECTURE.md
    └── FINAL_STATUS.md
```

---

## 4. Environment Variables (.env)

### ⚠️ IMPORTANT: Two separate env files

| File | Location | Contains secrets? |
|------|----------|-------------------|
| **Backend `.env`** | `backend/.env` | ✅ YES — JWT secret, DB, Redis, OAuth |
| **Frontend `.env.local`** | `frontend/.env.local` | ❌ NO — public URLs only |

### Backend `.env` — create from example

```powershell
cd C:\Users\HP\Projects\linguaquest\backend
copy .env.example .env
```

```env
# backend/.env
DATABASE_URL=sqlite:///./data/linguaquest.db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=change-me-to-a-long-random-secret-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DEBUG=true
ENVIRONMENT=development

# Optional Google OAuth (leave blank to disable)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/oauth/google/callback
FRONTEND_OAUTH_REDIRECT=http://localhost:3000/auth/callback

# Rate limits
RATE_LIMIT_LOGIN=5/minute
RATE_LIMIT_REGISTER=3/minute
RATE_LIMIT_CHAT=30/minute
RATE_LIMIT_FRIEND_REQUEST=10/hour
RATE_LIMIT_LESSON_ANSWER=120/minute
```

**Never commit `backend/.env` to git** — it's in `.gitignore`.

### Frontend `.env.local` — create from example

```powershell
cd C:\Users\HP\Projects\linguaquest\frontend
copy .env.example .env.local
```

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

> ⚠️ Only `NEXT_PUBLIC_*` vars are exposed to the browser. Never put JWT secrets here.

### What each variable does

| Variable | Layer | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Backend | SQLite/Postgres connection string |
| `REDIS_URL` | Backend | Rate limits + WebSocket pub/sub |
| `JWT_SECRET_KEY` | Backend | Signs access/refresh tokens |
| `CORS_ORIGINS` | Backend | Allowed frontend origins |
| `GOOGLE_CLIENT_*` | Backend | Optional OAuth (server-side only) |
| `RATE_LIMIT_*` | Backend | Abuse prevention thresholds |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend REST base URL |
| `NEXT_PUBLIC_WS_URL` | Frontend | WebSocket base URL |

---

## 5. How to Run Locally (Step-by-Step)

### Prerequisites
- Python 3.10+
- Node.js 20+
- Redis (optional but recommended)

### Step 1 — Clone / navigate to project
```powershell
cd C:\Users\HP\Projects\linguaquest
```

### Step 2 — Backend setup
```powershell
cd backend

# Create virtual environment (first time only)
python -m venv .venv
.\.venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Create env file (first time only)
copy .env.example .env

# Create data directory (first time only)
mkdir data

# Seed database with courses + demo users (first time, or to reset)
$env:PYTHONPATH="."
python -m app.db.seed

# Start backend server
uvicorn app.main:app --reload --port 8000
```

✅ Backend running at: http://localhost:8000  
✅ API docs at: http://localhost:8000/docs

### Step 3 — Frontend setup (new terminal)
```powershell
cd C:\Users\HP\Projects\linguaquest\frontend

# Install dependencies (first time only)
npm install

# Create env file (first time only)
copy .env.example .env.local

# Start frontend dev server
npm run dev
```

✅ Frontend running at: http://localhost:3000

### Step 4 — Redis (optional but recommended)
```powershell
# If you have Redis installed locally:
redis-server

# Or via Docker:
docker run -d -p 6379:6379 redis:7-alpine
```
Without Redis: rate limiting fails open (app still works).

### Step 5 — Login
Open http://localhost:3000/login

| Email | Password |
|-------|----------|
| demo@linguaquest.com | password123 |
| maria@linguaquest.com | password123 |

### Step 6 — Run tests
```powershell
# Backend tests
cd backend
$env:PYTHONPATH="."
pytest -v

# Frontend build check
cd frontend
npm run build
```

### All-in-one with Docker
```powershell
cd C:\Users\HP\Projects\linguaquest
docker-compose up --build
```
Starts: backend (8000), frontend (3000), redis (6379)

---

## 6. High-Level Design (HLD)

### System Context Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      LEARNER (Browser)                   │
│  Next.js App  —  pages, components, TanStack Query       │
└──────────────┬──────────────────────────┬───────────────┘
               │ HTTP REST (/api/v1)       │ WebSocket (/ws/chat)
               ▼                           ▼
┌──────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                        │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐ │
│  │ Routers │→ │ Services │→ │ SQLAlchemy│→ │ SQLite   │ │
│  │ (api/)  │  │(business)│  │   ORM     │  │   DB     │ │
│  └─────────┘  └──────────┘  └───────────┘  └──────────┘ │
│       │                                                   │
│       └──────────────────► Redis (rate limit, WS pub/sub)│
└──────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| **Frontend** | UI/UX, display server data, collect user input |
| **API Routers** | HTTP routing, input validation, auth checks |
| **Services** | Business logic, gamification rules, lesson engine |
| **ORM/Models** | Database reads/writes |
| **SQLite** | Persistent source of truth |
| **Redis** | Ephemeral: rate counters, WS message relay |

### Data Flow (Simplified)
```
User action → Frontend API client → FastAPI router
  → JWT auth dependency → Service layer → Database
  → Response schema → Frontend → UI update
```

---

## 7. Low-Level Design (LLD)

### 7.1 Backend Layer Architecture

```
HTTP Request
    │
    ▼
main.py (CORS, lifespan, router registration)
    │
    ▼
api/v1/*.py (Router)
    │  - Validates request body (Pydantic)
    │  - Calls Depends(get_current_user) for auth
    │  - Calls Depends(get_db) for DB session
    ▼
services/*.py (Business Logic)
    │  - lesson.py: lesson lifecycle
    │  - exercise_validator.py: answer checking
    │  - gamification.py: XP/hearts/streak
    │  - analytics.py: weakness scoring
    ▼
db/models/*.py (SQLAlchemy ORM)
    │
    ▼
SQLite (data/linguaquest.db)
```

### 7.2 Exercise Validator (Extensible Design)

```python
# services/exercise_validator.py
VALIDATORS = {
    "multiple_choice": validate_multiple_choice,
    "word_bank":       validate_word_bank,
    "match_pairs":     validate_match_pairs,
    "fill_blank":      validate_fill_blank,
    "type_answer":     validate_type_answer,
    "audio":           validate_audio,
    "speech":          validate_speech,
    "image_choice":    validate_image_choice,
}

# To add a new exercise type:
# 1. Add validator function
# 2. Register in VALIDATORS dict
# 3. Add sanitize rule in sanitize_payload_for_client()
# 4. Add frontend component in ExerciseRenderer.tsx
```

### 7.3 Lesson State Machine

```
[Start Lesson]
      │
      ▼
[Attempt Created] ──hearts=0──► [FAILED] (cannot complete)
      │
      ▼
[Answering Exercises] ◄── loop ──┐
      │                          │
      ├── correct ────────────────┤
      ├── wrong (lose heart) ────┤
      │                          │
      ▼ (all answered)           │
[Complete Lesson]                │
      │                          │
      ▼                          │
[XP + Streak + Crowns + Achievements + Unlock next skill]
```

### 7.4 Authentication Class Diagram

```
User
├── id, email, username
├── hashed_password (nullable for OAuth users)
├── avatar_url, active_course_id
├── stats: UserStats (1:1)
├── skill_progress: UserSkillProgress[]
├── oauth_accounts: OAuthAccount[]
└── achievements: UserAchievement[]

JWT Payload: { sub: user_id, exp, type: "access"|"refresh" }
```

### 7.5 Frontend Component Tree

```
RootLayout
└── ThemeProvider
    └── Providers (TanStack Query)
        └── AppShell
            ├── TopBar (stats from /api/v1/stats)
            ├── {page content}
            └── BottomNav

LessonPage
├── ProgressBar + Hearts
├── ExerciseRenderer
│   ├── MultipleChoice / WordBank / MatchPairs
│   ├── FillBlank / TypeAnswer / SpeechInput
│   └── AudioButton
└── FeedbackBar (correct/incorrect animation)
```

---

## 8. System Design & Scaling

### Current Architecture (Assignment/Demo)
- Single FastAPI process
- SQLite file database
- Redis for rate limits
- Suitable for: **1–100 concurrent users**

### Scaling Path

#### Phase 1 — Vertical Scale (100–1K users)
```
Single EC2 / VPS
├── FastAPI (uvicorn workers=4)
├── SQLite on EFS volume
└── Redis on same host
```

#### Phase 2 — Horizontal Scale (1K–10K users)
```
                    ┌─── FastAPI Instance 1 ───┐
CloudFront/ALB ─────├─── FastAPI Instance 2 ───├─── RDS PostgreSQL
                    └─── FastAPI Instance 3 ───┘
                              │
                         ElastiCache Redis
                              │
                    WebSocket sticky sessions on ALB
```

**Changes needed:**
1. Replace `DATABASE_URL` with PostgreSQL connection string
2. Run Alembic migrations instead of `create_all()`
3. Redis required (not optional) for WS pub/sub across instances
4. Store JWT secret in AWS Secrets Manager
5. Frontend on Amplify/Vercel/S3+CloudFront

#### Phase 3 — High Scale (10K+ users)
```
CDN → Frontend (static/SSR)
         ↓
    API Gateway / ALB
         ↓
    ECS Fargate (auto-scaling FastAPI pods)
         ↓
    RDS PostgreSQL (read replicas)
    ElastiCache Redis Cluster
    S3 (audio/assets)
    SQS (async achievement notifications)
```

### Bottleneck Analysis

| Component | Bottleneck at scale | Solution |
|-----------|-------------------|----------|
| SQLite | Single writer | Migrate to PostgreSQL |
| Single FastAPI | CPU/memory | Horizontal pods + load balancer |
| WebSocket | Connection affinity | Sticky sessions + Redis pub/sub |
| Leaderboard query | Full table scan | Materialized view or Redis sorted set |
| Exercise payload | Large JSON reads | Cache course content in Redis |

### Caching Strategy (Future)
```
Redis cache:
  course:{id}:path     → TTL 1 hour (rarely changes)
  user:{id}:stats      → TTL 30 seconds (invalidate on lesson complete)
  leaderboard:top20    → TTL 5 minutes
```

---

## 9. Database Design

### ER Diagram (Text)

```
Course ──< Unit ──< Skill ──< Lesson ──< Exercise
  │
  └── (active_course_id) ── User ──< UserSkillProgress >── Skill
                              │
                              ├── UserStats (1:1)
                              ├── LessonAttempt ──< ExerciseAttempt
                              ├── MistakeRecord
                              ├── UserAchievement >── Achievement
                              ├── Friendship
                              └── ChatMessage
```

### Key Tables

| Table | Rows (seeded) | Key columns |
|-------|--------------|-------------|
| courses | 3 (ES, DE, EN) | slug, language_code, color |
| units | 12 (4 per course) | order, title |
| skills | 36 (3 per unit) | crown max = 5 |
| lessons | 72 (2 per skill) | xp_reward = 10 |
| exercises | ~360 | type, payload (JSON), audio_text |
| users | 5 demo users | avatar_url, active_course_id |
| user_stats | 5 | total_xp, hearts, streak |
| achievements | 8 | slug, xp/streak/lesson thresholds |

### Important Constraints
- `UNIQUE(user_id, skill_id)` on user_skill_progress
- `UNIQUE(user_id, exercise_id)` on mistake_records
- `UNIQUE(email)`, `UNIQUE(username)` on users
- `ON DELETE CASCADE` on all user FK relationships

### Exercise Payload Example (stored in DB, sanitized before client)
```json
{
  "options": [
    {"id": "a", "text": "Hello"},
    {"id": "b", "text": "Goodbye"}
  ],
  "correct_option_id": "a"
}
```
Client receives options WITHOUT `correct_option_id`.

---

## 10. API Reference Summary

Base: `http://localhost:8000/api/v1`

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | No | Create account |
| POST | /auth/login | No | Login (form: username=email) |
| GET | /auth/me | Yes | Profile + stats |

### Learning
| Method | Path | Description |
|--------|------|-------------|
| GET | /courses | List ES/DE/EN courses |
| GET | /path?course_id=1 | Full learning path |
| POST | /users/active-course | Switch language track |
| POST | /lessons/{id}/attempts | Start lesson |
| POST | /lesson-attempts/{id}/answer | Submit answer |
| POST | /lesson-attempts/{id}/complete | Finish + earn XP |

### Gamification
| GET | /stats | XP, hearts, streak, daily goal |
| POST | /hearts/refill | Spend gems for hearts |
| GET | /leaderboard | Real XP rankings |
| GET | /achievements | All achievements |

### Social & Learning Analytics
| GET | /friends | Friend list |
| POST | /friends/request | Send request |
| GET | /friends/activity | Friend activity feed |
| GET | /mistakes | Mistake journal |
| GET | /recommendations | Weak area recommendation |
| GET | /analytics | Full analytics |
| GET | /analytics/learning-health | 0-100 health score |
| POST | /practice/personalized | Start weak-area practice |

### WebSocket
```
ws://localhost:8000/ws/chat?token=JWT

Send:    {"type": "message", "recipient_id": 2, "content": "Hola!"}
Receive: {"type": "message", "id": 1, "sender_id": 1, "content": "...", "created_at": "..."}
Ping:    {"type": "ping"} → {"type": "pong"}
```

---

## 11. Authentication Flow

```
Registration:
  Client POST /auth/register {email, username, password, display_name}
    → Rate limit check (Redis)
    → Check email/username uniqueness
    → bcrypt hash password
    → Create User + UserStats rows
    → Return JWT access + refresh tokens

Login:
  Client POST /auth/login (form: username=email, password)
    → Rate limit check
    → Find user by email
    → bcrypt verify password
    → Return JWT tokens

Protected Request:
  Client sends: Authorization: Bearer <access_token>
    → deps.get_current_user decodes JWT
    → Extract sub (user_id)
    → Load User from DB
    → Inject into route handler

Token Storage (Frontend):
  localStorage: lq_access_token, lq_refresh_token
  NEVER stored: XP, hearts, gems
```

---

## 12. Lesson Engine Flow

### Start Lesson
```
POST /lessons/5/attempts
→ Check user has hearts > 0
→ Create LessonAttempt (hearts_remaining = current hearts)
→ Load exercises, strip correct answers via sanitize_payload_for_client()
→ Return { attempt_id, exercises[], hearts_remaining }
```

### Submit Answer
```
POST /lesson-attempts/12/answer { exercise_id, user_answer }
→ Verify attempt belongs to current user (IDOR check)
→ Verify attempt not completed/failed
→ Verify exercise belongs to this lesson
→ validate_answer(type, user_answer, payload) → is_correct
→ If wrong: lose_heart(), record MistakeRecord
→ If hearts = 0: mark attempt as failed
→ Return { is_correct, correct_answer (if wrong), hearts_remaining }
```

### Complete Lesson
```
POST /lesson-attempts/12/complete
→ Verify all exercises answered
→ Calculate XP (base + perfect bonus)
→ award_xp(), update_streak()
→ Increment crown level on skill
→ Unlock next skill if applicable
→ evaluate_achievements()
→ Return { xp_earned, streak, newly_earned_achievements, unlocked_skills }
```

---

## 13. Gamification System

| Mechanic | Storage | Server Rule |
|----------|---------|-------------|
| XP | user_stats.total_xp | +10 per lesson, +5 perfect bonus |
| Hearts | user_stats.hearts | -1 per wrong answer, max 5 |
| Heart regen | last_heart_regen_at | 1 heart per 30 min |
| Heart refill | gems | 350 gems → full hearts |
| Streak | current_streak | +1 if active yesterday, reset if gap |
| Daily goal | today_xp / daily_xp_goal | Resets at midnight |
| Crowns | user_skill_progress.crown_level | +1 per lesson, max 5 |
| Gems | user_stats.gems | Earned from achievements |
| Leaderboard | Derived from total_xp | No separate table |

**Anti-cheat:** No endpoint accepts `{xp: N}` from client.

---

## 14. WebSocket Chat Flow

```
1. Client: new WebSocket("ws://localhost:8000/ws/chat?token=JWT")
2. Server: decode JWT → get user_id → accept connection
3. Client sends: { type: "message", recipient_id: 2, content: "Hi!" }
4. Server:
   a. Validate content length (max 500)
   b. Check friendship exists (status=accepted)
   c. Rate limit via Redis
   d. Save ChatMessage to SQLite
   e. Send to recipient's active connections
   f. Publish to Redis channel for other server instances
5. Disconnect: remove from ConnectionManager.active
```

---

## 15. Audio & Speech System

### Text-to-Speech (Free — Browser)
```
Backend returns: { audio_text: "Hola", language: "es-ES" }
Frontend: new SpeechSynthesisUtterance("Hola") with lang="es-ES"
No paid API needed.
```

### Speech Recognition (Browser → Backend)
```
User speaks → Web Speech API → transcript string
→ POST /lesson-attempts/{id}/answer { user_answer: transcript }
→ Backend normalize_text() (lowercase, strip punctuation, Unicode normalize)
→ Compare against acceptable_answers[]
→ Return is_correct (server decides, never trust client)
```

Fallback UI: "Speech recognition is unavailable. Type your answer instead."

---

## 16. Personalized Learning Engine

### Mistake Journal
Wrong answers → `MistakeRecord` table (upsert by user+exercise)

### Weakness Score (Deterministic — No ML)
```
weakness_score = mistake_count × recency_weight × difficulty_weight

recency_weight    = 1 / (1 + days_since_last_mistake)
difficulty_weight = 1 + (1 - skill_accuracy)
```

### Learning Health (0–100)
```
score = accuracy×30 + consistency×25 + coverage×25 + recovery×20

accuracy    = correct / total attempts
consistency = min(1, streak / 7)
coverage    = min(1, lessons_completed / 20)
recovery    = max(0, 1 - mistakes / 50)
```

### Practice XP Cap
Personalized practice awards max **5 XP** per session to prevent farming.

---

## 17. Frontend Architecture

### State Management Rules
| Data | Where stored | Why |
|------|-------------|-----|
| XP, hearts, streak | TanStack Query → server | Authoritative backend |
| Learning path | TanStack Query | Cached 30s |
| Selected words/pairs | Local React state | Temporary UI only |
| JWT token | localStorage | Auth persistence |

### API Client Pattern
```typescript
// All HTTP calls go through lib/api/client.ts
// Never scatter raw fetch() in components

import { lessonsApi } from "@/lib/api";
const session = await lessonsApi.start(token, lessonId);
```

### Key Pages
| Route | Component | Data source |
|-------|-----------|-------------|
| / | LearningPath + course selector | GET /path, /courses |
| /lesson/[id] | ExerciseRenderer | POST lesson attempts |
| /profile | Stats + health | GET /auth/me, /analytics/learning-health |
| /leaderboard | Ranked list | GET /leaderboard |
| /mistakes | Mistake journal | GET /mistakes |

---

## 18. Security Architecture

| Threat | Mitigation |
|--------|-----------|
| IDOR (access other user's attempt) | `attempt.user_id == current_user.id` check |
| XP manipulation | No endpoint accepts XP in request body |
| SQL injection | SQLAlchemy parameterized queries |
| Brute force login | Redis rate limit 5/minute |
| Answer leaking | `sanitize_payload_for_client()` strips answers |
| JWT theft | Short expiry (60 min), HTTPS in production |
| Chat abuse | Friend-only, length limit, rate limit |
| Mass assignment | Pydantic schemas whitelist fields |
| Stack trace leak | Generic error messages in production |

---

## 19. Docker Deployment

```yaml
# docker-compose.yml services:
backend:   port 8000, mounts ./backend/data for SQLite
frontend:  port 3000
redis:     port 6379
```

```powershell
cd C:\Users\HP\Projects\linguaquest
docker-compose up --build
```

Backend startup command runs seed automatically then starts uvicorn.

---

## 20. AWS / Production Deployment

```
Internet
    │
CloudFront (CDN)
    ├── S3 / Amplify → Next.js frontend
    │
    └── ALB (HTTPS)
            ├── Target Group → ECS Fargate (FastAPI × N)
            │       ├── ElastiCache Redis
            │       └── RDS PostgreSQL
            └── WebSocket support (sticky sessions, idle timeout 3600s)
```

### Environment changes for production
```env
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/linguaquest
REDIS_URL=redis://elasticache-endpoint:6379/0
JWT_SECRET_KEY=<from AWS Secrets Manager>
CORS_ORIGINS=https://linguaquest.com
ENVIRONMENT=production
DEBUG=false
NEXT_PUBLIC_API_URL=https://api.linguaquest.com
NEXT_PUBLIC_WS_URL=wss://api.linguaquest.com
```

---

## 21. Testing

### Backend (pytest)
```powershell
cd backend
$env:PYTHONPATH="."
pytest -v
```

| Test | What it verifies |
|------|-----------------|
| test_health | Server starts |
| test_register_login | Auth flow |
| test_seed_and_courses | DB seed works |
| test_lesson_flow | Full lesson start→answer→complete |
| test_leaderboard | Real XP ranking |
| test_idor_attempt | User B cannot complete User A's attempt |

**Result: 6/6 passed**

### Frontend
```powershell
cd frontend
npm run build   # TypeScript + production build
npm run lint    # ESLint
```

---

## 22. Demo Accounts & Seed Data

| Email | Username | XP | Streak | Avatar |
|-------|----------|----|--------|--------|
| demo@linguaquest.com | demo | 450 | 7 | avatar-1.png |
| maria@linguaquest.com | maria | 1200 | 14 | avatar-2.png |
| hans@linguaquest.com | hans | 890 | 10 | avatar-3.png |
| emma@linguaquest.com | emma | 650 | 5 | avatar-4.png |
| carlos@linguaquest.com | carlos | 320 | 3 | avatar-5.png |

All passwords: `password123`

### Seeded content per language track
- 4 units × 3 skills × 2 lessons × 5 exercises = **120 exercises per language**
- All 8 exercise types included
- Achievements, friendships, friend activity pre-seeded

### Re-run seed safely (idempotent)
```powershell
cd backend
$env:PYTHONPATH="."
python -m app.db.seed
```

---

## 23. Interview Preparation

### Must-know files (read these first)
1. `backend/app/services/lesson.py` — lesson lifecycle
2. `backend/app/services/exercise_validator.py` — answer validation
3. `backend/app/services/gamification.py` — XP/hearts/streak
4. `backend/app/db/models/` — database schema
5. `frontend/lib/api/client.ts` — API integration pattern

### Top 10 interview questions
1. **Why is the backend authoritative for gamification?**  
   Prevents cheating; client is untrusted; all XP/hearts computed server-side.

2. **How do you prevent exposing correct answers?**  
   `sanitize_payload_for_client()` removes correct_option_id, pairs, etc. before API response.

3. **Explain the IDOR fix on lesson attempts.**  
   Every attempt operation checks `attempt.user_id == current_user.id`.

4. **Why SQLite for demo but Postgres for production?**  
   SQLite: zero config, single file, great for dev. Postgres: concurrent writes, replication, production ops.

5. **How does the weakness analyzer work without ML?**  
   Deterministic formula: mistake_count × recency × difficulty. Explainable and testable.

6. **Why Redis?**  
   Rate limiting counters, WebSocket pub/sub for multi-instance chat, future caching layer.

7. **How would you scale WebSockets?**  
   Sticky sessions on ALB + Redis pub/sub so any instance can deliver to any connected user.

8. **Why TanStack Query instead of storing XP in Zustand?**  
   Server is source of truth; Query handles cache, refetch, stale data automatically.

9. **How do you add a new exercise type?**  
   Add validator in exercise_validator.py + UI component in ExerciseRenderer.tsx.

10. **Explain the monorepo structure decision.**  
    Single repo, shared docs, easier local dev, one docker-compose — no microservice overhead for this scope.

---

## 24. Known Limitations

| Item | Status | Notes |
|------|--------|-------|
| Google OAuth callback | Partial | Start URL works; needs GOOGLE_CLIENT_ID to complete |
| Alembic migrations | Not used | Uses `create_all()` — add Alembic for production |
| Docker tested | Not in session | docker-compose.yml exists |
| Redis required | Optional | App fails open if Redis down |
| Test coverage | 6 tests | Core flows covered, not exhaustive |
| Legendary UI page | Minimal | Backend API exists, no dedicated UI page |

---

*End of LinguaQuest Project Guide*
