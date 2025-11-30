"""Development-only endpoints for testing and synthetic data generation."""

from typing import Dict, Any, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.config import settings
from app.api.routes_jobs import create_job
from app.models import JobCreateRequest, JobPayload
from app.redis_client import get_redis

router = APIRouter()


class GenerateJobsRequest(BaseModel):
    """Request model for generating synthetic jobs."""

    count: int = Field(..., ge=1, le=10000, description="Number of jobs to create")
    partition_key_prefix: str = Field(default="dev-partition", description="Partition key prefix")
    task_type: str = Field(default="synthetic", description="Task type for all jobs")
    payload_template: Dict[str, Any] = Field(default_factory=dict, description="Payload template")


@router.post("/dev/generate-jobs")
async def generate_jobs(request: GenerateJobsRequest) -> Dict[str, Any]:
    """
    Generate synthetic jobs for testing (dev only).

    This endpoint is disabled in production.
    """
    if settings.environment == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is disabled in production"
        )

    created_count = 0
    errors = []

    for i in range(request.count):
        try:
            # Build payload with index
            payload_data = {**request.payload_template, "index": i, "batch_id": request.count}
            payload = JobPayload(task_type=request.task_type, data=payload_data)

            # Determine partition key
            partition_key = f"{request.partition_key_prefix}-{i % 10}" if request.count > 10 else request.partition_key_prefix

            # Create job using same logic as POST /jobs
            job_request = JobCreateRequest(payload=payload, partition_key=partition_key)
            await create_job(job_request)
            created_count += 1
        except Exception as e:
            errors.append(f"Job {i}: {str(e)}")

    return {
        "created": created_count,
        "requested": request.count,
        "errors": errors if errors else None,
    }

