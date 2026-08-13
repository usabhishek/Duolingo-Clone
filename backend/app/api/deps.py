"""FastAPI dependencies — DB session and authenticated user."""
from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.exceptions import unauthorized
from app.core.security import safe_decode_token
from app.db.database import get_db
from app.db.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    payload = safe_decode_token(token)
    if not payload or payload.get("type") != "access":
        raise unauthorized()
    user_id = payload.get("sub")
    if not user_id:
        raise unauthorized()
    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()  # noqa: E712
    if not user:
        raise unauthorized()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
DbSession = Annotated[Session, Depends(get_db)]
