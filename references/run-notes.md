# AiMemo run notes

These notes capture the commands and fixes used during local setup/troubleshooting.

## New backend (Tornado + Postgres)

- Activate env and install backend in editable mode:
  - `conda activate ai`
  - `cd /home/lachlan/ProjectsLFS/AiMemo/backend`
  - `pip install -e .`

- Start the backend:
  - `python -m aimemo.app`

- Health check:
  - `curl http://localhost:8799/health`

- If you see a psycopg2 import error on Python 3.13, your `DATABASE_URL` is using a sync driver.
  Use `postgresql+asyncpg://...` and ensure no shell `DATABASE_URL` overrides `.env`.
  - `.env` is loaded from `backend/.env`; restart the backend after edits.

- Export conda environment (keep `environment.yml` up to date):
  - `conda env export -n ai > /home/lachlan/ProjectsLFS/AiMemo/environment.yml`

## PWA (static)

- Create local config:
  - `cp /home/lachlan/ProjectsLFS/AiMemo/pwa/config.example.js /home/lachlan/ProjectsLFS/AiMemo/pwa/config.js`
  - Fill in `API_BASE_URL`, `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`, `APPLE_REDIRECT_URI`.

- Serve locally (any static server works):
  - `cd /home/lachlan/ProjectsLFS/AiMemo/pwa && python -m http.server 8090`

## iOS (SwiftUI)

- Generate Xcode project:
  - `cd /home/lachlan/ProjectsLFS/AiMemo/ios && xcodegen generate`

- Open in Xcode:
  - `open /home/lachlan/ProjectsLFS/AiMemo/ios/AiMemo.xcodeproj`

- Update API base URL:
  - `ios/AiMemo/Resources/Info.plist` -> `API_BASE_URL`

## Android (Compose)

- Open `android/` in Android Studio and sync Gradle.
- If Gradle sync fails, run `cd /home/lachlan/ProjectsLFS/AiMemo/android && ./gradlew --version`.
- Update API base URL:
  - `android/app/src/main/res/values/strings.xml` -> `api_base_url`

## Backend (Tornado API)

- Activate env and install backend in editable mode:
  - `conda activate ai`
  - `cd /home/lachlan/ProjectsLFS/AiMemo/aimemo-legacy/backend`
  - `pip install -e .`

- Start the backend on a free port:
  - `APP_PORT=8799 python -m aisecretary.app`

- Health check:
  - `curl http://localhost:8799/health`

## CORS fixes

If the frontend runs on a different dev port, add it to CORS.
Pydantic expects JSON for list values.

- Example for port 8092:
  - `CORS_ALLOW_ORIGINS='["http://localhost:8092","http://127.0.0.1:8092"]' APP_PORT=8799 python -m aisecretary.app`

- Dev-only allow all:
  - `CORS_ALLOW_ORIGINS='["*"]' APP_PORT=8799 python -m aisecretary.app`

## Frontend (Expo web)

- Start the web app pointing at the backend:
  - `cd /home/lachlan/ProjectsLFS/AiMemo/aimemo-legacy/app`
  - `EXPO_PUBLIC_API_URL=http://localhost:8799 npx expo start --web --port 8091`

## Common issues

- CORS errors in the browser mean the backend did not allow the web origin.
- The backend reads `.env` from `aimemo-legacy/.env` after the move.
