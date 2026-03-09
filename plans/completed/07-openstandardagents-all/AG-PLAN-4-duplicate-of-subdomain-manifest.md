# Bluefly Application Routes (Oracle Platform)

This is the canonical source of truth for the reverse proxied services running on the `*.blueflyagents.com` DNS zone via Tailscale / Oracle k3s.

## Core Services
1. **Mesh (Discovery)**: `mesh.blueflyagents.com` -> `oracle-platform:3005`
2. **Router**: `router.blueflyagents.com` -> `oracle-platform:4000`
3. **Registry (API)**: `agents.blueflyagents.com` -> `oracle-platform:3001`
4. **OSSA UI**: `ossa-ui.blueflyagents.com` -> `oracle-platform:3456`
5. **Kagent**: `kagent.blueflyagents.com` -> `oracle-platform:30083`
6. **Kagent UI**: `kagent-ui.blueflyagents.com` -> `oracle-platform:30080`
7. **Social API**: `social-api.blueflyagents.com` -> `oracle-platform:3018`
8. **Compliance Engine**: `compliance.blueflyagents.com` -> `oracle-platform:3010`
9. **Workflow Engine**: `workflow.blueflyagents.com` -> `oracle-platform:3015`

## Storage & Network
1. **NAS HTTPS**: `nas.blueflyagents.com` -> `blueflynas:5001`
2. **S3 Storage**: `storage.blueflyagents.com` -> `blueflynas:9000`
3. **NPM Registry**: `npm.blueflyagents.com` -> `blueflynas:4873`

## Platform Tooling
1. **Studio**: `studio.blueflyagents.com` -> `oracle-platform:3012`
2. **Tracer**: `tracer.blueflyagents.com` -> `oracle-platform:3006`
3. **MCP**: `mcp.blueflyagents.com` -> `oracle-platform:4005`
4. **Brain (Vector)**: `brain.blueflyagents.com` -> `oracle-platform:6333`
5. **Grafana**: `grafana.blueflyagents.com` -> `oracle-platform:30300`
6. **N8N**: `n8n.blueflyagents.com` -> `oracle-platform:5678`
7. **Flowise**: `flowise.blueflyagents.com` -> `nas-platform:3100`
8. **Langflow**: `langflow.blueflyagents.com` -> `oracle-platform:7860`
