"""Email integration skeleton."""

from __future__ import annotations

import structlog

from ..config import Settings

logger = structlog.get_logger(__name__)


class EmailService:
    """Placeholder service for iCloud email access."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def pull_inbox(self) -> None:
        """Fetch new messages from the configured provider."""
        logger.info("email.pull_inbox.start")
        # TODO: integrate with icloud IMAP using app-specific password
        logger.info("email.pull_inbox.end")

    async def send_message(self, *, to: str, subject: str, body: str) -> None:
        """Send an outbound email."""
        logger.info("email.send", to=to, subject=subject)
        # TODO: integrate with SMTP
