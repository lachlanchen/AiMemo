"""Common request handler utilities."""

from __future__ import annotations

import json
from typing import Any, Iterable

import structlog
from tornado.web import RequestHandler


class BaseHandler(RequestHandler):
    """Adds CORS handling and structured request logging."""

    _logger: structlog.stdlib.BoundLogger | None = None
    _json_body: dict[str, Any] | None = None

    @property
    def allowed_origins(self) -> Iterable[str]:
        return self.application.settings.get("cors_allow_origins", ["*"])

    def _origin_is_allowed(self, origin: str | None) -> bool:
        if not origin:
            return False
        origins = self.allowed_origins
        if "*" in origins:
            return True
        return origin in origins

    def set_default_headers(self) -> None:  # noqa: D401
        """Attach CORS headers to all responses."""
        origin = self.request.headers.get("Origin")
        if self._origin_is_allowed(origin):
            self.set_header("Access-Control-Allow-Origin", origin)
            self.set_header("Vary", "Origin")
        elif "*" in self.allowed_origins:
            self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header(
            "Access-Control-Allow-Headers",
            self.application.settings.get(
                "cors_allow_headers", "Content-Type, Authorization, X-Requested-With"
            ),
        )
        self.set_header(
            "Access-Control-Allow-Methods",
            self.application.settings.get(
                "cors_allow_methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            ),
        )
        if self.application.settings.get("cors_allow_credentials", True):
            self.set_header("Access-Control-Allow-Credentials", "true")

    async def options(self, *args: Any, **kwargs: Any) -> None:
        """Short-circuit preflight requests."""
        self.set_status(204)
        self.finish()

    def prepare(self) -> None:
        """Record the start of a request with structured logging."""
        request = self.request
        self._logger = structlog.get_logger("http").bind(
            method=request.method,
            path=request.path,
            remote_ip=request.remote_ip,
        )
        self._logger.info("request.start", headers=dict(request.headers))

        if request.body:
            content_type = request.headers.get("Content-Type", "")
            if "application/json" in content_type:
                try:
                    self._json_body = json.loads(request.body.decode("utf-8"))
                except json.JSONDecodeError as exc:
                    self._logger.warning("request.json_decode_error", error=str(exc))
                    self.send_error(400, reason="Invalid JSON payload")

    def write_error(self, status_code: int, **kwargs: Any) -> None:
        """Return JSON error responses."""
        message = kwargs.get("reason") or self._reason
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps({"error": message, "status": status_code}))

    def json_body(self) -> dict[str, Any]:
        """Return the parsed JSON body or an empty dict."""
        return self._json_body or {}

    def write_json(self, status: int = 200, **payload: Any) -> None:
        """Serialize a response as JSON."""
        self.set_header("Content-Type", "application/json")
        self.set_status(status)
        self.finish(json.dumps(payload))

    def on_finish(self) -> None:
        """Log response metadata after the request concludes."""
        if not self._logger:
            self._logger = structlog.get_logger("http")
        self._logger.info(
            "request.finish",
            status=self.get_status(),
            elapsed_ms=int(self.request.request_time() * 1000),
        )
