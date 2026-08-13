"""Application configuration loaded from environment variables.

WHY: Centralizes all secrets and tunables so Docker, local dev, and AWS
deployments differ only by env — never by code changes.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "LinguaQuest"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database — SQLite for assignment/demo; swap URL for Postgres in production
    DATABASE_URL: str = "sqlite:///./data/linguaquest.db"

    # Redis — rate limits, WebSocket pub/sub, presence, cache
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT auth
    JWT_SECRET_KEY: str = "change-me-in-production-use-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS — frontend origin(s)
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"

    # Gamification defaults (server-authoritative)
    MAX_HEARTS: int = 5
    HEART_REGEN_MINUTES: int = 30
    HEART_REFILL_GEM_COST: int = 350
    DAILY_XP_GOAL_DEFAULT: int = 50
    LESSON_XP_BASE: int = 10
    PERFECT_LESSON_BONUS_XP: int = 5

    # Rate limits (requests per window)
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_REGISTER: str = "3/minute"
    RATE_LIMIT_CHAT: str = "30/minute"
    RATE_LIMIT_FRIEND_REQUEST: str = "10/hour"
    RATE_LIMIT_LESSON_ANSWER: str = "120/minute"

    # OAuth — optional; app works without these
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/oauth/google/callback"
    FRONTEND_OAUTH_REDIRECT: str = "http://localhost:3000/auth/callback"

    # WebSocket / chat
    CHAT_MAX_MESSAGE_LENGTH: int = 500

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def google_oauth_enabled(self) -> bool:
        return bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET)


@lru_cache
def get_settings() -> Settings:
    return Settings()
