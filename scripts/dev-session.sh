#!/usr/bin/env bash
set -euo pipefail

SESSION="aisecretary-dev"
PROJECT_ROOT="/home/lachlan/ProjectsLFS/EmailAssistant"

BACKEND_PANE="$SESSION:0.0"
BACKEND_NGROK_PANE="$SESSION:0.1"
FRONTEND_PANE="$SESSION:0.2"
FRONTEND_NGROK_PANE="$SESSION:0.3"

BACKEND_PYTHON_CMD="python -m aisecretary.app"
BACKEND_NGROK="ngrok http --url=ai-backend.lazying.art 8787"
FRONTEND_CMD="npx expo start --web --port 8091"
FRONTEND_NGROK="ngrok http --url=ai.lazying.art 8091"
CONDA_SH="/home/lachlan/miniconda3/etc/profile.d/conda.sh"

# kill existing session if present
tmux has-session -t "$SESSION" 2>/dev/null && tmux kill-session -t "$SESSION"

# create base session
tmux new-session -d -s "$SESSION" "bash"

# Pane 0: backend setup then leave python command ready
tmux send-keys -t "$BACKEND_PANE" "cd '$PROJECT_ROOT/backend'" Enter
tmux send-keys -t "$BACKEND_PANE" "source $CONDA_SH" Enter
tmux send-keys -t "$BACKEND_PANE" "conda activate ai" Enter
tmux send-keys -t "$BACKEND_PANE" "$BACKEND_PYTHON_CMD"

# Pane 1: backend ngrok (run immediately)
tmux split-window -h -t "$SESSION:0" "bash"
tmux send-keys -t "$BACKEND_NGROK_PANE" "$BACKEND_NGROK" Enter

# Pane 2: frontend setup then leave Expo command ready
tmux split-window -v -t "$SESSION:0.0" "bash"
tmux send-keys -t "$FRONTEND_PANE" "cd '$PROJECT_ROOT/app'" Enter
tmux send-keys -t "$FRONTEND_PANE" "export EXPO_PUBLIC_API_URL=http://127.0.0.1:8787" Enter
tmux send-keys -t "$FRONTEND_PANE" "$FRONTEND_CMD"

# Pane 3: frontend ngrok (run immediately)
tmux split-window -v -t "$SESSION:0.1" "bash"
tmux send-keys -t "$FRONTEND_NGROK_PANE" "$FRONTEND_NGROK" Enter

# select tiled layout and attach
tmux select-layout -t "$SESSION:0" tiled
tmux attach -t "$SESSION"
