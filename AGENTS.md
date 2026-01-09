# Repository Guidelines

## Repository Sync & Workflow
- Always `git pull --ff-only` before edits, and `git commit` + `git push` after each change set.
- Keep Ubuntu and macOS in sync; after changes on one machine, pull on the other before continuing work.
- `EchoMind/` and `IdeasGlass/` are local reference folders and are gitignored.

## Project Structure & Module Organization
- `docs/`: Public website for memo.lazying.art (static HTML/CSS).
- `references/`: Legacy docs and run notes (see `references/run-notes.md`).
- `aimemo-legacy/`: Legacy codebase to refactor/replace. Contains:
  - `aimemo-legacy/app/`: Expo React Native + web client.
  - `aimemo-legacy/backend/`: Tornado API server (Python).
  - `aimemo-legacy/scripts/`, `aimemo-legacy/ai_requests/`, `aimemo-legacy/figs/`.
- `README.md`: High-level overview; keep at repo root.

## Build, Test, and Development Commands
- Backend (legacy):
  - `cd aimemo-legacy/backend && pip install -e .`
  - `APP_PORT=8799 python -m aisecretary.app`
  - Health check: `curl http://localhost:8799/health`
- Frontend (legacy):
  - `cd aimemo-legacy/app && EXPO_PUBLIC_API_URL=http://localhost:8799 npx expo start --web`
  - Lint: `cd aimemo-legacy/app && npm run lint`
- Combined session (legacy): `aimemo-legacy/scripts/dev-session.sh`

## Coding Style & Naming Conventions
- Python (backend): 4-space indentation; follow `black`/`ruff` settings in `aimemo-legacy/backend/pyproject.toml`.
- TypeScript/React (app): 2-space indentation; follow existing ESLint config in `aimemo-legacy/app/package.json`.
- Prefer clear, domain-specific names (e.g., `auth`, `calendar`, `memo`).

## Product Direction (AI Memo)
- Build a production-ready memo app with chat-based conversations and collaboration.
- Backend AI summarizes chats and outputs structured tables, docs, calendar items, and reminders.
- Develop the backend + PWA first, then keep iOS/Android in sync with the PWA implementation.

## Auth, Subscription, and Data
- Provide login, registration, logout, and password reset flows.
- Support Google and Apple login.
- Use PostgreSQL as the primary database, plus local/offline storage where appropriate.
- Ensure subscription flows are reasonable and consistent across PWA, iOS, and Android.

## Testing Guidelines
- No automated tests are configured in this repo.
- Run manual smoke checks after changes:
  - Backend: `/health` responds.
  - Frontend: login screen loads and API calls succeed.

## Commit & Pull Request Guidelines
- Commit messages follow imperative, concise verbs (e.g., `Add ...`, `Fix ...`, `Update ...`).
- PRs should include: summary of changes, affected areas (`docs/`, `aimemo-legacy/`), and screenshots for UI updates.

## Configuration & Security Tips
- Secrets live in `aimemo-legacy/.env` (e.g., `JWT_SECRET`, `DATABASE_AI_URL`).
- Do not commit secrets; use local `.env` overrides for ports and CORS.
