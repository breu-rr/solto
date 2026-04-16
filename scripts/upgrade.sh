#!/usr/bin/env bash
# Upgrade the local solto checkout in a safe, repeatable way.
#
# Usage:
#   ./scripts/upgrade.sh
#
# Expected environment:
#   Run this from the solto checkout on the host, as the agent user.
#   The script refuses to proceed if the working tree is dirty.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

require_cmd() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Missing required command: $1" >&2
        exit 1
    fi
}

require_cmd git
require_cmd pnpm
require_cmd pm2

if [ ! -d "$ROOT/.git" ]; then
    echo "This script must be run from a solto checkout." >&2
    exit 1
fi

cd "$ROOT"

current_branch="$(git branch --show-current)"
if [ "$current_branch" != "main" ]; then
    echo "Refusing to upgrade from branch '$current_branch'. Switch to main first." >&2
    exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
    echo "Working tree is dirty. Commit or stash changes before upgrading." >&2
    exit 1
fi

echo "--- Fetching latest main"
git fetch origin main
git pull --ff-only origin main

echo "--- Refreshing dependencies"
pnpm install --frozen-lockfile

echo "--- Reloading pm2 with current env"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

cat <<'EOF'

--- Upgrade complete

The local checkout is now on the latest main, dependencies are refreshed,
and pm2 has been reloaded with the current environment.
EOF
