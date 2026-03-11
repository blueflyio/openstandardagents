# Agentic AI Ecosystem (Late-2025 to Early-2026): Executive Overview

_Report date: 2026-03-11_

## 1) What DUADP and Open Standard Agents are

### DUADP (duadp.org)
DUADP presents itself as a **decentralized discovery protocol** for AI agents: effectively “DNS for AI agents,” with federation, trust verification, and a 17-tool MCP surface for discovery/search/publishing workflows. The site positions DUADP as the missing layer between agent runtimes and internet-scale discoverability, and explicitly frames itself alongside NIST-style governance and policy controls.[SRC-01][SRC-02][SRC-03][SRC-04][SRC-05]

From package metadata, DUADP is published as `@bluefly/duadp` (Apache-2.0) and described as a TypeScript SDK for “Decentralized Universal AI Discovery Protocol.”[SRC-07]

### Open Standard Agents (openstandardagents.org / OSSA)
OSSA presents itself as a **vendor-neutral manifest contract** for agents: define an agent once (identity, capabilities, trust boundaries, governance), then export to multiple targets. The site positions OSSA as a “contract layer” that complements transport protocols (e.g., MCP/A2A) and deployment platforms (e.g., Docker/Kubernetes/framework exports).[SRC-08][SRC-09][SRC-10][SRC-11][SRC-12]

From package metadata, OSSA is published as `@bluefly/openstandardagents` (Apache-2.0), with a CLI/export-oriented positioning.[SRC-13]

## 2) Ecosystem pattern: stack is converging into layers

Across official protocol docs, framework READMEs, and 2026 engineering/security commentary, the ecosystem is converging into a layered architecture:

1. **Tool/context connectivity** (MCP): model/application to tools and data sources.[SRC-14][SRC-16]  
2. **Agent-to-agent task exchange** (A2A/ACP/ANP variants): inter-agent coordination.[SRC-17][SRC-18][SRC-23][SRC-20]  
3. **Agent-to-UI interaction** (AG-UI): frontend/back-end event coordination for interactive products.[SRC-19]  
4. **Agent contract/discovery/governance overlays** (OSSA + DUADP-style positioning): identity, policy, deployment contracts, and discovery mesh concerns.[SRC-09][SRC-12][SRC-01]

This is analogous to early internet layering: transport and naming standards emerge first, governance and trust hardening follow.

## 3) What appears most mature vs. still unsettled

### More mature in practice
- MCP and A2A have strong mindshare, fast implementation velocity, and explicit attempts to standardize around existing web patterns (HTTP/JSON-RPC/SSE, etc.).[SRC-14][SRC-18]
- Major open-source frameworks now expose durable state, multi-agent orchestration, and observability primitives as first-class concerns.[SRC-25][SRC-27][SRC-28][SRC-29][SRC-30]

### Still unsettled
- Cross-org agent identity and authorization at scale remain unresolved in production, despite rapid adoption.[SRC-37][SRC-38][SRC-41]
- Web-conduct norms for autonomous agents are incomplete; transparency and disclosure lag capability releases.[SRC-45][SRC-43]
- Discovery and trust federation are fragmented; multiple projects are competing to define “agent DNS + trust + policy” patterns.[SRC-01][SRC-20][SRC-11]

## 4) Security reality in early 2026

Adoption appears faster than control maturity:
- Gravitee’s 2026 survey reports high implementation activity, but low full security approval and high incident prevalence.[SRC-37][SRC-38]
- Practical threat guidance converges on three recurring risks: prompt injection, excessive permissions, and hallucinated or unsafe actions.[SRC-39][SRC-40]
- NIST’s AI Agent Standards Initiative and NCCoE concept direction indicate institutional recognition that identity/authz standards for autonomous software agents are now a priority area.[SRC-41]

## 5) Practical implications for teams building now

### What to do immediately (0-3 months)
- Treat agents as **independent workload identities**, not as shared API-key wrappers.[SRC-38][SRC-41]
- Separate protocol concerns: tool access (MCP), inter-agent communication (A2A/ACP family), UI interaction (AG-UI), and policy/manifest/discovery overlays.[SRC-14][SRC-18][SRC-19][SRC-09]
- Instrument tracing, guardrails, and HITL checkpoints before scaling autonomy.[SRC-25][SRC-46]

### What to do next (3-12 months)
- Standardize internal manifests/contracts to reduce rework across frameworks/environments.
- Build policy-as-code controls for agent permissions and outbound actions.
- Prepare for federated discovery and verifiable metadata exchange patterns as these specs mature.

## 6) Evidence quality and limitations

- **High-confidence sources**: official protocol/framework docs, primary announcements, university/standards pages.[SRC-14][SRC-18][SRC-19][SRC-25][SRC-41][SRC-45]
- **Useful but interpretive sources**: industry blogs and practitioner analyses (good for rollout/cost heuristics, weaker as normative standards evidence).[SRC-35][SRC-36][SRC-39]
- Some materials (especially rapidly changing protocol ecosystems) changed quickly between late-2025 and early-2026; all references in this folder are timestamped and should be revalidated before policy commitments.
