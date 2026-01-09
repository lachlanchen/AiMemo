"""Service layer abstractions for external integrations."""

from .auth import AuthService
from .email import EmailService
from .calendar import CalendarService

__all__ = ["EmailService", "CalendarService", "AuthService"]
