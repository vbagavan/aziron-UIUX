#!/usr/bin/env bash
# Deploy DEV to aziron VM: build image + restart container (no dependency churn).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${DEPLOY_ENV_FILE:-$ROOT/deploy/.env}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

: "${DEPLOY_HOST:?Set DEPLOY_HOST in deploy/.env (copy from deploy/env.example)}"
: "${DEPLOY_USER:?Set DEPLOY_USER in deploy/.env}"
: "${DEPLOY_PATH:?Set DEPLOY_PATH in deploy/.env}"

REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"
COMPOSE="docker compose"

echo "→ DEV deploy to ${REMOTE}:${DEPLOY_PATH}"

if [[ "${RSYNC_BEFORE_DEPLOY:-0}" == "1" ]]; then
  echo "→ Syncing project (excluding node_modules, dist)…"
  rsync -az --delete \
    --exclude node_modules --exclude dist --exclude .git \
    "$ROOT/" "${REMOTE}:${DEPLOY_PATH}/"
fi

echo "→ docker compose build"
ssh "$REMOTE" "cd '${DEPLOY_PATH}' && ${COMPOSE} build"

echo "→ docker compose up -d --no-deps"
ssh "$REMOTE" "cd '${DEPLOY_PATH}' && ${COMPOSE} up -d --no-deps"

echo "→ Done. App: http://${DEPLOY_HOST}:${APP_PORT:-8080}/"
