# Agentic AI Research Summary (2025-2026)

Prepared on March 14, 2026.

## Executive synthesis

The agent ecosystem now looks like a pre-standard internet layer: model/tool connectivity standards (MCP), agent-to-agent exchange (A2A/ACP), UI event transport (AG-UI), and discovery/trust overlays (DUADP, ANP) are all evolving in parallel without a single dominant governance baseline yet. [T01][T07][T09][T11][T13][T16]

Two projects you explicitly asked about are central in this report:

- **DUADP (duadp.org)**: a decentralized discovery protocol for agents, skills, and tools, positioned as a DNS-like layer for agent ecosystems and shipped as `@bluefly/duadp` on npm. [T01][T03][T05]
- **Open Standard Agents / OSSA (openstandardagents.org)**: a manifest/contract specification that aims to be “OpenAPI for agents,” with CLI and export tooling distributed as `@bluefly/openstandardagents`. [T02][T04][T06]

## What the ecosystem is converging on

1. **Layered interoperability instead of one protocol**
   - MCP standardizes model-to-tool/data context exchange. [T07][T08]
   - A2A/ACP standardize agent-to-agent task/message exchange. [T09][T10][T16]
   - AG-UI standardizes agent-to-frontend event streaming. [T11][T12]
   - DUADP/ANP address discovery, identity, and network semantics across organizations. [T01][T13][T14]
   - OSSA attempts to standardize agent contracts/deployment metadata between protocols and runtime frameworks. [T02][T04][T06]

2. **Rapid buildout, slower governance**
   - MIT’s 2025 Agent Index shows strong feature growth but weak safety transparency and no settled web-conduct standards for agents. [T20]
   - Gravitee’s 2026 survey reports high deployment momentum with major control gaps (security approval, identity isolation, incident prevalence). [T23]
   - NIST/NCCoE is actively developing identity/authorization guidance for autonomous software and AI agents. [T22]

3. **Universities and policy groups are shifting from “whether” to “how”**
   - Cornell: workforce-oriented architecture training from LLM foundations through RAG, agent frameworks, governance, and risk. [T18]
   - Harvard (LIL/Berkman): open protocol mapping (APTT), institutional design, and governance-by-protocol framing. [T19][T25][T40]
   - MIT: deployment reality checks plus structured transparency benchmarking and governance mapping. [T20][T21][T39]

## Core risks and control priorities

Most serious operational risks remain:

- prompt injection and context poisoning,
- over-privileged tool access and weak authorization boundaries,
- hallucinated autonomous actions,
- weak agent identity/accountability and shared credentials,
- low observability across multi-agent chains. [T22][T23][T24][T37][T38]

Practical control priorities repeatedly recommended across sources:

- identity-first architecture for agents (unique principals, auditable delegation),
- least-privilege authorization with policy enforcement before tool execution,
- strong tracing/telemetry and replayable logs,
- human-in-the-loop checkpoints for high-impact actions,
- protocol standardization to reduce bespoke, unreviewed integrations. [T22][T23][T24][T29][T35][T36]

## Bottom line

Agentic AI is moving quickly into production, but **interoperability and security maturity are still uneven**. Teams that adopt open protocols plus explicit contract/identity controls early (rather than ad hoc integrations) are better positioned to scale safely over 2026-2027. [T07][T09][T22][T23][T35]

---

## Citation keys

Use `reading-list.md` for full bibliographic entries of keys `[T01]` through `[T40]`.
