"""Service layer abstractions for external integrations."""

from .email import EmailService
from .calendar import CalendarService

__all__ = ["EmailService", "CalendarService"]
