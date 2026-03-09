---
name: ossa-research
description: "OSSA specification deep-dive — agent cards, interop patterns, manifest authoring, marketplace publishing."
triggers:
  - pattern: "ossa|open.*standard|agent.*spec|manifest|agent.*card"
    priority: critical
  - pattern: "interop|a2a|mcp.*agent|capability|schema"
    priority: high
  - pattern: "publish.*agent|register.*agent|agent.*format"
    priority: medium
allowed-tools:
  - Read
  - Bash
  - WebFetch
---

# OSSA Research & Specification

## OSSA Version

- **Spec**: v0.4 (YAML manifest format)
- **NPM Package**: `@openstandard/agent-spec` v0.4.4
- **Full Name**: Open Standard for Software Agents
- **Tagline**: "The OpenAPI for Agents"

## Manifest Structure (Complete)

```yaml
ossa: "0.4"
agent:
  id: "{kebab-case-id}"
  name: "{Human Readable Name}"
  version: "1.0.0"
  description: "{What the agent does}"
  domain: "{domain}"
  status: "active | deprecated | experimental"

capabilities:
  - id: "{capability-id}"
    description: "{What this capability does}"
    input_schema:
      type: object
      properties: { ... }
      required: [...]
    output_schema:
      type: object
      properties: { ... }

security:
  access_tier: "tier_1_read | tier_2_write | tier_3_full | tier_4_policy"
  role: "analyzer | reviewer | executor | approver"
  conflicts_with: ["{conflicting-roles}"]
  data_classification: "public | internal | confidential | restricted"

runtime:
  transport: "mcp-sse | http | grpc"
  endpoint: "https://{service}.blueflyagents.com/{path}"
  health_check: "/health"
  timeout_ms: 30000
  retry_policy:
    max_retries: 3
    backoff: "exponential"

dependencies:
  requires: ["{other-agent-id}"]
  optional: ["{nice-to-have-agent-id}"]

metadata:
  author: "blueflyio"
  license: "MIT"
  tags: ["security", "scanning", "ci-cd"]
  documentation: "https://wiki.blueflyagents.com/{agent-id}"
```

## Agent Card Format

Agent cards are the public-facing summary exported from manifests:

```bash
# Export agent card
ossa agent export --format card

# Card fields
# - id, name, version, description
# - capabilities (list of cap IDs + descriptions)
# - security tier + role
# - endpoint + transport
# - health status (live check)
# - tags + domain
```

### Card JSON Structure
```json
{
  "card_version": "1.0",
  "agent_id": "vulnerability-scanner",
  "name": "Vulnerability Scanner",
  "description": "Scans dependencies and containers for known CVEs",
  "domain": "security",
  "capabilities": ["scan-dependencies", "scan-containers", "generate-report"],
  "security": { "tier": "tier_1_read", "role": "analyzer" },
  "endpoint": "https://vuln-scanner.blueflyagents.com",
  "transport": "mcp-sse",
  "health": "https://vuln-scanner.blueflyagents.com/health",
  "status": "active",
  "tags": ["security", "cve", "sbom"]
}
```

## Access Tiers (Detailed)

| Tier | Role | Can Do | Cannot Do | Conflicts |
|------|------|--------|-----------|-----------|
| tier_1_read | Analyzer | Read repos, scan artifacts, generate reports, query APIs | Write to repos, modify issues, approve anything | Executor, Approver |
| tier_2_write | Reviewer | Comment on MRs, update issues, label/assign, request changes | Push code, merge MRs, deploy, approve | Executor, Approver |
| tier_3_full | Executor | Push code, merge MRs, run deploys, execute pipelines | Approve own work, review own MRs, set policy | Reviewer, Approver |
| tier_4_policy | Approver | Approve MRs, override gates, release, set policy | Analyze (bias risk), execute (conflict) | Analyzer, Executor |

### Conflict Rules
- No agent can review/approve its own work
- Executor→Reviewer handoff in same chain is FORBIDDEN
- Approver cannot also be Executor for same change
- Analyzer findings cannot be dismissed by Analyzer (needs Reviewer+)

## Interop Patterns

### MCP-SSE Transport
Most agents use MCP-SSE (Model Context Protocol over Server-Sent Events):
```
Client → POST /mcp/invoke → Agent processes → SSE stream response
Client → GET /mcp/capabilities → Returns capability list
Client → GET /health → Returns health status
```

### HTTP REST Transport
For simpler request/response agents:
```
Client → POST /api/v1/{capability} → JSON response
Client → GET /api/v1/capabilities → OpenAPI spec
```

### Agent-to-Agent (A2A) Communication
```
Agent A → Agent Mesh (port 3005) → Route to Agent B
Agent B → Process → Response via Mesh → Agent A
```

The mesh handles:
- Service discovery (which agent has which capability)
- Load balancing across agent instances
- Circuit breaking for failing agents
- Telemetry collection for all A2A calls

## Marketplace Publishing Flow

```
1. Author manifest     → platform-agents/packages/@ossa/{id}/manifest.yaml
2. Validate            → buildkit agents marketplace validate {id}
3. Export card          → ossa agent export --format card
4. Register in mesh    → buildkit agents marketplace sync {id}
5. Health check        → curl https://{service}.blueflyagents.com/health
6. Publish             → buildkit agents marketplace publish {id}
7. Verify in catalog   → https://marketplace.blueflyagents.com
```

### Validation Checks
- Required fields present (id, name, version, description, capabilities, security, runtime)
- Access tier is valid enum
- Role conflicts are declared
- Endpoint resolves
- Health check returns 200
- Capability schemas validate (JSON Schema draft-07)
- No duplicate capability IDs across fleet

## OSSA CLI Reference

```bash
# Interactive agent creation
ossa agent wizard

# Validate manifest
ossa agent validate .
ossa agent validate --strict .

# Export formats
ossa agent export --format card      # Agent card JSON
ossa agent export --format openapi   # OpenAPI spec
ossa agent export --format markdown  # Human-readable doc

# Schema operations
ossa schema validate input.json --against manifest.yaml
ossa schema generate --from openapi.yaml

# Registry operations
ossa registry list
ossa registry search "security"
ossa registry info vulnerability-scanner
```

## Design Principles

1. **Vendor-neutral**: No lock-in to any LLM provider or cloud
2. **Composable**: Agents combine via capabilities, not inheritance
3. **Observable**: Every A2A call emits telemetry
4. **Secure by default**: Deny-all, explicit tier grants
5. **Self-describing**: Manifest IS the documentation
6. **Testable**: Every capability has input/output schemas for contract testing
