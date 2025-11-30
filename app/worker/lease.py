"""Worker lease management to prevent double-processing."""

from datetime import datetime, timezone, timedelta
from typing import Optional

from app.redis_client import get_redis
from app.events import EventType, append_job_event
from app.models import JobStatus


async def acquire_lease(
    job_id: str,
    worker_id: str,
    lease_ttl_seconds: int = 30,
) -> bool:
    """
    Atomically acquire a lease on a job.

    Args:
        job_id: The job identifier
        worker_id: Unique identifier for this worker
        lease_ttl_seconds: Lease duration in seconds

    Returns:
        True if lease was acquired, False otherwise
    """
    redis = await get_redis()
    job_key = f"job:{job_id}"

    # Lua script for atomic lease acquisition
    lua_script = """
    local job_key = KEYS[1]
    local worker_id = ARGV[1]
    local lease_ttl = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local expires_at = tonumber(ARGV[4])
    
    local job_hash = redis.call('HGETALL', job_key)
    if #job_hash == 0 then
        return 0  -- Job doesn't exist
    end
    
    -- Convert hash array to table
    local job = {}
    for i = 1, #job_hash, 2 do
        job[job_hash[i]] = job_hash[i + 1]
    end
    
    local current_owner = job['lease_owner'] or ''
    local current_expires = job['lease_expires_at'] or ''
    
    -- Check if lease is available
    local can_acquire = false
    if current_owner == '' then
        can_acquire = true
    elseif current_expires ~= '' then
        local expires_num = tonumber(current_expires)
        if expires_num and expires_num < now then
            can_acquire = true  -- Lease expired
        end
    end
    
    if can_acquire then
        redis.call('HSET', job_key, 'lease_owner', worker_id)
        redis.call('HSET', job_key, 'lease_expires_at', tostring(expires_at))
        return 1
    else
        return 0
    end
    """

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=lease_ttl_seconds)
    now_timestamp = now.timestamp()
    expires_timestamp = expires_at.timestamp()

    result = await redis.eval(
        lua_script,
        1,  # Number of keys
        job_key,
        worker_id,
        str(lease_ttl_seconds),
        str(now_timestamp),
        str(expires_timestamp),
    )

    if result == 1:
        # Emit LEASED event
        await append_job_event(
            job_id,
            EventType.LEASED,
            JobStatus.PENDING,  # Status hasn't changed yet
            details={"worker_id": worker_id, "lease_ttl_seconds": lease_ttl_seconds},
        )
        return True

    return False


async def release_lease(job_id: str, worker_id: str) -> None:
    """
    Release a lease on a job if owned by this worker.

    Args:
        job_id: The job identifier
        worker_id: Unique identifier for this worker
    """
    redis = await get_redis()
    job_key = f"job:{job_id}"

    # Check current lease owner
    current_owner = await redis.hget(job_key, "lease_owner")
    if current_owner == worker_id:
        await redis.hset(job_key, mapping={
            "lease_owner": "",
            "lease_expires_at": "",
        })

