# Agentic AI ecosystem overview

As of June 7, 2026, the agent ecosystem looks less like a single product category and more like an early internet protocol stack. MCP connects agents to tools and data. A2A connects agents to other agents. AG-UI connects agents to user-facing applications. OSSA defines the portable agent contract, while DUADP proposes a federated discovery layer for finding signed agents, skills, and tools across domains [S01][S02][S25][S27][S30].

The central theme across the sources is fragmentation. Frameworks such as LangGraph, CrewAI, OpenAI Agents SDK, AutoGen/AG2, LlamaIndex, and Microsoft Agent Framework define different runtime abstractions. Enterprise platforms such as GitLab Duo Agent Platform embed agents into software delivery systems with their own catalogs, flows, governance, billing, and context models [S36][S38][S39][S44][S45]. OSSA is explicitly positioned as a contract layer for this M x N problem: define an agent once, then export or map it to deployment targets, protocol surfaces, and policy controls [S02][S03][S05].

## What DUADP and OSSA are

DUADP is the "DNS/WebFinger/gossip" side of the stack. It describes a decentralized discovery protocol where agents and nodes publish well-known metadata, resolve globally addressable agent IDs, use DIDs for cryptographic identity, federate registrations across peers, and expose REST/MCP operations for discovery, publishing, validation, federation, governance, and health [S01][S04]. Its live homepage says it indexes 36 registered resources, supports 17 MCP tools, and uses GAID handles, WebFinger resolution, DID documents, Ed25519 signatures, provenance, and Cedar policy inputs to derive trust tiers [S01].

OSSA is the "OpenAPI for agents" side of the stack. It is not a runtime, orchestration engine, or protocol like MCP/A2A. It is a spec-first manifest, schema, validator, CLI, and package for agent identity, role, tools, capabilities, governance metadata, discovery metadata, policy bindings, validation, and export targets [S02][S03]. The npm package `@bluefly/openstandardagents` version 0.5.6 was published June 3, 2026, requires Node.js 20+, exposes the `ossa` CLI, and ships v0.5 schemas, validation utilities, OpenAPI contracts, reference manifests, and a well-known discovery document [S03].

Together, OSSA and DUADP form a proposed identity-discovery-governance stack:

| Layer | Main artifact | Purpose | Current maturity |
| --- | --- | --- | --- |
| Identity and contract | OSSA manifest | Defines what the agent is, what it can do, what policies apply, and how to validate it | Early but packaged on npm; v0.5.6 stable per package page [S03] |
| Discovery and federation | DUADP node/registry | Resolves agents, skills, and tools across domains using well-known endpoints, WebFinger, gossip, DID identity, and trust tiers | Experimental; npm 0.1.7, low downloads [S04][S08] |
| Execution | Runtime/framework/platform | Runs the agent in LangGraph, CrewAI, GitLab, Kubernetes, Claude, Cursor, Drupal, or another target | External to OSSA/DUADP [S02][S03] |

## Why this matters

Academic and industry sources converge on the same risk: agents are easy to assemble but hard to govern. Harvard's Library Innovation Lab describes agents as "models using tools in a loop" and argues that, because the technique is widely replicable, open protocols may be one of the practical ways to shape agent behavior [S10]. MIT's AI Agent Index documents rapid deployment, autonomy increases, transparency gaps, closed-source concentration, and no established standards for how agents should behave on the web [S12][S13]. MIT Sloan warns that agentic AI is not ready for prime time because of hallucinations, mistakes, and prompt injection, while still expecting agents to handle most transactions in many large-scale business processes within five years [S15].

Security research and security surveys show the governance gap. Gravitee reports that 80.9% of technical teams have moved beyond planning into testing or production, but only 14.4% report full security/IT approval for all agents, 88% report confirmed or suspected incidents, and only 21.9% treat AI agents as independent identities [S48]. NIST/NCCoE has opened a concept project focused on applying identity standards and authorization best practices to software and AI agents, explicitly asking about identification, authorization, auditing, non-repudiation, and prompt-injection mitigation [S49].

## Protocol stack summary

The mature direction is not a single winner; it is layered interoperability:

- MCP: agent-to-tool and agent-to-context. JSON-RPC 2.0, hosts/clients/servers, tools/resources/prompts, and explicit consent/privacy/tool-safety principles [S25][S26].
- A2A: agent-to-agent collaboration. Agent Cards, tasks, messages, parts, artifacts, HTTP/SSE/JSON-RPC orientation, long-running task support, modality negotiation, and enterprise auth goals [S27][S28].
- AG-UI: agent-to-user-interface. Event streams, 16 standardized event types, state deltas, tool-call visualization, frontend tool calls, human-in-the-loop interrupts, and transport flexibility across SSE, WebSockets, webhooks, and HTTP streaming [S30][S31].
- ANP: identity/discovery/description for agent networks using JSON-LD, schema.org vocabulary, did:wba, signatures, and interface links to OpenAPI or JSON-RPC [S32].
- LangChain Agent Protocol: production serving API for runs, threads, agents, store/memory, streaming, and introspection, implemented as REST/OpenAPI and streaming primitives [S33].
- ACP: IBM BeeAI's agent communication protocol, now merged into A2A under Linux Foundation governance [S34].
- ATP: monday.com's code-first Agent Tool Protocol, which lets agents generate TypeScript/JavaScript code executed in isolated V8 sandboxes, with OpenAPI/MCP compatibility and provenance controls [S35].

## Framework and platform direction

Open-source frameworks are specializing. LangGraph is the durable graph/state/checkpointing option; CrewAI is the role/task/crew option; OpenAI Agents SDK is the lightweight primitive set for agents, handoffs, guardrails, sessions, HITL, tracing, MCP tools, sandbox agents, and realtime; LlamaIndex is strongest for document/RAG agents; Microsoft Agent Framework is Microsoft's consolidated Python/.NET path; AutoGen remains highly starred but is increasingly treated as legacy relative to Microsoft Agent Framework and AG2 [S36][S38][S39][S40][S41][S42][S43].

Enterprise platforms are integrating agents where context and governance already live. GitLab Duo Agent Platform makes the SDLC the control plane: Agentic Chat, Planner Agent, Security Analyst Agent, custom agents, external agents such as Claude Code and Codex CLI, foundational flows, MCP clients/servers, Knowledge Graph, sessions/logs, credits, and model/access controls [S44][S45].

## Key challenges

1. Identity is underdeveloped. Shared API keys and service accounts make accountability weak. NIST and Gravitee both emphasize agent identity as a core missing control [S48][S49].
2. Tool descriptions and retrieved content are untrusted. MCP explicitly warns that tool annotations/descriptions should be treated cautiously, and MCPShield classifies tool poisoning, rug pulls, cross-server leakage, privilege escalation, context manipulation, and protocol-level attacks [S26][S18].
3. Multi-agent systems multiply uncertainty. The arXiv communication survey treats user-agent, agent-agent, and agent-environment communication as separate risk zones and finds new risks such as privacy leakage, agent spoofing, bullying, and denial of service [S17].
4. Evaluation remains immature. MIT's index found that most safety/evaluation information is missing or not publicly disclosed; 25 of 30 indexed agents disclose no internal safety results and 23 of 30 have no third-party testing information [S12][S13].
5. Production costs and reliability are not solved by frameworks. 47Billion's engineering analysis argues that simple workflows and constrained tool-using agents are production-ready with guardrails, while open-ended multi-agent systems remain too unpredictable for critical paths [S46].

## Practical recommendations

- Treat every agent as a workload identity with explicit authorization boundaries, not as a shared human user or generic service account [S48][S49].
- Adopt standards by layer: MCP for tools/data, A2A for inter-agent delegation, AG-UI for frontend interaction, OSSA for manifest/governance portability, and DUADP for discovery pilots [S01][S02][S26][S28][S30].
- Start with narrow, measurable workflows. Use prompt chains, deterministic workflow branches, and single tool-using agents before open-ended multi-agent swarms [S46].
- Gate every tool call. Validate schemas, enforce least privilege, cap calls/costs, isolate filesystems and egress, require human approval for irreversible actions, and keep tamper-evident audit logs [S26][S48][S50].
- Use OSSA/DUADP as of June 7, 2026 as early infrastructure for pilots, internal standards, registry experiments, and governance modeling. Their npm adoption is early compared with MCP/A2A/LangGraph/CrewAI, so avoid relying on them as the sole enterprise control plane until conformance and ecosystem support grow [S03][S04][S07][S08].

## Report map

- `academia.md`: university and academic research.
- `protocols.md`: standards/protocol comparisons.
- `frameworks.md`: open-source frameworks, GitLab Duo, OSSA/DUADP packages.
- `security.md`: threat model, identity, governance, and controls.
- `blogs.md`: engineering and industry blog synthesis.
- `reading-list.md`: citation key map and limitations.
