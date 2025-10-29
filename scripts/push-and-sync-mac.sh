#!/usr/bin/env bash
# Push local changes and immediately pull them on the macOS machine.
#
# Usage:
#   ./scripts/push-and-sync-mac.sh
#   ./scripts/push-and-sync-mac.sh origin main
#
# Configure environment variables if your remote differs:
#   export MAC_HOST=lachlanchen@192.168.1.122
#   export MAC_REPO_DIR=/Users/lachlanchen/Local/AISecretary

set -euo pipefail

REMOTE="${1:-origin}"
BRANCH="${2:-main}"
MAC_HOST="${MAC_HOST:-lachlanchen@192.168.1.122}"
MAC_REPO_DIR="${MAC_REPO_DIR:-/Users/lachlanchen/Local/AISecretary}"

echo "Pushing to ${REMOTE} ${BRANCH}..."
git push "$REMOTE" "$BRANCH"

echo "Triggering pull on ${MAC_HOST}:${MAC_REPO_DIR}..."
ssh "${MAC_HOST}" "cd '${MAC_REPO_DIR}' && git pull --ff-only"

echo "Done."
