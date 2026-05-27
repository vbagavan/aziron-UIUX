#!/usr/bin/env bash
# Run ON the VM inside ~/workspace/aziron-UIUX (same commands you use manually).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ docker compose build"
docker compose build

echo "→ docker compose up -d --no-deps"
docker compose up -d --no-deps

echo "→ Done. Check: docker compose ps"
