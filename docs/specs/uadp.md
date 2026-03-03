# Universal Agent Discovery Protocol (UADP) v0.4

UADP is OSSA's open, decentralized protocol for agent registration, discovery, and trust
verification. It is the **distribution layer** of the OSSA specification — the same way DNS
distributes names, UADP distributes agent identities across platforms.

## Specification Files

| File | Format | Purpose |
|------|--------|---------|
| [`openapi/uadp-openapi.yaml`](../../openapi/uadp-openapi.yaml) | OpenAPI 3.1 | REST endpoints: register, discover, verify, revoke |
| [`openapi/uadp-asyncapi.yaml`](../../openapi/uadp-asyncapi.yaml) | AsyncAPI 3.0 | Event streams: heartbeat, revocation, trust invalidation |

## Architecture

```
  Agent                    UADP Registry Node               Consumer
   │                              │                              │
   │── POST /registry/register ──▶│                              │
   │                              │── uadp.agents.registered ──▶│
   │── PUT /registry/heartbeat ──▶│                              │
   │                              │── uadp.agents.heartbeat ───▶│
   │                              │                              │
   Admin ─ PUT /registry/revoke ─▶│                              │
   │                              │── uadp.agents.revoked ─────▶│
   │                              │── uadp.registry.trust-inv ─▶│
```

## Trust Tiers

UADP resolves a **TrustTier** for every discovered agent based on the `metadata.x-signature`
block in the OSSA manifest (introduced in v0.4):

| Tier | x-signature state |
|------|-------------------|
| `official` | Publisher is OSSA Steering Committee |
| `verified-signature` | `type` + `value` + `publicKey` all present |
| `signed` | `x-signature` exists but `publicKey` missing |
| `community` | No `x-signature` |
| `experimental` | Pre-release manifests |

### Example x-signature block (ossa.yaml)

```yaml
metadata:
  name: compliance-scanner
  version: 1.2.0
  uuid: 5d3f9a2b-7e8c-4f1d-a0b3-123456789abc
  x-signature:
    type: Ed25519
    value: "base64EncodedSignature=="
    publicKey: "base64EncodedPublicKey=="
    issuer: "did:web:agents.bluefly.io:compliance-scanner"
    timestamp: "2026-03-02T00:00:00Z"
```

## REST API Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/registry/register` | Self-register with full OSSA manifest |
| DELETE | `/registry/unregister/{agentId}` | Graceful unregistration |
| PUT | `/registry/heartbeat/{agentId}` | Renew registration TTL |
| PUT | `/registry/revoke/{agentId}` | Revoke (admin, NIST CAISI) |
| GET | `/discovery/agents` | Filter by domain/capability/trust/status |
| GET | `/discovery/agents/{agentId}` | Get single agent |
| POST | `/trust/verify` | Verify an x-signature block |
| GET | `/health` | Registry health and statistics |

## Event Streams Quick Reference

| Channel | Direction | Description |
|---------|-----------|-------------|
| `uadp.agents.registered` | → consumer | New agent joined |
| `uadp.agents.updated` | → consumer | Agent manifest updated |
| `uadp.agents.heartbeat.{agentId}` | agent → registry | Alive signal |
| `uadp.agents.revoked` | → consumer | **NIST CAISI** — immediate revocation |
| `uadp.agents.deprecated` | → consumer | Agent deprecated, migration path available |
| `uadp.registry.snapshot` | → consumer | Full snapshot for cold-start bootstrap |
| `uadp.registry.trust-invalidated` | → consumer | Key compromised, re-verify affected agents |

## NIST CAISI Alignment

UADP directly satisfies the February 2026 NIST AI Agent Standards Initiative requirements:

| CAISI Requirement | UADP Implementation |
|-------------------|---------------------|
| **Agent Identity** | `x-signature` with DID (`did:web:`, `did:key:`) in `metadata` |
| **Interoperability** | OpenAPI 3.1 + AsyncAPI 3.0, transport-agnostic (NATS/Kafka/MQTT) |
| **Authorization** | Trust tiers enforced at discovery time; consumers can require `verified-signature` |
| **Revocation** | Real-time `uadp.agents.revoked` event; no polling required |
| **Auditability** | All events include `agentId`, `timestamp`, and optional `revokedBy` DID |
