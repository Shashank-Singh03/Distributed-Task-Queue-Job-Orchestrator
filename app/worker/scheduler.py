"""Retry scheduling and backoff logic."""

from datetime import datetime, timedelta, timezone

from app.config import settings


def compute_next_backoff_ms(attempt: int) -> int:
    """Compute exponential backoff delay in milliseconds.
    
    Formula: initial_backoff_ms * (2 ^ (attempt - 1))
    Clamped between initial_backoff_ms and max_backoff_ms.
    
    Args:
        attempt: Current attempt number (1-indexed)
        
    Returns:
        Backoff delay in milliseconds
    """
    if attempt < 1:
        attempt = 1
    
    # Exponential backoff: initial * 2^(attempt-1)
    backoff_ms = settings.initial_backoff_ms * (2 ** (attempt - 1))
    
    # Clamp between initial and max
    backoff_ms = max(settings.initial_backoff_ms, backoff_ms)
    backoff_ms = min(backoff_ms, settings.max_backoff_ms)
    
    return int(backoff_ms)


def compute_next_attempt_time(now: datetime, attempt: int) -> datetime:
    """Compute the next attempt time based on backoff.
    
    Args:
        now: Current datetime
        attempt: Current attempt number
        
    Returns:
        Datetime for next attempt
    """
    backoff_ms = compute_next_backoff_ms(attempt)
    backoff_delta = timedelta(milliseconds=backoff_ms)
    return now + backoff_delta

