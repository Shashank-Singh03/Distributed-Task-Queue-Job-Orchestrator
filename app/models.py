"""Pydantic models and enums for jobs, payloads, and statuses."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_serializer, ConfigDict


class JobStatus(str, Enum):
    """Job status enumeration."""
    
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    DEAD_LETTERED = "DEAD_LETTERED"


class JobPayload(BaseModel):
    """Job payload containing task type and data."""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "task_type": "echo",
                "data": {"message": "Hello, World!"}
            }
        }
    )
    
    task_type: str = Field(..., description="Type of task to execute")
    data: Dict[str, Any] = Field(default_factory=dict, description="Task-specific data")


class JobCreateRequest(BaseModel):
    """Request model for creating a new job."""
    
    payload: JobPayload = Field(..., description="Job payload")
    partition_key: Optional[str] = Field(
        default=None,
        description="Optional partition key for job routing"
    )


class JobResponse(BaseModel):
    """Response model for job information."""
    
    job_id: UUID = Field(..., description="Unique job identifier")
    status: JobStatus = Field(..., description="Current job status")
    created_at: datetime = Field(..., description="Job creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    payload: JobPayload = Field(..., description="Job payload")
    attempts: int = Field(default=0, description="Number of execution attempts")
    partition_key: Optional[str] = Field(
        default=None,
        description="Partition key for job routing"
    )
    result: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Job execution result (if completed)"
    )
    
    @field_serializer('job_id')
    def serialize_job_id(self, job_id: UUID) -> str:
        """Serialize UUID to string."""
        return str(job_id)
    
    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, dt: datetime) -> str:
        """Serialize datetime to ISO format."""
        return dt.isoformat()

