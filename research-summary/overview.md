# Overview: Agentic AI Protocols, Standards, Frameworks, and Security

Prepared: 2026-05-13.

## Executive synthesis

The agent ecosystem is splitting into layers. MCP standardizes how agents reach tools and context [S30]. A2A standardizes how agents coordinate tasks with other agents [S32]. AG-UI standardizes how agent runs stream state and interaction events to frontends [S34]. ANP, DUADP, and related discovery protocols focus on identity, capability discovery, and federated registries for an "agentic web" [S01, S36]. OSSA sits at a different layer: it is a portable agent contract and packaging/deployment manifest, not a tool or messaging protocol [S03, S04, S05].

The most important finding is that interoperability is advancing faster than trust infrastructure. MIT's 2025 AI Agent Index reports accelerating agent releases, rising autonomy, weak safety disclosure, and no settled standards for web conduct [S13]. NIST/NCCoE is now explicitly asking how identity and authorization standards should apply to software and AI agents [S72 indirectly, S14 context, S10 education]. Gravitee's 2026 survey found 80.9% of technical teams past planning, but only 14.4% with full security/IT approval and only 21.9% treating agents as independent identities [S72].

## What DUADP and OSSA are

DUADP is a decentralized discovery layer for AI agents, skills, tools, and registries. Its own positioning is "DNS for AI agents": DNS TXT records, WebFinger, well-known endpoints, gossip federation, GAIDs, DIDs, signatures, and trust tiers help agents find other agents or capabilities without a single central marketplace [S01, S02]. Its TypeScript SDK exposes client, server, validation, crypto, DID, and conformance subpaths, and the reference API surface includes discovery manifests, WebFinger, registries for skills/agents/tools, publish/validate endpoints, and federation endpoints [S02].

OSSA is a portable contract layer for agent definition, governance, export, and deployment. It defines schema-validated YAML manifests that can reference MCP servers, support A2A agent cards or messaging, carry identity/governance/security metadata, and export to deployment targets such as Docker, Kubernetes, LangChain, CrewAI, GitLab Duo, Claude/Cursor-oriented artifacts, npm, MCP, and A2A [S03, S04, S05]. In short: OSSA defines what an agent is and what it may do; DUADP helps discover where that agent or skill is published.

## Why standards matter now

Academic and policy sources converge on the same pressure point: agents are easy enough to build that governance cannot rely on controlling a small number of vendors. Harvard LIL frames open protocols as the visible "x-ray" of what builder communities agree on, analogous to TCP/IP, SMTP, DNS, HTTP, and SSL in the early internet [S11]. Cornell's Agentic AI Architecture curriculum now teaches a progression from LLM fundamentals and RAG to tool-using agents, multi-agent workflows, MCP, governance, risk, security, and human oversight [S10]. MIT Sloan warns that hallucinations and prompt-injection attacks make broad agentic AI deployment premature, while still expecting agents to handle most transactions in many large-scale processes within five years [S14].

## Key architecture themes

1. **Layering beats protocol maximalism.** MCP, A2A, AG-UI, ACP, ATP, ANP, DUADP, LangChain Agent Protocol, and OSSA are not interchangeable. Each answers a different question: tool access, peer coordination, UI interaction, REST invocation, code-based tool execution, open-network identity, decentralized discovery, run management, or portable contract definition [S18, S30-S41].
2. **Identity is becoming the control plane.** DUADP, ANP, NIST/NCCoE, OSSA, and Gravitee all point toward agent-specific identities, DIDs, signatures, scoped authorization, provenance, and revocation [S01, S02, S03, S36, S37, S72].
3. **Human-in-the-loop is production infrastructure.** OpenAI Agents SDK, LangGraph, CrewAI, AG-UI, 47Billion's production lessons, Cornell, MIT Sloan, and security guides all treat approval gates and intervention as necessary for high-impact actions [S10, S14, S34, S50, S53, S56, S70, S73].
4. **Cost is architectural.** 47Billion reports simple workflows at roughly $0.10-$0.50 per task, structured CrewAI multi-agent tasks at $0.50-$2.00, and open-ended AutoGen-style multi-agent tasks at $2.00-$5.00 [S70]. ATP's thesis is that code execution can cut token-heavy tool loops by filtering, mapping, and aggregating data inside a sandbox rather than routing every operation through an LLM [S40, S41].
5. **Observability must trace decisions, not just requests.** The best frameworks now emphasize tracing, run histories, threads, stores, event streams, and audit logs. This is visible in OpenAI Agents SDK tracing, LangGraph/LangSmith, LangChain Agent Protocol, AG-UI events, GitLab governance visibility, OSSA manifests, and Gravitee's monitoring gap data [S34, S38, S50, S53, S64, S72].

## Current maturity map

| Layer | More mature | Emerging | Main gap |
|---|---|---|---|
| Tool/context | MCP, MCP SDK | ATP as code-execution alternative | Permission and supply-chain hardening |
| Agent-to-agent | A2A, ACP | ANP | Cross-domain trust and revocation |
| Agent-to-UI | AG-UI | A2UI/generative UI specs | Consistent frontend safety semantics |
| Contract/deploy | OSSA | Oracle Agent Spec interop, DUADP registry flows | Conformance and adoption scale |
| Runtime/framework | OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex | Parlant, specialized coding agents | Evaluation and predictable autonomy |
| Governance/security | NIST/NCCoE, OWASP-style controls, Gravitee findings | DID/GAID trust meshes | First-class agent identity |

## Practical recommendations

- Treat each agent as a separate security principal. Avoid shared API keys; use scoped credentials, audit trails, and revocation [S72].
- Start with the narrowest autonomy level that solves the problem. Prefer deterministic workflows and single tool-using agents before open-ended multi-agent systems [S70].
- Use MCP for tool exposure, A2A or ACP for coordination, AG-UI for frontend streaming, and OSSA for portable manifests. Use DUADP/ANP-style discovery when agents must find capabilities across organizational boundaries [S01, S03, S18, S30, S32, S34, S36, S38, S39].
- Enforce guardrails outside the prompt: policy checks, tool allow-lists, structured input validation, sandboxing, cost limits, and human approvals [S03, S41, S70, S73].
- Build evaluation around trajectories. Output-only tests miss tool loops, delegation chains, retries, memory updates, and protocol abuse [S19, S20, S70].

## Bottom line

Agentic AI is moving from demos to infrastructure, but the ecosystem still resembles the early web: fast protocol invention, fragmented implementation, and incomplete governance. The strongest near-term architecture is layered and conservative: portable agent contracts (OSSA), discovery and identity (DUADP/ANP), tool access (MCP), agent coordination (A2A/ACP), user interaction (AG-UI), and security controls that make identity, authorization, provenance, monitoring, and human oversight explicit.
