"""Authentication endpoints: register, login, OAuth, current user."""
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.core.exceptions import bad_request, conflict, unauthorized
from app.core.rate_limit import check_rate_limit
from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.db.models.gamification import UserStats
from app.db.models.user import OAuthAccount, User
from app.schemas.auth import TokenResponse, UserProfile, UserPublic, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: DbSession):
    check_rate_limit(f"register:{data.email}", get_settings().RATE_LIMIT_REGISTER)
    if db.query(User).filter((User.email == data.email) | (User.username == data.username)).first():
        raise conflict("Email or username already registered")
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password),
        display_name=data.display_name,
        avatar_url="/avatars/default.svg",
    )
    db.add(user)
    db.flush()
    db.add(UserStats(user_id=user.id))
    db.commit()
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
def login(db: DbSession, form: OAuth2PasswordRequestForm = Depends()):
    check_rate_limit(f"login:{form.username}", get_settings().RATE_LIMIT_LOGIN)
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not user.hashed_password or not verify_password(form.password, user.hashed_password):
        raise unauthorized("Invalid email or password")
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.get("/me", response_model=UserProfile)
def me(user: CurrentUser, db: DbSession):
    stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()
    return UserProfile(
        id=user.id,
        email=user.email,
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        active_course_id=user.active_course_id,
        total_xp=stats.total_xp if stats else 0,
        gems=stats.gems if stats else 0,
        hearts=stats.hearts if stats else 5,
        max_hearts=stats.max_hearts if stats else 5,
        current_streak=stats.current_streak if stats else 0,
        longest_streak=stats.longest_streak if stats else 0,
        daily_xp_goal=stats.daily_xp_goal if stats else 50,
        today_xp=stats.today_xp if stats else 0,
        lessons_completed=stats.lessons_completed if stats else 0,
    )


@router.get("/oauth/google/status")
def oauth_status():
    return {"enabled": get_settings().google_oauth_enabled}


@router.get("/oauth/google")
def oauth_google_start():
    settings = get_settings()
    if not settings.google_oauth_enabled:
        raise bad_request("Google OAuth is not configured")
    import secrets
    state = secrets.token_urlsafe(32)
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        f"&response_type=code&scope=openid email profile&state={state}"
    )
    return {"authorization_url": url, "state": state}


@router.get("/oauth/google/callback")
def oauth_google_callback(db: DbSession, code: str, state: str | None = None):
    settings = get_settings()
    if not settings.google_oauth_enabled:
        raise bad_request("Google OAuth is not configured")

    # Exchange authorization code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    import httpx
    from urllib.parse import urlencode

    resp = httpx.post(token_url, data=data, timeout=10.0)
    if resp.status_code != 200:
        raise bad_request("Failed to exchange code with Google")
    token_data = resp.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise bad_request("Missing access token from Google")

    # Retrieve user info
    userinfo_resp = httpx.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10.0,
    )
    if userinfo_resp.status_code != 200:
        raise bad_request("Failed to fetch user info from Google")
    userinfo = userinfo_resp.json()
    provider_user_id = userinfo.get("sub")
    email = userinfo.get("email")
    display_name = userinfo.get("name") or (email.split("@")[0] if email else f"google_{provider_user_id}")
    avatar = userinfo.get("picture")

    # Find or create user and OAuth account
    oauth = db.query(OAuthAccount).filter(OAuthAccount.provider == "google", OAuthAccount.provider_user_id == provider_user_id).first()
    if oauth:
        user = oauth.user
    else:
        user = None
        if email:
            user = db.query(User).filter(User.email == email).first()
        if not user:
            base = (email.split("@")[0] if email else f"google_{provider_user_id}")[:50]
            username = base
            i = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base}{i}"
                i += 1
            user = User(
                email=email or f"{provider_user_id}@noemail",
                username=username,
                hashed_password=None,
                display_name=display_name,
                avatar_url=avatar or "/avatars/default.svg",
            )
            db.add(user)
            db.flush()
            db.add(UserStats(user_id=user.id))
        new_oauth = OAuthAccount(user_id=user.id, provider="google", provider_user_id=provider_user_id, email=email)
        db.add(new_oauth)
        db.commit()

    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))

    params = {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}
    if state:
        params["state"] = state
    redirect_url = f"{settings.FRONTEND_OAUTH_REDIRECT}?{urlencode(params)}"
    from fastapi.responses import RedirectResponse

    return RedirectResponse(redirect_url)

