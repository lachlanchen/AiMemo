from tornado.ioloop import IOLoop
from tornado.web import Application
import structlog

from .config import settings
from .db import init_db
from .handlers.auth import AppleOAuthHandler, GoogleOAuthHandler, LoginHandler, RegisterHandler
from .handlers.health import HealthHandler
from .handlers.me import MeHandler

log = structlog.get_logger()


def make_app() -> Application:
    return Application(
        [
            (r"/health", HealthHandler),
            (r"/auth/register", RegisterHandler),
            (r"/auth/login", LoginHandler),
            (r"/auth/oauth/google", GoogleOAuthHandler),
            (r"/auth/oauth/apple", AppleOAuthHandler),
            (r"/auth/me", MeHandler),
        ],
        debug=settings.debug,
    )


def main() -> None:
    if settings.auto_create_db:
        IOLoop.current().run_sync(init_db)

    app = make_app()
    app.listen(settings.port, address=settings.host)
    log.info("server.started", host=settings.host, port=settings.port)
    IOLoop.current().start()


if __name__ == "__main__":
    main()
