#!/usr/bin/env bash
set -euo pipefail

SESSION="aisecretary-dev"
PROJECT_ROOT="/home/lachlan/ProjectsLFS/EmailAssistant"
CONDA_SH="/home/lachlan/miniconda3/etc/profile.d/conda.sh"

BACKEND="cd '$PROJECT_ROOT/backend' && source $CONDA_SH && conda activate ai && python -m aisecretary.app"
BACKEND_NGROK="ngrok http --url=ai-backend.lazying.art 8787"
FRONTEND="cd '$PROJECT_ROOT/app' && EXPO_PUBLIC_API_URL=http://127.0.0.1:8787 npx expo start --web --port 8091"
FRONTEND_NGROK="ngrok http --url=ai.lazying.art 8091"

# Ensure tmux available
if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is required" >&2
  exit 1
fi

# Kill existing session if any
if tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux kill-session -t "$SESSION"
fi

# Pane 0: backend server
tmux new-session -d -s "$SESSION" "$BACKEND"

# Pane 1: backend ngrok
tmux split-window -h -t "$SESSION:0" "$BACKEND_NGROK"

# Pane 2: frontend dev server
tmux split-window -v -t "$SESSION:0.0" "$FRONTEND"

# Pane 3: frontend ngrok
tmux split-window -v -t "$SESSION:0.1" "$FRONTEND_NGROK"

# arrange layout and attach
tmux select-layout -t "$SESSION:0" tiled
exec tmux attach -t "$SESSION"
