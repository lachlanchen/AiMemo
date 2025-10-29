"""Tornado application entrypoint."""

from __future__ import annotations

import asyncio
import logging

from tornado.httpserver import HTTPServer
from tornado.platform.asyncio import AsyncIOMainLoop
from tornado.web import Application

import structlog
from tornado.log import enable_pretty_logging

from .config import settings
from .handlers import get_routes
from .services import CalendarService, EmailService
from .storage import Database


def build_application() -> Application:
    """Construct the Tornado application with its dependencies."""
    database = Database(settings)
    email_service = EmailService(settings)
    calendar_service = CalendarService(settings)

    routes = get_routes()

    return Application(
        routes,
        debug=settings.debug,
        app_name=settings.app_name,
        db=database,
        email_service=email_service,
        calendar_service=calendar_service,
        cors_allow_origins=settings.cors_allow_origins,
        cors_allow_headers=settings.cors_allow_headers,
        cors_allow_methods=settings.cors_allow_methods,
        cors_allow_credentials=settings.cors_allow_credentials,
    )


async def _run_server() -> None:
    app = build_application()
    server = HTTPServer(app)
    server.bind(settings.port, address=settings.host)
    server.start()
    structlog.get_logger("server").info(
        "server.started",
        host=settings.host,
        port=settings.port,
        debug=settings.debug,
        cors_allow_origins=settings.cors_allow_origins,
    )
    await asyncio.Event().wait()


def main() -> None:
    """Install the Tornado-asyncio bridge and start the service."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
    )
    enable_pretty_logging()
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.add_log_level,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        cache_logger_on_first_use=True,
    )
    AsyncIOMainLoop().install()
    asyncio.run(_run_server())


if __name__ == "__main__":
    main()
