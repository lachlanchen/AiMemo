"""Calendar integration skeleton."""

from __future__ import annotations

import structlog

from ..config import Settings

logger = structlog.get_logger(__name__)


class CalendarService:
    """Placeholder service for CalDAV calendar access."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def sync_events(self) -> None:
        """Fetch calendar events and persist locally."""
        logger.info("calendar.sync.start")
        # TODO: integrate with CalDAV via caldav library
        logger.info("calendar.sync.end")

    async def create_event(self, *, title: str, start: str, end: str) -> None:
        """Create an event on the remote calendar."""
        logger.info("calendar.create", title=title, start=start, end=end)
        # TODO: implement CalDAV create
