---
name: gkg-knowledge
description: "Global Knowledge Graph — 8 entity types, semantic search, MCP endpoint, relationship traversal."
triggers:
  - pattern: "gkg|knowledge.*graph|entity|relationship|semantic.*search"
    priority: critical
  - pattern: "find.*agent|find.*service|find.*package|search.*platform"
    priority: high
  - pattern: "how.*related|what.*connects|dependency"
    priority: medium
allowed-tools:
  - Read
  - Bash
  - WebFetch
---

# Global Knowledge Graph (GKG)

## Overview

GKG is the semantic search layer across the entire BlueFly Agent Platform. It indexes all agents, services, packages, policies, recipes, workflows, documents, and people into a queryable graph.

- **URL**: https://gkg.blueflyagents.com
- **Port**: 3015
- **MCP**: https://gkg.blueflyagents.com/mcp/sse
- **Package**: `@bluefly/agent-brain` (vector search) + `@bluefly/gkg-api` (graph API)

## Entity Types

| Type | Count | Source |
|------|-------|--------|
| Agent | 67 | platform-agents OSSA manifests |
| Service | 38 | Platform service registry |
| Package | 18 | common_npm @bluefly/* packages |
| Policy | ~30 | security-policies Cedar files |
| Recipe | ~15 | Fleet recipes |
| Workflow | ~20 | n8n/LangFlow/Flowise flows |
| Document | ~200 | Wiki pages, whitepapers |
| Person | ~10 | Team members, contributors |

## Relationships

```
Agent ──uses──→ Service
Agent ──implements──→ Package
Agent ──governed-by──→ Policy
Agent ──triggered-by──→ Recipe
Service ──depends-on──→ Service
Service ──monitored-by──→ Agent
Package ──depends-on──→ Package
Policy ──applies-to──→ Agent
Recipe ──orchestrates──→ Agent
Workflow ──invokes──→ Agent
Document ──describes──→ Agent | Service | Package
Person ──maintains──→ Package | Service
```

## API Endpoints

### Search
```bash
# Full-text semantic search
curl "https://gkg.blueflyagents.com/api/search?q=vulnerability+scanning"

# Typed search
curl "https://gkg.blueflyagents.com/api/search?q=security&type=agent"
curl "https://gkg.blueflyagents.com/api/search?q=docker&type=package"

# Multi-type
curl "https://gkg.blueflyagents.com/api/search?q=deployment&type=agent,service,workflow"
```

### Entity Operations
```bash
# Get entity by ID
curl "https://gkg.blueflyagents.com/api/entities/agent/vulnerability-scanner"

# Get relationships
curl "https://gkg.blueflyagents.com/api/entities/agent/vulnerability-scanner/relationships"

# Traverse graph (2 hops)
curl "https://gkg.blueflyagents.com/api/entities/agent/vulnerability-scanner/traverse?depth=2"

# Get all entities of type
curl "https://gkg.blueflyagents.com/api/entities?type=agent&limit=100"
```

### Graph Queries
```bash
# What agents use a service?
curl "https://gkg.blueflyagents.com/api/graph/query" \
  -d '{"from": "service/agents-api", "relation": "used-by", "to_type": "agent"}'

# What policies govern an agent?
curl "https://gkg.blueflyagents.com/api/graph/query" \
  -d '{"from": "agent/pipeline-remediation", "relation": "governed-by", "to_type": "policy"}'

# Dependency chain
curl "https://gkg.blueflyagents.com/api/graph/dependencies/package/agent-router"
```

## MCP Integration

The GKG MCP server exposes these tools:
| Tool | Description |
|------|-------------|
| `search` | Semantic search across all entity types |
| `get_entity` | Get entity details by type and ID |
| `get_relationships` | Get all relationships for an entity |
| `traverse` | Multi-hop graph traversal |
| `query` | Structured graph query |

### MCP Configuration
```json
{
  "bluefly-gkg": {
    "url": "https://gkg.blueflyagents.com/mcp/sse",
    "transport": "sse"
  }
}
```

## BuildKit Commands

```bash
# Search GKG
buildkit gkg search "vulnerability scanner"
buildkit gkg search --type agent "security"
buildkit gkg search --type service "monitoring"

# Entity info
buildkit gkg info agent/vulnerability-scanner
buildkit gkg info service/agents-api

# Relationships
buildkit gkg relations agent/vulnerability-scanner
buildkit gkg dependencies package/agent-router

# Re-index
buildkit gkg reindex              # Full reindex
buildkit gkg reindex --type agent # Reindex agents only
```

## Index Sources

GKG indexes are built from:
1. **OSSA manifests** → Agent entities
2. **Platform service registry** → Service entities
3. **package.json files** → Package entities
4. **Cedar policy files** → Policy entities
5. **Fleet recipe YAML** → Recipe entities
6. **Flow builder exports** → Workflow entities
7. **Wiki pages** → Document entities
8. **GitLab user data** → Person entities

Reindexing runs on:
- Git push to relevant repos (webhook)
- Scheduled daily at 02:00 UTC
- Manual via `buildkit gkg reindex`
