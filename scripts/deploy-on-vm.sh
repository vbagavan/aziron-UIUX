#!/usr/bin/env bash
# Run ON the VM inside ~/workspace/aziron-UIUX (pull latest, then build + restart).
set -euo pipefail

cd "$(dirname "$0")/.."

# Files that used to be copied manually; now tracked on main — remove untracked copies before pull.
DOCKER_TRACKED=(.dockerignore Dockerfile docker-compose.yml)

pull_latest() {
  if [[ ! -d .git ]]; then
    echo "→ No .git repo here; skipping pull"
    return 0
  fi

  echo "→ git fetch origin main"
  git fetch origin main

  for f in "${DOCKER_TRACKED[@]}"; do
    if [[ -f "$f" ]] && ! git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
      if git cat-file -e "origin/main:$f" 2>/dev/null; then
        echo "→ Removing untracked ${f} (tracked on origin/main)"
        rm -f "$f"
      fi
    fi
  done

  echo "→ git pull --ff-only origin main"
  git pull --ff-only origin main
}

if [[ "${SKIP_GIT_PULL:-0}" != "1" ]]; then
  pull_latest
fi

echo "→ docker compose build"
docker compose build

echo "→ docker compose up -d --no-deps"
docker compose up -d --no-deps

echo "→ Done. Check: docker compose ps"
