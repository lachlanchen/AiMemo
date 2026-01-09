# Auth Setup (Google, Apple, JWT)

This guide explains how to configure login for AiMemo.

## Backend environment

Edit `backend/.env`:

```
DATABASE_URL=postgresql+asyncpg://USER:PASS@HOST:5432/aimemo
JWT_SECRET=replace-me
JWT_EXPIRES_MINUTES=10080
GOOGLE_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID
APPLE_CLIENT_ID=YOUR_APPLE_CLIENT_ID
CORS_ALLOW_ORIGINS=["http://localhost:8090","http://localhost:8091"]
```

Notes:
- `.env` is always loaded from `backend/.env`.
- Avoid `postgresql://` with `psycopg2`; use `postgresql+asyncpg://`.

## Generate a JWT secret

Use one of these and paste into `JWT_SECRET`:

```
openssl rand -hex 32
```

or

```
python - <<'PY'
import secrets
print(secrets.token_hex(32))
PY
```

## Google Sign-In (PWA)

1. Google Cloud Console -> APIs & Services -> Credentials.
2. Create OAuth Client ID -> Web application.
3. Add authorized JavaScript origins:
   - `http://localhost:8090`
   - `https://memo.lazying.art`
4. Copy the Client ID into:
   - `backend/.env` -> `GOOGLE_CLIENT_ID`
   - `pwa/config.js` -> `GOOGLE_CLIENT_ID`

The PWA uses Google Identity Services and sends `id_token` to `/auth/oauth/google`.

## Google Sign-In (iOS / Android)

The backend currently validates a single `GOOGLE_CLIENT_ID`.
To keep verification simple, use the web client ID as the server audience:

- iOS: configure GoogleSignIn with `serverClientID` set to the web client ID.
- Android: configure GoogleSignIn with `requestIdToken(webClientId)`.

If you need multiple audiences, update the backend to accept a list.

## Apple Sign-In (PWA)

1. Apple Developer -> Certificates, Identifiers & Profiles.
2. Create a **Service ID** (for web/PWA):
   - Identifier example: `art.lazying.memo.web`
3. Configure Sign in with Apple for the Service ID:
   - Web domain: `memo.lazying.art`
   - Return URL: `https://memo.lazying.art/auth/apple/callback`
4. Set:
   - `backend/.env` -> `APPLE_CLIENT_ID=art.lazying.memo.web`
   - `pwa/config.js` -> `APPLE_CLIENT_ID=art.lazying.memo.web`
   - `pwa/config.js` -> `APPLE_REDIRECT_URI=https://memo.lazying.art/auth/apple/callback`

The PWA uses Apple JS and sends `id_token` to `/auth/oauth/apple`.

## Apple Sign-In (iOS)

iOS identity tokens use the **app bundle ID** as the audience.
You have two choices:

1) Use the same Apple client ID for all platforms (simpler, but only one target).
2) Extend the backend to accept multiple `APPLE_CLIENT_ID` values.

For now, if you target iOS only:
- Set `APPLE_CLIENT_ID` to the bundle ID (`art.lazying.memo`).
- Enable the "Sign in with Apple" capability in Xcode.

## PWA local config

Create a local file (gitignored):

```
cp pwa/config.example.js pwa/config.js
```

Then edit `pwa/config.js`:

```
window.__APP_CONFIG__ = {
  API_BASE_URL: "http://localhost:8799",
  GOOGLE_CLIENT_ID: "...",
  APPLE_CLIENT_ID: "...",
  APPLE_REDIRECT_URI: "http://localhost:8090/auth/apple/callback",
};
```

## Test flow checklist

1. Start backend: `python -m aimemo.app`
2. Start PWA: `python -m http.server 8090` in `pwa/`
3. Register with email/password.
4. Sign in with Google (if configured).
5. Sign in with Apple (if configured).

## Troubleshooting

- `JWT_SECRET missing` -> ensure `backend/.env` has it and restart.
- `psycopg2` error -> use `postgresql+asyncpg://` and unset shell `DATABASE_URL`.
- CORS errors -> add your web origin to `CORS_ALLOW_ORIGINS` and restart.
