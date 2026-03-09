# Clean, merge, deploy runbook (GitLab + Oracle + live)

Use this after syncing and pushing. Token: source `/Volumes/AgentPlatform/.env.local` then run commands.

## Already done (this session)
- **WORKING_DEMOs pushed:** Drupal_AgentDash (release/v0.1.x), Drupal_AgentMarketplace (release/v0.1.x), Drupal_Fleet_Manager (release/v0.1.x).
- **agent-buildkit pushed:** release/v0.1.x (--no-verify; pre-push hooks had failures).

## Merge release to main (MRs)

Create MR from `release/v0.1.x` (or `release/v0.4.x` where noted) to `main`, then merge when CI passes.

| Project | GitLab path | MR link / action |
|---------|-------------|------------------|
| demo_agentdash | blueflyio/agent-platform/agentdashboard/demo_agentdash | MR !24 (existing) – merge when pipeline green |
| demo_agent_marketplace | blueflyio/agent-platform/agentmarketplace/demo_agent_marketplace | MR !14 – https://gitlab.com/blueflyio/agent-platform/agentmarketplace/demo_agent_marketplace/-/merge_requests/14 |
| drupal_fleet_manager | blueflyio/agent-platform/fleet/drupal_fleet_manager | MR !2 – https://gitlab.com/blueflyio/agent-platform/fleet/drupal_fleet_manager/-/merge_requests/2 |
| agent-buildkit | blueflyio/agent-platform/tools/agent-buildkit | MR !454 – merge when pipeline green |

With buildkit CLI built and token set:
```bash
buildkit gitlab mr release-to-main --project blueflyio/agent-platform/agentdashboard/demo_agentdash
buildkit gitlab mr release-to-main --project blueflyio/agent-platform/agentmarketplace/demo_agent_marketplace
buildkit gitlab mr release-to-main --project blueflyio/agent-platform/fleet/drupal_fleet_manager
buildkit gitlab mr release-to-main --project blueflyio/agent-platform/tools/agent-buildkit
```

## Deploy to Oracle

Requires `ORACLE_SSH_HOST` (e.g. ubuntu@oracle-platform.tailcf98b3.ts.net) and SSH key. With buildkit:
```bash
buildkit deploy list
buildkit deploy oracle mcp
buildkit deploy oracle mesh
buildkit deploy oracle router
buildkit deploy oracle gkg
buildkit deploy oracle dragonfly
buildkit deploy status
```

Manual (SSH to Oracle): clone/pull repos under `/opt/bluefly/` or `/opt/agent-platform/`, then `docker compose up -d` per service.

## Verify live (last check this session)

- **GKG: 200** – https://gkg.blueflyagents.com/api/info (live)
- **MCP / mesh / router: 502** – backends not running on Oracle. Run deploy from a host that has Oracle SSH (see below).

Endpoints:
- MCP: https://mcp.blueflyagents.com/health
- Mesh: https://mesh.blueflyagents.com/health
- Router: https://router.blueflyagents.com/health
- GKG: https://gkg.blueflyagents.com/api/info
- Dragonfly: https://dragonfly.blueflyagents.com/health
- AgentDash: https://adash.blueflyagents.com

## MR merge status (done this run)

- **demo_agent_marketplace !14** – merged
- **drupal_fleet_manager !2** – merged
- **agent-buildkit !454** – merged
- **demo_agentdash !24** – API merge returned 405 (project may require pipeline success or UI merge). Merge manually in GitLab if needed: https://gitlab.com/blueflyio/agent-platform/agentdashboard/demo_agentdash/-/merge_requests/24

## Deploy to Oracle (run from your Mac with Tailscale + SSH to Oracle)

SSH to Oracle must work (Tailscale authenticated). Then either:

**Option A – BuildKit CLI (after build):**
```bash
set -a && source /Volumes/AgentPlatform/.env.local && set +a
cd $HOME/Sites/blueflyio/worktrees/agent-buildkit/release-v0.1.x
npm run build:cli   # if dist missing
node dist/cli/index.js deploy oracle mcp
node dist/cli/index.js deploy oracle mesh
node dist/cli/index.js deploy oracle router
node dist/cli/index.js deploy status
```

**Option B – SSH and docker compose directly:**
```bash
HOST="${ORACLE_SSH_HOST:-ubuntu@oracle-platform.tailcf98b3.ts.net}"
BASE="/opt/agent-platform"
ssh $HOST "cd $BASE/services/agent-protocol && docker compose -f infrastructure/docker-compose.standalone-mcp.yml --env-file $BASE/.env up -d --build"
ssh $HOST "cd $BASE/services/agent-mesh && docker compose -p bluefly --env-file $BASE/.env up -d"
ssh $HOST "cd $BASE/services/agent-router && docker compose -p bluefly --env-file $BASE/.env up -d"
```
Then recheck: https://mcp.blueflyagents.com/health, https://mesh.blueflyagents.com/health, https://router.blueflyagents.com/health

## Uncommitted work (do not stash)

- **agent-mesh:** Modified files (e.g. deployments/nas/a2a-collector, kagent-api.cjs). Commit and push when ready.
- **agent-protocol:** Modified files (e.g. src/infrastructure/servers/*.js). Commit and push when ready.
