# Get MCP (agent-protocol) live at https://mcp.blueflyagents.com

Priority: high
Project: agent-buildkit
Branch: release/v0.1.x

## Spec / Deliverables

Goal: https://mcp.blueflyagents.com/health returns 200.
- Oracle clone/pull of agent-protocol failed with HTTP Basic denied. Set GITLAB_TOKEN or GITLAB_DEPLOY_TOKEN on Oracle (e.g. /opt/agent-platform/.env or deploy user env) with read_repository.
- From Mac: buildkit deploy oracle mcp (uses /opt/agent-platform/services/agent-protocol; compose infrastructure/docker-compose.standalone-mcp.yml or project compose).
- Or SSH to Oracle: cd /opt/agent-platform/services/agent-protocol, ensure repo present and .env for compose, docker compose up -d. Port 4005.
- Tunnel already routes mcp.blueflyagents.com to localhost:4005. Verify with curl -sI https://mcp.blueflyagents.com/health.
