# Overview: agentic AI, protocols, standards, and security in 2026

Prepared on 2026-06-05. This overview synthesizes the detailed notes in the other files in this folder. Citation keys resolve in [reading-list.md](./reading-list.md).

## Executive synthesis

The agent ecosystem is separating into layers that resemble early internet infrastructure. MCP standardizes how agents connect to tools and data; A2A standardizes how agents exchange tasks; AG-UI standardizes agent-to-frontend event streams; ANP and DUADP address identity, discovery, and federation; and OSSA defines a portable manifest/contract for what an agent is, how it is governed, and how it can be exported across runtimes [S01], [S03], [S07], [S08], [S10], [S12]. The strongest takeaway is that no single protocol is becoming "the" agent standard. The emerging pattern is a stack of complementary standards.

OSSA and DUADP are best understood as infrastructure layers above and beside the mainstream agent protocols. OSSA is not a framework like CrewAI or LangGraph and not a transport protocol like MCP or A2A. It is a contract layer for identity, capabilities, tools, compliance, lifecycle, security metadata, and export targets. Its public site frames the gap directly: "MCP connects tools. A2A connects agents. Neither defines the contract" [S01]. DUADP fills the discovery layer: a federated, DNS/WebFinger/gossip-style "phonebook" for agents, backed by GAIDs, W3C DIDs, signatures, trust tiers, and MCP/REST endpoints [S03]. The local repository summarizes the relationship as: "OSSA defines the agent. DUADP discovers it" [S05].

The academic and policy literature is converging on the same concern: agents are easy to build but hard to govern once they can act. Cornell's agentic AI curriculum moves from LLM fundamentals and RAG into tool-using agents, multi-agent workflows, MCP, governance, security, and human oversight [S18]. Harvard Library Innovation Lab treats open protocols as the levers that can shape agent behavior because protocols determine what is easy to build [S20]. MIT's 2025 AI Agent Index documents high autonomy and poor transparency: 25 of 30 indexed agents disclosed no internal safety results and 23 of 30 disclosed no third-party testing [S22], [S23]. MIT Sloan's 2026 guidance says agentic AI is not ready for prime time because hallucinations, mistakes, and prompt injection still require human guardrails [S24].

Security research shows adoption has outrun governance. Gravitee's 2026 survey reports that 81% of teams are past planning, but only 14.4% have full security approval for the entire agent fleet; 88% reported confirmed or suspected incidents; only 21.9% treat agents as independent identities; and 45.6% still rely on shared API keys for agent-to-agent authentication [S38], [S39]. NIST/NCCoE's 2026 concept paper therefore focuses on applying identity and authorization standards to software and AI agents, including identification, authentication, authorization, auditing, non-repudiation, and controls for prompt injection [S25].

## What these things are

| Layer | Representative projects | Primary question answered |
| --- | --- | --- |
| Contract and governance | OSSA, Cedar policy bindings, signed manifests | What is this agent, what can it do, and what rules govern it? [S01], [S02] |
| Discovery and identity | DUADP, ANP, WebFinger, DIDs | Where is the agent, how do I resolve it, and how do I verify who published it? [S03], [S12] |
| Agent-to-tool access | MCP | How does an agent safely discover and call tools, data, and workflows? [S07] |
| Agent-to-agent work exchange | A2A, ACP legacy | How do independent agents discover each other's capabilities and exchange tasks? [S08], [S09], [S15], [S16] |
| Agent-to-user interface | AG-UI | How do agent backends stream typed events and accept user interaction in apps? [S10], [S11] |
| Runtime/frameworks | LangGraph, CrewAI, OpenAI Agents SDK, LlamaIndex, AutoGen/MAF | How do developers implement state, tools, memory, handoffs, workflows, and observability? [S26], [S28], [S30], [S32] |
| Platform/catalog | GitLab Duo Agent Platform, AI catalogs, registries | How are agents packaged, shared, selected, and triggered in an enterprise workflow? [S34], [S35] |

## OSSA and DUADP in one sentence each

- OSSA is the OpenAPI-like contract layer for agents: a schema, validator, CLI, manifest model, policy/governance metadata, and export bridge across frameworks and platforms [S01], [S02].
- DUADP is the DNS/WebFinger/gossip discovery layer for agents: a way to publish, search, resolve, validate, federate, revoke, and govern agent/skill/tool resources across domains [S03], [S04].

Together, they address an infrastructure gap that MCP and A2A intentionally do not solve. MCP can tell an agent how to call a tool; A2A can tell one agent how to communicate with another; OSSA tells a runtime what the agent is allowed to be and do; DUADP tells the ecosystem where to find it and how to evaluate trust evidence [S01], [S03], [S05].

## Trends through 2026-06-05

1. **Protocol specialization is accelerating.** MCP, A2A, AG-UI, ANP, DUADP, Agent Protocol, and ATP all solve different boundaries. The useful comparison is not "which wins" but "which boundary does this govern?" [S07], [S08], [S10], [S12], [S13], [S17].
2. **Open governance matters.** A2A moved from Google-originated launch to Linux Foundation hosting, reported 150+ supporting organizations, and reached v1.0.1 by late May 2026 [S08], [S09]. ACP, originally IBM/BeeAI, merged into A2A rather than continuing as a competing agent-to-agent standard [S15], [S16].
3. **Frameworks are maturing around reliability primitives.** LangGraph emphasizes durable execution, persistence, streaming, and human-in-the-loop; OpenAI Agents SDK emphasizes agents, handoffs, guardrails, tracing, and provider-agnostic models; CrewAI separates autonomous crews from production flows; LlamaIndex emphasizes RAG-grounded workflows; AutoGen is now maintenance-mode in favor of Microsoft Agent Framework [S26], [S28], [S30], [S31], [S32].
4. **Security has moved from prompt policy to runtime governance.** OWASP's Agentic Top 10, MCP tool-poisoning research, and NIST's agent identity project all point away from "ask the model to behave" and toward identities, scoped credentials, signed metadata, policy enforcement, sandboxing, audit logs, revocation, and human approval for high-impact actions [S25], [S41], [S42], [S43].
5. **The web is becoming agent-mediated.** MIT's Agent Index found unsettled standards for web conduct, while bot-traffic sources report that automated traffic now exceeds human traffic and AI-driven automation is growing rapidly [S22], [S44], [S46]. HTTP-level agent authentication proposals such as the HTTP Agent Profile suggest that agent traffic may need protocol-native identity, signatures, and access economics rather than CAPTCHA-only defenses [S45].

## Practical architecture recommendation

For a production agent platform in 2026, use a layered architecture:

1. Define every agent with an OSSA-style manifest or equivalent contract: identity, capabilities, declared tools, autonomy bounds, observability, governance, policy bindings, version, and provenance [S01], [S02].
2. Publish and discover agents through DUADP-style well-known endpoints, WebFinger, DIDs, signatures, federation, trust tiers, and revocation evidence [S03], [S04], [S06].
3. Use MCP for tool and data access, but treat MCP server metadata and tool responses as untrusted input until validated [S07], [S41], [S42].
4. Use A2A only at the boundary where independent agents need to discover, delegate, stream progress, and exchange task artifacts [S08], [S09].
5. Use AG-UI when a user-facing app needs real-time agent state, text deltas, tool-call events, interrupts, and bidirectional interaction [S10], [S11].
6. Put policy enforcement outside the model loop: least-privilege credentials, action classification, high-risk approval gates, deterministic schema validation, nonces/timestamps/signatures, trace IDs, and kill switches [S25], [S38], [S40], [S43].

## Open issues and limitations

- Standards remain immature and overlapping. A2A has strong public adoption; MCP is widely implemented; AG-UI, ANP, DUADP, ATP, and OSSA are promising but still emerging and need more independent conformance tests [S01], [S03], [S09], [S10], [S12], [S17].
- Security evidence is uneven. MIT's Index shows broad transparency gaps, and Gravitee shows that enterprise controls are not keeping up with deployment [S22], [S23], [S38].
- Source availability varies. Some pages timed out or were only available via search snippets; these are marked in the reading list. A specific Harvard policy-review page matching every bot-traffic claim in the prompt was not located, so the report cites Harvard LIL for protocol-policy framing and uses Imperva/Malwarebytes, HUMAN Security, and the HTTP Agent Profile draft for bot-traffic and protocol-level web-governance claims [S20], [S44], [S45], [S46].
