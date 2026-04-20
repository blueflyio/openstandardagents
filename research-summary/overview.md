# Agentic AI Ecosystem Research (2026): Executive Overview

Date prepared: April 20, 2026  
Coverage window: late-2024 through early-2026, with emphasis on late-2025/early-2026.

## Direct answer: what DUADP and Open Standard Agents are

### DUADP (`duadp.org`, npm `@bluefly/duadp`)

DUADP (Decentralized Universal AI Discovery Protocol) positions itself as a **discovery and federation layer** for agents, skills, and tools, analogous to “DNS for AI agents.” It exposes well-known and REST endpoints for discovery, search, publishing, validation, federation, and governance/trust operations, and it emphasizes DNS/WebFinger discovery plus DID-based identity and signatures for trust assertions. The public package `@bluefly/duadp` is the TypeScript SDK and server router implementing this protocol surface. [T01][T02][T03]

In practice, DUADP is trying to solve: “How do agents find each other across organizational boundaries without one central registry?” It is not a model runtime; it is a discovery/control protocol layer. [T02][T03][T07]

### Open Standard Agents / OSSA (`openstandardagents.org`, npm `@bluefly/openstandardagents`)

OSSA positions itself as a **portable agent contract/manifest layer** (“define once, export everywhere”). It is intentionally framed as neither an agent runtime protocol (like MCP/A2A) nor a single framework; instead it defines a schema/CLI/export toolchain for agent identity, capabilities, governance metadata, and multi-platform packaging. The package `@bluefly/openstandardagents` is a large CLI + schema + exporter implementation. [T04][T05][T06]

In short:
- DUADP = discovery/federation + trust-aware registry layer. [T01][T02]
- OSSA = portable agent definition and deployment-contract layer. [T04][T05]
- Their own ecosystem documents repeatedly present them as complementary: OSSA defines agents, DUADP discovers them. [T06][T07]

## Macro themes across the 2026 agent ecosystem

## 1) The stack is stratifying into layers, not one winner-take-all protocol

A recurring architecture pattern is now clear:
- **Agent ↔ tool/data**: MCP. [T12][T13]
- **Agent ↔ agent**: A2A / ACP / ANP variants. [T14][T15][T22][T19]
- **Agent ↔ user interface**: AG-UI. [T17][T18]
- **Agent contract/deployment metadata**: OSSA-style manifest layers. [T04][T05]
- **Cross-registry discovery**: DUADP/ANP-style discovery/federation. [T01][T19]

This layered decomposition appears in both vendor docs and independent surveys, and it reduces the “single protocol to rule them all” framing. [T39][T40]

## 2) Interoperability moved from “nice-to-have” to design-center

Major protocol initiatives emphasize vendor neutrality and portability:
- Anthropic’s MCP was launched as an open standard to replace fragmented integrations. [T12]
- Google launched A2A (April 9, 2025) with 50+ partners and later highlighted 150+ ecosystem supporters in 2025 updates. [T14][T16]
- ACP (IBM/BeeAI lineage) explicitly markets lightweight REST interop and now states migration under broader A2A/Linux Foundation governance direction. [T22][T23]

## 3) Security and governance lag deployment

Security evidence indicates a deployment-governance gap:
- Gravitee’s 2026 report: high adoption velocity, low full-approval coverage, high incident rates, and weak identity practices for agents in many orgs. [T32][T33][T34]
- MIT Sloan’s 2026 guidance: hallucinations + prompt injection risks materially slow fully autonomous adoption. [T11]
- NIST/NCCoE concept paper (Feb 5, 2026): identity, authorization, auditing, non-repudiation, and prompt-injection controls are central open problems. [T35]

## 4) Academic and policy communities are converging on protocol/governance urgency

- Harvard LIL frames open protocols as structural governance leverage for a fast-moving, hard-to-regulate agent ecosystem. [T09]
- MIT AI Agent Index 2025 documents transparency gaps, unsettled web conduct standards, and limited safety disclosure among frontier-autonomy systems. [T10]
- Surveys on protocol interoperability (arXiv 2025) signal active standardization across MCP/ACP/A2A/ANP but no final convergence yet. [T39][T40]

## 5) Framework growth is real, but protocol maturity is uneven

Framework adoption (OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex) is robust and highly active, while protocol standardization is still in active flux and often spread across vendor sites, GitHub specs, and evolving foundations. [T27][T28][T29][T30][T31]

## Strategic implications for teams building agents in 2026

1. Build to **layer boundaries** (tool protocol, inter-agent protocol, UI protocol, policy layer) to avoid lock-in. [T13][T15][T17][T39]  
2. Treat agent identity/authorization as first-class platform concerns, not post-launch patches. [T32][T35]  
3. Start with constrained autonomy and explicit human-in-the-loop controls in high-risk workflows. [T11][T36]  
4. Standardize metadata/contracts early (manifests, capability cards, policy declarations) to preserve portability. [T05][T15][T20]  
5. Distinguish marketing “ecosystem support” from production interoperability guarantees; verify conformance and operational semantics directly. [T16][T39]

## Scope limitations

- Some cited materials are vendor blogs and marketing pages; they are useful for implementation details and ecosystem claims but should be triangulated with neutral sources where possible. [T32][T43][T44]
- Some high-value governance/security commentary is partially paywalled (e.g., HBR full article body), so only publicly visible portions were used. [T36]
- “Current stars/downloads” are snapshots and can change quickly.
