# Exhibit B — UADP Protocol and CAISI Alignment
## NIST CAISI RFI Response — BlueFly.io / OSSA

Source: OSSA docs/specs/uadp.md — Universal Agent Discovery Protocol (UADP)

---

## UADP Endpoints and Events

| Endpoint / Event | Method | Purpose | CAISI Alignment |
|------------------|--------|---------|-----------------|
| **REST** | | | |
| `GET /.well-known/agent-card.json` | GET | Agent card (identity, capabilities, tools) | Identity (1a), Tool disclosure (3a) |
| `GET /.well-known/agent.json` | GET | A2A agent descriptor | Identity, A2A interoperability |
| `GET /registry` | GET | List agents (optional filter) | Discovery, revocation visibility |
| `GET /registry/{agentId}` | GET | Single agent by GAID | Identity resolution |
| `PUT /registry/revoke/{agentId}` | PUT | Revoke agent | Revocation (1d) |
| **AsyncAPI (Events)** | | | |
| `uadp.agents.registered` | Publish | New agent registered | Real-time discovery |
| `uadp.agents.updated` | Publish | Agent manifest/capabilities changed | Lifecycle, audit |
| `uadp.agents.revoked` | Publish | Agent revoked | Revocation propagation (1d) |

---

## Transport and Security

| Transport | Use Case | Auth / Encryption |
|-----------|----------|--------------------|
| REST over HTTPS | Discovery, registry, revocation | TLS 1.2+; optional mTLS for registry write |
| AsyncAPI over WebSocket/TLS | Event stream for revocation/updates | TLS; optional API key or OAuth |
| A2A (Agent-to-Agent) | Delegation, handoff | DID in envelope; optional signed delegation credential |

---

## CAISI Pillar Mapping (from uadp.md)

| CAISI Pillar | UADP / OSSA Support |
|--------------|----------------------|
| Identity | GAID (DID) in agent card and registry; DID Document in identity extension |
| Authorization | Cedar policies reference principal DIDs; tier/capability in manifest |
| Tools | Declarative tools in agent card; MCP servers; rate limits in manifest |
| Token efficiency | token-efficiency extension; budgets; attribution in logs |
| Observability | Registry events; Dragonfly/AgentDash telemetry; Cedar decision logs |
| Interoperability | REST + AsyncAPI; A2A envelope; MCP; multi-framework adapters |

---

*Exhibit B — End*
