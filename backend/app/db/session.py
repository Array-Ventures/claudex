from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.core.config import get_settings

settings = get_settings()


engine = create_async_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=30,
    max_overflow=20,
    pool_recycle=3600,
    pool_timeout=120,
    echo=False,
)
SessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

# Celery uses NullPool (no connection pooling) because workers fork processes.
# Forked processes inherit parent's connections, causing "connection already closed" errors
# when multiple workers try to use the same pooled connection.
celery_engine = create_async_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,
    echo=False,
)

CelerySessionLocal = async_sessionmaker(
    celery_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as db:
        yield db


@asynccontextmanager
async def get_celery_session() -> AsyncIterator[
    tuple[async_sessionmaker[AsyncSession], AsyncEngine]
]:
    yield CelerySessionLocal, celery_engine
