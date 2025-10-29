"""Authentication service."""

from __future__ import annotations

import datetime as dt
from typing import Any

import jwt
import structlog
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from ..config import Settings
from ..models import User
from ..storage import Database

LOGGER = structlog.get_logger(__name__)


class AuthError(Exception):
    """Base auth error."""


class InvalidCredentials(AuthError):
    """Raised when credentials cannot be verified."""


class AuthService:
    """Handles user lifecycle, credential verification, and token issuance."""

    def __init__(self, db: Database, settings: Settings) -> None:
        self._db = db
        self._pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self._jwt_secret = settings.jwt_secret
        self._jwt_algorithm = "HS256"
        self._jwt_exp_minutes = settings.jwt_exp_minutes

    async def register_user(self, *, email: str, password: str) -> User:
        """Create a new user record with hashed password."""
        normalized_email = email.strip().lower()
        password_hash = self._pwd_context.hash(password)
        async with self._db.session() as session:
            user = User(email=normalized_email, password_hash=password_hash)
            session.add(user)
            try:
                await session.flush()
                await session.refresh(user)
            except IntegrityError as exc:
                LOGGER.warning("auth.register.duplicate", email=normalized_email)
                raise AuthError("Email already registered") from exc
            return user

    async def authenticate(self, *, email: str, password: str) -> User:
        """Validate credentials and return the matching user."""
        normalized_email = email.strip().lower()
        async with self._db.session() as session:
            statement = select(User).where(User.email == normalized_email)
            result = await session.execute(statement)
            user = result.scalar_one_or_none()
            if user is None:
                LOGGER.info("auth.login.unknown_email", email=normalized_email)
                raise InvalidCredentials("Invalid email or password")
            if not self._pwd_context.verify(password, user.password_hash):
                LOGGER.info("auth.login.invalid_password", email=normalized_email)
                raise InvalidCredentials("Invalid email or password")
            return user

    def issue_token(self, *, user: User) -> str:
        """Generate a JWT access token for the provided user."""
        now = dt.datetime.utcnow()
        payload: dict[str, Any] = {
            "sub": str(user.id),
            "email": user.email,
            "iat": now,
            "exp": now + dt.timedelta(minutes=self._jwt_exp_minutes),
        }
        return jwt.encode(payload, self._jwt_secret, algorithm=self._jwt_algorithm)

    def decode_token(self, token: str) -> dict[str, Any]:
        """Decode and validate a JWT token."""
        return jwt.decode(token, self._jwt_secret, algorithms=[self._jwt_algorithm])

    async def initiate_password_reset(self, *, email: str) -> None:
        """Placeholder flow for forgot-password."""
        normalized_email = email.strip().lower()
        async with self._db.session() as session:
            statement = select(User).where(User.email == normalized_email)
            result = await session.execute(statement)
            user = result.scalar_one_or_none()
            if not user:
                LOGGER.info("auth.forgot_password.unknown_email", email=normalized_email)
                return

        LOGGER.info("auth.forgot_password.requested", email=normalized_email)
