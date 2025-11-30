"""Worker main loop for processing jobs from Redis Streams."""

import asyncio
import json
import os
import signal
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.config import settings
from app.events import EventType, append_job_event
from app.models import JobPayload, JobStatus
from app.redis_client import get_redis
from app.worker.job_handlers import handle_job
from app.worker.lease import acquire_lease, release_lease
from app.worker.scheduler import compute_next_attempt_time


# Consumer name (unique per worker instance)
CONSUMER_NAME = f"worker-{os.getpid()}"


async def ensure_consumer_group() -> None:
    """Ensure consumer group exists for the job stream."""
    redis = await get_redis()
    
    try:
        await redis.xgroup_create(
            name=settings.job_stream,
            groupname=settings.consumer_group,
            id="$",  # Start from new messages
            mkstream=True  # Create stream if it doesn't exist
        )
    except Exception as e:
        # Ignore "group already exists" errors
        if "BUSYGROUP" not in str(e) and "already exists" not in str(e).lower():
            raise


async def process_message(msg_id: str, fields: Dict[str, str]) -> None:
    """Process a single message from the stream.
    
    Args:
        msg_id: Stream message ID
        fields: Message fields containing job_id, task_type, payload_json
    """
    redis = await get_redis()
    
    job_id = fields.get("job_id")
    if not job_id:
        # Invalid message, ack and skip
        await redis.xack(settings.job_stream, settings.consumer_group, msg_id)
        return
    
    job_key = f"job:{job_id}"
    
    # Get job hash
    job_hash = await redis.hgetall(job_key)
    if not job_hash:
        # Job not found, ack and skip
        await redis.xack(settings.job_stream, settings.consumer_group, msg_id)
        return
    
    # Check if job is cancelled
    status = job_hash.get("status")
    if status == "CANCELLED":
        await redis.xack(settings.job_stream, settings.consumer_group, msg_id)
        return
    
    # Try to acquire lease
    if not await acquire_lease(job_id, CONSUMER_NAME, lease_ttl_seconds=30):
        # Lease not available, ack and skip (another worker will handle it)
        await redis.xack(settings.job_stream, settings.consumer_group, msg_id)
        return
    
    # Increment attempts
    attempts = int(job_hash.get("attempts", "0")) + 1
    now = datetime.now(timezone.utc)
    
    # Update job status to RUNNING
    await redis.hset(job_key, mapping={
        "status": JobStatus.RUNNING.value,
        "updated_at": now.isoformat(),
        "attempts": str(attempts)
    })
    
    # Emit STARTED event
    await append_job_event(job_id, EventType.STARTED, JobStatus.RUNNING, details={"worker_id": CONSUMER_NAME})
    
    # Parse payload
    try:
        payload_json = job_hash.get("payload_json", "{}")
        payload_data = json.loads(payload_json)
        payload = JobPayload(**payload_data)
    except Exception as e:
        # Invalid payload, mark as failed
        await redis.hset(job_key, mapping={
            "status": JobStatus.FAILED.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        await redis.xack(settings.job_stream, settings.consumer_group, msg_id)
        return
    
    # Execute job
    try:
        result = await handle_job(payload)
        
        # Job succeeded
        await redis.hset(job_key, mapping={
            "status": JobStatus.SUCCEEDED.value,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "result": json.dumps(result)
        })
        
        # Emit SUCCEEDED event
        await append_job_event(job_id, EventType.SUCCEEDED, JobStatus.SUCCEEDED, details={"worker_id": CONSUMER_NAME, "result": result})
        
        # Increment completion counter
        await redis.incr("metrics:jobs_completed_total")
        
        # Release lease
        await release_lease(job_id, CONSUMER_NAME)
        
        # Ack message
        await redis.xack(settings.job_stream, settings.consumer_group, msg_id)
        
    except Exception as e:
        # Job failed
        error_msg = str(e)
        
        # Emit FAILED event
        await append_job_event(job_id, EventType.FAILED, JobStatus.FAILED, details={"worker_id": CONSUMER_NAME, "error": error_msg, "attempt": attempts})
        
        if attempts >= settings.max_retries:
            # Max retries reached, move to DLQ
            await redis.hset(job_key, mapping={
                "status": JobStatus.DEAD_LETTERED.value,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            
            # Emit DEAD_LETTERED event
            await append_job_event(job_id, EventType.DEAD_LETTERED, JobStatus.DEAD_LETTERED, details={"worker_id": CONSUMER_NAME, "error": error_msg, "final_attempt": attempts})
            
            # Add to DLQ stream
            dlq_fields = {
                "job_id": job_id,
                "task_type": payload.task_type,
                "payload_json": payload_json,
                "error": error_msg,
                "attempts": str(attempts)
            }
            await redis.xadd(settings.dlq_stream, dlq_fields)
            
            # Release lease
            await release_lease(job_id, CONSUMER_NAME)
            
            # Ack original message
            await redis.xack(settings.job_stream, settings.consumer_group, msg_id)
        else:
            # Retry with backoff
            next_attempt_time = compute_next_attempt_time(now, attempts)
            
            # Update job back to PENDING with next attempt time
            await redis.hset(job_key, mapping={
                "status": JobStatus.PENDING.value,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "next_attempt_at": next_attempt_time.isoformat()
            })
            
            # Emit RETRIED event
            await append_job_event(job_id, EventType.RETRIED, JobStatus.PENDING, details={"worker_id": CONSUMER_NAME, "attempt": attempts, "next_attempt_at": next_attempt_time.isoformat()})
            
            # Release lease before re-enqueuing
            await release_lease(job_id, CONSUMER_NAME)
            
            # Re-add to stream for retry
            retry_fields = {
                "job_id": job_id,
                "partition_key": fields.get("partition_key", ""),
                "task_type": payload.task_type,
                "payload_json": payload_json,
                "retry": "true"
            }
            await redis.xadd(settings.job_stream, retry_fields)
            
            # Ack current message
            await redis.xack(settings.job_stream, settings.consumer_group, msg_id)


async def worker_loop() -> None:
    """Main worker loop consuming from Redis Streams."""
    redis = await get_redis()
    
    # Ensure consumer group exists
    await ensure_consumer_group()
    
    while True:
        try:
            # Read from stream with consumer group
            messages = await redis.xreadgroup(
                groupname=settings.consumer_group,
                consumername=CONSUMER_NAME,
                streams={settings.job_stream: ">"},  # Read pending messages
                count=10,  # Process up to 10 messages at a time
                block=5000  # Block for 5 seconds if no messages
            )
            
            if not messages:
                continue
            
            # Process each message
            for stream_name, stream_messages in messages:
                for msg_id, fields in stream_messages:
                    try:
                        await process_message(msg_id, fields)
                    except Exception as e:
                        # Log error but continue processing
                        print(f"Error processing message {msg_id}: {e}")
                        # Still ack to avoid reprocessing forever
                        try:
                            await redis.xack(
                                settings.job_stream,
                                settings.consumer_group,
                                msg_id
                            )
                        except Exception:
                            pass
        
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Error in worker loop: {e}")
            await asyncio.sleep(1)  # Brief pause before retrying


async def main() -> None:
    """Worker entrypoint."""
    print(f"Starting worker {CONSUMER_NAME}")
    
    # Setup signal handlers for graceful shutdown
    loop = asyncio.get_event_loop()
    shutdown_event = asyncio.Event()
    
    def signal_handler():
        print("Shutdown signal received")
        shutdown_event.set()
    
    for sig in (signal.SIGTERM, signal.SIGINT):
        if hasattr(signal, sig.name):
            try:
                loop.add_signal_handler(sig, signal_handler)
            except NotImplementedError:
                # Windows does not support add_signal_handler
                pass
    
    # Run worker loop
    try:
        await worker_loop()
    except KeyboardInterrupt:
        print("Worker interrupted")
    finally:
        # Cleanup
        redis = await get_redis()
        await redis.aclose()


if __name__ == "__main__":
    asyncio.run(main())

