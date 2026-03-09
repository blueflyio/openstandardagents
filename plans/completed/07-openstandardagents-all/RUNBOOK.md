# Agent Platform – Deployment & Operations Runbook

> **Owner:** BlueFly.io Platform Team  
> **Environment order:** Local (DDEV) → NAS (staging) → Oracle (production)  
> **Run before any push:** `set -a && source /Volumes/AgentPlatform/.env.local && set +a`

---

## 0. Pre-flight Checklist (always run first)

```bash
# 1. Verify token
buildkit gitlab token check
# If 401: refreshed with
buildkit gitlab token pat-self-rotate --update-env /Volumes/AgentPlatform/.env.local
source /Volumes/AgentPlatform/.env.local

# 2. Confirm NAS is reachable
ping -c 1 blueflynas.tailcf98b3.ts.net

# 3. Confirm Oracle is reachable
ping -c 1 oracle-platform.tailcf98b3.ts.net

# 4. Sync all WORKING_DEMOs from NAS (pull latest Drupal module code)
buildkit repos sync --path $HOME/Sites/blueflyio/WORKING_DEMOs
```

---

## 1. Git Push Order (dependency-safe)

Always push in this order to avoid broken CI pipelines referencing unpublished packages:

| # | Repo | Branch | Notes |
|---|------|--------|-------|
| 1 | `openstandardagents` | release/v0.4.x | OSSA spec and schema |
| 2 | `openstandard-ui` | release/v0.1.x | Wizard and API |
| 3 | `studio-ui` | release/v0.1.x | React component library |
| 4 | `marketplace` | main | IDE marketplace |
| 5 | `NODE-AgentMarketplace` | release/v0.1.x | Frontend |
| 6 | `Drupal_AgentMarketplace` | release/v0.1.x | Registry backend |
| 7 | `Drupal_Fleet_Manager` | release/v0.1.x | Fleet orchestrator |
| 8 | `Drupal_AgentDash` | release/v0.1.x | Dashboard (depends on all) |
| 9 | `dragonfly` | release/v0.1.x | Test orchestrator |

```bash
# Push from any repo using BuildKit (handles token + remote correctly):
cd $HOME/Sites/blueflyio/WORKING_DEMOs/<REPO>
buildkit git push
# Or with pull-merge-push:
buildkit flow push
```

---

## 2. NPM Package Publishing

Run after merging release → main for packages that update `@bluefly/*`:

```bash
# Check current published version
npm view @bluefly/ossa-ui version --registry https://gitlab.com/api/v4/groups/87749026/-/packages/npm/

# Publish (from repo root, ensure version bumped in package.json first)
npm publish --registry https://gitlab.com/api/v4/groups/87749026/-/packages/npm/
```

**Packages that trigger publishing:**
- `@bluefly/openstandardagents` → from `openstandardagents`
- `@bluefly/ossa-ui` → from `openstandard-ui`
- `@bluefly/studio-ui` → from `studio-ui`

---

## 3. MR Merge Order (release → main)

```bash
# Create MR and merge via buildkit
buildkit gitlab mr release-to-main --project blueflyio/<group>/<project>

# Verify NPM publish landed
npm view @bluefly/<pkg> version --registry https://gitlab.com/api/v4/groups/87749026/-/packages/npm/
```

---

## 4. Oracle Deployments

### Dragonfly (Node.js service, port 3020)
```bash
# From Mac (uses buildkit deploy config):
buildkit deploy oracle dragonfly

# Or manually via SSH:
ssh opc@oracle-platform.tailcf98b3.ts.net \
  "cd /opt/bluefly/dragonfly && git fetch origin && git reset --hard origin/release/v0.1.x && docker compose -f /opt/bluefly/docker-compose.yml up -d --build --no-deps dragonfly"

# Health check
curl https://dragonfly.blueflyagents.com/health
```

### Drupal_AgentDash (Drupal on Oracle, DDEV or Docker)
```bash
# Via CI (push to release/v0.1.x triggers oracle-deploy-buildkit)
cd $HOME/Sites/blueflyio/WORKING_DEMOs/Drupal_AgentDash
buildkit git push   # triggers pipeline -> deploy:oracle:buildkit

# Manual SSH fallback:
ssh opc@oracle-platform.tailcf98b3.ts.net \
  "cd /opt/bluefly/agentdash && git fetch origin && git reset --hard origin/release/v0.1.x && ddev restart && ddev drush deploy -y"

# Health: https://agentdash.blueflyagents.com
```

### IDE Marketplace (static Node service)
```bash
# marketplace deploys to NAS via `deploy:nas` (rsync)
# Just push to main; CI job runs automatically
cd $HOME/Sites/blueflyio/WORKING_DEMOs/marketplace
git push origin main

# Health: https://marketplace.blueflyagents.com/health
```

---

## 5. NAS Deployments

### Sync Drupal_AgentDash to NAS (staging)
```bash
# NAS path: /volume1/AgentPlatform/applications/AgentDash
ssh nas@blueflynas.tailcf98b3.ts.net "cd /volume1/AgentPlatform/applications/AgentDash && git fetch origin && git reset --hard origin/release/v0.1.x && ddev restart && ddev drush deploy -y"

# Health: check via Tailscale IP or tunnel
```

### Sync custom Drupal modules to NAS
```bash
# Sync all custom modules from WORKING_DEMOs to NAS bare repos
buildkit drupal modules
# Or per-module:
buildkit repos sync --path $HOME/Sites/blueflyio/WORKING_DEMOs/Drupal_AgentDash
```

### ddev sync-all-from-nas (pull NAS code to local)
```bash
# For new devs: pull all Drupal platforms from NAS to local WORKING_DEMOs
for repo in Drupal_AgentDash Drupal_AgentMarketplace Drupal_Fleet_Manager; do
  buildkit repos sync --path $HOME/Sites/blueflyio/WORKING_DEMOs/$repo
done
```

---

## 6. Phase 8 Remaining Items

Reference: `plans/00-ORIGINAL-PLAN-build-order.plan.md`

Key outstanding items:
- [ ] `api_normalization` module: http_client_manager + Key module audit
- [ ] `cedar_policy` integration in Fleet Manager: CedarGateMiddleware for fleet tool execution
- [ ] `mcp_registry` bridging: ensure mcp_registry_fleet reports to AgentDash correctly
- [ ] OSSA v0.4.6 schema validation pipeline in Drupal_AgentMarketplace
- [ ] NIST CAISI RFI response (deadline: March 9, 2026)
- [ ] NIST ITL concept paper response (deadline: April 2, 2026)

---

## 7. Parallel Registry Agents (5 tracks)

**Prereqs:** `source /Volumes/AgentPlatform/.env.local`, set `WORKTREE_SOURCE_DIR`, run token check.

Open 5 terminals and run one command per terminal:

```bash
# Terminal 1 – Agent registry
buildkit agent spawn-team --registry agent --worktree-dir $WORKTREE_SOURCE_DIR

# Terminal 2 – NPM package registry
buildkit agent spawn-team --registry npm --worktree-dir $WORKTREE_SOURCE_DIR

# Terminal 3 – API Schema registry
buildkit agent spawn-team --registry api-schema --worktree-dir $WORKTREE_SOURCE_DIR

# Terminal 4 – Composer registry
buildkit agent spawn-team --registry composer --worktree-dir $WORKTREE_SOURCE_DIR

# Terminal 5 – Container registry
buildkit agent spawn-team --registry container --worktree-dir $WORKTREE_SOURCE_DIR
```

Full reference: `REGISTRY-REFERENCE.md` → "Run parallel registry agents (5 tracks)"

---

## 8. End-to-End Smoke Test

After all deployments, verify the complete agent lifecycle:

```bash
# Step 1: Create agent via NODE-AgentMarketplace wizard
open https://marketplace.blueflyagents.com/create

# Step 2: Confirm it hits Drupal_AgentMarketplace registry (JSON:API)
curl https://agentmarketplace.blueflyagents.com/jsonapi/node/agent | jq '.data[0].attributes.title'

# Step 3: Verify pipeline triggered in openstandard-generated-agents
# Check: https://gitlab.com/blueflyio/openstandard/openstandard-generated-agents/-/pipelines

# Step 4: Confirm agent appears in Fleet Manager sync
curl https://fleetmanager.blueflyagents.com/api/ai-agents-client/fleet/status | jq '.'

# Step 5: Dragonfly health + test trigger
curl https://dragonfly.blueflyagents.com/health
curl -X POST https://dragonfly.blueflyagents.com/api/dragonfly/v1/tests/trigger \
  -H "Content-Type: application/json" \
  -d '{"projects":"all","testTypes":["phpcs","phpstan"],"priority":"low"}'

# Step 6: AgentDash shows updated agent status
open https://agentdash.blueflyagents.com/admin/dashboard/agentdash_agents
```

---

## 9. Troubleshooting Reference

| Problem | Fix |
|---------|-----|
| `401 Unauthorized` on push | Run `buildkit gitlab token pat-self-rotate --update-env /Volumes/AgentPlatform/.env.local` |
| Oracle SSH permission denied | Check `ORACLE_USER` is `opc`; ensure runner key in `authorized_keys` |
| NAS unreachable | Check Tailscale is running: `tailscale status` |
| `docker compose up` fails on Oracle | Check `/root/.env.local` has `DB_PASSWORD`, `GITLAB_TOKEN`, `MINIO_*` |
| Dragonfly health check 502 | Container crashlooped: `ssh opc@oracle ... docker logs dragonfly` |
| Drupal cache errors after deploy | `ddev drush cr` or `vendor/bin/drush cr` in site root |
| DDEV not starting | `ddev restart --skip-confirmation` or `ddev delete && ddev start` |
| Composer 401 on NAS | Set `GITLAB_AGENTNAS` group CI variable; locally add to `~/.composer/auth.json` |
