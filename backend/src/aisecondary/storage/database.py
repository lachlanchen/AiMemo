"""Async database helpers backed by SQLAlchemy."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from ..config import Settings


class Database:
    """Wraps the async SQLAlchemy engine and sessions."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._engine: AsyncEngine | None = None
        self._session_factory: async_sessionmaker[AsyncSession] | None = None

    def _ensure_engine(self) -> None:
        if self._engine is None:
            self._engine = create_async_engine(
                self._settings.database_url, echo=self._settings.echo, future=True
            )
            self._session_factory = async_sessionmaker(
                self._engine,
                expire_on_commit=False,
                autoflush=False,
            )

    @property
    def engine(self) -> AsyncEngine:
        self._ensure_engine()
        assert self._engine is not None
        return self._engine

    @asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        self._ensure_engine()
        assert self._session_factory is not None
        session = self._session_factory()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
