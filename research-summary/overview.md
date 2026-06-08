# Agentic AI protocols, OSSA, DUADP, and security: overview

_Last updated: June 8, 2026._

## Executive synthesis

The agent ecosystem is separating into layers. MCP gives agents a standard way to reach tools and data. A2A, ACP, ANP, and related protocols define how agents discover and coordinate with other agents. AG-UI defines an event stream for agent-to-user interfaces. OSSA adds a missing contract layer: a portable manifest for identity, capabilities, lifecycle, security, governance, compliance, and deployment export. DUADP/UADP adds a discovery layer: a DNS/WebFinger/gossip-style network that lets agents, skills, tools, and marketplaces find each other across domains. [S01] [S02] [S13] [S14] [S16] [S17] [S18] [S19]

Openstandardagents.org describes OSSA as "the missing agent contract" between MCP and A2A: MCP says what an agent can use, A2A says how agents communicate, and OSSA says what the agent is, how it is governed, and where it can be deployed. The public site reports v0.5.6, 23+ export targets, 10 MCP tools, Apache-2.0 licensing, and production/beta maturity labels across LangChain, MCP, Docker, Kubernetes, GitLab Duo, npm, CrewAI, Claude Code, Cursor, Drupal, AutoGen, Semantic Kernel, and more. [S02]

The local checkout is @bluefly/openstandardagents v0.5.1 on branch feature/ai-agent-ecosystem-research-ac40, while npm reports @bluefly/openstandardagents latest v0.5.6 published on June 3, 2026. The local package.json describes OSSA as "the infrastructure bridge between agent protocols (MCP, A2A) and deployment platforms" with schema, validation, generation, migration, mesh, agent-card, SDK, trust, and workspace validation exports. The npm package narrows the public description to "Spec-first schemas, validator, and CLI" and exposes schemas, workflow/registry/policy-binding schemas, validation, and well-known metadata. [S03] [S06]

Duadp.org describes DUADP as "DNS for AI Agents": federated discovery via DNS TXT records and WebFinger, gossip federation, DID identity, OSSA-native manifests, MCP tooling, governance endpoints, and trust tiers. npm reports @bluefly/duadp v0.1.7 published on June 3, 2026 with TypeScript client, server, validation, crypto, DID, conformance, and fleet subpath exports. The package README says any system implementing the standard HTTP endpoints can become a DUADP node, and it positions DUADP as a decentralized discovery, publishing, validation, and federation protocol for agents, skills, tools, and marketplaces. [S01] [S07]

The main technical risk is not that agents are hard to build; it is that they are easy to build without identities, least-privilege permissions, runtime authorization, transparent safety evaluations, and cost circuit breakers. MIT's 2025 AI Agent Index finds rapid release acceleration, rising autonomy, a transparency gap, no settled web-conduct standards, and limited agent-specific safety disclosure. NIST/NCCoE's February 2026 concept paper focuses on agent identity, authorization, auditing, non-repudiation, and prompt-injection controls. Gravitee's 2026 survey reports that 81% of teams are past planning, only 14.4% have full security approval, 88% report confirmed or suspected security/privacy incidents, and only 21.9% treat agents as independent identities. [S10] [S12] [S29]

## What these systems are about

| Layer | Representative standards | Main question answered | Status in 2026 |
|---|---|---|---|
| Contract and governance | OSSA | What is this agent, what can it do, and how is it governed/deployed? | BlueFly OSSA package/site, npm latest v0.5.6; local repo v0.5.1. [S02] [S03] [S06] |
| Discovery and federation | DUADP/UADP, ANP | How can agents, skills, tools, nodes, and marketplaces find and verify each other? | DUADP npm v0.1.7; UADP draft docs in repo; ANP GitHub active with DID/meta-protocol/application layers. [S01] [S04] [S05] [S07] [S17] |
| Tool/data access | MCP, ATP | How does an agent access tools, APIs, files, databases, and external systems? | MCP widely adopted; ATP experiments with sandboxed code execution and API aggregation. [S13] [S20] |
| Agent-to-agent messaging | A2A, ACP, Agent Protocol | How do agents delegate, stream, collaborate, and expose run/thread state? | A2A has Linux Foundation backing and broad partner support; ACP is lightweight REST; LangChain Agent Protocol standardizes runs/threads/store. [S14] [S15] [S18] [S19] |
| Agent-to-user interface | AG-UI | How does an agent stream state, text, tools, and UI events to a frontend? | Active open protocol with event-based HTTP/SSE/WebSocket patterns. [S16] |
| Execution frameworks | OpenAI Agents SDK, LangGraph, CrewAI, LlamaIndex, Microsoft Agent Framework | How do developers build and operate agent workflows? | Fast-moving, with thousands of stars and increasing emphasis on durable execution, guardrails, HITL, tracing, and production deployment. [S21] [S22] [S23] [S24] [S25] |

## Key takeaways

1. **OSSA and DUADP are complementary, not substitutes for MCP or A2A.** OSSA is a portable manifest and contract; DUADP is discovery/federation; MCP and A2A are runtime protocols for tool access and agent communication. [S01] [S02] [S03]
2. **The open protocol stack is becoming layered.** MCP, A2A, AG-UI, ACP, ANP, and Agent Protocol overlap at the edges, but each has a different center of gravity: tools, agents, UI, REST messaging, secure network identity, or production run management. [S13] [S14] [S16] [S17] [S18] [S19]
3. **Security is shifting from model prompts to runtime control planes.** Current recommendations converge on agent identity, task-scoped credentials, deterministic pre-action authorization, tool validation, audit logs, human approval gates, and sandboxing. [S12] [S29] [S30] [S31] [S32]
4. **Transparency is still weak.** MIT found that only 4 of 13 high-autonomy agents disclosed any agentic safety evaluations, 25 of 30 disclosed no internal safety results, and 23 of 30 had no third-party testing information. [S10]
5. **Production economics matter.** Blogs and production playbooks emphasize cost budgets, loop detection, circuit breakers, conservative rollout, structured output validation, and monitoring before broad deployment. [S27] [S33]

## Recommended mental model

Use OSSA as the "agent contract" that defines identity, capabilities, policy, compliance, lifecycle, and export targets. Use DUADP as the "agent phonebook" that lets a contract-bearing agent, skill, or tool be found and verified across domains. Use MCP to connect agents to tools/data, A2A/ACP/ANP/Agent Protocol to connect agents to other agents or runtime servers, AG-UI to connect agents to frontends, and framework runtimes such as LangGraph, CrewAI, OpenAI Agents SDK, LlamaIndex, or Microsoft Agent Framework to implement behavior. [S01] [S02] [S13] [S14] [S16] [S17] [S18] [S19] [S21] [S22] [S23] [S24] [S25]
