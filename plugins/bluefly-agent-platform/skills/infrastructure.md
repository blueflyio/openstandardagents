---
name: infrastructure
description: "Oracle Cloud + Synology NAS + Tailscale mesh + Cloudflare tunnel. K8s, Docker, port allocation, networking."
triggers:
  - pattern: "oracle|nas|synology|k8s|kubernetes|docker"
    priority: critical
  - pattern: "tailscale|cloudflare|tunnel|network|mesh"
    priority: high
  - pattern: "port|container|pod|deploy.*infra|storage"
    priority: medium
allowed-tools:
  - Read
  - Bash
  - WebFetch
---

# Infrastructure

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│             Cloudflare Tunnel                │
│    (38 routes → *.blueflyagents.com)         │
└──────────┬──────────────┬───────────────────┘
           │              │
    ┌──────▼──────┐  ┌───▼──────────┐
    │ Oracle Cloud │  │ Synology NAS │
    │  (FREE tier) │  │ (192.168.68.54)│
    │  K8s + Docker│  │   Docker     │
    └──────┬──────┘  └───┬──────────┘
           │              │
    ┌──────▼──────────────▼──────┐
    │       Tailscale Mesh       │
    │    tailcf98b3.ts.net       │
    └────────────────────────────┘
```

## Oracle Cloud (Production)

- **Tier**: Always Free (ARM A1, 4 OCPU, 24 GB RAM)
- **Tailscale**: oracle-platform.tailcf98b3.ts.net / 100.103.48.75
- **Runs**: 19 core platform services + 4 dashboards + 3 flow builders + 2 chat services
- **K8s**: Lightweight K3s cluster
- **Container runtime**: containerd

### Key K8s Resources
```bash
# Namespaces
kubectl get ns
# Expected: bluefly-agents, bluefly-ui, bluefly-flow, monitoring, cloudflared

# Deployments
kubectl get deploy -n bluefly-agents
kubectl get deploy -n bluefly-ui

# Services
kubectl get svc -n bluefly-agents

# Cloudflared
kubectl get pods -n cloudflared
kubectl logs -n cloudflared -l app=cloudflared --tail=50
```

## Synology NAS (Storage + Auxiliary)

- **IP**: 192.168.68.54
- **Tailscale**: blueflynas.tailcf98b3.ts.net / 100.104.119.76
- **Runs**: MinIO, npm registry, Dockge, CouchDB, Code Server, Zotero, webhooks, mesh replica, Portainer

### NAS Services
| Service | Port | Purpose |
|---------|------|---------|
| DSM | 5001 | Synology admin |
| MinIO | 9000 | S3-compatible object storage |
| npm Registry | 4873 | Verdaccio private npm |
| Dockge | 9010 | Docker compose manager |
| CouchDB | 5984 | Obsidian sync backend |
| Code Server | 8080 | VS Code in browser |
| Zotero | 5005 | Research library sync |
| Webhooks | 3001 | GitLab webhook receiver |
| Agent Mesh | 3005 | Mesh replica |
| Portainer | 9000 | Container management |

### NAS Docker Management
```bash
# Via Dockge UI
https://dockge.blueflyagents.com

# Via SSH
ssh admin@192.168.68.54
docker ps
docker-compose -f /volume1/docker/{service}/docker-compose.yml logs
```

## Tailscale Mesh

| Device | Hostname | IP | Role |
|--------|----------|-----|------|
| Mac M4 | mac-m4.tailcf98b3.ts.net | 100.108.129.7 | Operator workstation |
| NAS | blueflynas.tailcf98b3.ts.net | 100.104.119.76 | Storage + aux services |
| Oracle | oracle-platform.tailcf98b3.ts.net | 100.103.48.75 | Production platform |
| iPhone | iphone-t.tailcf98b3.ts.net | 100.67.125.25 | Mobile access |

### Tailscale Commands
```bash
# Status
tailscale status

# Ping a node
tailscale ping oracle-platform

# SSH to Oracle
ssh oracle-platform.tailcf98b3.ts.net

# SSH to NAS
ssh blueflynas.tailcf98b3.ts.net
```

## Cloudflare Tunnel

- **Tunnel ID**: f6da7bdf-...
- **Daemon**: cloudflared on Oracle (K8s pod in `cloudflared` namespace)
- **Config source of truth**: `agent-docker` repo → `k8s/cloudflared-oracle/config-configmap.yaml`
- **Subdomain list**: `/Volumes/AgentPlatform/config/cloudflare/cf_tunnel_subdomains.tsv`

### Adding a New Route
```bash
# 1. Edit the ConfigMap
kubectl edit configmap cloudflared-config -n cloudflared
# Add:
#   - hostname: newservice.blueflyagents.com
#     service: http://newservice-svc.bluefly-agents.svc.cluster.local:PORT

# 2. Add DNS record in Cloudflare (CNAME → tunnel UUID.cfargotunnel.com)

# 3. Restart cloudflared
kubectl rollout restart deployment/cloudflared -n cloudflared

# 4. Verify
curl -sk https://newservice.blueflyagents.com/health
```

## Port Allocation

| Range | Purpose |
|-------|---------|
| 3000-3015 | Agent platform services |
| 4000 | LiteLLM gateway |
| 4873 | npm registry (Verdaccio) |
| 5000-5005 | ML models + Zotero |
| 5432 | PostgreSQL |
| 5678 | n8n |
| 5984 | CouchDB |
| 6333 | Qdrant vector DB |
| 6379 | Redis |
| 7860 | LangFlow |
| 8080 | Code Server |
| 9000 | MinIO / Portainer |
| 9010 | Dockge |
| 9090 | Prometheus |
| 27017 | MongoDB |

## Vast.ai (GPU Compute)

- **Instance**: 29484611 (RTX 4090)
- **Scaling**: Managed by `@bluefly/agent-router`
- **Use**: ML inference, embedding generation, fine-tuning
- **Auto-scaling**: Starts on demand, stops after idle timeout

## Storage Architecture

```
MinIO (S3)
├── bluefly-artifacts/     → Build artifacts, agent cards
├── bluefly-models/        → ML model weights
├── bluefly-embeddings/    → Vector data backups
├── bluefly-backups/       → Database snapshots
└── bluefly-research/      → Research papers, whitepapers
```

## Health Checks

```bash
# Full infrastructure sweep
for host in oracle-platform blueflynas mac-m4; do
  tailscale ping $host 2>/dev/null && echo "✅ $host" || echo "❌ $host"
done

# K8s health (from Oracle)
kubectl get pods -A | grep -v Running | grep -v Completed

# NAS Docker health
ssh blueflynas "docker ps --format '{{.Names}}: {{.Status}}'"
```
