"""HTTP route registration for Tornado handlers."""

from tornado.web import URLSpec

from .health import HealthHandler


def get_routes() -> list[URLSpec]:
    """Return the route table for the application."""
    return [
        URLSpec(r"/health", HealthHandler),
    ]


__all__ = ["get_routes"]
