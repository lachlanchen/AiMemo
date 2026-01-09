# AiMemo Backend

Tornado-based API service with PostgreSQL storage and JWT auth.

## Quick start

```bash
conda activate ai
cd backend
pip install -e .
cp .env.example .env
python -m aimemo.app
```

## Required configuration

Set these in `.env`:

- `DATABASE_URL` (PostgreSQL, async): `postgresql+asyncpg://USER:PASS@HOST:5432/aimemo`
- `JWT_SECRET`: long random string
- `CORS_ALLOW_ORIGINS`: JSON array of allowed origins

### Google Sign-In

- Create an OAuth client in Google Cloud Console.
- Set `GOOGLE_CLIENT_ID` to the web client ID.

### Apple Sign-In

- Create a Service ID in Apple Developer.
- Set `APPLE_CLIENT_ID` to the Service ID identifier.

## Endpoints

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/oauth/google`
- `POST /auth/oauth/apple`
- `GET /auth/me`
