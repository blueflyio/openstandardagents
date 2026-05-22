# Overview: Agentic AI Protocols, Standards, Frameworks, and Security

Prepared on May 22, 2026. Citations use the source IDs in [reading-list.md](reading-list.md).

## Executive summary

The agent ecosystem is splitting into layers. MCP standardizes agent-to-tool and agent-to-data access; A2A standardizes agent-to-agent task exchange; AG-UI standardizes agent-to-user application streaming; ANP and DUADP address discovery and identity; and OSSA defines the portable agent contract that can reference these protocols and export to runtimes and platforms [S01][S02][S17][S18][S21][S25]. The pattern resembles early internet standardization: small, open protocols emerge first as builder consensus, then governance and security practices catch up [S08].

OSSA and DUADP are especially important because they are not just another agent framework. OSSA is a manifest and contract layer: it describes what an agent is, what it can access, what policies govern it, and how it can be exported to platforms such as Docker, Kubernetes, LangChain, CrewAI, GitLab Duo, MCP, A2A, and IDE agents [S01][S03]. DUADP is the discovery and federation layer: it uses DNS/WebFinger, GAIDs, W3C DIDs, signatures, gossip federation, trust tiers, and MCP/REST endpoints so agents, skills, and tools can be found across domains [S02][S04]. In shorthand: OSSA defines the agent; DUADP discovers it.

The strongest research signal is that production agent systems require external infrastructure, not just better prompts. Cornell's agentic AI curriculum teaches LLM reliability, RAG, tool-using agents, MCP, multi-agent workflows, and governance/security as one integrated architecture problem [S07]. Harvard's Library Innovation Lab argues that agents are easy to build because they are essentially models using tools in a loop, so protocols may shape agent behavior more effectively than centralized rulemaking [S08]. MIT's AI Agent Index documents rapid deployment, increasing autonomy, poor transparency, and no established standards for web conduct [S09]. MIT Sloan's 2026 guidance warns that hallucinations and prompt injection keep agentic AI from being fully ready for critical autonomy, even while agents may handle many large-scale transactions within five years [S10].

Security is the blocking issue. Gravitee's 2026 survey found 80.9% of technical teams are beyond planning, but only 14.4% have full IT/security approval for all agents, 88% reported confirmed or suspected incidents, and only 21.9% treat agents as independent identity-bearing entities [S41]. NIST/NCCoE is explicitly scoping identity, authentication, authorization, auditing, non-repudiation, and prompt-injection mitigations for software and AI agents [S42]. OWASP frames excessive agency as the failure mode where prompt injection, hallucination, compromised tools, or malicious peer agents trigger damaging actions because agents have too much functionality, permission, or autonomy [S43][S44].

## What openstandardagents.org is about

Open Standard for Software Agents (OSSA) is an Apache-2.0 specification, CLI, SDK, schema, and npm package for portable agent manifests [S01][S03]. It positions itself as the missing contract layer between protocol transports and deployment platforms. The core artifact is a schema-validated YAML manifest describing identity, role, tools, LLM configuration, autonomy, compliance, observability, state, deployment, human oversight, cost controls, and trust metadata [S01][S03].

OSSA explicitly says it is not MCP, A2A, or a framework. MCP answers how agents access tools, A2A answers how agents communicate, and OSSA answers what the agent is and what governance constraints travel with it [S01][S03]. This is the OpenAPI analogy: a single agent definition can be exported to multiple targets instead of hand-maintaining different framework/platform configs [S01].

The npm package `@bluefly/openstandardagents` is at version 0.5.1 as of May 22, 2026, with latest modification Mar 28, 2026, Apache-2.0 license, and a GitLab source repository [S03]. The package exposes CLI binaries such as `ossa`, schema exports, validation/generation/migration services, MCP server support, trust services, SDK exports, and many platform adapters. It depends on agent and infrastructure libraries including MCP SDK, OpenAI/Anthropic/Google AI SDKs, Cedar WASM, OpenTelemetry, Temporal, Qdrant, GitLab, LangChain, and `@bluefly/duadp` is referenced as the discovery counterpart [S03][S05].

## What duadp.org is about

DUADP is the Decentralized Universal AI Discovery Protocol: a federated discovery protocol for AI agents, skills, tools, and registries [S02][S04]. Its analogy is DNS for AI agents. A DUADP node can publish a well-known manifest, expose REST/MCP endpoints, register agents/skills/tools, federate with peers, evaluate trust tiers, and route capability discovery across a mesh [S02].

DUADP's identity chain is GAID to WebFinger to DID to signature verification to policy/trust-tier enforcement [S02]. The homepage describes GAIDs such as `agent://discover.duadp.org/agents/code-reviewer`, DIDs such as `did:web:discover.duadp.org:agents:code-reviewer`, Ed25519 signatures, provenance, SBOM metadata, revocation state, and Cedar policies [S02]. This directly addresses the identity gap identified by Gravitee and NIST [S41][S42].

The npm package `@bluefly/duadp` is at version 0.1.4 as of May 22, 2026, with latest modification Mar 9, 2026, Apache-2.0 license, and a GitLab source repository [S04]. It provides TypeScript client and server APIs, validation, Ed25519 signing/verification, W3C DID resolution for `did:web` and `did:key`, and conformance testing [S04]. The package documents 15 core endpoints, including `/.well-known/duadp.json`, WebFinger, skills/agents/tools lists, publish, validate, and federation endpoints [S04].

## High-level layer map

| Layer | Typical question | Representative standards/projects | Notes |
| --- | --- | --- | --- |
| Agent contract | What is this agent, and under what controls may it run? | OSSA | Portable manifest, validation, export, trust and compliance metadata [S01][S03]. |
| Discovery and identity | How do agents find and trust each other? | DUADP, ANP | DNS/WebFinger/DID/gossip in DUADP; DID and protocol negotiation in ANP [S02][S25]. |
| Tool/data access | How does the agent use tools and data? | MCP, ATP | MCP servers/clients; ATP code-first sandboxed tool execution [S17][S26]. |
| Agent-to-agent work | How do agents delegate tasks? | A2A, ACP | A2A Agent Cards and task lifecycle; ACP REST/SSE messaging merged into A2A [S18][S19][S23]. |
| Agent-to-user UI | How does the app stream state, tools, text, and user input? | AG-UI | Event-based, HTTP/WebSockets, frontend/backend protocol [S21]. |
| Runtime/framework | How is behavior implemented? | OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex | Frameworks differ in abstractions, state, durability, RAG, orchestration, and production controls [S27][S29][S31][S32][S33]. |
| Governance/security | How is risk constrained and evidenced? | NIST, OWASP, Gravitee, Harvard KYA, LGA | Identity, authorization, least privilege, audit, human approvals, and protocol threat models [S11][S15][S41][S42][S43]. |

## Themes and opportunities

1. **Interoperability is moving from libraries to protocols.** MCP, A2A, AG-UI, ACP, ANP, DUADP, Agent Protocol, and ATP each standardize one part of agent connectivity. The better architectures compose them by boundary: tools via MCP, agent coordination via A2A, UI via AG-UI, discovery via DUADP/ANP, and packaging via OSSA [S01][S02][S17][S18][S21][S24][S25][S26].

2. **Contract metadata is becoming as important as code.** Production agents need declared tools, permissions, data access, autonomy, budgets, human approval checkpoints, compliance obligations, and provenance. OSSA's manifest approach and DUADP's trust-tier discovery create artifacts that security teams can validate before runtime [S01][S02][S03][S04].

3. **Identity is the next bottleneck.** Agents using shared API keys cannot be independently audited or revoked. NIST asks how identification, authentication, authorization, auditing, and non-repudiation should apply to agents; Gravitee shows most teams are not there yet [S41][S42].

4. **Web conduct is unresolved.** MIT found no established standards for agent behavior on the web, and most agents do not document robots.txt, CAPTCHA handling, or web-access practices [S09]. Harvard JOLT argues that the agentic web needs KYA-style identity, delegation, and auditability standards [S11].

5. **Reliability is inseparable from security.** Production advice converges on bounded tools, schema/output validation, trace propagation, circuit breakers, human-in-the-loop checkpoints, cost limits, and progressive rollout [S39][S43][S45][S46].

## Main risks

| Risk | Why it matters | Primary mitigations |
| --- | --- | --- |
| Prompt injection | External content can hijack goals and tool calls. | Treat context as untrusted; route actions through policy gates; use HITL for high-impact actions [S10][S43][S46]. |
| Excessive permissions | Agents with broad keys can act outside intended scope. | Least privilege, short-lived scoped credentials, action allowlists, default deny [S42][S43][S46]. |
| Hallucinated actions | Agents can invent invalid APIs/parameters or unsafe steps. | Schema validation, capability manifests, typed tools, execution-time verification [S43][S45]. |
| Identity ambiguity | Shared credentials break accountability and revocation. | Per-agent identities, DIDs, GAIDs, OAuth/OIDC/SPIFFE/SCIM-style lifecycle, audit logs [S02][S11][S42]. |
| Cross-protocol composition | A bridge can violate assumptions of MCP, A2A, ACP, or ANP. | Explicit threat modeling, composition-safety checks, boundary enforcement [S14][S16]. |
| Agentic web traffic | Agents/bots are increasingly machine-speed participants. | Human/agent traffic distinction, agent channels, KYA, network QoS/observability [S11][S47][S48]. |

## Bottom line

By May 22, 2026, the agentic AI stack is no longer just LLM plus tools. It is becoming an internet-like stack of protocols, manifests, discovery, identity, execution frameworks, and security controls. The most durable direction is not to pick one mega-framework; it is to define agents with portable contracts, discover them through verifiable identity, connect them through purpose-specific protocols, and enforce action-level security outside the model.
