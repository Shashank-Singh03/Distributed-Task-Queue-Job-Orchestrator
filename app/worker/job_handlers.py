"""Task execution handlers."""

from typing import Any, Dict

from app.models import JobPayload


async def handle_job(payload: JobPayload) -> Dict[str, Any]:
    """Handle job execution based on task type.
    
    Args:
        payload: Job payload containing task type and data
        
    Returns:
        Dictionary with execution result
        
    Raises:
        Exception: If job execution fails
    """
    # Simple echo implementation for now
    # Later can dispatch on task_type
    if payload.task_type == "echo":
        return {
            "status": "success",
            "output": payload.data.get("message", "echo")
        }
    
    # Default handler - just return the data
    return {
        "status": "success",
        "output": payload.data
    }

