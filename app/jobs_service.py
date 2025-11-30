"""Job service layer for status transitions and business logic."""

from datetime import datetime, timezone
from typing import Optional

from app.events import EventType, append_job_event
from app.models import JobStatus
from app.redis_client import get_redis
from app.transitions import InvalidTransitionError, can_transition


async def transition_job_status(
    job_id: str,
    to_status: JobStatus,
    *,
    reason: Optional[str] = None,
    actor: str = "system",
) -> JobStatus:
    """
    Transition a job to a new status with validation.

    Args:
        job_id: The job identifier
        to_status: Target status
        reason: Optional reason for the transition
        actor: Who/what triggered the transition (e.g., "system", "user", "ui")

    Returns:
        The new status

    Raises:
        InvalidTransitionError: If transition is not allowed
    """
    redis = await get_redis()
    job_key = f"job:{job_id}"

    # Get current job state
    job_hash = await redis.hgetall(job_key)
    if not job_hash:
        raise ValueError(f"Job {job_id} not found")

    current_status_str = job_hash.get("status", "PENDING")
    
    # Handle CANCELLED status (stored as string, not in enum)
    if current_status_str == "CANCELLED":
        if to_status != JobStatus.PENDING:  # Only allow requeue from CANCELLED
            raise InvalidTransitionError(JobStatus.PENDING, to_status)  # Approximate
        # Allow transition from CANCELLED to PENDING (requeue)
        current_status = JobStatus.PENDING
    else:
        try:
            current_status = JobStatus(current_status_str)
        except ValueError:
            current_status = JobStatus.PENDING

    # Validate transition (skip validation for CANCELLED -> PENDING requeue)
    if current_status_str != "CANCELLED" and not can_transition(current_status, to_status):
        raise InvalidTransitionError(current_status, to_status)

    # Update status
    now = datetime.now(timezone.utc)
    update_fields = {
        "status": to_status.value,
        "updated_at": now.isoformat(),
    }

    # Store transition metadata
    if reason:
        update_fields["last_status_change_reason"] = reason
    update_fields["last_status_actor"] = actor

    await redis.hset(job_key, mapping=update_fields)

    # Emit event
    event_type = EventType.STATUS_CHANGED
    # Check if transitioning to CANCELLED (stored as string)
    if to_status.value == "CANCELLED" or (hasattr(to_status, 'name') and to_status.name == "CANCELLED"):
        event_type = EventType.CANCELLED

    details = {"actor": actor}
    if reason:
        details["reason"] = reason

    await append_job_event(job_id, event_type, to_status, details=details)

    return to_status

