#!/usr/bin/env bash

set -euo pipefail

# Launches backend, Expo web app, and paired ngrok tunnels inside a tmux session
# so you can monitor everything without backgrounding commands.
#
# Environment overrides:
#   AISEC_TMUX_SESSION          - tmux session name (default: aisecondary-dev)
#   APP_PORT                    - backend port (default: 8787)
#   FRONTEND_PORT               - Expo web port (default: 8091)
#   NGROK_BACKEND_DOMAIN        - reserved ngrok domain for backend
#   NGROK_FRONTEND_DOMAIN       - reserved ngrok domain for web app
#   ENABLE_FRONTEND             - set to 0 to skip Expo client (default: 1)
#   ENABLE_FRONTEND_NGROK       - set to 0 to skip frontend ngrok (default: 1)
#   BACKEND_CMD                 - override backend command
#   FRONTEND_CMD                - override Expo command
#   NGROK_BACKEND_CMD           - override backend ngrok command
#   NGROK_FRONTEND_CMD          - override frontend ngrok command

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

SESSION_NAME=${AISEC_TMUX_SESSION:-aisecretary-dev}
APP_PORT=${APP_PORT:-8787}
FRONTEND_PORT=${FRONTEND_PORT:-8091}
ENABLE_FRONTEND=${ENABLE_FRONTEND:-1}
ENABLE_FRONTEND_NGROK=${ENABLE_FRONTEND_NGROK:-1}

NGROK_BACKEND_DOMAIN=${NGROK_BACKEND_DOMAIN:-ai-backend.lazying.art}
NGROK_FRONTEND_DOMAIN=${NGROK_FRONTEND_DOMAIN:-ai.lazying.art}

export EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL:-http://127.0.0.1:${APP_PORT}}

BACKEND_CMD=${BACKEND_CMD:-"python -m aisecondary.app"}
FRONTEND_CMD=${FRONTEND_CMD:-"npx expo start --web --port ${FRONTEND_PORT}"}
NGROK_BACKEND_CMD=${NGROK_BACKEND_CMD:-"ngrok http --url=${NGROK_BACKEND_DOMAIN} ${APP_PORT}"}
NGROK_FRONTEND_CMD=${NGROK_FRONTEND_CMD:-"ngrok http --url=${NGROK_FRONTEND_DOMAIN} ${FRONTEND_PORT}"}

require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require tmux
require ngrok

if [[ "${ENABLE_FRONTEND}" != "0" ]]; then
  require npx
fi

if tmux has-session -t "${SESSION_NAME}" 2>/dev/null; then
  echo "Attaching to existing tmux session: ${SESSION_NAME}"
  exec tmux attach -t "${SESSION_NAME}"
fi

echo "Starting new tmux session '${SESSION_NAME}'"
echo "  Backend command : cd backend && ${BACKEND_CMD}"
echo "  Backend ngrok   : ${NGROK_BACKEND_CMD}"
if [[ "${ENABLE_FRONTEND}" != "0" ]]; then
  echo "  Frontend command: cd app && ${FRONTEND_CMD}"
  if [[ "${ENABLE_FRONTEND_NGROK}" != "0" ]]; then
    echo "  Frontend ngrok  : ${NGROK_FRONTEND_CMD}"
  fi
fi

tmux new-session -d -s "${SESSION_NAME}" "cd '${PROJECT_ROOT}/backend' && ${BACKEND_CMD}"
tmux set-option -t "${SESSION_NAME}" remain-on-exit on
tmux split-window -h -t "${SESSION_NAME}:0" "${NGROK_BACKEND_CMD}"

if [[ "${ENABLE_FRONTEND}" != "0" ]]; then
  tmux select-pane -t "${SESSION_NAME}:0.0"
  tmux split-window -v -t "${SESSION_NAME}:0.0" "cd '${PROJECT_ROOT}/app' && ${FRONTEND_CMD}"

  if [[ "${ENABLE_FRONTEND_NGROK}" != "0" ]]; then
    tmux select-pane -t "${SESSION_NAME}:0.1"
    tmux split-window -v -t "${SESSION_NAME}:0.1" "${NGROK_FRONTEND_CMD}"
  fi
fi

tmux select-layout -t "${SESSION_NAME}:0" tiled
tmux select-pane -t "${SESSION_NAME}:0.0"
exec tmux attach -t "${SESSION_NAME}"
