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
