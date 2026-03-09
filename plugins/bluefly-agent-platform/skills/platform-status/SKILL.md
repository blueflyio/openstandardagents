---
name: platform-status
description: "Complete 38-service registry with URLs, ports, health endpoints, Tailscale mesh, Cloudflare tunnel config. The canonical service map."
triggers:
  - pattern: "service|URL|endpoint|health|status|running"
    priority: critical
  - pattern: "port|domain|subdomain|cloudflare|tunnel"
    priority: high
  - pattern: "where.*is|how.*access|connect.*to"
    priority: medium
allowed-tools:
  - Read
  - Bash
  - WebFetch
---

# Platform Status & Service Registry

## All 38 Services

### Core Platform (Oracle Cloud — FREE tier)
| # | Service | URL | Port | Health |
|---|---------|-----|------|--------|
| 1 | Agents API | https://agents.blueflyagents.com | 3001 | /health |
| 2 | Agent Studio | https://studio.blueflyagents.com | 3010 | /health |
| 3 | Agent Mesh | https://mesh.blueflyagents.com | 3005 | /health |
| 4 | Agent Brain | https://brain.blueflyagents.com | 3002 | /health |
| 5 | Agent Router | https://router.blueflyagents.com | 3003 | /health |
| 6 | MCP Server | https://mcp.blueflyagents.com | 3006 | /health |
| 7 | Workflow Engine | https://workflow.blueflyagents.com | 3007 | /health |
| 8 | Orchestrator | https://orchestrator.blueflyagents.com | 3008 | /health |
| 9 | Compliance Engine | https://compliance.blueflyagents.com | 3009 | /health |
| 10 | A2A Collector | https://a2a-collector.blueflyagents.com | 3011 | /health |
| 11 | A2A Stream | https://a2a-stream.blueflyagents.com | 3012 | /health |
| 12 | Tracer | https://tracer.blueflyagents.com | 3013 | /health |
| 13 | Intel Feed | https://intel.blueflyagents.com | 3014 | /health |
| 14 | LiteLLM | https://litellm.blueflyagents.com | 4000 | /health |
| 15 | KAgent API | https://kagent.blueflyagents.com | — | /health |
| 16 | KAgent UI | https://kagent-ui.blueflyagents.com | — | / |
| 17 | OSSA UI | https://ossa-ui.blueflyagents.com | — | / |
| 18 | GKG API | https://gkg.blueflyagents.com | 3015 | /health |
| 19 | API Gateway | https://api.blueflyagents.com | 3001 | /health |

### Dashboards & UIs
| # | Service | URL |
|---|---------|-----|
| 20 | Agent Dashboard | https://adash.blueflyagents.com |
| 21 | Grafana | https://grafana.blueflyagents.com |
| 22 | Marketplace | https://marketplace.blueflyagents.com |
| 23 | Prometheus | internal :9090 |

### Flow Builders
| # | Service | URL | Port |
|---|---------|-----|------|
| 24 | n8n | https://n8n.blueflyagents.com | 5678 |
| 25 | LangFlow | https://langflow.blueflyagents.com | 7860 |
| 26 | Flowise | https://flowise.blueflyagents.com | 3000 |

### Chat & Content
| # | Service | URL |
|---|---------|-----|
| 27 | Open WebUI | https://chat.blueflyagents.com |
| 28 | LibreChat | https://librechat.blueflyagents.com |

### NAS Services (Synology)
| # | Service | URL | Port |
|---|---------|-----|------|
| 29 | DSM | https://nas.blueflyagents.com | 5001 |
| 30 | MinIO | https://storage.blueflyagents.com | 9000 |
| 31 | npm Registry | https://npm.blueflyagents.com | 4873 |
| 32 | Dockge | https://dockge.blueflyagents.com | 9010 |
| 33 | CouchDB | https://obsidian.blueflyagents.com | 5984 |
| 34 | Code Server | https://code.blueflyagents.com | 8080 |
| 35 | Zotero | https://zotero.blueflyagents.com | 5005 |
| 36 | Webhooks | https://api.blueflyagents.com | 3001 |
| 37 | Agent Mesh (NAS) | https://mesh.blueflyagents.com | 3005 |
| 38 | Portainer | internal | 9000 |

## Tailscale Mesh
| Device | Hostname | IP | Role |
|--------|----------|-----|------|
| Mac M4 | mac-m4.tailcf98b3.ts.net | 100.108.129.7 | Operator |
| NAS | blueflynas.tailcf98b3.ts.net | 100.104.119.76 | Storage |
| Oracle | oracle-platform.tailcf98b3.ts.net | 100.103.48.75 | Production |
| iPhone | iphone-t.tailcf98b3.ts.net | 100.67.125.25 | Mobile |

## Cloudflare Tunnel
- All 38 routes through one `cloudflared` daemon on Oracle
- Config source of truth: `agent-docker` repo `k8s/cloudflared-oracle/config-configmap.yaml`
- Subdomain list: `/Volumes/AgentPlatform/config/cloudflare/cf_tunnel_subdomains.tsv`
- Deploy: Update ConfigMap → `kubectl apply` → restart cloudflared

## MCP Endpoints
| Server | URL | Protocol |
|--------|-----|----------|
| bluefly-mcp | https://mcp.blueflyagents.com/api/mcp/sse | SSE |
| bluefly-gkg | https://gkg.blueflyagents.com/mcp/sse | SSE |
| wikis | local node process | stdio |

## Health Check (Quick)
```bash
for svc in agents studio mesh brain router mcp workflow orchestrator compliance a2a-collector a2a-stream tracer intel litellm kagent gkg api; do
  STATUS=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 5 "https://${svc}.blueflyagents.com/health" 2>/dev/null)
  [ "$STATUS" -ge 200 ] && [ "$STATUS" -lt 400 ] && echo "✅ $svc" || echo "❌ $svc ($STATUS)"
done
```
