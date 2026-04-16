#!/usr/bin/env bash

set -euo pipefail

AGENT_USER="${1:-agent}"
AGENT_HOME="$(getent passwd "$AGENT_USER" | cut -d: -f6)"

if [[ -z "$AGENT_HOME" || ! -d "$AGENT_HOME" ]]; then
  echo "missing home directory for $AGENT_USER" >&2
  exit 1
fi

id "$AGENT_USER" >/dev/null
test -d "$AGENT_HOME"

sudo -i -u "$AGENT_USER" env \
  HOME="$AGENT_HOME" \
  XDG_CONFIG_HOME="$AGENT_HOME/.config" \
  XDG_CACHE_HOME="$AGENT_HOME/.cache" \
  XDG_DATA_HOME="$AGENT_HOME/.local/share" \
  XDG_STATE_HOME="$AGENT_HOME/.local/state" \
  bash -lc '
    set -euo pipefail
    source ~/.bashrc
    command -v node
    command -v npm
    command -v pnpm
    command -v pm2
    command -v codex
    command -v claude
    command -v cloudflared
    command -v bwrap
  '
