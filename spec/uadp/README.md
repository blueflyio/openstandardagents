# Universal Agent Discovery Protocol (UADP)

**Version:** 0.1.0-draft
**Status:** Proposition

## 1. Overview
The Universal Agent Discovery Protocol (UADP) is a decentralized, hybrid-federated protocol for the discovery, validation, and exchange of autonomous AI Agents, Skills, and Context tools. Built on top of the Open Standard for Agent Systems (OSSA), UADP allows any organization, department, or individual to host a decentralized "UADP Node" that acts as an API-first microservice registry.

Drawing inspiration from ActivityPub and traditional WebFinger mechanisms, UADP ensures that agents built on one platform can seamlessly discover and securely utilize skills hosted on an entirely different platform.

## 2. Core Architecture: The Hybrid Model
The UADP operates on a **Hybrid Discovery Model** combining static well-known manifests with dynamic federated server-to-server APIs.

### 2.1 The Discovery Layer (`/.well-known/uadp.json`)
Every domain hosting a UADP registry MUST publish a static configuration file at `/.well-known/uadp.json`. This provides immediate, DNS-based discovery without requiring a central directory.

**Example `/.well-known/uadp.json` Payload:**
```json
{
  "protocol_version": "0.1.0",
  "node_name": "Acme Corp IT Skills Hub",
  "endpoints": {
    "skills": "https://api.acme.com/uadp/v1/skills",
    "agents": "https://api.acme.com/uadp/v1/agents",
    "federation": "https://api.acme.com/uadp/v1/federation"
  },
  "public_key": "-----BEGIN PUBLIC KEY-----\n..."
}
```

### 2.2 The Federated API Layer
Once a node is discovered, clients or other nodes query its RESTful JSON endpoints.
- `GET /uadp/v1/skills`: Returns a paginated list of OSSA-compliant skill manifests.
- `GET /uadp/v1/agents`: Returns a list of OSSA-compliant agent manifests.
- Both endpoints support search, filtering by category, and capability matching.

### 2.3 Trust, Security & Peering
UADP nodes do not implicitly trust one another. Federation and cross-node execution use standard OpenID Connect (OIDC) or OAuth 2.0 flows.
- **Departmental Isolation:** An enterprise can run separate UADP containers for HR, IT, and Security.
- **Cross-Node Security:** The Security department’s UADP node can authenticate with the IT node, gaining authorized access to audit deployed agents or utilize IT-specific tools, without exposing those tools to the public internet.

## 3. OSSA Integration
UADP is the transport and discovery layer; OSSA is the payload.
When a UADP node returns an agent or a skill, it MUST be formatted as a valid OSSA YAML/JSON document (`apiVersion: ossa/v0.4`).

Because OSSA enforces explicit `safety` guardrails declaratively, a downstream UADP node can statically validate an upstream tool's safety requirements *before* importing it.

## 4. Why UADP?
- **No Central Chokepoint:** Avoids the single-point-of-failure inherent in locked-down, proprietary AI marketplaces.
- **Microservice Ready:** A UADP node is just a containerized REST API. It can easily exist as a sidecar in a Kubernetes pod or as an enterprise-wide application like a Drupal instance.
- **Universal Composability:** Multi-agent systems can now span across organizational boundaries securely.
