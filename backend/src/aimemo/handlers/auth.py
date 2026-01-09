from typing import Any

from ..auth import (
    AuthError,
    build_auth_result,
    login_user,
    login_with_oauth,
    register_user,
    serialize_user,
)
from ..db import SessionLocal
from ..models import AuthProvider
from .base import BaseHandler


class RegisterHandler(BaseHandler):
    async def post(self) -> None:
        try:
            body = self.json_body()
        except ValueError as exc:
            self.write_json(400, {"error": str(exc)})
            return

        email = body.get("email")
        password = body.get("password")
        display_name = body.get("display_name")
        if not email or not password:
            self.write_json(400, {"error": "email and password are required"})
            return

        async with SessionLocal() as session:
            try:
                user = await register_user(session, email, password, display_name)
            except AuthError as exc:
                self.write_json(exc.status, {"error": str(exc)})
                return

        result = build_auth_result(user)
        self.write_json(
            201,
            {"access_token": result.access_token, "user": serialize_user(result.user)},
        )


class LoginHandler(BaseHandler):
    async def post(self) -> None:
        try:
            body = self.json_body()
        except ValueError as exc:
            self.write_json(400, {"error": str(exc)})
            return

        email = body.get("email")
        password = body.get("password")
        if not email or not password:
            self.write_json(400, {"error": "email and password are required"})
            return

        async with SessionLocal() as session:
            try:
                user = await login_user(session, email, password)
            except AuthError as exc:
                self.write_json(exc.status, {"error": str(exc)})
                return

        result = build_auth_result(user)
        self.write_json(200, {"access_token": result.access_token, "user": serialize_user(user)})


class GoogleOAuthHandler(BaseHandler):
    async def post(self) -> None:
        await _oauth_handler(self, AuthProvider.google)


class AppleOAuthHandler(BaseHandler):
    async def post(self) -> None:
        await _oauth_handler(self, AuthProvider.apple)


async def _oauth_handler(handler: BaseHandler, provider: AuthProvider) -> None:
    try:
        body: dict[str, Any] = handler.json_body()
    except ValueError as exc:
        handler.write_json(400, {"error": str(exc)})
        return

    id_token = body.get("id_token")
    email = body.get("email")
    display_name = body.get("display_name")
    if not id_token:
        handler.write_json(400, {"error": "id_token is required"})
        return

    async with SessionLocal() as session:
        try:
            user = await login_with_oauth(
                session,
                provider,
                id_token,
                email_hint=email,
                display_name=display_name,
            )
        except AuthError as exc:
            handler.write_json(exc.status, {"error": str(exc)})
            return

    result = build_auth_result(user)
    handler.write_json(200, {"access_token": result.access_token, "user": serialize_user(user)})
