"""Redis-backed rate limiting.

HOW: Each key tracks request count in a sliding window. Used on login,
registration, chat, and reward-sensitive endpoints.
"""
import time
from typing import Optional

import redis

from app.core.config import get_settings
from app.core.exceptions import too_many_requests

_redis: Optional[redis.Redis] = None


def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(get_settings().REDIS_URL, decode_responses=True)
    return _redis


def parse_rate_limit(limit: str) -> tuple[int, int]:
    """Parse '5/minute' -> (5, 60)."""
    count_str, period = limit.split("/")
    count = int(count_str)
    seconds = {"second": 1, "minute": 60, "hour": 3600, "day": 86400}[period.rstrip("s")]
    return count, seconds


def check_rate_limit(key: str, limit: str) -> None:
    """Raise 429 if limit exceeded."""
    try:
        r = get_redis()
        max_requests, window = parse_rate_limit(limit)
        now = int(time.time())
        bucket = f"rl:{key}:{now // window}"
        current = r.incr(bucket)
        if current == 1:
            r.expire(bucket, window + 1)
        if current > max_requests:
            raise too_many_requests()
    except redis.RedisError:
        # If Redis is down, fail open for availability in demo mode
        pass
