# Get agent-router live at https://router.blueflyagents.com

Priority: high
Project: agent-buildkit
Branch: release/v0.1.x

## Spec / Deliverables

Goal: https://router.blueflyagents.com/health returns 200.
- deploy status showed no agent-router container. buildkit deploy oracle router brings up router from /opt/agent-platform compose (port 4000).
- If deploy uses per-service path, ensure agent-router repo at correct path and compose defines service on 4000.
- Tunnel routes router.blueflyagents.com to localhost:4000. Verify with curl -sI https://router.blueflyagents.com/health.
