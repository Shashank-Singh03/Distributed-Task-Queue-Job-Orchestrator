"""Job lifecycle event logging."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional

from app.config import settings
from app.models import JobStatus
from app.redis_client import get_redis


class EventType(str, Enum):
    """Types of job lifecycle events."""

    CREATED = "CREATED"
    ENQUEUED = "ENQUEUED"
    LEASED = "LEASED"
    STARTED = "STARTED"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    RETRIED = "RETRIED"
    DEAD_LETTERED = "DEAD_LETTERED"
    CANCELLED = "CANCELLED"
    STATUS_CHANGED = "STATUS_CHANGED"


async def append_job_event(
    job_id: str,
    event_type: EventType,
    status: JobStatus,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Append a job lifecycle event to both global stream and per-job list.

    Args:
        job_id: The job identifier
        event_type: Type of event
        status: Job status after this event
        details: Optional event details (error message, worker id, etc.)
    """
    redis = await get_redis()
    now = datetime.now(timezone.utc)

    # Prepare event data
    event_data = {
        "job_id": job_id,
        "event_type": event_type.value,
        "status": status.value,
        "timestamp": now.isoformat(),
    }

    if details:
        import json

        event_data["details"] = json.dumps(details)

    # Add to global events stream
    await redis.xadd(
        settings.job_events_stream,
        event_data,
        maxlen=100000,  # Keep last 100k events
    )

    # Add to per-job events list
    job_events_key = f"job:{job_id}:events"
    import json

    event_json = json.dumps(event_data)
    await redis.rpush(job_events_key, event_json)
    await redis.expire(job_events_key, 86400 * 7)  # Keep for 7 days


async def get_job_events(job_id: str) -> list[Dict[str, Any]]:
    """
    Retrieve all events for a specific job.

    Args:
        job_id: The job identifier

    Returns:
        List of events in chronological order
    """
    redis = await get_redis()
    job_events_key = f"job:{job_id}:events"

    events_json = await redis.lrange(job_events_key, 0, -1)

    import json

    events = []
    for event_json in events_json:
        try:
            event = json.loads(event_json)
            events.append(event)
        except json.JSONDecodeError:
            continue

    # Sort by timestamp
    events.sort(key=lambda e: e.get("timestamp", ""))

    return events

