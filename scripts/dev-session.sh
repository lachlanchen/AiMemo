#!/usr/bin/env bash

set -euo pipefail

# Simple helper that launches the backend and ngrok side-by-side in tmux so you can
# monitor both processes without backgrounding either of them.

SESSION_NAME=${AISEC_TMUX_SESSION:-aisecretary-dev}
APP_PORT=${APP_PORT:-8787}
NGROK_DOMAIN=${NGROK_DOMAIN:-ai-backend.lazying.art}
BACKEND_CMD=${BACKEND_CMD:-"python -m aisecondary.app"}
NGROK_CMD=${NGROK_CMD:-"ngrok http --url=${NGROK_DOMAIN} ${APP_PORT}"}

require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require tmux
require ngrok

if tmux has-session -t "${SESSION_NAME}" 2>/dev/null; then
  echo "Attaching to existing tmux session: ${SESSION_NAME}"
  exec tmux attach -t "${SESSION_NAME}"
fi

echo "Starting new tmux session '${SESSION_NAME}' with:"
echo "  - pane 1: ${BACKEND_CMD}"
echo "  - pane 2: ${NGROK_CMD}"

tmux new-session -d -s "${SESSION_NAME}" "${BACKEND_CMD}"
tmux split-window -v -t "${SESSION_NAME}:0" "${NGROK_CMD}"
tmux select-layout -t "${SESSION_NAME}:0" tiled
tmux select-pane -t "${SESSION_NAME}:0.0"
exec tmux attach -t "${SESSION_NAME}"
