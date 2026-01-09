#!/usr/bin/env bash
# Usage: ./scripts/run-mac-simulator.sh
# Can be executed locally or over ssh on the Mac host.

set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/Local/AISecretary}"
APP_DIR="${APP_DIR:-$REPO_DIR/app}"
SESSION_NAME="${EXPO_TMUX_SESSION:-aisecretary-metro}"
NODE_VERSION="${NODE_VERSION:-20}"

if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "Repository not found at $REPO_DIR"
  exit 1
fi

cd "$REPO_DIR"
git fetch --all --prune
git pull --ff-only

if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  . "$HOME/.nvm/nvm.sh"
elif [[ -s "/usr/local/opt/nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  . "/usr/local/opt/nvm/nvm.sh"
else
  echo "nvm not found; install nvm before running this script."
  exit 1
fi

nvm use "$NODE_VERSION"

cd "$APP_DIR"

npm install
npm uninstall @types/react-native >/dev/null 2>&1 || true
npx expo install expo-font >/dev/null
npx expo install typescript@~5.3.3 >/dev/null

if command -v watchman >/dev/null 2>&1; then
  watchman watch-del-all >/dev/null 2>&1 || true
  watchman shutdown-server >/dev/null 2>&1 || true
fi

ulimit -n 8192 >/dev/null 2>&1 || true

if command -v tmux >/dev/null 2>&1; then
  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    tmux kill-session -t "$SESSION_NAME"
  fi
  tmux new-session -d -s "$SESSION_NAME" "cd '$APP_DIR' && npx expo start --clear --ios"
  echo "Expo started in tmux session: $SESSION_NAME"
  echo "Attach with: tmux attach -t $SESSION_NAME"
else
  npx expo start --clear --ios
fi
