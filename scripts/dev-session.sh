#!/usr/bin/env bash

set -euo pipefail

# Launch development panes for backend, frontend, and ngrok tunnels inside tmux.
# Commands can be prefilled without execution when START_* flags are set to 0.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

SESSION_NAME=${AISEC_TMUX_SESSION:-aisecretary-dev}
APP_PORT=${APP_PORT:-8787}
FRONTEND_PORT=${FRONTEND_PORT:-8091}

START_BACKEND=${START_BACKEND:-1}
START_BACKEND_NGROK=${START_BACKEND_NGROK:-1}
START_FRONTEND=${START_FRONTEND:-1}
START_FRONTEND_NGROK=${START_FRONTEND_NGROK:-1}

NGROK_BACKEND_DOMAIN=${NGROK_BACKEND_DOMAIN:-ai-backend.lazying.art}
NGROK_FRONTEND_DOMAIN=${NGROK_FRONTEND_DOMAIN:-ai.lazying.art}

BACKEND_CMD=${BACKEND_CMD:-"python -m aisecondary.app"}
FRONTEND_CMD=${FRONTEND_CMD:-"npx expo start --web --port ${FRONTEND_PORT}"}
NGROK_BACKEND_CMD=${NGROK_BACKEND_CMD:-"ngrok http --url=${NGROK_BACKEND_DOMAIN} ${APP_PORT}"}
NGROK_FRONTEND_CMD=${NGROK_FRONTEND_CMD:-"ngrok http --url=${NGROK_FRONTEND_DOMAIN} ${FRONTEND_PORT}"}

EXPO_EXPORT="export EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL:-http://127.0.0.1:${APP_PORT}}"

require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require tmux
if [[ "$START_BACKEND" != "0" ]]; then
  require python
fi
if [[ "$START_BACKEND_NGROK" != "0" || "$START_FRONTEND_NGROK" != "0" ]]; then
  require ngrok
fi
if [[ "$START_FRONTEND" != "0" ]]; then
  require npx
fi

if tmux has-session -t "${SESSION_NAME}" 2>/dev/null; then
  echo "Attaching to existing tmux session: ${SESSION_NAME}"
  exec tmux attach -t "${SESSION_NAME}"
fi

echo "Creating tmux session '${SESSION_NAME}'"

tmux new-session -d -s "${SESSION_NAME}" "bash"
tmux set-option -t "${SESSION_NAME}" remain-on-exit on

tmux display-message -p -t "${SESSION_NAME}:0.0" &>/dev/null

backend_pane=$(tmux display-message -p -t "${SESSION_NAME}:0.0" "#{pane_id}")
tmux send-keys -t "${backend_pane}" "cd '${PROJECT_ROOT}/backend'" Enter
tmux send-keys -t "${backend_pane}" "${BACKEND_CMD}"
if [[ "${START_BACKEND}" != "0" ]]; then
  tmux send-keys -t "${backend_pane}" Enter
fi

tmux split-window -h -t "${SESSION_NAME}:0" "bash"
backend_ngrok_pane=$(tmux display-message -p -t "${SESSION_NAME}:0.1" "#{pane_id}")
tmux send-keys -t "${backend_ngrok_pane}" "${NGROK_BACKEND_CMD}"
if [[ "${START_BACKEND_NGROK}" != "0" ]]; then
  tmux send-keys -t "${backend_ngrok_pane}" Enter
fi

# Frontend pane (bottom left)
tmux select-pane -t "${backend_pane}"
tmux split-window -v -t "${SESSION_NAME}:0.0" "bash"
frontend_pane=$(tmux display-message -p -t "${SESSION_NAME}:0.2" "#{pane_id}")
tmux send-keys -t "${frontend_pane}" "cd '${PROJECT_ROOT}/app'" Enter
tmux send-keys -t "${frontend_pane}" "${EXPO_EXPORT}" Enter
tmux send-keys -t "${frontend_pane}" "${FRONTEND_CMD}"
if [[ "${START_FRONTEND}" != "0" ]]; then
  tmux send-keys -t "${frontend_pane}" Enter
fi

# Frontend ngrok pane (bottom right)
tmux select-pane -t "${backend_ngrok_pane}"
tmux split-window -v -t "${SESSION_NAME}:0.1" "bash"
frontend_ngrok_pane=$(tmux display-message -p -t "${SESSION_NAME}:0.3" "#{pane_id}")
tmux send-keys -t "${frontend_ngrok_pane}" "${NGROK_FRONTEND_CMD}"
if [[ "${START_FRONTEND_NGROK}" != "0" ]]; then
  tmux send-keys -t "${frontend_ngrok_pane}" Enter
fi

tmux select-layout -t "${SESSION_NAME}:0" tiled
tmux select-pane -t "${SESSION_NAME}:0.0"
exec tmux attach -t "${SESSION_NAME}"
