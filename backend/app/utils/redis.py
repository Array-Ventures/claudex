import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from redis.asyncio import Redis
from redis.asyncio.client import PubSub

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def redis_connection() -> "AsyncIterator[Redis[str]]":
    redis: "Redis[str]" = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        yield redis
    finally:
        try:
            await redis.close()
        except Exception as e:
            logger.warning("Error closing Redis connection: %s", e)


@asynccontextmanager
async def redis_pubsub(redis: "Redis[str]", channel: str) -> AsyncIterator[PubSub]:
    pubsub = redis.pubsub()
    await pubsub.subscribe(channel)
    try:
        yield pubsub
    finally:
        try:
            await pubsub.unsubscribe(channel)
        except Exception as e:
            logger.warning("Error unsubscribing from channel %s: %s", channel, e)
        try:
            await pubsub.close()
        except Exception as e:
            logger.warning("Error closing pubsub: %s", e)
