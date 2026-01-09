# Repository Guidelines

## Workflow & Product Direction
- Canonical guide: `AIMEMO_GUIDE.md` (mirrored here for quick reference).
- Always `git pull --ff-only` before edits, then `git commit` + `git push` after each change set.
- Keep Ubuntu and macOS in sync; see `macOS_config.md` (gitignored) for macOS sync + simulator notes.
- macOS pull example: `cd /Users/lachlanchen/Local/AiMemo && git pull --ff-only`
- macOS pull via SSH: `ssh lachlanchen@192.168.1.122` then `cd /Users/lachlanchen/Local/AiMemo && git pull --ff-only` (see `macOS_config.md`).
- Build backend + PWA first, then keep iOS/Android aligned with the same API contracts and data models.
- Product goal: chat-based memo app with collaboration; backend AI summarizes chats into tables, docs, calendar items, and reminders.
- Auth/data: Google + Apple login, register/login/logout/reset; PostgreSQL primary DB + local/offline storage; consistent subscriptions across platforms.
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
- Backend (legacy): `cd aimemo-legacy/backend && pip install -e . && APP_PORT=8799 python -m aisecretary.app`
- Frontend (legacy): `cd aimemo-legacy/app && EXPO_PUBLIC_API_URL=http://localhost:8799 npx expo start --web`
- Lint (legacy): `cd aimemo-legacy/app && npm run lint`

## Coding Style & Naming Conventions
- Python (backend): 4-space indentation; follow `black`/`ruff` settings in `aimemo-legacy/backend/pyproject.toml`.
- TypeScript/React (app): 2-space indentation; follow existing ESLint config in `aimemo-legacy/app/package.json`.
- Prefer clear, domain-specific names (e.g., `auth`, `calendar`, `memo`).

## Testing Guidelines
- No automated tests are configured in this repo.
- Run manual smoke checks after changes:
  - Backend: `/health` responds.
  - Frontend: login screen loads and API calls succeed.

## Commit & Pull Request Guidelines
- Commit messages use concise imperative verbs (e.g., `Add`, `Fix`, `Update`).
- PRs include a short summary, affected areas (`docs/`, `aimemo-legacy/`), and screenshots for UI changes.

## Configuration & Security Tips
- Secrets live in `aimemo-legacy/.env` (e.g., `JWT_SECRET`, `DATABASE_AI_URL`).
- Do not commit secrets; use local `.env` overrides for ports and CORS.
