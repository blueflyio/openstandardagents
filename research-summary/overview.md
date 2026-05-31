# Agentic AI ecosystem overview

Generated on 2026-05-31.

## Executive synthesis

The agent ecosystem is becoming a layered protocol stack rather than a single winning framework. MCP is consolidating as the agent-to-tool and agent-to-data interface; A2A is the main cross-agent task and capability protocol; AG-UI is emerging for agent-to-user-interface streams; ANP explores decentralized agent networking and identity; and OSSA/DUADP add an agent contract and discovery layer that the major transport protocols do not define [S01], [S03], [S05], [S06], [S09], [S11].

The two requested projects fit together as follows:

- OSSA, published as `@bluefly/openstandardagents`, is a portable YAML/JSON agent manifest specification and CLI. Its job is to define what an agent is: identity, role, tools, LLM config, trust boundaries, compliance metadata, human oversight, budgets, observability, and export targets. The latest npm package observed during research was 0.5.1, published 2026-03-28, with 23 versions, 75 dependencies, Apache-2.0 licensing, and 49 weekly downloads [S01], [S02].
- DUADP, published as `@bluefly/duadp`, is a federated discovery protocol and TypeScript SDK. Its job is to help agents, skills, and tools find each other across domains using DNS TXT records, `.well-known` endpoints, WebFinger-style lookup, federation/gossip, DIDs, signatures, and trust tiers. The npm package observed was 0.1.4, published 2026-03-09, with 5 versions, 7 dependencies, Apache-2.0 licensing, and 16 weekly downloads [S03], [S04].
- In short: OSSA defines the agent contract; DUADP discovers and verifies published agent resources. This is analogous to OpenAPI plus service discovery, not a replacement for MCP or A2A [S01], [S02], [S03], [S04].

## Why this matters in 2026

Universities and policy labs are framing agentic AI as a distributed, fast-moving infrastructure problem. Cornell's agentic AI curriculum moves from LLM fundamentals to RAG, tool-using agents, multi-agent workflows, MCP, governance, risk, security, and human oversight [S16]. Harvard's Agent Protocols Tech Tree argues that open protocols expose what builders agree on, as TCP/IP and DNS did for the early internet, and that agents are difficult to regulate because the recipe is simple: model, loop, and tools [S17]. MIT's 2025 AI Agent Index found that 24 of 30 prominent agents launched or received major agentic updates in 2024-2025, while only 4 of 13 high-autonomy agents disclosed agentic safety evaluations [S19].

The adoption curve is outpacing security maturity. Gravitee's 2026 survey of 919 executives and practitioners found 80.9% of technical teams past planning, only 14.4% with full IT/security approval, 88% with confirmed or suspected agent security/privacy incidents, and only 21.9% treating agents as independent identities [S36]. MIT Sloan separately warns that agentic AI is not ready for prime time because hallucinations and prompt injection still require human guardrails, while still expecting agents to handle most transactions in many large-scale business processes within five years [S20].

## Layered model of the ecosystem

| Layer | Main standards/projects | What it answers |
| --- | --- | --- |
| Agent contract | OSSA | What is this agent, what can it access, and under what governance rules? |
| Discovery and identity | DUADP, ANP, Web Bot Auth | How do agents find and verify each other or identify themselves on the web? |
| Tool/data access | MCP | How does an agent invoke tools, resources, prompts, and data sources? |
| Agent-to-agent work | A2A, legacy ACP, Agent Protocol variants | How do agents discover capabilities, delegate tasks, and exchange artifacts? |
| UI interaction | AG-UI, A2UI-style efforts | How does a backend agent stream state, text, tools, approvals, and progress into a user interface? |
| Runtime/framework | OpenAI Agents SDK, LangGraph, CrewAI, AutoGen/MAF, LlamaIndex, Parlant, GitLab Duo | How are actual workflows, state, memory, handoffs, guardrails, and observability implemented? |

The strategic pattern is separation of concerns. MCP should not become an agent identity system; A2A should not define an entire deployment manifest; a framework should not be the only place governance metadata lives. OSSA and DUADP are useful precisely because they address the missing manifest/discovery surfaces around the more mature transport protocols [S01], [S03], [S05], [S06].

## Key findings

1. **Agent protocols are complementary, not mutually exclusive.** 47Billion, AG-UI, A2A, and MCP sources converge on the same division: MCP for tools, A2A for agent collaboration, AG-UI for frontend interaction [S07], [S09], [S32].
2. **The contract layer is under-standardized.** OSSA is trying to make agent configuration portable the way OpenAPI made API descriptions portable: define once, validate, export to many runtimes and deployment targets [S01], [S02].
3. **Discovery is an open gap.** A2A has Agent Cards, ANP has DID-based networking, Web Bot Auth helps websites identify bots, and DUADP proposes DNS/WebFinger/gossip discovery for agent resources [S03], [S07], [S11], [S21].
4. **Security is mostly an identity and authorization problem.** The most recurring failures are over-permissioned agents, shared credentials, hardcoded authorization, prompt injection turning untrusted text into actions, weak observability, and after-the-fact audits [S22], [S36], [S37].
5. **Production reliability still needs conventional engineering.** Cost ledgers, circuit breakers, structured outputs, tool allowlists, HITL checkpoints, per-tool metrics, and rollout controls matter more than demo autonomy [S32], [S36], [S37].

## Recommended mental model

Treat agents as non-human, versioned software principals. Each agent should have a manifest, owner, identity, declared capabilities, bounded tools, explicit autonomy level, cost policy, audit configuration, and revocation path before it executes. In that model, OSSA supplies the manifest, DUADP supplies discovery and federation, MCP supplies tool access, A2A supplies cross-agent collaboration, AG-UI supplies user-facing event streams, and a runtime such as LangGraph, CrewAI, OpenAI Agents SDK, GitLab Duo, or Parlant supplies execution [S01], [S03], [S23], [S24], [S25], [S28], [S29].

## Folder guide

- `academia.md`: university and research-center findings.
- `protocols.md`: protocol comparison, including OSSA and DUADP.
- `frameworks.md`: open-source frameworks, platforms, npm packages, and repository metadata.
- `security.md`: risks, statistics, identity frameworks, and controls.
- `blogs.md`: industry-blog synthesis and production recommendations.
- `reading-list.md`: citation key, links, and source limitations.
