# Agentic AI, Protocols, Standards, and Security (Late 2025 to Early 2026)

Date: 2026-04-14

This overview synthesizes the current state of the agent ecosystem, with focused analysis of DUADP and OSSA, adjacent protocol standards (MCP, A2A, AG-UI, ACP, ANP, Agent Protocol), open-source frameworks, and security/governance findings from research and industry reports. Detailed evidence and source links are in `reading-list.md`.

## Executive synthesis

Three structural patterns now define the ecosystem:

1. **Protocol modularization is real**: the ecosystem is converging around a layered model rather than a single universal protocol: tool/context connectivity (MCP), agent-to-agent coordination (A2A/ACP/ANP variants), and UI interaction (AG-UI), with a separate contract/governance layer emerging (OSSA). [R13][R15][R16][R18][R20][R23][R24]
2. **Contract and discovery layers are the most under-standardized areas**: this is exactly where OSSA (manifest/contract) and DUADP (federated discovery + DID/trust) position themselves. [R01][R02][R04][R05][R06]
3. **Adoption is outpacing controls**: security and governance maturity remains materially behind deployment velocity, especially around identity, authorization, and runtime controls for agent actions. [R39][R40][R43]

## What DUADP is and why it matters

DUADP presents itself as a decentralized discovery layer for agents/skills/tools, analogous to DNS + discovery for an "agentic web." The core proposition is:

- publish resources on any node,
- resolve/discover using web-native surfaces (`/.well-known`, WebFinger, DNS TXT),
- federate through gossip,
- attach identity/trust signals (DID + signatures + governance).

This fills a tangible gap not solved by MCP or A2A alone: **finding** agent resources across organizational boundaries and evaluating trust/provenance prior to use. [R01][R02][R03]

Practically, DUADP currently combines:

- SDK packaging (`@bluefly/duadp`),
- an API/MCP surface for discovery/registry/federation/governance operations,
- explicit DID/trust-tier concepts,
- alignment claims with NIST-oriented governance language.

Weekly npm download signal in this snapshot: ~120/week. [R03][D02]

## What OSSA (Open Standard Agents) is and why it matters

OSSA is positioned as a **portable contract manifest** layer ("define once, export everywhere"), bridging protocol/runtime fragmentation. It explicitly argues that MCP and A2A solve transport/interop concerns, but not "what the agent is" as a governed, portable artifact. [R04][R05][R06]

In current materials, OSSA combines:

- versioned YAML manifest spec and schema validation,
- export/transformation into many runtime targets,
- trust/compliance metadata concepts,
- MCP server tooling and ecosystem integrations.

Weekly npm signal in this snapshot: ~198/week; package size/dependency footprint is materially larger than DUADP, consistent with being a broader CLI/export platform. [R06][D02]

## Academic and institutional consensus direction

Across Cornell, Harvard, MIT, and adjacent research:

- **Cornell/eCornell** frames agentic architecture as progression from LLM basics to RAG, tool-enabled agents, multi-agent patterns, then governance/risk/security/human oversight. [R07]
- **Harvard LIL/Berkman-affiliated work** emphasizes open protocols as governance-bearing infrastructure, comparable to early internet standards history. [R08]
- **MIT AI Agent Index 2025** documents rapid deployment and autonomy increase with major transparency and safety-reporting deficits; notably flags absence of settled web conduct standards for agents. [R09][R10][R48]
- **MIT Sloan/SMR** positions 2026 as a "de-hype and hardening" year: enterprise value pressure, persistent hallucination/injection issues, and gradual but likely medium-term expansion of agentic workflows. [R11][R12]
- **Protocol survey literature** already treats MCP/ACP/A2A/ANP as a recognizable family and suggests staged adoption patterns. [R47]

## Security and governance state in 2026

Security research and practitioner data converge on the same risk classes:

- prompt injection (direct + indirect),
- excessive permissions/excessive agency,
- weak identity/credential models,
- insufficient runtime visibility and post-hoc audits.

OWASP and NIST framing increasingly aligns with identity- and authorization-first design, not just model-safety prompts. [R41][R42][R43]

Gravitee's 2026 survey data (widely cited) quantifies the gap:

- 81% beyond planning,
- 14.4% full security approval,
- 88% confirmed/suspected incidents,
- <22% treating agents as independent identities.

While this is vendor-produced research, the trend direction is consistent with MIT transparency findings and OWASP/NIST priorities. [R39][R40][R10][R42][R43]

## Ecosystem maturity and adoption signals

Open-source framework activity (stars, releases, docs) indicates sustained momentum, but with different lifecycle stages:

- high momentum orchestration/framework layer: CrewAI, LangGraph, LlamaIndex, OpenAI Agents SDK;
- transition signals: AutoGen now explicitly in maintenance mode, with migration guidance to Microsoft Agent Framework;
- protocol repos are active but still uneven in implementation depth and standardization maturity.

GitHub snapshot values captured in this run (see frameworks document for table). [D01]

## Key strategic conclusions

1. **OSSA + DUADP represent a coherent stack hypothesis**:
   - OSSA as contract/manifest portability layer,
   - DUADP as discovery/federation/trust distribution layer.
   This is a rational complement to MCP/A2A, not a direct replacement. [R02][R05][R15][R18]
2. **Identity and policy enforcement are now the primary bottlenecks** rather than model IQ.
3. **Standards remain plural, not winner-take-all** in 2026: organizations should plan multi-protocol interoperability with explicit policy controls.
4. **Production readiness now depends more on control-plane quality** (authorization, observability, governance, rollback) than on selecting a single "best" model/framework.

## What to do next (research utilization)

Use the companion files as follows:

- `academia.md`: institutional and research findings with risk/governance emphasis.
- `protocols.md`: protocol-by-protocol analysis and comparison table.
- `frameworks.md`: framework and repository landscape with maturity signals.
- `security.md`: threat model and governance controls with quantified findings.
- `blogs.md`: practical production guidance from engineering publications.
- `reading-list.md`: source map and citation keys.
