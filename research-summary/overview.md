# Agentic AI Landscape (Late 2025 to April 16, 2026): Overview

## Scope and intent

This research package summarizes current developments in agentic AI across:

- academic and policy research,
- open protocols and standards,
- open-source frameworks and production platforms,
- security/governance trends and controls,
- and industry implementation guidance.

It also includes a focused analysis of:

- `https://duadp.org/` and the `@bluefly/duadp` package, and
- `https://openstandardagents.org/` and the `@bluefly/openstandardagents` package.

All claims are sourced using citation keys that map to `reading-list.md`.

## Executive synthesis

### 1) The stack is stratifying into layers

A practical architecture is emerging with distinct protocol layers:

- **Tool/context connectivity layer** (MCP): how agents access tools and data [R01] [R02].
- **Agent-to-agent collaboration layer** (A2A, ACP): how agents discover peers, delegate tasks, and exchange artifacts [R03] [R04] [R13] [R14].
- **Agent-to-UI interaction layer** (AG-UI): how agent events synchronize with application frontends [R16].
- **Identity/discovery and trust layer** (e.g., ANP, DUADP): how entities are located, authenticated, and policy-scored in federated environments [R12] [R19] [R20].
- **Contract/governance layer** (e.g., OSSA): what an agent is allowed to do, under which controls, and how it exports across runtimes [R21] [R22] [R56].

The strongest strategic takeaway: the market is moving away from a single “winner protocol” narrative toward **composable protocol bundles** (for example MCP + A2A + governance contract + discovery).

### 2) DUADP and OSSA position themselves as “missing layers”

#### DUADP (Decentralized Universal AI Discovery Protocol)

DUADP presents itself as a federated discovery mesh for agents/skills/tools, using DNS/WebFinger, gossip propagation, and DID-based identity, with MCP and REST interfaces [R19] [R20]. The npm package (`@bluefly/duadp`) is currently an early-stage TypeScript SDK (latest `0.1.4`, Apache-2.0, created March 6, 2026) with rapid patch cadence and light package size [R57] [R58]. Last-week npm downloads are currently modest (`170`) [R59].

Interpretation: DUADP is best understood as an **early-stage registry/discovery protocol and SDK**, technically ambitious in federation/identity posture but still early in external adoption telemetry.

#### OSSA (Open Standard Agents)

OSSA positions itself as a vendor-neutral **agent contract specification** between transport protocols and deployment platforms, with schema validation, extensions, and multi-target export [R21] [R22]. The npm package (`@bluefly/openstandardagents`) is a larger and more mature CLI/spec/tooling distribution (latest `0.5.1`, Apache-2.0, started November 2025, broad command surface) [R57] [R58]. Last-week npm downloads are currently `182` [R59].

Interpretation: OSSA is a **contract-centric interoperability effort** combining schema, packaging/export, and compliance vocabulary. It is more mature than DUADP in version history and tooling depth, while still early by mainstream ecosystem metrics.

### 3) Security is the bottleneck, not experimentation

Security data shows substantial deployment pressure and governance lag:

- 81% of teams moved beyond planning, but only 14.4% report full security approval [R26] [R27].
- 88% reported confirmed or suspected AI-agent incidents [R26] [R27].
- Only about 22% treat agents as independent identities; shared API keys remain common [R26] [R27].

This aligns with NIST/NCCoE framing that agent identity, authorization, auditability, and prompt-injection controls require explicit architecture rather than ad hoc controls [R08]. It also aligns with MIT and HBR concerns around current maturity and risk posture [R09] [R07] [R17].

### 4) Academic/policy consensus: high capability growth, weak accountability norms

MIT AI Agent Index data highlights:

- accelerating deployment cadence,
- sparse safety reporting,
- concentrated model dependencies,
- and unresolved web-conduct standards [R10].

Harvard ecosystem work frames open protocols as a governance mechanism in a rapidly distributed “agentic web” where centralized control is limited [R11] [R18] [R31].

### 5) Framework market signal

By GitHub signal, the strongest open-source gravity currently sits with:

- AutoGen, CrewAI, LangGraph, OpenAI Agents SDK, LlamaIndex, LangChain ecosystem projects [R73] [R74].

Practical trend: teams increasingly build with mainstream orchestration frameworks while layering MCP/A2A/proprietary glue and then retrofitting security and observability.

## High-level opportunities

1. **Interoperability-first architecture**
   - Adopt modular layers rather than monolithic framework lock-in [R01] [R03] [R34].
2. **Identity-first governance**
   - Treat agents as first-class principals (unique IDs, scoped credentials, signed attestations) [R08] [R27].
3. **Progressive autonomy rollout**
   - Start with constrained autonomy, explicit approvals, and full tracing [R25] [R26].
4. **Contract-as-code discipline**
   - Use machine-validated manifests/schemas to align runtime behavior with compliance posture [R21] [R56].

## Major risks

- Prompt injection and indirect tool misuse [R29] [R30].
- Over-privileged credentials and weak agent identity isolation [R26] [R27].
- Fragmented standards causing brittle integration debt [R34] [R13].
- Governance theater: policy confidence without runtime coverage [R27].

## Confidence and limitations

- Most protocol/framework claims are based on official docs and repositories.
- Some business/analyst articles are partially paywalled (HBR), limiting extraction to visible summary content [R17].
- Blog-level adoption numbers (outside official org/repo/npm metrics) should be treated as directional, not canonical [R24B] [R25B].

