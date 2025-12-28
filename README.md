<p align="center">
  <img src="figs/banner.png" alt="LazyingArt banner" />
</p>

# AISecretary

## Project Overview

AISecretary is an email and calendar assistant that ingests incoming messages, performs intelligent triage, and schedules events on behalf of the user. The solution is split into two major pieces:

- **Backend (Python + Tornado)** — Acts as the API layer, integrates with email/calendar providers, performs message analysis, and coordinates tasks. Runs locally or in the cloud, backed by PostgreSQL.
- **Client App (Expo React Native + Web)** — A single codebase targeting iOS, Android, and PWA via Expo's React Native toolchain. It provides secure setup flows, conversation history, and calendar visualizations.

## Technology Choices

| Area | Choice | Rationale |
| --- | --- | --- |
| API Framework | Tornado (Python 3.11) | Asynchronous, production-tested, integrates nicely with asyncio-based email/calendar SDKs. |
| Database | PostgreSQL | Already provisioned, reliable transactional store for mail metadata and user state. |
| Auth & Secrets | `.env` + pydantic settings | Centralized configuration, easy to switch to AWS Secrets Manager or Vault later. |
| Background Tasks | `asyncio` + `tornado.ioloop.PeriodicCallback` | Lightweight scheduling for polling IMAP/CalDAV or webhook processing. |
| Email Access | `icloudpy` (later) + IMAP/SMTP abstraction | Works with iCloud app passwords; pluggable for Gmail/Microsoft later. |
| Calendar Access | CalDAV via `caldav` package | Compatible with iCloud and other CalDAV providers. |
| AI Layer | Placeholder (to integrate with OpenAI/Azure later) | Backend exposes hooks for LLM-based analysis. |
| Mobile/Web App | Expo (React Native + TypeScript) | Fast iteration locally, native builds via EAS or local Xcode/Android Studio, web/PWA out of the box. |
| State Management | React Query + Zustand | Simple yet powerful server state and client state handling. |

## Repository Layout

```
.
├── README.md
├── .env                     # Local secrets (never commit to VCS)
├── backend/                 # Tornado API service
│   ├── pyproject.toml
│   └── src/
│       └── aisecretary/
│           ├── __init__.py
│           ├── app.py       # Tornado entrypoint
│           ├── config.py    # Pydantic settings loader
│           ├── handlers/    # HTTP endpoints
│           ├── services/    # Email/calendar integrations
│           └── storage/     # Database access layer
└── app/                     # Expo multi-platform client
    ├── app.config.ts
    ├── package.json
    ├── tsconfig.json
    ├── App.tsx
    └── src/
        ├── api/
        ├── components/
        ├── hooks/
        ├── screens/
        ├── store/
        └── theme/
```

## Getting Started

### Backend

```bash
conda activate ai
cd backend
pip install -e .
# ensure .env includes DATABASE_AI_URL pointing at your Postgres instance
# optional: set APP_PORT (defaults to 8787)
# optional: update CORS_ALLOW_ORIGINS for mobile/web clients
# optional: BACKEND_PUBLIC_URL / FRONTEND_PUBLIC_URL (defaults use ai-backend.lazying.art & ai.lazying.art)
# optional: set ANDROID_HOME / ANDROID_SDK_ROOT (used by dev-session.sh to expose adb/emulator)
# required: set JWT_SECRET (use a long random string) and optionally JWT_EXP_MINUTES
alembic upgrade head  # (after migration scripts are added)
python -m aisecretary.app
```

### Frontend

```bash
cd app
npm install
# optionally configure the API URL that the app should hit
# export EXPO_PUBLIC_API_URL="http://localhost:8787"
# if testing on device/emulator, use your machine IP instead of localhost
npx expo start --tunnel   # or --ios / --android
```

### Combined Dev Session (backend + web + ngrok)

```bash
conda activate ai
./scripts/dev-session.sh
```

The script opens a tmux session arranged as follows (top-left → bottom-right):

- backend service command pretyped (`python -m aisecretary.app`)
- backend ngrok tunnel (defaults to `ai-backend.lazying.art`, hitting `APP_PORT`)
- frontend ngrok tunnel (defaults to `ai.lazying.art`)
- Expo web dev server command pretyped (`npx expo start --web --port FRONTEND_PORT`)

Environment overrides:

```bash
APP_PORT=8787 \
FRONTEND_PORT=8091 \
NGROK_BACKEND_DOMAIN=ai-backend.lazying.art \
NGROK_FRONTEND_DOMAIN=ai.lazying.art \
START_BACKEND=1 \
START_BACKEND_NGROK=1 \
START_FRONTEND=1 \
START_FRONTEND_NGROK=1 \
./scripts/dev-session.sh
```

By default the backend/app panes are prefilled but paused, while both ngrok tunnels start automatically. Set any `START_*` flag to `1` if you want the command to auto-run. Exit a pane with `Ctrl+C`; detach the tmux session with `Ctrl+B` followed by `D`.

Example: launch only the ngrok tunnels while leaving backend/frontend commands queued:

```bash
START_BACKEND=0 \
START_FRONTEND=0 \
./scripts/dev-session.sh
```

### Auth API Endpoints

- `POST /auth/register` — payload `{ "email": "user@example.com", "password": "hunter2" }`; returns `{ token, user }`.
- `POST /auth/login` — same payload/response as register.
- `POST /auth/forgot-password` — payload `{ "email": "user@example.com" }`; always returns `202` with a generic message.

All responses include a JWT signed with `JWT_SECRET`; clients should store the token securely (the Expo app uses SecureStore).

## Next Steps

1. Flesh out Tornado handlers for auth, email sync, and calendar management.
2. Integrate iCloud email + CalDAV calendar via app-specific passwords.
3. Plug in LLM workflow for message intent classification and scheduling suggestions.
4. Build mobile/web UI flows for onboarding, conversation review, and event editing.
5. Review `docs/mobile-setup.md` for Android/iOS tooling requirements.

### Android Setup (Ubuntu/Linux)

1. **Install Android Studio** via `snap run android-studio` or official archive.
2. **Install SDK components** from Android Studio ➝ *More Actions* ➝ *SDK Manager*: Command-line Tools, Emulator, desired API level.
3. **Set env vars** (add to `.env` so scripts pick them up):
   ```ini
   ANDROID_HOME=/home/youruser/Android/Sdk
   ANDROID_SDK_ROOT=/home/youruser/Android/Sdk
   ```
4. **Verify** from terminal: `echo $ANDROID_HOME`, `adb --version`.
5. **Create emulator** (Android Studio Device Manager) or via CLI:
   ```bash
   sdkmanager "system-images;android-34;default;x86_64"
   avdmanager create avd -n Pixel_Android_14 -k "system-images;android-34;default;x86_64"
   emulator @Pixel_Android_14 &
   ```
6. `./scripts/dev-session.sh` now automatically sees `adb` and runs Expo in the emulator when `RUN_FRONTEND=1`.

### iOS Setup (macOS)

1. Install Xcode (App Store) and run once to finish setup.
2. Accept license: `sudo xcodebuild -license`.
3. Clone repo, install deps: `cd app && npm install`.
4. Copy `.env` from Ubuntu or create one with `EXPO_PUBLIC_API_URL`, `BACKEND_PUBLIC_URL`, etc.
5. Launch Expo: `npx expo start --ios` (opens simulator).

### Expo Targets & tmux session

- `./scripts/dev-session.sh` loads `.env`, runs backend, Expo web, and ngrok tunnels. Use `RUN_BACKEND=0 RUN_FRONTEND=0` to prefill commands without starting them.
- By default Expo uses `EXPO_PUBLIC_API_URL`; backend defaults to `.env`’s `BACKEND_PUBLIC_URL` if unset.
- For a complete macOS simulator walkthrough, see [`docs/mac-ios-simulator.md`](docs/mac-ios-simulator.md).
- On macOS you can pull + launch the simulator remotely with `./scripts/run-mac-simulator.sh` (works over SSH; requires nvm & watchman as described in the doc).
- From Ubuntu, use `./scripts/push-and-sync-mac.sh` to `git push` and immediately invoke a `git pull --ff-only` on the Mac (`MAC_HOST` / `MAC_REPO_DIR` env vars override defaults).
