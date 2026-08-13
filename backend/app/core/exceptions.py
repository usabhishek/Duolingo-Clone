"""Custom HTTP exceptions with safe user-facing messages (no stack traces)."""
from fastapi import HTTPException, status


class AppHTTPException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


def not_found(resource: str = "Resource") -> AppHTTPException:
    return AppHTTPException(status.HTTP_404_NOT_FOUND, f"{resource} not found")


def forbidden(message: str = "Not authorized") -> AppHTTPException:
    return AppHTTPException(status.HTTP_403_FORBIDDEN, message)


def unauthorized(message: str = "Could not validate credentials") -> AppHTTPException:
    return AppHTTPException(status.HTTP_401_UNAUTHORIZED, message)


def bad_request(message: str) -> AppHTTPException:
    return AppHTTPException(status.HTTP_400_BAD_REQUEST, message)


def conflict(message: str) -> AppHTTPException:
    return AppHTTPException(status.HTTP_409_CONFLICT, message)


def too_many_requests(message: str = "Rate limit exceeded") -> AppHTTPException:
    return AppHTTPException(status.HTTP_429_TOO_MANY_REQUESTS, message)
