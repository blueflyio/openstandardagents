# Protocols and Standards (2025-2026)

This document summarizes the main open protocols shaping the agent ecosystem as of 2026-03-17, including a deep dive on **DUADP** and **OSSA/Open Standard Agents** as requested. Sources are cited as keys from `reading-list.md`.

## 1) DUADP and OSSA: what they are, and how they fit together

### DUADP (Decentralized Universal AI Discovery Protocol)

DUADP is a federated discovery protocol for AI agents, tools, and skills, positioned as "DNS for AI agents." It emphasizes decentralized discovery, federation between nodes, cryptographic identity (DID), and governance-aligned trust metadata. [S01][S02][S03]

Core traits:
- Discovery primitives (`/.well-known/duadp.json`, WebFinger mapping, search/registry APIs). [S02]
- Federated mesh behavior (peer registration + gossip-style propagation). [S02]
- Trust and governance hooks (trust tiers, Cedar policy integration on standards page). [S03]
- SDK packaging for TypeScript and Python users; npm package is `@bluefly/duadp`. [S01][S04]

### OSSA (Open Standard for Software Agents)

OSSA is a **manifest contract layer**, not a wire protocol. It provides a vendor-neutral YAML/JSON schema to define agent identity, capabilities, governance, runtime requirements, and deployment intent. [S05][S06][S07]

Core traits:
- "Define once, export everywhere" contract model across multiple deployment targets. [S05][S07]
- Explicit positioning between protocols (for example MCP/A2A) and runtime platforms/frameworks. [S05]
- Spec-driven validation, versioning, and schema references (v0.5.0 on the public spec page). [S06]
- npm package is `@bluefly/openstandardagents` (CLI + schema tooling). [S08]

### DUADP + OSSA relationship

Operationally: **OSSA describes agents; DUADP discovers and federates them**. OSSA gives static contract portability, DUADP gives network-level lookup and trust/discovery dynamics. This pairing is explicitly reflected in OSSA and DUADP public materials. [S01][S03][S05][S06]

## 2) Protocol comparison

| Protocol/Spec | Primary scope | Wire/transport model | Identity/Security emphasis | Current adoption signal |
|---|---|---|---|---|
| MCP | Agent-to-tool/context interoperability | JSON-RPC-style protocol over supported transports; SDK/server ecosystem | Secure data/tool access, server boundaries | Widely integrated; moved into Linux Foundation Agentic AI Foundation context in 2025 [S09][S10][S53] |
| A2A | Agent-to-agent interoperability | JSON-RPC 2.0 over HTTP(S), SSE/async options | Enterprise-ready auth + discovery via Agent Cards | Large partner ecosystem; partners list contains 164 org entries as of 2026-03-17 [S11][S12][S13] |
| AG-UI | Agent-to-frontend/user interaction | Event-based stream model (SSE/WebSocket/webhooks/HTTP patterns) | UX-time event integrity and predictable UI-agent contracts | Rapid OSS adoption and integrations list in active repo/docs [S14][S15] |
| ANP | Agentic web communication stack | Layered approach with identity + meta-protocol + app protocol layers | W3C DID-driven identity and secure comms layer | Emerging; strong conceptual framing, smaller community footprint vs MCP/A2A [S16] |
| Agent Protocol (LangChain) | Framework-agnostic serving API for agents | HTTP API endpoints (`runs`, `threads`, `store`) | Operational control, lifecycle and state semantics | Implemented by LangGraph platform and related ecosystem tooling [S17] |
| ACP (BeeAI lineage) | Lightweight messaging among agents/apps/humans | REST/OpenAPI + SDKs | Interop, stateful sessions, rich message parts | Active community and now aligned with A2A under LF context (per ACP docs/README) [S18][S19] |
| ATP (Monday) | Code-first tool execution protocol | Secure sandboxed code execution layer; OpenAPI + MCP adapters | Runtime sandbox limits, provenance, audit controls | Early-stage OSS but clear production-security intent [S20] |
| DUADP | Agent/service discovery federation | Well-known + API + federation patterns | DID + trust tiers + governance controls | Emerging; dedicated protocol website and SDK packages [S01][S02][S03][S04] |
| OSSA (spec) | Agent contract portability | Manifest specification (YAML/JSON), not a transport protocol | Governance, trust boundaries, validation | Growing standards-oriented tooling around manifests and exports [S05][S06][S08] |

## 3) MCP, A2A, AG-UI, and where overlap starts

A practical decomposition that appears across ecosystem docs:
- **MCP**: "how an agent uses tools/data systems." [S09]
- **A2A**: "how agents communicate and delegate tasks to each other." [S11][S13]
- **AG-UI**: "how an agent runtime streams state/events to user interfaces." [S14][S15]

Teams that conflate these layers typically incur integration churn. The emerging practice is to compose all three where needed, then add manifest/contract and governance layers (for example OSSA + policy + identity controls). [S05][S06][S34]

## 4) Design trends in 2026

1. **Layered standardization is replacing monolithic frameworks**: teams mix protocols by function (tooling, inter-agent, UI) rather than selecting one "all-in-one" stack. [S11][S14][S17]
2. **Identity and authorization are moving to first-class concerns**: standards conversations have shifted from mere message formats toward authenticated principals, policy enforcement, and auditable authorization. [S03][S16][S34][S36]
3. **Open governance is becoming strategic**: MCP’s foundation movement and A2A’s broad partner model indicate that protocol legitimacy is now partly institutional, not just technical. [S10][S12][S53]
4. **Discovery remains under-standardized**: DUADP and ANP highlight unresolved market need around federated discovery, provenance, revocation, and trust scoring for autonomous actors. [S02][S03][S16]

## 5) Risks and unresolved protocol questions

- Cross-protocol auth portability remains immature (for example, mapping identities and trust decisions consistently across MCP/A2A/ACP stacks). [S19][S34]
- Discovery abuse/poisoning and protocol-level impersonation defenses are still uneven across projects. [S03][S16][S34]
- There is still no universal "web conduct" standard for agent behavior, a gap explicitly highlighted in MIT’s index context. [S24][S25]
