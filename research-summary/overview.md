# Agentic AI Protocols, Standards, Frameworks, and Security - Overview

Date of research: 2026-06-06.

## Executive synthesis

The agent ecosystem is separating into layers. MCP standardizes how models and agents reach tools and data; A2A standardizes task exchange between agents; AG-UI standardizes live agent-to-frontend event streams; ANP and DUADP address discovery and open-network federation; OSSA provides a portable manifest contract describing what an agent is, what it can do, and which governance controls apply. The recurring theme is that production agent systems need contracts, identity, discovery, observability, and deterministic control points, not only better prompts. [S01] [S02] [S03] [S04] [S05] [S06] [S07]

DUADP and OSSA are part of the Bluefly ecosystem but solve different layers. DUADP is positioned as "DNS for AI agents": federated discovery using well-known endpoints, DNS/WebFinger, gossip, GAIDs, DIDs, signatures, trust tiers, and MCP/REST surfaces. OSSA is positioned as "OpenAPI for agents": a schema and CLI for validating portable YAML manifests across frameworks and platforms. DUADP answers "where is this agent/capability and can I trust its publication path?"; OSSA answers "what is this agent, what does it declare, and what policy/governance metadata applies?" [S05] [S06] [S43] [S44]

The public standards conversation is still young. Harvard's Agent Protocols Tech Tree frames protocols as the practical levers that reveal what builders have converged on and that may shape agent behavior, similar to how TCP/IP, DNS, and HTTP shaped the internet. MIT's AI Agent Index documents rapidly increasing autonomy, but also severe gaps in safety disclosure, third-party testing, web conduct norms, and agent-specific system cards. [S10] [S11] [S12]

Security research and industry surveys are converging on the same conclusion: agents must be treated as non-human identities with scoped, auditable authority. NIST/NCCoE's 2026 concept paper asks how identity, authorization, audit, non-repudiation, and prompt-injection controls should be applied to software and AI agents. Gravitee's 2026 survey reports that 81% of teams are beyond planning, but only 14.4% have full security approval; 88% report confirmed or suspected incidents; and fewer than 22% treat agents as independent identities. [S15] [S16]

## What these systems are about

### DUADP

DUADP, the Decentralized Universal AI Discovery Protocol, is a discovery and federation layer. It lets agent registries publish resources under standard HTTP endpoints, resolve GAID handles through WebFinger and DIDs, verify signatures, search across peers, and expose the discovery surface through REST and MCP tools. The npm package `@bluefly/duadp` 0.1.7 is the current TypeScript SDK on npm as of this research date. It provides a typed client, Express router, validation, Ed25519 signing/verification, DID resolution, and conformance tooling. [S05] [S43]

### OSSA

OSSA, the Open Standard for Software Agents, is a contract layer, not a runtime. It defines schemas, validation utilities, CLI commands, manifest concepts, export targets, and metadata for identity, roles, tools, capabilities, workflows, registries, and policy bindings. The npm package `@bluefly/openstandardagents` 0.5.6 is the current stable npm release as of this research date; this checkout's `package.json` currently reports 0.5.1, so the local branch is behind the public package. [S06] [S44]

### Protocol stack in one sentence

Use MCP for tool/data access, A2A for agent-to-agent task delegation, AG-UI for user-facing event streams, OSSA for portable agent manifests and governance metadata, DUADP/ANP for discovery and open-network identity, and deterministic policy enforcement for any real authority or side effect. [S01] [S02] [S04] [S05] [S06] [S07] [S18]

## Major opportunities

- Reduce M x N integration cost with portable manifests and protocol adapters rather than bespoke framework/platform definitions. [S06] [S44]
- Make registries and marketplaces interoperable through well-known discovery, WebFinger, DIDs, and signed manifests. [S05] [S43]
- Let frontends subscribe to standard event streams instead of building custom WebSocket protocols for every agent backend. [S04]
- Improve production reliability using graph/state machines, checkpoints, human interrupts, tracing, cost budgets, and progressive rollout. [S23] [S24] [S29]
- Build enterprise security around independent agent identities, least privilege, scoped delegation, policy-as-code, and append-only audit trails. [S15] [S16] [S18] [S19]

## Major challenges

- Web conduct standards remain unsettled. MIT's index found no established standard for how agents should behave on the web, and many agents omit clear disclosure on robots.txt, CAPTCHA handling, and anti-bot behavior. [S12]
- Safety transparency is weak. The 2025 AI Agent Index found that 25 of 30 agents disclosed no internal safety results and 23 of 30 had no third-party testing information. [S12]
- Protocols do not automatically provide security. MCP, for example, standardizes tool access, but research identifies tool poisoning, installer spoofing, unauthorized access, and related threat classes. [S17] [S20]
- Production frameworks often make agents easy to build before they make them safe to operate. Blogs and security guides repeatedly recommend deterministic tool-call mediation, human approval for high-impact actions, and observability as mandatory production layers. [S18] [S27] [S28]

## Practical recommendations

1. Start with a bounded workflow, not an open-ended multi-agent swarm. Define task completion, failure modes, cost budgets, and human escalation before adding autonomy. [S27] [S29]
2. Publish an agent contract. For this ecosystem, OSSA is the natural manifest layer; include identity, tools, capabilities, governance metadata, cost limits, and policy bindings. [S06] [S44]
3. Use standards incrementally. Add MCP where agents need tools; add A2A where independent agents coordinate; add AG-UI when the frontend must follow agent state; add DUADP/ANP when agents must be discoverable across registries or organizations. [S01] [S02] [S04] [S05] [S07]
4. Treat agents as identities. Avoid shared API keys; give agents first-class identities, scoped credentials, revocation, logs, and task-specific delegation. [S15] [S16] [S30]
5. Put a deterministic policy enforcement point between reasoning and action. Validate tool parameters, enforce allowlists/default-deny policy, require approval for irreversible operations, and log the full trace. [S18] [S19] [S20]

## Source limitations

Some requested items were not fully available as primary sources. "Parlay" did not surface as a clearly maintained, mainstream open-source agent framework comparable to LangGraph, CrewAI, AutoGen, or LlamaIndex; search results pointed mostly to research/negotiation uses and unrelated projects, so it is noted as a limitation in `frameworks.md`. HBR content is partly paywalled; available article metadata and secondary summaries were used for the high-level trust-gap points. Firecrawl CLI could not be used because the VM lacked authentication and browser login required a human session; sources were collected with available read-only web retrieval tools instead.
