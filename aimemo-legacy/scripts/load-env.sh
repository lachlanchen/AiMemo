#!/usr/bin/env bash

# Load environment variables from the repository .env file

set -euo pipefail

ENV_FILE="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -n "${ANDROID_HOME:-}" ]]; then
  export ANDROID_HOME
  export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
  ANDROID_CMDLINE="$ANDROID_HOME/cmdline-tools/latest/bin"
  ANDROID_PLATFORM_TOOLS="$ANDROID_HOME/platform-tools"
  ANDROID_EMULATOR="$ANDROID_HOME/emulator"
  PATH="$ANDROID_CMDLINE:$ANDROID_PLATFORM_TOOLS:$ANDROID_EMULATOR:$PATH"
  export PATH
fi
