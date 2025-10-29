"""Basic liveness handler."""

from __future__ import annotations

from .base import BaseHandler


class HealthHandler(BaseHandler):
    """Responds with application liveness metadata."""

    async def get(self) -> None:
        self.write(
            {
                "status": "ok",
                "app": self.application.settings.get("app_name", "AISecretary"),
            }
        )
