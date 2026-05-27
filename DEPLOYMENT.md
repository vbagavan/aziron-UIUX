# DEV deployment (Docker on aziron VM)

Ultra-simple flow: **one prompt in Cursor** → agent runs the deploy script, or you run two commands on the VM.

| Where you are | Command |
|---------------|---------|
| **On VM** (`~/workspace/aziron-UIUX`) | `docker compose build && docker compose up -d --no-deps` |
| **On VM** (script) | `./scripts/deploy-on-vm.sh` |
| **From laptop** | `./scripts/deploy-dev.sh` |
| **In Cursor** | Say: **"deploy dev"** |

**URL after deploy:** `http://172.30.47.194:8080/` (port `8080` → nginx `80` in container)

---

## One-time setup on the VM

```bash
# Install Docker + Compose plugin if missing
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker "$USER"
# Log out and back in so docker group applies

cd ~/workspace/aziron-UIUX   # clone or sync your repo here
cp deploy/env.example deploy/.env   # optional on VM; compose uses defaults
docker compose build
docker compose up -d --no-deps
```

Open firewall if needed: allow TCP **8080** (or change `APP_PORT` in `docker-compose.yml`).

---

## One-time setup from your laptop (prompt-based deploy)

1. **SSH key** (do not store password in git):

   ```bash
   ssh-copy-id aziron@172.30.47.194
   ```

   Optional `~/.ssh/config` — see `deploy/ssh-config.example`.

2. **Deploy env**:

   ```bash
   cp deploy/env.example deploy/.env
   # Edit DEPLOY_PATH if the folder on the VM is not aziron-UIUX
   ```

3. **Test**:

   ```bash
   chmod +x scripts/deploy-dev.sh
   ./scripts/deploy-dev.sh
   ```

4. **Cursor:** say **"deploy dev"** — the agent uses `.cursor/rules/deploy-dev.mdc`.

---

## Sync code to the VM

Pick one:

- **Git:** `ssh aziron@172.30.47.194` → `cd ~/workspace/aziron-UIUX && git pull`
- **Rsync:** set `RSYNC_BEFORE_DEPLOY=1` in `deploy/.env`, then run `./scripts/deploy-dev.sh`

---

## Troubleshooting

### `git pull` / merge: untracked files would be overwritten

The VM may have old **untracked** copies of `.dockerignore`, `Dockerfile`, or `docker-compose.yml` from before they were added to the repo. Remove them, then pull:

```bash
cd ~/workspace/aziron-UIUX
rm -f .dockerignore Dockerfile docker-compose.yml
git pull origin main
```

Or run `./scripts/deploy-on-vm.sh` (it removes those files automatically before pull).

### Logs and health

```bash
docker compose ps
docker compose logs -f web
curl -sI http://127.0.0.1:8080/
```

Rebuild from scratch:

```bash
docker compose down
docker compose build --no-cache
docker compose up -d --no-deps
```
