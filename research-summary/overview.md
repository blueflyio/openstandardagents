# Overview: agentic AI protocols, standards, and security

Research snapshot: May 17, 2026.

## Executive synthesis

The agentic AI ecosystem is converging around a layered stack rather than one universal protocol. MCP standardizes how agents reach tools and data; A2A and ACP address agent-to-agent work exchange; AG-UI addresses agent-to-user interface streaming; ANP and DUADP push discovery and identity into decentralized web infrastructure; OSSA defines a portable contract for what an agent is, what it can access, and how it should be governed [S01][S02][S05][S06][S09][S12][S16].

Two project sites are especially relevant to this repository. DUADP is a "DNS for AI agents": a decentralized discovery layer using DNS TXT records, WebFinger, federation/gossip, W3C DID-based identity, signature verification, and trust policy inputs [S01]. OSSA is a manifest and contract layer: schema-validated YAML manifests that can be exported to many deployment targets and can carry identity, capabilities, compliance, lifecycle, security, cost, and trust metadata [S02]. In short: DUADP helps agents find each other; OSSA describes and governs the agent once found.

The npm packages make those ideas installable. `@bluefly/openstandardagents` latest is 0.5.1, Apache-2.0, with CLI bins such as `ossa`, schema exports, validation/generation/migration services, agent-card generation, an MCP server, mesh/trust modules, and platform export support [S03]. `@bluefly/duadp` latest is 0.1.4, Apache-2.0, with a `duadp` CLI and TypeScript exports for client, server, validation, crypto, DID, and conformance functions [S04].

## Key themes

1. Interoperability is now multi-layered. Official and community sources increasingly describe MCP, A2A, AG-UI, ACP, ANP, OSSA, and DUADP as complementary pieces, not replacements for one another [S02][S09][S16][S33][S34].
2. Discovery and identity are unsolved enough to justify new layers. A2A Agent Cards, ACP discovery endpoints, ANP DIDs, DUADP GAIDs/WebFinger, and OSSA GAIDs all point at the same gap: agents need stable descriptors, proof, and policy inputs before interaction [S01][S02][S06][S10][S12][S16].
3. Production reliability remains harder than demos. Industry case studies emphasize bounded autonomy, structured outputs, cost monitoring, tool constraints, human-in-the-loop checkpoints, observability, and progressive rollout [S21][S33].
4. Security is lagging deployment. NIST/NCCoE is soliciting identity and authorization approaches for software and AI agents; Gravitee reports that 81% of teams are past planning while only 14.4% have full security approval; MIT reports wide safety disclosure gaps among deployed agents [S20][S35][S36].
5. Prompt injection has shifted from a prompt-filter problem to a runtime authorization problem. Current research emphasizes indirect injection through external content, supply-chain inputs, tool observations, MCP-like services, and context-dependent tasks where agents are supposed to use external observations [S37][S38][S39].

## How the ecosystem fits together

| Layer | Main examples | What it answers |
| --- | --- | --- |
| Agent contract | OSSA | What is this agent, what can it access, and what policies apply? |
| Discovery and identity | DUADP, ANP, A2A Agent Cards | How do agents find and verify each other? |
| Tool and data access | MCP, ATP | How does an agent use tools, APIs, and data? |
| Agent-to-agent work | A2A, ACP, ANP | How do agents delegate, coordinate, and exchange tasks? |
| User interaction | AG-UI | How does the backend agent stream state, events, and UI intents to the frontend? |
| Runtime/framework | OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex | How are loops, state, memory, workflows, teams, and handoffs implemented? |
| Governance/security | NIST IAM, Cedar/ABAC, HITL, tracing, policy engines | How are identity, authorization, audit, and accountability enforced? |

## What DUADP is

DUADP stands for Decentralized Universal AI Discovery Protocol. Its homepage frames the problem as "no universal discovery exists for AI agents" and positions DUADP as a federated DNS + WebFinger + gossip protocol so any agent can publish and be discovered on the open web [S01]. It uses Global Agent Identifiers (GAIDs), WebFinger resolution, DID documents, signature/provenance checks, federation witnesses, and policy decisions. The public site reports protocol version 0.1.4, 17 MCP tools, federation enabled, and 36 registered resources at fetch time [S01].

The npm package `@bluefly/duadp` is the TypeScript SDK. It exposes client/server/validation/crypto/DID/conformance modules, ships a `duadp` CLI, and depends on DID resolver packages and JSON/schema tooling [S04]. Its scope is discovery and trust evidence, not replacing MCP or A2A. DUADP's own positioning is: MCP connects agents to tools, A2A connects agents to agents, and DUADP helps agents find each other [S01].

## What OSSA is

OSSA stands for Open Standard for Software Agents. It is a portable manifest specification and CLI/package intended to solve the agent "M x N" configuration problem: every framework and deployment target represents agents differently, causing duplicated config and scattered governance metadata [S02]. OSSA provides a schema-validated YAML contract for identity, capabilities, compliance, lifecycle, security, cost controls, state, trust, and integrations with MCP/A2A/other targets [S02][S03].

The public site reports v0.5.0, Apache-2.0, 23+ export targets, 65+ CLI commands, 10 MCP tools, and production maturity for targets such as LangChain, MCP, npm, Docker, Kubernetes, GitLab Duo Agent, Agent Skills, A2A agent-card generation, Anthropic, and OpenAI [S02]. npm metadata shows the latest package as 0.5.1, created November 19, 2025 and modified March 28, 2026 [S03]. This small version discrepancy should be treated as site telemetry lag unless the maintainers document otherwise.

## Open questions and risks

- Standards fragmentation could persist. Multiple protocols overlap in discovery, messaging, identity, and governance. The arXiv protocol survey recommends phased adoption rather than a single winner: MCP for tool access, ACP for structured messaging/discovery, A2A for collaborative tasks, and ANP for decentralized marketplaces [S16].
- Agent identity needs executable enforcement. DID/GAID/Agent Card metadata is useful only if runtimes enforce per-tool permissions, session-aware authorization, audit, and revocation [S01][S02][S35][S37].
- Safety transparency is sparse. MIT found that 25 of 30 indexed agents disclosed no internal safety results and 23 of 30 had no third-party testing information [S20].
- Production cost is multiplicative in multi-agent systems. 47Billion reports per-task costs from roughly USD 0.10-0.50 for simple workflows to USD 2.00-5.00 for AutoGen-style multi-agent tasks, and warns that multi-agent systems can cost five to ten times more than single-agent designs because each agent may see extended history [S33].

## Recommended reading order

1. `protocols.md` for the layered standard landscape.
2. `frameworks.md` for build/runtime choices and npm/GitHub metadata.
3. `security.md` for identity, authorization, prompt injection, and governance.
4. `academia.md` for university research, education, and policy framing.
5. `blogs.md` for production engineering recommendations.
6. `reading-list.md` for all citation keys.
