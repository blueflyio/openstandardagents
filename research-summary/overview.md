# Agentic AI, Protocols, Standards, and Security (2025-2026): Overview

Date finalized: April 18, 2026.

## Scope and method

This research synthesizes primary sources across:

- DUADP and OSSA official properties and npm packages [D01][D02][D03][O01][O02][O04]
- University and policy-facing analysis (Cornell, Harvard, MIT, NIST) [A01][A02][A03][A04][A05][A07][A08]
- Protocol and interoperability specifications (MCP, A2A, AG-UI, ANP, Agent Protocol, ACP/ATP) [P01][P02][P03][P04][P05][P06][P07][P09][P10]
- Framework and platform evidence (OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex, GitLab Duo Agent Platform) [F01][F02][F03][F04][F05][F06]
- Security reports and practitioner guidance (Gravitee, Dev.to, governance papers) [S01][S02][S03][S04]
- Industry engineering blogs (47Billion, Ruh.ai) [B01][B02]

## Executive synthesis

### 1) What DUADP and OSSA are

DUADP and OSSA are positioned as adjacent layers:

- **DUADP** = discovery and federation layer for agents/skills/tools (well-known endpoints, search, publish, federation, DID-linked trust metadata), with TypeScript SDK distribution as `@bluefly/duadp` on npm [D01][D02][D03].
- **OSSA** = agent contract/manifest layer (`agent.ossa.yaml`) for portability, validation, and exports to many runtimes/platforms, distributed as `@bluefly/openstandardagents` on npm [O01][O02][O04].

In short: DUADP is “where to find capabilities”; OSSA is “what the capability contract is.” [D01][O02]

### 2) The ecosystem is converging into a layered stack

A practical 2026 stack is emerging:

1. **Agent-to-tool** protocols (MCP) [P01]
2. **Agent-to-agent** protocols (A2A; ACP merged directionally into A2A governance trajectory) [P02][P03][P07]
3. **Agent-to-user interface** protocols (AG-UI) [P04]
4. **Agent identity/discovery fabrics** (ANP, DUADP) [P05][D01]
5. **Contract/deployment layer** (OSSA-like manifest/export systems) [O01][O04]

Core pattern: protocols are becoming specialized instead of monolithic.

### 3) Frameworks are maturing, but reliability still lags autonomy claims

Frameworks and SDKs now support durable loops, handoffs, tool orchestration, and tracing at production level [F01][F02][F03][F05]. However:

- Multi-agent reliability and governance remain deployment bottlenecks [B01][S01].
- Security incidents are already common in enterprises operating agents [S01][S02].
- Human oversight remains necessary for high-risk use cases [A04][S03].

### 4) Security and governance are the current weakest layer

Evidence across reports and policy sources shows:

- Adoption is ahead of control maturity [S01][S02].
- Identity and authorization models are often underdeveloped for autonomous agents [A05][S02].
- Prompt injection, privilege overreach, and tool misuse remain central operational risks [S03][S04].

## Key themes, challenges, and opportunities

### Theme A: Interoperability is moving from “custom glue” to standards

Standards now exist for tool connectivity, inter-agent exchange, and UI interaction [P01][P02][P04]. This reduces bespoke integration cost and should improve portability.

**Challenge:** standards overlap, governance is fragmented, and quality of implementation varies.

**Opportunity:** organizations can adopt layered standards incrementally rather than redesigning all systems at once.

### Theme B: Discovery and identity are becoming first-class concerns

Agent systems increasingly require:

- machine-readable discovery
- stable identifiers
- verifiable trust/provenance signals

DUADP/ANP and related DID-oriented approaches are explicit responses to this gap [D01][P05].

**Challenge:** trust-tier semantics are not yet universal across ecosystems.

**Opportunity:** policy-aware routing and auditable agent provenance can be built earlier in architecture.

### Theme C: Contract portability is becoming strategic

OSSA-like manifest approaches target the same pain point OpenAPI solved for APIs: define once, deploy many [O01][O04].

**Challenge:** export fidelity and runtime behavior equivalence remain hard in heterogeneous stacks.

**Opportunity:** contracts can centralize governance metadata, compliance hooks, and testable agent definitions.

### Theme D: Governance needs runtime enforcement, not only policy text

NIST’s concept direction and enterprise incident data both imply that documentation alone is insufficient [A05][S02]. Runtime controls are needed across:

- authorization
- action gating
- auditing
- incident response

## What this means for technical decision makers in 2026

1. **Pick standards by interaction boundary, not by hype**  
   MCP for tools, A2A for delegation/collaboration, AG-UI for front-end interaction.

2. **Treat identity as infrastructure**  
   Prefer per-agent identity and scoped credentials over shared service keys [S02][A05].

3. **Use a contract artifact for portability**  
   Keep one source-of-truth manifest and generate platform adapters.

4. **Make security controls action-level**  
   Guardrails must evaluate tool invocation intent, permission scope, and audit traceability [S03][S04].

5. **Adopt progressive autonomy**  
   Start with constrained workflows and human checkpoints; expand autonomy as evidence quality improves [A04][B01].

## Limitations and source-quality notes

- Some high-value sources are partially paywalled or truncated (for example HBR and ACM pages), so this report uses available excerpts and substitutes with accessible primary documents where needed [A09][S03].
- Industry blogs contain useful operational insights but are not peer-reviewed; claims are included with source attribution and should be validated in your own environment [B01][B02].

---

For citation keys and URLs, see `reading-list.md`.
