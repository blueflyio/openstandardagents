---
name: research
description: "NAS research library, 8 whitepapers, 63 wiki repos, Zotero, Obsidian. Knowledge search and retrieval."
triggers:
  - pattern: "research|whitepaper|paper|wiki|knowledge"
    priority: critical
  - pattern: "zotero|obsidian|library|reference|citation"
    priority: high
  - pattern: "find.*paper|search.*docs|where.*documentation"
    priority: medium
allowed-tools:
  - Read
  - Bash
  - WebFetch
---

# Research & Knowledge

## NAS Research Library

**Path**: `/Volumes/AgentPlatform/applications/Research/`

### Whitepapers
| # | Title | File |
|---|-------|------|
| 1 | OSSA Specification v0.4 | ossa-spec-v0.4.pdf |
| 2 | Agent Mesh Architecture | agent-mesh-architecture.pdf |
| 3 | Cedar Policy Language for AI Agents | cedar-policy-agents.pdf |
| 4 | Fleet Change Control Design | fleet-change-control.pdf |
| 5 | GKG: Global Knowledge Graph Design | gkg-design.pdf |
| 6 | A2A Telemetry Protocol | a2a-telemetry-protocol.pdf |
| 7 | Separation of Duties in AI Systems | separation-of-duties-ai.pdf |
| 8 | BlueFly Platform Security Model | platform-security-model.pdf |

## GitLab Wikis (63 Repos)

All documentation lives in GitLab Wikis, NEVER in `.md` files in repos.

### Access
```bash
# Local wiki clones
ls /Volumes/AgentPlatform/applications/Wikis/

# Via MCP
# wikis MCP server provides search across all 63 wiki repos

# Via BuildKit
buildkit gitlab wiki search "deployment strategy"
buildkit gitlab wiki list
buildkit gitlab wiki publish
```

### Key Wiki Repos
| Wiki | Content |
|------|---------|
| agent-buildkit.wiki | CLI reference, command docs |
| platform-agents.wiki | OSSA manifests, agent registry |
| technical-docs.wiki | Architecture, ADRs, runbooks |
| llm-platform.wiki | Drupal platform docs |
| gitlab_components.wiki | CI/CD component library |
| security-policies.wiki | Cedar policies, access model |

## Zotero (Research Management)

- **URL**: https://zotero.blueflyagents.com
- **Port**: 5005
- **Purpose**: Academic paper management, citation tracking
- **Sync**: NAS-hosted Zotero server

### Collections
| Collection | Topic |
|------------|-------|
| AI Agents | Agent architectures, OSSA, A2A protocols |
| Security | Cedar, RBAC, zero-trust, supply chain |
| Drupal | CMS architecture, headless, accessibility |
| DevOps | GitOps, K8s, observability, SRE |
| ML/AI | LLMs, RAG, embeddings, fine-tuning |

## Obsidian (Knowledge Base)

- **URL**: https://obsidian.blueflyagents.com (CouchDB sync)
- **Port**: 5984
- **Purpose**: Personal knowledge graph, meeting notes, decision logs
- **Sync**: CouchDB on NAS → Obsidian LiveSync plugin

## GKG (Global Knowledge Graph)

- **URL**: https://gkg.blueflyagents.com
- **Port**: 3015
- **MCP**: https://gkg.blueflyagents.com/mcp/sse

### Entity Types
| Type | Examples |
|------|----------|
| Agent | OSSA agent definitions |
| Service | Platform services (38) |
| Package | npm packages (@bluefly/*) |
| Policy | Cedar policies |
| Recipe | Fleet recipes |
| Workflow | n8n/LangFlow/Flowise flows |
| Document | Wiki pages, whitepapers |
| Person | Team members, contributors |

### Search
```bash
# Via MCP (preferred)
# GKG MCP server at https://gkg.blueflyagents.com/mcp/sse

# Via API
curl "https://gkg.blueflyagents.com/api/search?q=vulnerability+scanner&type=agent"

# Via BuildKit
buildkit gkg search "deployment pipeline"
buildkit gkg search --type agent "security"
```

## Search Strategy

| Need | Tool | Speed |
|------|------|-------|
| Agent info | GKG MCP → type:agent | Fast |
| Service info | platform-status skill | Instant |
| Wiki docs | wikis MCP → search | Fast |
| Research papers | Zotero UI or NAS path | Medium |
| Meeting notes | Obsidian search | Medium |
| Code | GitLab search (glab) | Fast |
| Everything | GKG MCP (searches all) | Medium |
