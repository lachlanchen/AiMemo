import json
from typing import Any, Optional

from tornado.web import RequestHandler

from ..config import settings


class BaseHandler(RequestHandler):
    def set_default_headers(self) -> None:
        origin = self.request.headers.get("Origin")
        allow_all = "*" in settings.cors_allow_origins
        if allow_all:
            self.set_header("Access-Control-Allow-Origin", "*")
        elif origin and origin in settings.cors_allow_origins:
            self.set_header("Access-Control-Allow-Origin", origin)
            self.set_header("Vary", "Origin")

        self.set_header("Access-Control-Allow-Headers", "authorization,content-type")
        self.set_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.set_header("Access-Control-Allow-Credentials", "true")

    def options(self, *args: Any, **kwargs: Any) -> None:
        self.set_status(204)
        self.finish()

    def json_body(self) -> dict[str, Any]:
        if not self.request.body:
            return {}
        try:
            return json.loads(self.request.body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError("Invalid JSON payload") from exc

    def write_json(self, status: int, payload: dict[str, Any]) -> None:
        self.set_header("Content-Type", "application/json")
        self.set_status(status)
        self.finish(json.dumps(payload))

    def get_bearer_token(self) -> Optional[str]:
        auth_header = self.request.headers.get("Authorization")
        if not auth_header:
            return None
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        return parts[1]
