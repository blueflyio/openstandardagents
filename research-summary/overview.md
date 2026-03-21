# Agentic AI Landscape (Late 2025 to Early 2026): Executive Overview

## Scope

This report synthesizes academic, protocol, framework, security, and practitioner sources gathered on March 21, 2026, with emphasis on:

- `duadp.org`, `openstandardagents.org`, and their npm packages (`@bluefly/duadp`, `@bluefly/openstandardagents`) [T01][T02][T03][T04]
- Major open protocols (MCP, A2A, AG-UI, ANP, Agent Protocol, ACP, ATP) [T25][T27][T33][T35][T38][T40][T42]
- Open-source frameworks and production platforms (OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex, GitLab Duo Agent Platform) [T44][T47][T48][T49][T50][T52]
- Security and governance findings from NIST/NCCoE, OWASP, Gravitee, and other engineering publications [T56][T59][T62][T64]

## 1) What DUADP and OSSA are, in practical terms

### DUADP

DUADP positions itself as a decentralized discovery layer for AI agents: DNS/WebFinger discovery, federated gossip, DID-based identity, and policy-aware trust evaluation through governance endpoints and Cedar-oriented policy framing. Operationally, DUADP exposes discovery/search/publish/federation APIs and claims native MCP tooling on top of that API surface. [T01][T05][T06]

### OSSA / `@bluefly/openstandardagents`

OSSA positions itself as a contract/specification layer for agent definitions (manifest-first, export-to-many-platforms), distinct from transport protocols like MCP/A2A and distinct from runtime frameworks like LangChain/CrewAI. In practice: OSSA defines an agent artifact and export model; DUADP is presented as discovery/federation infrastructure adjacent to that contract layer. [T02][T04][T07]

### Combined interpretation

A useful mental model from these sources is:

- **Contract**: OSSA manifest (`what the agent is`) [T07]
- **Discovery/Federation**: DUADP (`how agents are found and trust-scored`) [T05][T06]
- **Transport/Execution**: MCP/A2A/framework runtime (`how agents use tools and collaborate`) [T25][T27][T47]

## 2) Macro ecosystem pattern in 2025–2026

Across vendor and research sources, the ecosystem is converging toward a layered stack rather than one dominant protocol:

1. **Agent-tool protocols** (MCP) [T25][T26]  
2. **Agent-agent protocols** (A2A, ACP, ANP variants) [T28][T40][T35]  
3. **Agent-UI protocols** (AG-UI / A2UI ecosystem) [T33][T30]  
4. **Contract/packaging standards** (OSSA, Agent Protocol API surfaces, agent card conventions) [T07][T38][T28]  
5. **Identity/authorization/governance overlays** (NIST, OpenID, Cedar/ABAC approaches, trust tiers) [T63][T24][T62]

The strongest repeated theme is **interoperability pressure**: teams want to avoid N×M custom integrations and vendor lock-in while still enforcing enterprise security controls. [T21][T22][T66]

## 3) Adoption reality vs security readiness

Deployment momentum is high, but governance maturity lags:

- Gravitee reports broad movement into production and large incident prevalence, with identity/authorization gaps (shared credentials, weak independent agent identity treatment). [T56][T57]
- MIT AI Agent Index and related research identify transparency and safety-disclosure gaps in deployed systems. [T13][T14]
- MIT Sloan guidance (2026) is explicit that agentic AI is not yet “prime time” for fully autonomous operation, even while forecasting strong medium-term transaction automation potential. [T15][T16]

Security consensus in the corpus:

- prompt injection remains a first-order risk;
- excessive permissions and weak authorization boundaries are common failure modes;
- human-in-the-loop and policy enforcement are still required for high-risk actions. [T59][T60][T61][T63]

## 4) Most important strategic takeaway

The most resilient architecture in this cycle is not “pick one framework/protocol and standardize forever.”  
It is **layered, replaceable components**:

- open protocol(s) for communication,
- explicit contract/spec for portability,
- cryptographic identity + authorization policy plane,
- continuous monitoring and revocation paths.

That structure appears consistently in official protocol documentation, standards initiatives, and post-incident security guidance. [T25][T28][T64][T63][T69]

## 5) Coverage notes

- This package prioritizes primary protocol docs, official announcements, and institution sources.
- Where sources were paywalled or short-form posts, limitations are explicitly called out in the reading list. [T19][T71]
