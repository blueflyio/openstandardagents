# Open-source frameworks and project ecosystem

## 1) What is mature enough for production now?

Based on repository maturity signals (stars, forks, activity), documentation completeness, and public platform announcements, the most production-ready framework layer in early 2026 is:

- **OpenAI Agents SDK**, **LangGraph**, **CrewAI**, **AutoGen**, **LlamaIndex**, plus vendor platforms such as **GitLab Duo Agent Platform**. [F1]-[F9]

## 2) Framework snapshots

| Framework / project | Main purpose | Notable primitives/features | Maturity signal (snapshot 2026-03-16) |
|---|---|---|---|
| OpenAI Agents SDK (Python) | Multi-agent workflow SDK | Agents, handoffs/agents-as-tools, guardrails, tracing; provider-agnostic incl. 100+ models claim via LiteLLM mention | ~20,032 stars [F1] |
| OpenAI Agents SDK (JS/TS) | JS/TS counterpart with voice + orchestration | Similar primitive model for JS ecosystem | ~2,470 stars [F2] |
| LangGraph | Low-level stateful agent orchestration | Durable execution, memory, human-in-the-loop, production deployment focus | ~26,518 stars [F3] |
| CrewAI | Multi-agent orchestration with crews + flows | Event-driven flows + autonomous crews; enterprise control-plane messaging | ~46,208 stars [F4] |
| AutoGen | Agentic programming framework | Multi-agent app framework, extensions, orchestration patterns | ~55,676 stars [F5] |
| LlamaIndex | Data-centric agent and RAG framework | Ingestion/indexing/RAG + workflow/agent constructs | ~47,699 stars [F6] |
| LangChain Agent Protocol | Framework-agnostic serving API | Runs/Threads/Store API semantics | ~530 stars [P14] |
| ANP | Agent network protocol implementation | DID-secure layered protocol approach | ~1,232 stars [P13] |
| A2A protocol repo | Interoperability protocol implementation | Agent cards + task/message/artifact model | ~22,553 stars [P8] |

> Star counts above are time-sensitive and should be treated as point-in-time indicators.

## 3) GitLab Duo Agent Platform (enterprise platform signal)

GitLab announced GA on **2026-01-15** for Duo Agent Platform, highlighting context-aware agentic chat, foundational agents (Planner, Security Analyst), custom agent catalog patterns, and MCP-based external connectivity. It also explicitly references Claude Code and Codex CLI integration paths in GA messaging and docs. [F7][F8][F9]

This is an important signal that agent systems are becoming a first-class DevSecOps platform concern, not only a sidecar assistant feature.

## 4) Cost and rollout considerations

The 47Billion practitioner analysis (secondary source) compares frameworks and recommends staged rollout, strong validation boundaries, and constrained complexity levels for reliability/cost control. It also warns that open-ended multi-agent architectures become expensive and hard to debug quickly. [B1]

Use this as operational guidance, not protocol truth.

## 5) DUADP + OSSA npm packages in this ecosystem

### `@bluefly/openstandardagents`

- Purpose: contract/spec tooling and export layer for agent manifests. [D5][D6][D7]
- npm latest at run: **0.5.0**; Apache-2.0; public package. [D7]
- Weekly downloads snapshot: **648**. [D8]

### `@bluefly/duadp`

- Purpose: TypeScript SDK for decentralized/federated agent discovery. [D1][D2][D3]
- npm latest at run: **0.1.4**; Apache-2.0; CLI exposed (`duadp`). [D3]
- Weekly downloads snapshot: **287**. [D4]

Interpretation: both packages are active and coherent in positioning, but currently much smaller than mainstream orchestration frameworks by adoption footprint.

## 6) “Parlay” note

I did not find a clearly dominant “Parlay” framework with strong 2026 ecosystem signals in this run. A likely related term in active circulation is **Parlant** (customer-facing agent control framework), which may be what some sources intended. Treat this as a naming ambiguity to validate before procurement decisions.
