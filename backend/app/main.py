"""FastAPI application entry point."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import achievements, analytics, auth, courses, friends, gamification, lessons
from app.core.config import get_settings
from app.db.database import Base, engine
from app.db import models  # noqa: F401 — register models
from app.websocket import chat as ws_chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure data directory exists for SQLite
    os.makedirs("data", exist_ok=True)
    Base.metadata.create_all(bind=engine)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    prefix = settings.API_V1_PREFIX
    app.include_router(auth.router, prefix=prefix)
    app.include_router(courses.router, prefix=prefix)
    app.include_router(lessons.router, prefix=prefix)
    app.include_router(gamification.router, prefix=prefix)
    app.include_router(achievements.router, prefix=prefix)
    app.include_router(friends.router, prefix=prefix)
    app.include_router(analytics.router, prefix=prefix)
    app.include_router(ws_chat.router)

    @app.get("/health")
    def health():
        return {"status": "ok", "app": settings.APP_NAME}

    return app


app = create_app()
