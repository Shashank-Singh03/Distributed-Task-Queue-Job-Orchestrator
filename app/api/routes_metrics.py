"""Metrics endpoints."""

from typing import Any, Dict

from fastapi import APIRouter

from app.config import settings
from app.models import JobStatus
from app.redis_client import get_redis

router = APIRouter()


@router.get("/metrics")
async def get_metrics() -> Dict[str, Any]:
    """Get job metrics including counts by status and DLQ depth."""
    redis = await get_redis()
    
    # Get all job keys
    job_keys = await redis.keys("job:*")
    
    # Count jobs by status
    status_counts = {
        JobStatus.PENDING.value: 0,
        JobStatus.RUNNING.value: 0,
        JobStatus.SUCCEEDED.value: 0,
        JobStatus.FAILED.value: 0,
        JobStatus.DEAD_LETTERED.value: 0,
        "CANCELLED": 0
    }
    
    for job_key in job_keys:
        job_hash = await redis.hgetall(job_key)
        if not job_hash:
            continue
        
        status = job_hash.get("status", "PENDING")
        if status in status_counts:
            status_counts[status] += 1
    
    # Get DLQ depth
    dlq_depth = await redis.xlen(settings.dlq_stream)

    # Get throughput metrics
    jobs_created_total = await redis.get("metrics:jobs_created_total") or "0"
    jobs_completed_total = await redis.get("metrics:jobs_completed_total") or "0"

    return {
        "job_counts": status_counts,
        "dlq_depth": dlq_depth,
        "total_jobs": sum(status_counts.values()),
        "jobs_created_total": int(jobs_created_total),
        "jobs_completed_total": int(jobs_completed_total),
    }

