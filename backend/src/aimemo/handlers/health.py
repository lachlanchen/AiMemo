from .base import BaseHandler


class HealthHandler(BaseHandler):
    def get(self) -> None:
        self.write_json(200, {"status": "ok"})
