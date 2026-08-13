"""Pydantic request/response schemas for auth and users."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    id: int
    email: EmailStr
    username: str
    display_name: str
    avatar_url: str
    active_course_id: Optional[int] = None

    model_config = {"from_attributes": True}


class UserProfile(UserPublic):
    total_xp: int = 0
    gems: int = 0
    hearts: int = 0
    max_hearts: int = 5
    current_streak: int = 0
    longest_streak: int = 0
    daily_xp_goal: int = 50
    today_xp: int = 0
    lessons_completed: int = 0


class UserStatsResponse(BaseModel):
    total_xp: int
    gems: int
    hearts: int
    max_hearts: int
    current_streak: int
    longest_streak: int
    daily_xp_goal: int
    today_xp: int
    daily_goal_met: bool
    lessons_completed: int
    perfect_lessons: int

    model_config = {"from_attributes": True}


class SetActiveCourseRequest(BaseModel):
    course_id: int
