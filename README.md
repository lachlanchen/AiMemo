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
│       └── aisecondary/
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
alembic upgrade head  # (after migration scripts are added)
python -m aisecondary.app
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

## Next Steps

1. Flesh out Tornado handlers for auth, email sync, and calendar management.
2. Integrate iCloud email + CalDAV calendar via app-specific passwords.
3. Plug in LLM workflow for message intent classification and scheduling suggestions.
4. Build mobile/web UI flows for onboarding, conversation review, and event editing.
5. Review `docs/mobile-setup.md` for Android/iOS tooling requirements.
