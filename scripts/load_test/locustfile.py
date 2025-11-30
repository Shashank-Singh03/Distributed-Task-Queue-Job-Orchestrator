"""
Load test script for the distributed task queue.

Usage:
    locust -f locustfile.py --host=http://localhost:8000

Or with custom parameters:
    locust -f locustfile.py --host=http://localhost:8000 --users=100 --spawn-rate=10
"""

from locust import HttpUser, task, between
import json
import random


class TaskQueueUser(HttpUser):
    """Simulates a user creating jobs and checking metrics."""

    wait_time = between(0.5, 2.0)

    @task(3)
    def create_job(self):
        """Create a new job."""
        payload = {
            "payload": {
                "task_type": "echo",
                "data": {
                    "message": f"Load test job {random.randint(1000, 9999)}",
                    "timestamp": "2025-11-30T12:00:00Z"
                }
            },
            "partition_key": f"partition-{random.randint(1, 10)}"
        }
        self.client.post(
            "/jobs",
            json=payload,
            headers={"Content-Type": "application/json"}
        )

    @task(1)
    def get_metrics(self):
        """Check metrics endpoint."""
        self.client.get("/metrics")

    @task(1)
    def list_jobs(self):
        """List jobs."""
        self.client.get("/jobs?limit=50&offset=0")

