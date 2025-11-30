"""Job lifecycle management endpoints."""

import json
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.config import settings
from app.events import EventType, append_job_event, get_job_events
from app.jobs_service import transition_job_status
from app.models import JobCreateRequest, JobResponse, JobStatus
from app.redis_client import get_redis
from app.transitions import InvalidTransitionError

router = APIRouter()


@router.post("/jobs", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_job(request: JobCreateRequest) -> JobResponse:
    """Create a new job and add it to the queue."""
    redis = await get_redis()
    
    # Generate job ID
    job_id = uuid4()
    now = datetime.now(timezone.utc)
    
    # Prepare job metadata
    job_key = f"job:{job_id}"
    payload_json = request.payload.model_dump_json()
    
    # Store job hash in Redis
    job_hash = {
        "job_id": str(job_id),
        "status": JobStatus.PENDING.value,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "attempts": "0",
        "partition_key": request.partition_key or "",
        "task_type": request.payload.task_type,
        "payload_json": payload_json
    }
    
    # Store job hash
    await redis.hset(job_key, mapping=job_hash)
    
    # Append to Redis Stream
    stream_fields = {
        "job_id": str(job_id),
        "partition_key": request.partition_key or "",
        "task_type": request.payload.task_type,
        "payload_json": payload_json
    }
    
    await redis.xadd(settings.job_stream, stream_fields)
    
    # Increment creation counter
    await redis.incr("metrics:jobs_created_total")
    
    # Emit events
    await append_job_event(str(job_id), EventType.CREATED, JobStatus.PENDING)
    await append_job_event(str(job_id), EventType.ENQUEUED, JobStatus.PENDING)
    
    # Return job response
    return JobResponse(
        job_id=job_id,
        status=JobStatus.PENDING,
        created_at=now,
        updated_at=now,
        payload=request.payload,
        attempts=0,
        partition_key=request.partition_key
    )


@router.get("/jobs", response_model=List[JobResponse])
async def list_jobs(
    limit: int = Query(default=50, ge=1, le=1000, description="Maximum number of jobs to return"),
    offset: int = Query(default=0, ge=0, description="Number of jobs to skip")
) -> List[JobResponse]:
    """List jobs with pagination."""
    redis = await get_redis()
    
    # Get all job keys
    job_keys = await redis.keys("job:*")
    
    # Sort by key (which includes job_id) for consistent ordering
    job_keys.sort()
    
    # Apply pagination
    paginated_keys = job_keys[offset:offset + limit]
    
    # Fetch job data
    jobs = []
    from app.models import JobPayload
    
    for job_key in paginated_keys:
        job_hash = await redis.hgetall(job_key)
        if not job_hash:
            continue
        
        try:
            payload_json = job_hash.get("payload_json", "{}")
            payload_data = json.loads(payload_json)
            
            job = JobResponse(
                job_id=UUID(job_hash["job_id"]),
                status=JobStatus(job_hash.get("status", "PENDING")),
                created_at=datetime.fromisoformat(job_hash["created_at"]),
                updated_at=datetime.fromisoformat(job_hash["updated_at"]),
                payload=JobPayload(**payload_data),
                attempts=int(job_hash.get("attempts", "0")),
                partition_key=job_hash.get("partition_key") or None
            )
            jobs.append(job)
        except Exception:
            # Skip invalid jobs
            continue
    
    return jobs


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: UUID) -> JobResponse:
    """Get job status by ID."""
    redis = await get_redis()
    
    job_key = f"job:{job_id}"
    job_hash = await redis.hgetall(job_key)
    
    if not job_hash:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )
    
    # Parse job data
    payload_json = job_hash.get("payload_json", "{}")
    payload_data = json.loads(payload_json)
    
    from app.models import JobPayload
    
    return JobResponse(
        job_id=UUID(job_hash["job_id"]),
        status=JobStatus(job_hash.get("status", "PENDING")),
        created_at=datetime.fromisoformat(job_hash["created_at"]),
        updated_at=datetime.fromisoformat(job_hash["updated_at"]),
        payload=JobPayload(**payload_data),
        attempts=int(job_hash.get("attempts", "0")),
        partition_key=job_hash.get("partition_key") or None
    )


@router.get("/jobs/{job_id}/events")
async def get_job_events_endpoint(job_id: UUID):
    """Get all events for a specific job."""
    events = await get_job_events(str(job_id))
    if not events:
        # Check if job exists
        redis = await get_redis()
        job_key = f"job:{job_id}"
        job_hash = await redis.hgetall(job_key)
        if not job_hash:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found"
            )
    return events


@router.post("/jobs/{job_id}/cancel", response_model=JobResponse)
async def cancel_job(job_id: UUID) -> JobResponse:
    """Cancel a job."""
    redis = await get_redis()
    
    job_key = f"job:{job_id}"
    job_hash = await redis.hgetall(job_key)
    
    if not job_hash:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )
    
    # Cancel job - set status to "CANCELLED" string directly
    now = datetime.now(timezone.utc)
    await redis.hset(job_key, mapping={
        "status": "CANCELLED",
        "updated_at": now.isoformat()
    })
    
    # Emit CANCELLED event
    await append_job_event(str(job_id), EventType.CANCELLED, JobStatus.PENDING, details={"actor": "user", "reason": "User requested cancellation"})
    
    # Get updated job data
    job_hash = await redis.hgetall(job_key)
    payload_json = job_hash.get("payload_json", "{}")
    payload_data = json.loads(payload_json)
    
    from app.models import JobPayload
    
    # Get updated job data
    updated_job_hash = await redis.hgetall(job_key)
    
    return JobResponse(
        job_id=UUID(updated_job_hash["job_id"]),
        status=JobStatus.PENDING,  # Status is CANCELLED in Redis, but enum doesn't include it
        created_at=datetime.fromisoformat(updated_job_hash["created_at"]),
        updated_at=datetime.fromisoformat(updated_job_hash["updated_at"]),
        payload=JobPayload(**payload_data),
        attempts=int(updated_job_hash.get("attempts", "0")),
        partition_key=updated_job_hash.get("partition_key") or None
    )


class TransitionRequest(BaseModel):
    """Request model for job status transition."""
    to_status: str = Field(..., description="Target status")
    reason: Optional[str] = Field(None, description="Reason for transition")


@router.post("/jobs/{job_id}/transition", response_model=JobResponse)
async def transition_job_endpoint(
    job_id: UUID,
    request: TransitionRequest,
):
    """Transition a job to a new status (UI-controlled transitions only)."""
    try:
        target_status = JobStatus(request.to_status.upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {request.to_status}"
        )

    # Only allow specific UI transitions
    # CANCELLED is stored as string, so we check it differently
    allowed_ui_transitions = {
        (JobStatus.PENDING, "CANCELLED"),  # Cancel
        (JobStatus.FAILED, JobStatus.PENDING),  # Retry
        (JobStatus.DEAD_LETTERED, JobStatus.PENDING),  # Requeue
        ("CANCELLED", JobStatus.PENDING),  # Requeue from cancelled
    }

    redis = await get_redis()
    job_key = f"job:{job_id}"
    job_hash = await redis.hgetall(job_key)
    if not job_hash:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )

    current_status_str = job_hash.get("status", "PENDING")
    
    # Handle CANCELLED transition
    if request.to_status.upper() == "CANCELLED":
        # Direct cancellation
        now = datetime.now(timezone.utc)
        await redis.hset(job_key, mapping={
            "status": "CANCELLED",
            "updated_at": now.isoformat()
        })
        await append_job_event(str(job_id), EventType.CANCELLED, JobStatus.PENDING, details={"actor": "ui", "reason": request.reason})
        return await get_job(job_id)
    
    try:
        current_status = JobStatus(current_status_str)
    except ValueError:
        if current_status_str == "CANCELLED":
            # Requeue from CANCELLED
            if target_status != JobStatus.PENDING:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Can only requeue from CANCELLED to PENDING"
                )
            # Allow requeue
            await transition_job_status(str(job_id), target_status, reason=request.reason, actor="ui")
            return await get_job(job_id)
        current_status = JobStatus.PENDING

    # Check if transition is allowed
    transition_key = (current_status, target_status)
    if transition_key not in allowed_ui_transitions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Transition from {current_status.value} to {target_status.value} not allowed via UI"
        )

    try:
        await transition_job_status(str(job_id), target_status, reason=request.reason, actor="ui")
        # Return updated job
        return await get_job(job_id)
    except InvalidTransitionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

