"""Authentication HTTP handlers."""

from __future__ import annotations

from typing import Any

from tornado.web import HTTPError

from ..services import AuthService
from ..services.auth import AuthError, InvalidCredentials
from .base import BaseHandler


class AuthBaseHandler(BaseHandler):
    """Shared helpers for auth handlers."""

    @property
    def auth_service(self) -> AuthService:
        return self.application.settings["auth_service"]


class RegisterHandler(AuthBaseHandler):
    """POST /auth/register"""

    async def post(self) -> None:
        data = self.json_body()
        email = str(data.get("email", "")).strip()
        password = str(data.get("password", "")).strip()

        if not email or not password:
            raise HTTPError(400, reason="Email and password are required")
        if len(password) < 8:
            raise HTTPError(400, reason="Password must be at least 8 characters long")

        try:
            user = await self.auth_service.register_user(email=email, password=password)
        except AuthError as exc:
            raise HTTPError(400, reason=str(exc)) from exc

        token = self.auth_service.issue_token(user=user)
        self.write_json(
            status=201,
            token=token,
            user={"id": str(user.id), "email": user.email},
        )


class LoginHandler(AuthBaseHandler):
    """POST /auth/login"""

    async def post(self) -> None:
        data = self.json_body()
        email = str(data.get("email", "")).strip()
        password = str(data.get("password", "")).strip()

        if not email or not password:
            raise HTTPError(400, reason="Email and password are required")

        try:
            user = await self.auth_service.authenticate(email=email, password=password)
        except InvalidCredentials as exc:
            raise HTTPError(401, reason=str(exc)) from exc

        token = self.auth_service.issue_token(user=user)
        self.write_json(
            status=200,
            token=token,
            user={"id": str(user.id), "email": user.email},
        )


class ForgotPasswordHandler(AuthBaseHandler):
    """POST /auth/forgot-password"""

    async def post(self) -> None:
        data = self.json_body()
        email = str(data.get("email", "")).strip()
        if not email:
            raise HTTPError(400, reason="Email is required")

        await self.auth_service.initiate_password_reset(email=email)
        self.write_json(
            status=202,
            message="If an account exists for that email, a reset link will be sent.",
        )
