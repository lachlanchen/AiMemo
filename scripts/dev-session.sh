#!/usr/bin/env bash
set -euo pipefail

SESSION="aisecretary-dev"
PROJECT_ROOT="/home/lachlan/ProjectsLFS/EmailAssistant"
CONDA_SH="/home/lachlan/miniconda3/etc/profile.d/conda.sh"

BACKEND="cd '$PROJECT_ROOT/backend' && source $CONDA_SH && conda activate ai && python -m aisecretary.app"
BACKEND_NGROK="ngrok http --url=ai-backend.lazying.art 8787"
FRONTEND="cd '$PROJECT_ROOT/app' && EXPO_PUBLIC_API_URL=https://ai-backend.lazying.art npx expo start --web --port 8091"
FRONTEND_NGROK="ngrok http --url=ai.lazying.art 8091"

# helper to send a command and optionally run it
send_cmd() {
  local target=$1
  shift
  local cmd=$1
  local run_now=${2:-0}
  tmux send-keys -t "$target" "$cmd"
  if [[ "$run_now" == "1" ]]; then
    tmux send-keys -t "$target" Enter
  fi
}

# kill existing session if present
if tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux kill-session -t "$SESSION"
fi

# start new session
BACKEND_PANE="$SESSION:0.0"
BACKEND_NGROK_PANE="$SESSION:0.1"
FRONTEND_PANE="$SESSION:0.2"
FRONTEND_NGROK_PANE="$SESSION:0.3"

RUN_BACKEND=${RUN_BACKEND:-1}
RUN_FRONTEND=${RUN_FRONTEND:-1}
RUN_BACKEND_NGROK=${RUN_BACKEND_NGROK:-1}
RUN_FRONTEND_NGROK=${RUN_FRONTEND_NGROK:-1}

# Pane 0
if [[ "${RUN_BACKEND}" == "1" ]]; then
  tmux new-session -d -s "$SESSION" "$BACKEND"
else
  tmux new-session -d -s "$SESSION" "bash"
  send_cmd "$BACKEND_PANE" "cd '$PROJECT_ROOT/backend'" 1
  send_cmd "$BACKEND_PANE" "source $CONDA_SH" 1
  send_cmd "$BACKEND_PANE" "conda activate ai" 1
  send_cmd "$BACKEND_PANE" "python -m aisecretary.app"
fi

# Pane 1
if [[ "${RUN_BACKEND_NGROK}" == "1" ]]; then
  tmux split-window -h -t "$SESSION:0" "$BACKEND_NGROK"
else
  tmux split-window -h -t "$SESSION:0" "bash"
  send_cmd "$BACKEND_NGROK_PANE" "$BACKEND_NGROK"
fi

# Pane 2
if [[ "${RUN_FRONTEND}" == "1" ]]; then
  tmux split-window -v -t "$SESSION:0.0" "$FRONTEND"
else
  tmux split-window -v -t "$SESSION:0.0" "bash"
  send_cmd "$FRONTEND_PANE" "cd '$PROJECT_ROOT/app'" 1
  send_cmd "$FRONTEND_PANE" "export EXPO_PUBLIC_API_URL=http://127.0.0.1:8787" 1
  send_cmd "$FRONTEND_PANE" "npx expo start --web --port 8091"
fi

# Pane 3
if [[ "${RUN_FRONTEND_NGROK}" == "1" ]]; then
  tmux split-window -v -t "$SESSION:0.1" "$FRONTEND_NGROK"
else
  tmux split-window -v -t "$SESSION:0.1" "bash"
  send_cmd "$FRONTEND_NGROK_PANE" "$FRONTEND_NGROK"
fi

# Finish
 tmux select-layout -t "$SESSION:0" tiled
 exec tmux attach -t "$SESSION"
