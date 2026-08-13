# Security

## Authentication
- bcrypt password hashing (passlib)
- JWT access tokens (HS256, configurable expiry)
- Secrets in environment variables only

## Authorization (IDOR Prevention)
Every resource access checks ownership:
- LessonAttempt.user_id == current_user.id
- MistakeRecord filtered by user_id
- Chat: friend-only, sender from JWT not client payload

## Input Validation
- Pydantic v2 schemas on all request bodies
- Exercise answers validated server-side per type
- Chat message length limit (500 chars)

## Reward Protection
- No endpoint accepts `{ "xp": N }` from client
- Lesson completion requires all exercises answered
- Duplicate completion rejected
- Practice XP capped at 5 per session

## Rate Limiting (Redis)
- Login: 5/minute
- Register: 3/minute
- Chat: 30/minute
- Lesson answers: 120/minute

## OAuth
- GOOGLE_CLIENT_SECRET never exposed to frontend
- Optional — app works without OAuth credentials

## Error Handling
- No stack traces in production responses
- Generic user-facing error messages

## Frontend Security
- No secrets in NEXT_PUBLIC_* variables
- JWT in localStorage (demo); use httpOnly cookies in production
