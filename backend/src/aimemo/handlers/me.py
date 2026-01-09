import uuid

import jwt
from sqlalchemy import select

from ..auth import decode_access_token, serialize_user
from ..db import SessionLocal
from ..models import User
from .base import BaseHandler


class MeHandler(BaseHandler):
    async def get(self) -> None:
        token = self.get_bearer_token()
        if not token:
            self.write_json(401, {"error": "missing bearer token"})
            return

        try:
            payload = decode_access_token(token)
        except jwt.PyJWTError:
            self.write_json(401, {"error": "invalid token"})
            return

        user_id = payload.get("sub")
        if not user_id:
            self.write_json(401, {"error": "invalid token"})
            return

        async with SessionLocal() as session:
            result = await session.execute(
                select(User).where(User.id == uuid.UUID(user_id))
            )
            user = result.scalar_one_or_none()

        if not user:
            self.write_json(404, {"error": "user not found"})
            return

        self.write_json(200, {"user": serialize_user(user)})
