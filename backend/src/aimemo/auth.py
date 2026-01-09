import datetime
from dataclasses import dataclass
from typing import Any, Optional

import jwt
from jwt import PyJWKClient
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import settings
from .models import AuthProvider, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"


class AuthError(Exception):
    def __init__(self, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.status = status


@dataclass
class AuthResult:
    user: User
    access_token: str


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(user: User) -> str:
    now = datetime.datetime.utcnow()
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "provider": user.provider.value,
        "iat": now,
        "exp": now + datetime.timedelta(minutes=settings.jwt_expires_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def serialize_user(user: User) -> dict[str, Any]:
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "provider": user.provider.value,
    }


def _verify_jwt_with_jwks(token: str, jwks_url: str, audience: Optional[str], issuer: Any) -> dict:
    jwks_client = PyJWKClient(jwks_url)
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        audience=audience,
        issuer=issuer,
    )


def verify_google_token(id_token: str) -> dict:
    if not settings.google_client_id:
        raise AuthError("GOOGLE_CLIENT_ID is not configured", status=500)
    payload = _verify_jwt_with_jwks(
        id_token,
        GOOGLE_JWKS_URL,
        settings.google_client_id,
        issuer=["https://accounts.google.com", "accounts.google.com"],
    )
    if not payload.get("email"):
        raise AuthError("Google token missing email")
    if payload.get("email_verified") is False:
        raise AuthError("Google email not verified")
    return payload


def verify_apple_token(id_token: str) -> dict:
    if not settings.apple_client_id:
        raise AuthError("APPLE_CLIENT_ID is not configured", status=500)
    return _verify_jwt_with_jwks(
        id_token,
        APPLE_JWKS_URL,
        settings.apple_client_id,
        issuer="https://appleid.apple.com",
    )


async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_provider(
    session: AsyncSession, provider: AuthProvider, provider_subject: str
) -> Optional[User]:
    result = await session.execute(
        select(User).where(
            User.provider == provider,
            User.provider_subject == provider_subject,
        )
    )
    return result.scalar_one_or_none()


async def register_user(
    session: AsyncSession, email: str, password: str, display_name: Optional[str]
) -> User:
    existing = await get_user_by_email(session, email)
    if existing:
        raise AuthError("Email already registered", status=409)
    user = User(
        email=email,
        password_hash=hash_password(password),
        provider=AuthProvider.email,
        display_name=display_name,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def login_user(session: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(session, email)
    if not user or not user.password_hash:
        raise AuthError("Invalid credentials", status=401)
    if not verify_password(password, user.password_hash):
        raise AuthError("Invalid credentials", status=401)
    return user


async def login_with_oauth(
    session: AsyncSession,
    provider: AuthProvider,
    id_token: str,
    email_hint: Optional[str] = None,
    display_name: Optional[str] = None,
) -> User:
    if provider == AuthProvider.google:
        payload = verify_google_token(id_token)
    elif provider == AuthProvider.apple:
        payload = verify_apple_token(id_token)
    else:
        raise AuthError("Unsupported provider")

    provider_subject = payload.get("sub")
    if not provider_subject:
        raise AuthError("Provider token missing subject")

    email = payload.get("email") or email_hint
    name = (
        display_name
        or payload.get("name")
        or payload.get("given_name")
        or payload.get("family_name")
    )

    user = await get_user_by_provider(session, provider, provider_subject)
    if not user and email:
        user = await get_user_by_email(session, email)

    if not user:
        user = User(
            email=email,
            provider=provider,
            provider_subject=provider_subject,
            display_name=name,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    changed = False
    if not user.provider_subject:
        user.provider_subject = provider_subject
        changed = True
    if email and not user.email:
        user.email = email
        changed = True
    if name and not user.display_name:
        user.display_name = name
        changed = True

    if changed:
        await session.commit()
        await session.refresh(user)

    return user


def build_auth_result(user: User) -> AuthResult:
    return AuthResult(user=user, access_token=create_access_token(user))
