"""Job status transition rules and validation."""

from app.models import JobStatus


# Define allowed status transitions
# Note: CANCELLED is stored as string "CANCELLED" in Redis but not in JobStatus enum
ALLOWED_TRANSITIONS: dict[JobStatus, set[JobStatus]] = {
    JobStatus.PENDING: {JobStatus.RUNNING},  # CANCELLED handled separately
    JobStatus.RUNNING: {JobStatus.SUCCEEDED, JobStatus.FAILED},  # CANCELLED handled separately
    JobStatus.FAILED: {JobStatus.PENDING, JobStatus.DEAD_LETTERED},
    JobStatus.SUCCEEDED: set(),  # Terminal state
    JobStatus.DEAD_LETTERED: set(),  # Terminal state
}


def can_transition(from_status: JobStatus, to_status: JobStatus) -> bool:
    """
    Check if a status transition is allowed.

    Args:
        from_status: Current job status
        to_status: Desired new status

    Returns:
        True if transition is allowed, False otherwise
    """
    allowed = ALLOWED_TRANSITIONS.get(from_status, set())
    return to_status in allowed


class InvalidTransitionError(Exception):
    """Raised when an invalid status transition is attempted."""

    def __init__(self, from_status: JobStatus, to_status: JobStatus):
        self.from_status = from_status
        self.to_status = to_status
        super().__init__(
            f"Invalid transition from {from_status.value} to {to_status.value}"
        )

