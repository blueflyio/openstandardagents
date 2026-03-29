# Agentic AI Landscape (Late 2025 to Early 2026): Executive Overview

Date prepared: March 29, 2026  
Coverage window: Late 2025 to early 2026 (with some foundational 2024 protocol launches where required for context)

## Direct answer: what DUADP and Open Standard Agents are

### DUADP (`duadp.org`)

DUADP (Decentralized Universal AI Discovery Protocol) is positioned as a discovery layer for AI agents, skills, and tools. In practical terms, it is trying to do for agents what DNS and well-known endpoints did for web services: make capability discovery interoperable across domains without requiring one central registry. Its public docs and npm package describe:

- well-known discovery manifests,
- DNS + WebFinger-based resolution,
- federated gossip between nodes,
- DID-based identity and signature checks,
- REST endpoints and MCP tool exposure for discovery/search/publish/governance operations. [SRC-DUADP-HOME] [SRC-DUADP-DOCS] [SRC-NPM-DUADP]

DUADP therefore sits in the "how agents find each other and discover capabilities" part of the stack.

### Open Standard Agents / OSSA (`openstandardagents.org`)

OSSA (Open Standard for Software/Standard Agents) is positioned as a contract/manifest layer, not an execution runtime and not a transport protocol. It defines portable YAML agent manifests intended to be exportable across multiple frameworks/platforms. OSSA claims to complement:

- MCP (tool/data connectivity),
- A2A (agent-to-agent communication),
- DUADP (discovery). [SRC-OSSA-HOME] [SRC-OSSA-SPEC] [SRC-OSSA-ABOUT] [SRC-NPM-OSSA]

In stack terms, OSSA is trying to answer "what an agent is allowed to do and how it is described/governed," while DUADP answers "where to find it."

## DUADP and OSSA npm packages

The key npm packages are:

1. `@bluefly/duadp` (SDK + server/router capabilities), published March 2026, Apache-2.0, with discovery/federation/DID/signing-related functionality documented in package README. [SRC-NPM-DUADP]
2. `@bluefly/openstandardagents` (CLI + schema + export tooling), published versions through March 2026, Apache-2.0, with "define once, export across platforms" positioning and broad command surface. [SRC-NPM-OSSA]

Operationally:

- DUADP package focus: network discovery/federation/registry capabilities.
- OSSA package focus: manifest authoring/validation/export and contract portability.

## Why this matters in the 2026 protocol landscape

Across major protocol families, the stack is becoming layered:

- **MCP**: agent/tool-data connectivity (JSON-RPC based). [SRC-MCP-SPEC] [SRC-ANTHROPIC-MCP]
- **A2A**: agent/agent collaboration with Agent Cards and task lifecycle semantics. [SRC-GOOGLE-A2A-LAUNCH] [SRC-A2A-SPEC] [SRC-A2A-DISCOVERY]
- **AG-UI**: agent/frontend interaction model for user-facing applications. [SRC-AGUI-DOCS] [SRC-AGUI-GITHUB]
- **OSSA/DUADP**: contract + discovery layers (in the Open Standard Agents ecosystem). [SRC-OSSA-HOME] [SRC-DUADP-HOME]

The ecosystem is converging on a pattern where no single protocol does everything well. Adoption decisions are increasingly compositional.

## Core synthesis across research

1. **Adoption is accelerating faster than governance**  
   Multiple sources report rapid movement into production and uneven security controls. The Gravitee 2026 report states high adoption with significant control gaps and high incident rates. [SRC-GRAVITEE-REPORT] [SRC-GRAVITEE-BLOG]

2. **Interoperability pressure is real**  
   A2A, MCP, Agent Protocol, and related initiatives exist because bespoke integrations do not scale. Enterprises are trying to avoid repeated connector work and vendor lock-in. [SRC-GOOGLE-A2A-LAUNCH] [SRC-LANGCHAIN-AGENT-PROTOCOL-BLOG] [SRC-RUH-2026]

3. **Security has shifted from model-quality-only to identity/authorization/runtime-control**  
   NIST/NCCoE focus and MIT Sloan guidance align with this shift: prompt injection and over-permissioning are practical blockers for unrestricted autonomy. [SRC-NIST-NCCOE-2026] [SRC-MIT-SLOAN-2026] [SRC-MCP-SPEC]

4. **Transparency and safety evidence are lagging capability marketing**  
   MIT's 2025 AI Agent Index finds notable disclosure gaps around safety evaluation and third-party testing in high-autonomy systems. [SRC-MIT-INDEX-2025] [SRC-MIT-INDEX-DETAILS]

## Strategic opportunities

- Adopt protocol standards early where they reduce repeated integration work.
- Use per-agent identity and scoped authorization from day one.
- Separate layers: discovery, contract, communication, tool access, and UI interaction.
- Keep human-in-the-loop for high-impact workflows until incident rates and evaluation maturity improve.

## Principal risks

- Prompt-injection-driven unauthorized actions.
- Shared credentials and weak agent identity.
- Insufficient auditability for autonomous task chains.
- Over-reliance on single-vendor model families.
- Governance claims not backed by measurable runtime controls.

## Evidence-quality note

This research uses primary sources where possible (official protocol specs, official announcements, docs, and repository/package pages). It also includes industry blogs for implementation insight; those are explicitly treated as directional unless corroborated by primary sources or independent datasets. See `reading-list.md` for source-by-source notes.
