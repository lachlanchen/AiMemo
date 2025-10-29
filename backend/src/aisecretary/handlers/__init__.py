"""HTTP route registration for Tornado handlers."""

from tornado.web import URLSpec

from .auth import ForgotPasswordHandler, LoginHandler, RegisterHandler
from .health import HealthHandler


def get_routes() -> list[URLSpec]:
    """Return the route table for the application."""
    return [
        URLSpec(r"/health", HealthHandler),
        URLSpec(r"/auth/register", RegisterHandler),
        URLSpec(r"/auth/login", LoginHandler),
        URLSpec(r"/auth/forgot-password", ForgotPasswordHandler),
    ]


__all__ = ["get_routes"]
