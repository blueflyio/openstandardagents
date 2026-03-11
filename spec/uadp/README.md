# Universal AI Discovery Protocol (UADP)

**Version:** 0.1.0
**Status:** Draft
**Spec URI:** `https://openstandardagents.org/spec/uadp/v0.1`

## 1. Overview

The Universal AI Discovery Protocol (UADP) is a decentralized, hybrid-federated protocol for the discovery, validation, and exchange of AI Agents, Skills, Tools, and Marketplaces. Built on top of the [Open Standard for Agent Systems (OSSA)](https://openstandardagents.org), UADP allows any organization, department, or individual to host a "UADP Node" that acts as an API-first microservice registry for any AI capability.

Drawing inspiration from ActivityPub and WebFinger, UADP ensures that AI resources built on one platform can seamlessly discover and securely utilize capabilities hosted on an entirely different platform. Whether it's an agent marketplace, a skills registry, an MCP tool directory, or an enterprise AI hub — if it speaks UADP, it's discoverable.

**Any system that implements the endpoints below is a UADP node.** There is no required language, framework, or database. A static JSON file on GitHub Pages, a Flask app, an Express server, a Drupal site, or a Kubernetes sidecar — all valid.

## 2. Conformance

The key words "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", and "MAY" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

A conforming UADP node:
- MUST serve `GET /.well-known/uadp.json` (Section 3)
- MUST serve at least one of: `GET /uadp/v1/skills` or `GET /uadp/v1/agents` (Section 4)
- SHOULD serve `GET /uadp/v1/federation` (Section 5)
- MUST return `Content-Type: application/json` for all UADP endpoints
- MUST return OSSA-formatted payloads (`apiVersion: ossa/v0.4` or later)

## 3. Discovery Layer

### 3.1 Well-Known Endpoint

Every UADP node MUST publish a JSON document at:

```
GET /.well-known/uadp.json
```

**Response** (`UadpManifest`):

```json
{
  "protocol_version": "0.1.0",
  "node_name": "Acme Corp Skills Hub",
  "node_description": "Enterprise AI skills registry for Acme Corp",
  "contact": "admin@acme.com",
  "endpoints": {
    "skills": "https://api.acme.com/uadp/v1/skills",
    "agents": "https://api.acme.com/uadp/v1/agents",
    "federation": "https://api.acme.com/uadp/v1/federation",
    "validate": "https://api.acme.com/uadp/v1/skills/validate"
  },
  "capabilities": ["skills", "agents", "federation", "validation"],
  "public_key": "-----BEGIN PUBLIC KEY-----\n...",
  "ossa_versions": ["v0.4", "v0.5"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `protocol_version` | string | MUST | Semver. Current: `"0.1.0"` |
| `node_name` | string | MUST | Human-readable node name |
| `node_description` | string | SHOULD | Short description of the node |
| `contact` | string | SHOULD | Admin contact (email or URL) |
| `endpoints` | object | MUST | Map of capability name to absolute URL |
| `endpoints.skills` | string | MUST* | Skills listing endpoint |
| `endpoints.agents` | string | MUST* | Agents listing endpoint |
| `endpoints.federation` | string | SHOULD | Federation/peering endpoint |
| `endpoints.validate` | string | MAY | Manifest validation endpoint |
| `capabilities` | string[] | SHOULD | List of supported capabilities |
| `public_key` | string | MAY | PEM-encoded public key for signature verification |
| `ossa_versions` | string[] | SHOULD | Supported OSSA spec versions |

*At least one of `endpoints.skills` or `endpoints.agents` MUST be present.

### 3.2 Discovery Flow

```
Client                          UADP Node
  |                                 |
  |  GET /.well-known/uadp.json     |
  |-------------------------------->|
  |  200 OK { endpoints: {...} }    |
  |<--------------------------------|
  |                                 |
  |  GET /uadp/v1/skills?search=... |
  |-------------------------------->|
  |  200 OK { data: [...], meta }   |
  |<--------------------------------|
```

## 4. Resource Endpoints

### 4.1 Skills Endpoint

```
GET /uadp/v1/skills
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | `""` | Full-text search across name + description |
| `category` | string | — | Filter by category |
| `capability` | string | — | Filter by capability tag |
| `trust_tier` | string | — | Filter: `official`, `verified-signature`, `signed`, `community`, `experimental` |
| `page` | integer | `1` | Page number (1-indexed) |
| `limit` | integer | `20` | Items per page (max 100) |

**Response** (`UadpSkillsResponse`):

```json
{
  "data": [
    {
      "apiVersion": "ossa/v0.4",
      "kind": "Skill",
      "metadata": {
        "name": "code-review",
        "version": "1.2.0",
        "description": "Reviews code for quality, security, and best practices",
        "uri": "uadp://acme.com/skills/code-review",
        "category": "development",
        "trust_tier": "verified-signature",
        "created": "2026-01-15T10:30:00Z",
        "updated": "2026-02-20T14:00:00Z"
      },
      "spec": {
        "capabilities": ["analysis", "security"],
        "inputs": { "code": { "type": "string", "required": true } },
        "outputs": { "review": { "type": "string" } }
      }
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "node_name": "Acme Corp Skills Hub"
  }
}
```

### 4.2 Agents Endpoint

```
GET /uadp/v1/agents
```

Same query parameters as Skills. Response shape:

```json
{
  "data": [
    {
      "apiVersion": "ossa/v0.4",
      "kind": "Agent",
      "metadata": {
        "name": "security-auditor",
        "version": "2.0.0",
        "description": "Audits infrastructure for vulnerabilities",
        "uri": "uadp://acme.com/agents/security-auditor"
      },
      "spec": {
        "role": "You are a security auditor...",
        "skills": ["code-review", "dependency-scan"],
        "llm": { "provider": "anthropic", "model": "claude-sonnet-4-5-20250514" }
      }
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "node_name": "Acme Corp Skills Hub"
  }
}
```

### 4.3 Validation Endpoint (Optional)

```
POST /uadp/v1/skills/validate
Content-Type: application/json

{
  "manifest": "apiVersion: ossa/v0.4\nkind: Skill\nmetadata:\n  name: my-skill\n..."
}
```

**Response:**

```json
{
  "valid": true,
  "errors": [],
  "warnings": ["metadata.version is recommended"]
}
```

### 4.4 Common Response Envelope

All list endpoints MUST return:

```json
{
  "data": [ ... ],
  "meta": {
    "total": <integer>,
    "page": <integer>,
    "limit": <integer>,
    "node_name": <string>
  }
}
```

Error responses MUST use standard HTTP status codes with:

```json
{
  "error": "<human-readable message>",
  "code": "<machine-readable error code>"
}
```

## 5. Federation

### 5.1 Federation Endpoint

```
GET /uadp/v1/federation
```

Returns this node's peer list and federation metadata:

```json
{
  "protocol_version": "0.1.0",
  "node_name": "Acme Corp Skills Hub",
  "peers": [
    {
      "url": "https://skills.sh",
      "name": "Skills.sh",
      "status": "healthy",
      "last_synced": "2026-03-05T12:00:00Z",
      "skill_count": 150
    }
  ]
}
```

### 5.2 Peer Registration

```
POST /uadp/v1/federation
Content-Type: application/json

{
  "url": "https://my-node.example.com",
  "name": "My UADP Node"
}
```

The receiving node SHOULD:
1. Fetch `{url}/.well-known/uadp.json` to validate the peer
2. If valid, add to its peer list
3. Return `201 Created` with the peer record

The receiving node MAY require authentication for peer registration.

### 5.3 Peer Discovery Flow

```
Node A                          Node B
  |                                 |
  |  POST /uadp/v1/federation       |
  |  { url: "https://node-a.com" }  |
  |-------------------------------->|
  |                                 |
  |  Node B validates:              |
  |  GET node-a.com/.well-known/    |
  |       uadp.json                 |
  |<--------------------------------|
  |  200 OK (valid UADP manifest)   |
  |-------------------------------->|
  |                                 |
  |  201 Created { peer: {...} }    |
  |<--------------------------------|
  |                                 |
  |  Node B can now query:          |
  |  GET node-a.com/uadp/v1/skills  |
```

### 5.4 Circuit Breaker

Implementations SHOULD implement a circuit breaker for peer health:
- Track consecutive fetch failures per peer
- After N failures (recommended: 3), mark peer as `degraded`
- Stop active fetching from degraded peers
- Retry after a backoff period (recommended: 24 hours)
- On successful fetch, reset failure count and mark `healthy`

Peer status values: `healthy`, `degraded`, `unreachable`

## 6. Trust Tiers

UADP defines five trust tiers for skills and agents:

| Tier | Badge | Description |
|------|-------|-------------|
| `official` | Shield (gold) | Published by the OSSA project or node operator |
| `verified-signature` | Shield (blue) | Cryptographically signed + verified identity |
| `signed` | Shield (green) | Cryptographically signed (identity not verified) |
| `community` | Shield (gray) | Published by authenticated user, no signature |
| `experimental` | Shield (orange) | Unreviewed, use at own risk |

Nodes SHOULD include `trust_tier` in skill/agent metadata. Consuming nodes SHOULD display trust badges to users.

## 7. Agent Identifiers (GAID)

Skills and agents MAY include a Global Agent Identifier (GAID) using the `uadp://` URI scheme:

```
uadp://<namespace>/<type>/<name>
```

Examples:
- `uadp://acme.com/skills/code-review`
- `uadp://marketplace.openstandardagents.org/agents/security-auditor`
- `uadp://skills.sh/skills/web-search`

GAIDs enable cross-registry resolution: a consumer seeing `uadp://skills.sh/skills/web-search` knows to query `skills.sh/.well-known/uadp.json` to find the skills endpoint, then search for `web-search`.

## 8. OSSA Integration

UADP is the transport and discovery layer; OSSA is the payload format.

- All items in `data[]` arrays MUST include `apiVersion` (e.g., `ossa/v0.4`) and `kind` (`Skill` or `Agent`)
- All items MUST include a `metadata` object with at least `name`
- Items SHOULD include a `spec` object with the OSSA specification body
- Consumers SHOULD validate incoming payloads against the OSSA schema before importing

Because OSSA enforces explicit `safety` guardrails declaratively, a downstream node can statically validate an upstream tool's safety requirements *before* importing it.

## 9. Security Considerations

- Nodes SHOULD serve all endpoints over HTTPS
- Write endpoints (POST to federation, skill publishing) SHOULD require authentication
- Read endpoints (GET skills, agents, federation) SHOULD be publicly accessible
- Nodes MUST NOT execute code from discovered skills without explicit user consent
- Signature verification using `public_key` from the well-known manifest is RECOMMENDED for high-trust deployments
- Rate limiting on all endpoints is RECOMMENDED

## 10. Implementing a Minimal UADP Node

The simplest possible UADP node is two static JSON files:

```
your-domain.com/
  .well-known/uadp.json     <- discovery manifest
  uadp/v1/skills             <- skills list (can be static JSON)
```

A more complete implementation adds:
- Database-backed skill/agent storage
- Federation with peer discovery and caching
- Authentication for write operations
- Manifest validation service

Reference implementations:
- **Drupal**: `ai_agents_marketplace` module (PHP)
- **Express**: `@bluefly/duadp` (TypeScript) — planned
- **Static**: GitHub Pages with JSON files — planned

## Appendix A: JSON Schemas

See `schemas/` directory:
- `uadp-manifest.schema.json` — `/.well-known/uadp.json` validation
- `uadp-skills-response.schema.json` — `/uadp/v1/skills` response
- `uadp-agents-response.schema.json` — `/uadp/v1/agents` response
- `uadp-federation-response.schema.json` — `/uadp/v1/federation` response

## Appendix B: OpenAPI Specification

See `openapi.yaml` for the complete OpenAPI 3.1 definition of all UADP endpoints.

## Appendix C: Changelog

### 0.1.0 (2026-03-06)
- Initial draft specification
- Discovery layer (`/.well-known/uadp.json`)
- Skills and Agents endpoints with OSSA payloads
- Federation with peer registration and circuit breaker
- Trust tiers and GAID identifiers
- Validation endpoint
