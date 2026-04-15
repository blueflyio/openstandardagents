# Agentic AI Protocols, Standards, Frameworks, and Security (Research Snapshot)

Date of synthesis: April 15, 2026

## Executive overview

The agent ecosystem in 2025-2026 is converging around a layered stack:

1. **Model/tool connectivity** (for example, MCP),
2. **Agent-to-agent interoperability** (for example, A2A, ACP, ANP),
3. **Agent-to-user interaction** (for example, AG-UI),
4. **Agent contract/manifest layers** (for example, OSSA/OpenStandardAgents),
5. **Discovery and identity layers** (for example, DUADP and DID-oriented designs).

This looks similar to early internet protocol evolution: multiple concurrent standards, rapid iteration, and incomplete governance. Harvard Library Innovation Lab (LIL) explicitly frames agent protocols as the “x-ray” of what builders are standardizing in real time, similar to early TCP/IP-DNS-HTTP dynamics.[T17][T18]

## What DUADP and OpenStandardAgents are

### DUADP (Decentralized Universal AI Discovery Protocol)

DUADP positions itself as “DNS for AI agents”: federated discovery of agents/skills/tools via DNS/WebFinger-like patterns, DID-linked identity, and federation/gossip mechanisms.[T01]  
Its npm package (`@bluefly/duadp`) is published as a TypeScript SDK (Apache-2.0) and, as of April 15, 2026, recorded 166 weekly downloads from the npm downloads API snapshot.[T02][D02][D03]

### OpenStandardAgents (OSSA)

OpenStandardAgents positions OSSA as a **portable agent manifest/contract layer** across runtime targets (for example Docker, Kubernetes, LangChain, MCP, A2A-facing exports), not as a replacement for MCP/A2A transports.[T03]  
Its npm package (`@bluefly/openstandardagents`) is published as Apache-2.0 and recorded 204 weekly downloads in the same snapshot.[T04][D02][D03]

**Practical interpretation:** DUADP solves discovery/registry identity concerns; OSSA solves “define agent once, export across platforms” concerns. They are adjacent and complementary in architecture claims rather than direct substitutes.

## Main ecosystem themes (2026)

### 1) Interoperability is maturing, but fragmented

- **MCP** became the de facto open standard for model-to-tool and model-to-data integration; Anthropic framed it as replacing one-off connectors with a universal protocol.[T05]
- **A2A** is becoming the cross-vendor inter-agent coordination standard, with formal Linux Foundation governance and claimed support growth from 50+ launch partners to 100+ and later 150+ in public ecosystem updates.[T06][T07][T08][T09]
- **AG-UI** addresses the application/UI boundary, standardizing event-based agent-frontend interaction.[T10]
- **ACP** (IBM/BeeAI) introduced a REST-first alternative for agent-to-agent messaging and later publicly announced merger/convergence into A2A governance paths.[T28][T29]

### 2) Contract layers and discovery layers are emerging as gaps

- Transport protocols answer “how agents/tools talk.”
- Contract/discovery systems answer “what this agent is,” “where to find it,” and “under what trust policy to use it.”
- OSSA and DUADP both explicitly target this missing middle, from different angles (manifest portability versus federated discovery and trust evidence).[T01][T03]

### 3) Security and governance are materially behind adoption

- Gravitee’s 2026 data reports high operational adoption but low full security approval and high incident prevalence.[T22][T23]
- MIT Sloan guidance says agentic AI is not yet fully production-safe for broad autonomy because hallucinations and prompt-injection risk remain active concerns.[T20]
- MIT AI Agent Index documents transparency gaps, weak safety disclosure, and unsettled standards for agent conduct on the web.[T19]

### 4) Identity and authorization are moving to center stage

- NIST/NCCoE’s February 2026 concept paper calls for stronger identity and authorization standards for software and AI agents.[T21]
- Multiple protocol efforts now reference DID/credential-based trust and policy enforcement, showing convergence toward identity-aware infrastructure.[T01][T11][T28]

## High-confidence strategic takeaways

1. **Do not pick one protocol as “the winner” yet.** Enterprises will likely run mixed stacks: MCP + A2A/ACP + UI protocol + internal contract layer.
2. **Treat discovery and identity as first-class architecture** (not afterthoughts), because scale introduces trust, provenance, and governance risk.
3. **Expect standards consolidation** (for example ACP-to-A2A convergence patterns), but ongoing coexistence across layers.
4. **Security maturity must catch up before full autonomy expansion**; current evidence supports controlled rollout with human-in-the-loop and least-privilege policy boundaries.

## Scope and limitations

- This summary emphasizes late-2025 to early-2026 publicly accessible sources.
- Some vendor claims (for example adoption counts) are from first-party announcements and should be treated as directional unless independently audited.
- Harvard Business Review-specific agent protocol coverage was not discoverable in this run; nearby MIT/Harvard and arXiv/ACL sources were used instead.[T17][T19][T35][T36][T37]
