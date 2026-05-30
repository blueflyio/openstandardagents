# Agentic AI Ecosystem Research Overview

Prepared as of May 30, 2026.

## Executive synthesis

The current agent ecosystem is splitting into layers that look less like one monolithic framework category and more like an early internet stack. MCP standardizes how agents reach tools and context. A2A and ACP standardize how agents coordinate with other agents. AG-UI standardizes how agent backends stream state and actions to user interfaces. ANP and DUADP focus on discovery, identity, and federation. OSSA occupies a separate but important contract layer: it defines what an agent is, what it may access, how it is governed, and how the same definition can be exported to concrete runtimes [S01][S02][S10][S11][S13][S14][S16].

The core theme across academic, industry, and security sources is that agent capability is moving faster than agent governance. MIT's 2025 AI Agent Index found that 24 of 30 prominent agents launched or received major agentic updates in 2024-2025, while only 4 of 13 frontier-autonomy systems disclosed any agentic safety evaluations [S07]. Gravitee's 2026 security survey found 80.9% of technical teams beyond planning, but only 14.4% with full security approval and only 21.9% treating agents as independent identity-bearing entities [S26]. This gap makes identity, authorization, runtime control, auditability, and human approval more central than model choice alone.

## What DUADP is

DUADP, the Decentralized Universal AI Discovery Protocol, is a discovery and federation layer for AI agents, skills, and tools. Its website describes it as "DNS for AI agents": agents publish themselves through well-known endpoints, DNS TXT records, WebFinger-style resolution, gossip federation, and DID-backed identity so other agents can find and verify them without a central marketplace [S01]. The public npm package `@bluefly/duadp` is a TypeScript SDK for both clients and servers. It exposes a typed client, an Express router for 15 core protocol endpoints, validation, Ed25519 signing, DID resolution, and conformance tests [S04].

The strongest DUADP concept is that discovery is not just search. It is policy-filtered discovery. A resource gets a GAID such as `agent://discover.duadp.org/agents/code-reviewer`; WebFinger or node manifests resolve it to real endpoints; DID documents and signatures provide cryptographic proof; trust tiers become inputs to policy decisions [S01][S04]. DUADP also exposes MCP tools for discovery, publishing, validation, federation, identity, governance, and health checks, which lets MCP-compatible clients use the discovery mesh without hand-writing REST calls [S01].

## What OpenStandardAgents / OSSA is

OpenStandardAgents, published as `@bluefly/openstandardagents`, implements OSSA: the Open Standard for Software Agents. OSSA is not a tool protocol like MCP and not an orchestration framework like LangGraph or CrewAI. It is a portable agent manifest and contract layer, similar in spirit to OpenAPI for REST APIs. A single YAML manifest can declare identity, role, tools, autonomy, observability, compliance metadata, trust, memory, cost controls, and deployment intent, then export to platforms such as LangChain, MCP, CrewAI, Docker, Kubernetes, GitLab Duo, Claude Skills, Cursor, Drupal, OpenAI Agents SDK, and others [S02][S03].

The OSSA/DUADP pairing is best understood as a three-layer stack. OSSA defines the agent contract and identity boundary. DUADP discovers and routes agents, skills, and tools across a federated mesh. The execution runtime remains whatever system actually runs the agent: Kubernetes, Claude, LangChain, Drupal, GitLab Duo, Cursor, or a custom service [S01][S02][S03][S04]. This is why OSSA complements MCP and A2A rather than replacing them. MCP describes tool access. A2A describes inter-agent task coordination. OSSA describes the portable definition and governance envelope that references those protocols [S02][S03].

## Major ecosystem trends

1. Protocol specialization is replacing bespoke integration. MCP, A2A, ACP, AG-UI, ANP, DUADP, LangChain Agent Protocol, and ATP each solve different edges of the agent graph: agent-to-tool, agent-to-agent, agent-to-user, agent discovery, production serving, or sandboxed code execution [S10][S11][S13][S14][S15][S16][S31].

2. Production frameworks are converging on state, observability, and human approval. LangGraph emphasizes durable execution, persistence, human-in-the-loop, and memory. CrewAI emphasizes role-based crews and event-driven flows. OpenAI Agents SDK emphasizes a smaller primitive set: agents, handoffs, guardrails, sessions, and tracing [S17][S18][S19].

3. Universities and policy centers are treating agents as governance infrastructure, not only model applications. Cornell's certificate explicitly moves from LLM fundamentals to RAG, tool-using agents, agentic protocols, and governance/security. Harvard's Agent Protocols Tech Tree frames protocols as the rough-consensus mechanisms that reveal what builders agree on. MIT's AI Agent Index documents transparency gaps and unsettled web conduct norms [S05][S06][S07][S08].

4. Security has shifted from output safety to action governance. Prompt injection matters more when agents can read private data, process untrusted input, and take external actions. NIST/NCCoE, Gravitee, Harvard JOLT, Imperva, and DEV Community security writeups all converge on identity, least privilege, auditability, and runtime enforcement outside the LLM [S26][S27][S28][S29][S30].

## Practical implication

A trustworthy agent system in 2026 should start with a contract and identity model before selecting an orchestration framework. A reasonable stack is: OSSA-style manifest for the contract; DUADP or similar for discovery; MCP for tools; A2A/ACP for inter-agent work; AG-UI for front-end interaction; LangGraph, CrewAI, OpenAI Agents SDK, LlamaAgents, Parlant, or GitLab Duo depending on the workflow; and a runtime control plane that enforces identity, authorization, logging, budget caps, and human approvals [S01][S02][S10][S11][S13][S18][S19][S26][S27].

## Source limitations

Some requested sources were available only through search excerpts or partial fetches. Ruh.ai's protocol guide returned limited direct page body but its search extract contained the requested Gartner and MCP/A2A/ACP claims [S25]. The requested DEV.to security guide was represented by a DEV Community MCP security/tunneling guide that covers prompt injection, excessive privilege, tool poisoning, human approvals, and gateway controls [S29]. Paywalled or gated PDFs were avoided where an official public page or excerpt was available.
