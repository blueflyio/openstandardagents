# Fix ossa-ui.blueflyagents.com (Still Broken)

**URL:** https://ossa-ui.blueflyagents.com  
**Oracle:** Service runs at `/opt/agent-platform/services/openstandard-ui`, port **3456**. Tunnel routes ossa-ui.blueflyagents.com and openstandard-ui.blueflyagents.com to localhost:3456 on Oracle.

**Status check:** As of 2026-03-01 the homepage and `GET /api/version` return 200 and valid content (v0.4.5). If you still see broken: try hard refresh (Cmd+Shift+R), another browser/incognito, or note which exact URL/action fails (e.g. /agent/, sandbox, or a specific API).

---

## Option A: Deploy from Mac (BuildKit)

**Required:** openstandard-ui deploy uses a **tag** (not branch). You must pass `--tag <tag>` e.g. `--tag v0.4.5`.

1. Source token and set Oracle SSH:
   ```bash
   set -a && source /Volumes/AgentPlatform/.env.local && set +a
   export ORACLE_SSH_HOST=ubuntu@oracle-platform.tailcf98b3.ts.net
   ```
2. Run deploy with a tag (e.g. v0.4.5; check GitLab for latest):
   ```bash
   buildkit deploy oracle openstandard-ui --tag v0.4.5
   ```
   If `buildkit` not found: from agent-buildkit worktree run `npm run build:cli` then `node dist/cli/index.js deploy oracle openstandard-ui --tag v0.4.5`.

---

## Option B: SSH to Oracle and restart

1. SSH to Oracle:
   ```bash
   ssh ubuntu@oracle-platform.tailcf98b3.ts.net
   ```
2. Go to app dir and pull + restart:
   ```bash
   cd /opt/agent-platform/services/openstandard-ui
   git fetch origin && git pull origin main --no-rebase
   docker compose ps
   docker compose up -d --build
   ```
   Or if run via Node/pnpm instead of Docker:
   ```bash
   cd /opt/agent-platform/services/openstandard-ui
   git pull origin main --no-rebase
   pnpm install && pnpm run build
   # Restart the process (pm2/systemd/script) that listens on 3456
   ```
3. Check port 3456:
   ```bash
   ss -tlnp | grep 3456
   curl -sI http://localhost:3456
   ```

---

## Option C: If container/image is missing

On Oracle, ensure the app is cloned and built:

```bash
cd /opt/agent-platform/services
git clone -b main https://gitlab.com/blueflyio/ossa/lab/openstandard-ui.git
cd openstandard-ui
# Add .env with GITLAB_REGISTRY_NPM_TOKEN if Docker build needs @bluefly/studio-ui
docker compose up -d --build
# OR: pnpm install && pnpm run build && start app on 3456
```

Tunnel (Cloudflare) already routes ossa-ui.blueflyagents.com to localhost:3456; no tunnel change needed if the app is listening on 3456.

---

## Verify after fix

- `curl -sI https://ossa-ui.blueflyagents.com`  (expect 200)
- `curl -s https://ossa-ui.blueflyagents.com/api/version`  (expect JSON or version string)
- Open https://ossa-ui.blueflyagents.com in browser; agent builder / sandbox should load.
