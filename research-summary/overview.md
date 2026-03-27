# Agentic AI, Protocols, Standards, and Security (2026): Executive Overview

Date compiled: March 27, 2026  
Relative-date normalization reference: March 10, 2026

## Scope

This overview synthesizes late-2025 to early-2026 developments in:

- University and research-center analysis of agentic AI
- Open protocols and standards (MCP, A2A, AG-UI, ANP, ACP, DUADP/OSSA)
- Open-source frameworks and ecosystem maturity
- Security and governance trends
- Industry engineering guidance for production deployments

Detailed notes and citations are in:

- `academia.md`
- `protocols.md`
- `frameworks.md`
- `security.md`
- `blogs.md`
- `reading-list.md`

## What DUADP and OSSA are, in plain terms

DUADP (Decentralized Universal AI Discovery Protocol) positions itself as a discovery layer ("DNS for AI agents"): it standardizes how agents/skills/tools are published and found across federated nodes with `.well-known` manifests, registry/search APIs, and DID-based identity/trust mechanisms. In the public materials, DUADP emphasizes federated discovery, gossip-style propagation, and trust-tiered publishing/search controls. [S01][S03][S04]

OSSA (Open Standard Agents / Open Standard for Software Agents, per source naming) positions itself as a contract layer: a portable manifest specification and toolchain intended to define agents once and export to multiple runtime targets. In OSSA's own framing, MCP handles tool connectivity, A2A handles agent communication, and OSSA handles "what the agent is" plus governance metadata. [S02][S04][S05]

On npm, `@bluefly/duadp` is published as a TypeScript SDK for DUADP node/client operations and conformance tooling; `@bluefly/openstandardagents` is published as the OSSA CLI/SDK with manifest validation and multi-target exports. Both list Apache-2.0 licensing and active 2026 releases. [S06][S07]

## Core ecosystem pattern emerging in 2025-2026

A practical architecture is becoming visible:

1. **Agent-to-tool layer**: MCP and compatible server/client ecosystems. [S08][S09]
2. **Agent-to-agent layer**: A2A (now under Linux Foundation governance), plus alternative/adjacent efforts (ACP, ANP). [S10][S11][S43][S12]
3. **Agent-to-UI layer**: AG-UI event protocol for frontend/runtime interactivity. [S13][S14]
4. **Contract/discovery layer**: OSSA + DUADP and related manifest/discovery approaches. [S02][S03][S04]

This division is not universally accepted, but it is a coherent integration pattern used by multiple vendors and ecosystem actors. [S02][S11][S15]

## Key research and policy signals

- Harvard Library Innovation Lab frames protocols as the most useful "x-ray" of fast-moving agent ecosystems and argues they are especially important when systems are easy to build and hard to centrally regulate. [S16]
- MIT's AI Agent Index (2025) identifies rapid release velocity and autonomy growth, while documenting large safety/transparency gaps and unsettled web-conduct norms. [S17][S18]
- MIT Sloan's 2026 guidance argues agentic AI is promising but not fully production-ready at enterprise scale due to hallucination and prompt-injection risks; it still forecasts major transactional adoption over the following five years. [S19]
- NIST NCCoE's 2026 concept paper highlights identity and authorization for software/AI agents as a standards gap requiring focused implementation guidance. [S20]

## Security state: adoption is ahead of controls

Across collected sources, the strongest recurring pattern is governance lag:

- Gravitee's 2026 survey reports high deployment activity but low full security approval and high incident prevalence. [S21][S22]
- Practitioner-oriented sources repeatedly identify the same three dominant risks: prompt injection, over-permissioned agents, and harmful autonomous actions. [S23][S24]
- Protocol and platform announcements increasingly foreground security primitives (identity, auth, approval gates, observability), but operational maturity remains uneven across organizations. [S11][S25][S26]

## Practical implications for builders

1. **Build to open interfaces where feasible** (MCP/A2A/AG-UI + interoperable manifests/discovery) to reduce bespoke glue code and lock-in risk. [S09][S11][S13]
2. **Treat identity as first-class infrastructure** (agent-specific identities, scoped credentials, auditable delegation), not as shared service credentials. [S20][S22]
3. **Constrain autonomy by risk tier** with explicit HITL gates for irreversible actions. [S19][S24]
4. **Adopt production observability from day one** (tracing, policy audit, anomaly detection, rollback paths). [S21][S27][S28]

## Known limitations in this research batch

- Several ecosystem pages are marketing-oriented; where possible, claims were anchored to primary technical docs/specs/repositories.
- Some pages were inaccessible or returned partial content in this environment (e.g., some GitHub-rendered pages, specific MCP/A2A mirrored paths); alternatives were used and noted in `reading-list.md`.
- "Parlay" as a named mainstream framework in this period could not be confirmed from high-authority primary documentation; this is explicitly flagged in `frameworks.md`.
