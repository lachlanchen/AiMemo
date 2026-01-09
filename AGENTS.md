# Repository Guidelines

## Workflow & Product Direction
- Canonical guide: `AIMEMO_GUIDE.md` (mirrored here for quick reference).
- Always `git pull --ff-only` before edits, then `git commit` + `git push` after each change set.
- Keep Ubuntu and macOS in sync; see `macOS_config.md` (gitignored) for macOS sync + simulator notes.
- macOS pull example: `cd /Users/lachlanchen/Local/AiMemo && git pull --ff-only`
- macOS pull via SSH: `ssh lachlanchen@192.168.1.122` then `cd /Users/lachlanchen/Local/AiMemo && git pull --ff-only` (see `macOS_config.md`).
- macOS pull one-liner: `ssh lachlanchen@192.168.1.122 'cd /Users/lachlanchen/Local/AiMemo && git pull --ff-only'`
- Build backend + PWA first, then keep iOS/Android aligned with the same API contracts and data models.
- Develop PWA, iOS, and Android in parallel for each feature to keep parity from day one.
- Product goal: chat-based memo app with collaboration; backend AI summarizes chats into tables, docs, calendar items, and reminders.
- Auth/data: Google + Apple login, register/login/logout/reset; PostgreSQL primary DB + local/offline storage; consistent subscriptions across platforms.
- Use `EchoMind/` (chat.lazying.art) as the reference implementation; copy/port submodules (LLM, TTS/STT, chat) when needed.
- `EchoMind/` and `IdeasGlass/` are local reference folders and are gitignored.
- Keep clear, top-level folders for each target: `backend/`, `pwa/`, `ios/`, `android/` to keep development isolated and predictable.
- Always capture the run command for each service (backend, PWA, iOS, Android) and the active conda env in `references/run-notes.md`.
- Keep a root conda export up to date: `conda env export -n ai > environment.yml`.

## Project Structure & Module Organization
- `docs/`: Public website for memo.lazying.art (static HTML/CSS).
- `references/`: Legacy docs and run notes (see `references/run-notes.md`).
- `backend/`: New Tornado + Postgres backend (auth, API).
- `pwa/`: New PWA shell (login + Ideas/Chat/Studio/Settings tabs).
- `ios/`: SwiftUI app (generate Xcode project with XcodeGen).
- `android/`: Jetpack Compose app (open in Android Studio).
- `aimemo-legacy/`: Legacy codebase to refactor/replace. Contains:
  - `aimemo-legacy/app/`: Expo React Native + web client.
  - `aimemo-legacy/backend/`: Tornado API server (Python).
  - `aimemo-legacy/scripts/`, `aimemo-legacy/ai_requests/`, `aimemo-legacy/figs/`.
- `README.md`: High-level overview; keep at repo root.

## Build, Test, and Development Commands
- Backend (new): `cd backend && pip install -e . && python -m aimemo.app`
- PWA (new): `cd pwa && python -m http.server 8090`
- iOS (new): `cd ios && xcodegen generate && open AiMemo.xcodeproj`
- Android (new): open `android/` in Android Studio and sync Gradle
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
