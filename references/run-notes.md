# AiMemo legacy run notes

These notes capture the commands and fixes used during local setup/troubleshooting.

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
