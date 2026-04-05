# Agentic AI Ecosystem Summary (Late 2025 to Early 2026)

Date of synthesis: 2026-04-05

## Scope

This report synthesizes recent developments in agentic AI across academia, open protocols, production frameworks, engineering practice, and security/governance, with focused analysis of DUADP and OSSA (`@bluefly/duadp` and `@bluefly/openstandardagents`). Sources are cited using tether IDs (for example, `[T01]`) and expanded in `reading-list.md`.

## Executive synthesis

The ecosystem is converging toward a layered architecture:

1. **Agent-to-tool layer**: MCP and related tool invocation standards reduce one-off connectors and improve tool portability across assistants and runtimes. `[T08]`
2. **Agent-to-agent layer**: A2A, ACP legacy work, and emerging decentralized proposals (ANP) focus on capability discovery, task exchange, and delegation between independent agents. `[T09][T10][T11][T14][T17]`
3. **Agent-to-UI layer**: AG-UI standardizes event streams between agent backends and interactive frontends. `[T12][T13]`
4. **Contract and deployment layer**: OSSA manifests package identity, capabilities, trust boundaries, and export/deployment semantics so protocol-level components can run in real infrastructure. `[T02][T05][T06]`
5. **Discovery and trust mesh layer**: DUADP provides federated discovery, DID-backed provenance, and trust tiers that can be consumed by authorization policy engines (for example Cedar). `[T01][T03][T07]`

A practical framing in 2026 is that these standards are **complementary, not mutually exclusive**. Teams increasingly combine MCP + A2A + AG-UI, then add manifest/discovery systems (OSSA + DUADP) for scale, governance, and supply-chain trust. `[T09][T12][T27][T28]`

## What DUADP and OSSA are (and how they fit)

### DUADP (`@bluefly/duadp`)

DUADP is a decentralized discovery protocol and TypeScript SDK for AI agents, skills, and tools. It combines DNS/WebFinger-style lookup, federated gossip propagation, and W3C DID identity proofs to support verifiable discovery across nodes. It is positioned as "DNS for AI agents," with OSSA-native payload support and trust-aware publication/search workflows. `[T01][T03][T07]`

Key mechanics:
- Publish/search/list/discover agent records over DUADP endpoints.
- Resolve and verify DID-linked metadata.
- Sign and verify manifests for provenance.
- Attach trust tiers to discovery results so policy engines can enforce stricter runtime decisions. `[T01][T07]`

### OSSA (`@bluefly/openstandardagents`)

OSSA is an open manifest specification plus tooling that acts as an infrastructure bridge between protocol ecosystems (for example MCP/A2A) and runtime/deployment targets (for example Kubernetes, Docker, LangChain, CrewAI, Claude Skills). It uses schema-validated YAML manifests, global agent identity patterns, and policy hooks (including Cedar) to make agent definitions portable and governable. `[T02][T05][T06][T43]`

Key mechanics:
- Define capabilities, tools, autonomy, and guardrails once in manifest form.
- Validate/lint/diff/migrate manifests with CLI commands.
- Export to multiple platform targets from one contract.
- Integrate trust and governance controls with DUADP identity/discovery signals. `[T02][T05][T06]`

## Major ecosystem findings

1. **Rapid production push, uneven controls**: Adoption is moving faster than governance, with strong operational pressure to deploy but lagging identity and approval practices. `[T29][T30]`
2. **Identity is a central bottleneck**: NIST and multiple policy analyses now treat agent identity, delegation, and authorization as first-order requirements for safe scale. `[T38][T39][T42]`
3. **Interoperability is no longer theoretical**: MCP and A2A have moved beyond concept-only discussions into broad ecosystem implementation activity; AG-UI and agent protocol specs are expanding adjacent layers. `[T08][T09][T10][T11][T12][T15]`
4. **Framework competition is healthy but fragmented**: OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, and LlamaIndex each optimize different operating points (control, speed, memory, integration depth, data/RAG specialization). `[T19][T20][T21][T22][T23][T24][T27]`
5. **Security posture is still the key execution risk**: Prompt injection, excessive permissions, and hallucinated tool actions remain recurrent failure modes in deployed systems. `[T31][T32][T37]`

## Short timeline (absolute dates)

- **2024-11-25**: Anthropic announces MCP as an open integration standard. `[T08]`
- **2025-04-09**: Google introduces A2A protocol publicly.
- **2025-06-23**: A2A is donated to Linux Foundation governance.
- **2025-07-16**: A2A v0.3 upgrade adds major interoperability/security features. `[T09][T10][T11]`
- **2026-02-05**: NIST NCCoE publishes AI agent identity/authorization concept paper (IPD). `[T38]`
- **2026-02-23**: Harvard LIL publishes Agent Protocols Tech Tree framing.
- **2026-02-28**: Harvard JOLT publishes institutional analysis of the "agentic web." `[T34][T42]`
- **2026-03-09**: `@bluefly/duadp` 0.1.4 published on npm.
- **2026-03-28**: `@bluefly/openstandardagents` 0.5.1 published on npm. `[T03][T05]`

## Opportunities and constraints

### Near-term opportunities
- Standardize internal agent interfaces around open protocol boundaries early.
- Treat identity and policy as architecture primitives, not post-deployment add-ons.
- Use manifest-plus-discovery approaches (OSSA + DUADP) to reduce integration drift across environments. `[T01][T02][T06][T38]`

### Constraints and risks
- Cross-standard overlap still creates implementation ambiguity (especially around responsibility boundaries).
- Many repositories are active, but production-hardening quality varies by project and by use case.
- Security telemetry and incident disclosure remain inconsistent across vendors and teams. `[T29][T35][T36]`

## Document map

- `academia.md`: university and research-center developments.
- `protocols.md`: protocol-by-protocol analysis and comparison.
- `frameworks.md`: frameworks, repositories, and community signals.
- `security.md`: risks, controls, governance, and identity proposals.
- `blogs.md`: credible practitioner publications and operational lessons.
- `reading-list.md`: source bibliography keyed by tether IDs.
