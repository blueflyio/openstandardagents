# Agentic AI Landscape Overview (current as of May 14, 2026)

This folder summarizes current agentic AI research, protocols, frameworks, standards, security, and the OSSA/DUADP npm ecosystem. Citations use the source IDs defined in `reading-list.md`.

## Executive synthesis

Agentic AI is moving from "LLM plus tools" demos into production infrastructure, but the ecosystem is still missing settled standards for identity, authorization, discovery, web conduct, and portable governance. Harvard's Library Innovation Lab frames open protocols as the practical lever for shaping an agent ecosystem that is easy to recreate and therefore hard to regulate centrally [S08]. MIT's 2025 AI Agent Index reaches the same conclusion from the deployment side: 24 of 30 prominent agents launched or received major updates in 2024-2025, while web conduct standards remain unsettled and safety disclosure lags capability disclosure [S10].

The clearest architectural pattern is a layered stack:

| Layer | Main question | Representative standards |
| --- | --- | --- |
| Agent contract | What is this agent allowed to be and do? | OSSA, Agent Cards, signed manifests |
| Agent-to-tool | What tools and data can it use? | MCP |
| Agent-to-agent | How do agents delegate and coordinate? | A2A, ACP, ANP |
| Agent-to-user interface | How does progress, state, and approval reach users? | AG-UI |
| Discovery and trust | How do agents find and verify each other? | DUADP, ANP, DIDs, WebFinger |

## What DUADP and OSSA are

Open Standard for Software Agents (OSSA), published as `@bluefly/openstandardagents`, positions itself as the contract layer for agents: a schema-validated YAML/JSON manifest that describes identity, capabilities, tools, governance, lifecycle, security, trust metadata, and export targets [S01][S04]. It is explicitly not trying to replace MCP or A2A. It references them and adds the portable "what is this agent?" contract that can be exported to Docker, Kubernetes, LangChain, CrewAI, GitLab Duo, Claude/Cursor-style IDE environments, Drupal, MCP, A2A, and other targets [S01][S02][S04].

Decentralized Universal AI Discovery Protocol (DUADP), published as `@bluefly/duadp`, is the discovery layer: "DNS for AI agents." It combines DNS TXT records, WebFinger, gossip federation, Global Agent Identifiers (GAIDs), W3C DIDs, Ed25519 signatures, trust tiers, OSSA-native resource validation, REST endpoints, and MCP tools so agents, skills, and tools can be found across organizational boundaries [S03][S05][S06]. In short: OSSA defines the agent; DUADP helps other agents find and verify it.

Together, OSSA and DUADP address a gap not fully covered by MCP or A2A. MCP connects agents to tools, and A2A connects agents to agents, but neither fully defines portable identity, authorization, signed governance metadata, export fidelity, or decentralized discovery [S01][S02][S03][S13][S15].

## Protocol direction

MCP has become the default agent-to-tool protocol because it replaces fragmented custom connectors with secure, two-way client/server integrations between AI applications and data/tool servers [S13]. A2A, originally announced by Google in April 2025 and later donated to the Linux Foundation, is the most visible agent-to-agent coordination protocol, using HTTP, SSE, JSON-RPC, Agent Cards, task lifecycles, artifacts, and enterprise-grade auth patterns [S14][S15]. AG-UI fills the agent-to-frontend gap with event-based HTTP/WebSocket flows for streaming, state, interrupts, shared UI context, and human-in-the-loop approval [S16]. ACP provides a REST-native, SDK-optional agent messaging layer and is now being folded into A2A under Linux Foundation governance [S20]. ANP aims at a decentralized "agentic web" using DIDs, semantic descriptions, and multi-layer negotiation [S18][S25].

Recent academic protocol surveys agree that no single protocol covers the whole lifecycle. One arXiv survey recommends progressive adoption: MCP for tool access, ACP for structured messaging, A2A for collaborative task execution, and ANP for decentralized marketplaces [S41]. That recommendation maps closely to the OSSA/DUADP thesis: communication protocols need a contract and discovery layer around them.

## Framework direction

Open-source frameworks are converging around similar primitives: tool-calling loops, multi-agent handoffs, structured workflows, state/memory, observability, and human checkpoints. The OpenAI Agents SDK emphasizes a small primitive set: agents, handoffs/agents-as-tools, guardrails, and tracing [S26][S27]. LangGraph focuses on durable, stateful graph execution, persistence, streaming, and human-in-the-loop control [S28]. CrewAI separates controlled flows from autonomous crews [S29]. AutoGen provides AgentChat, Core, and Extensions, including MCP integration and distributed runtimes [S30]. LlamaIndex is strongest where agents are coupled to RAG, document workflows, and query engines [S31].

GitLab Duo Agent Platform shows the enterprise DevSecOps direction: context-aware agentic chat, foundational planner and security analyst agents, custom agent catalogs, external Claude Code and Codex integrations, agentic flows, credits-based usage, governance, visibility, and model selection [S32].

## Security and governance direction

Security is the main blocker to broad autonomy. NIST and NCCoE opened a 2026 initiative around software and AI agent identity and authorization, explicitly asking for standards around identification, authorization, auditing, non-repudiation, prompt-injection controls, and existing IAM frameworks such as OAuth, OIDC, SCIM, SPIFFE, and SPIRE [S12][S47]. Gravitee's 2026 survey of 900+ executives and practitioners shows why: 80.9% of teams are past planning, only 14.4% report full security approval, 88% report confirmed or suspected incidents, and only 21.9% treat agents as independent identities [S38].

The technical threat model is broader than prompt injection. ACM and arXiv surveys identify four recurring gaps: unpredictable multi-step user inputs, complex internal execution, variable operating environments, and interactions with untrusted external entities [S42]. Protocol-level risks include exploits against MCP, ACP, ANP, and A2A; security research catalogs more than 30 attack techniques spanning prompt injection, long-context hijacking, multimodal attacks, model/backdoor compromise, retrieval poisoning, privacy attacks, and protocol vulnerabilities [S43].

## Practical recommendations

1. Treat agents as first-class identities, not shared API keys or invisible service accounts [S12][S38][S39].
2. Use MCP for tool access, but place authorization, validation, rate limits, auditing, and human approvals at the tool gateway [S13][S39].
3. Use A2A only when independent agents need task delegation or cross-vendor/cross-organization coordination; do not add it to simple single-agent apps prematurely [S14][S15][S36].
4. Use AG-UI when users need real-time progress, state, tool visualization, interrupts, approvals, or rich frontend interaction [S16].
5. Use OSSA to make agent identity, capabilities, policies, compliance, cost controls, and export targets explicit and portable [S01][S02][S04].
6. Use DUADP when agents, tools, or skills must be discoverable across domains or registries with trust evidence [S03][S05][S06].
7. Start with narrow, testable agents and progressive autonomy. Human-in-the-loop is a trust pattern, not a temporary embarrassment [S36][S37].

## Limitations

Firecrawl was unavailable in this automation environment because the CLI required unattended browser authentication. Public web search/fetch tools, npm metadata, and local package documentation were used instead. Some sources are vendor blogs rather than peer-reviewed research; those are separated in `blogs.md` and paired with primary sources wherever possible.
