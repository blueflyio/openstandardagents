# Get AgentDash (adash.blueflyagents.com) live on port 3013

Priority: high
Project: agent-buildkit
Branch: release/v0.1.x

## Spec / Deliverables

Goal: https://adash.blueflyagents.com/ returns 200 (or 302 to login).
- Oracle has agentdash-db and tunnel routes adash.blueflyagents.com to localhost:3013. The Drupal/app container must listen on 3013.
- buildkit deploy oracle agentdash (or deploy list agentdash). AGENTS.md "AgentDash deploy:oracle" - clone at ORACLE_DEPLOY_PATH, ddev start or docker compose with router_http_port 3013.
- Verify with curl -sI https://adash.blueflyagents.com/.
