"""Shared async Redis client singleton."""

import redis.asyncio as aioredis
from typing import Optional

from app.config import settings


class RedisClient:
    """Singleton async Redis client."""
    
    _instance: Optional[aioredis.Redis] = None
    
    @classmethod
    async def get_client(cls) -> aioredis.Redis:
        """Get or create the Redis client instance."""
        if cls._instance is None:
            cls._instance = aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        return cls._instance
    
    @classmethod
    async def close(cls) -> None:
        """Close the Redis client connection."""
        if cls._instance is not None:
            await cls._instance.aclose()
            cls._instance = None


# Convenience function
async def get_redis() -> aioredis.Redis:
    """Get the Redis client instance."""
    return await RedisClient.get_client()

