# Agentic AI Landscape Research (Late 2025 to Early 2026)

Last updated: April 17, 2026

## Scope and framing

This report surveys the 2025-2026 shift from single-model copilots toward autonomous and multi-agent systems, with emphasis on interoperability protocols, deployment frameworks, and security/governance controls. The key pattern across sources is clear: **adoption is accelerating faster than standardization and control**. Official protocol efforts (MCP, A2A, AG-UI, ANP variants) are converging, while enterprise deployments still rely on uneven identity and policy enforcement [SRC-009][SRC-010][SRC-011][SRC-018][SRC-020][SRC-032].

## What DUADP and OSSA are (and why they matter)

### DUADP (`@bluefly/duadp`)

DUADP positions itself as a decentralized discovery protocol for AI agents/skills/tools, analogous to DNS + WebFinger for the “agentic web.” Its public materials describe:

- federated discovery via `/.well-known` and DNS records,
- gossip-based federation between peer registries,
- DID-based identity and trust layering,
- an SDK and reference-node implementation,
- MCP-compatible tool surface [SRC-001][SRC-002][SRC-003].

As of npm metadata pulled on April 17, 2026, `@bluefly/duadp` is a TypeScript package (Apache-2.0), version `0.1.4`, with modest but active early adoption signals (weekly downloads and frequent recent updates) [SRC-003].

### OSSA / Open Standard Agents (`@bluefly/openstandardagents`)

OSSA presents itself as a **contract/manifest layer** for agents: define once in YAML, export to many runtimes and deployment targets. It explicitly describes itself as complementing MCP (agent↔tool) and A2A (agent↔agent) rather than replacing them [SRC-004][SRC-005][SRC-008].

As of npm metadata pulled on April 17, 2026, `@bluefly/openstandardagents` is at `0.5.1` (Apache-2.0), with larger package surface and higher weekly downloads than `@bluefly/duadp` [SRC-008]. OSSA claims built-in support for governance metadata, trust tiers, and interoperability tooling, and it links to NIST-oriented positioning papers [SRC-006].

## Macro findings across sources

1. **Interoperability is becoming layered, not winner-take-all.**  
   MCP (tooling), A2A (agent collaboration), AG-UI (agent-user interaction), and specialized protocols (ANP/ACP/ATP variants) are being combined in practice [SRC-009][SRC-010][SRC-018][SRC-020][SRC-028][SRC-030].

2. **Enterprise adoption is real, and no longer pilot-only.**  
   MIT and Gravitee sources indicate mainstream deployment pressure and expanding autonomy, especially in enterprise workflows [SRC-012][SRC-032].

3. **Security posture is lagging deployment velocity.**  
   Gravitee’s 2026 data and MIT Sloan commentary both identify a governance gap: incidents, over-permissioning, limited auditability, and weak identity discipline [SRC-013][SRC-032][SRC-033].

4. **Identity + authorization are moving to center stage.**  
   NIST/NCCoE’s 2026 concept paper explicitly focuses on identification, authentication, authorization, delegation, and auditability for software/AI agents [SRC-017]. MIT Media Lab’s delegation framework extends OAuth/OIDC for agent credentials and accountable delegation [SRC-036].

5. **Production engineering guidance now emphasizes guardrails over hype.**  
   Practitioner writeups stress progressive rollout, cost controls, deterministic constraints, and human-in-the-loop checks for reliable outcomes [SRC-030][SRC-031].

## Current-state opportunities

- Standardize interfaces early (MCP/A2A/AG-UI where applicable).
- Treat agent identity as first-class (no shared keys by default).
- Build policy and observability into runtime, not post-incident.
- Use contract/spec artifacts to reduce N×M integration complexity.
- Bias initial deployments to narrow, high-value agent scopes before broad autonomy.

Detailed evidence and protocol/framework/security breakdowns are in:

- `academia.md`
- `protocols.md`
- `frameworks.md`
- `security.md`
- `blogs.md`
- `reading-list.md`
