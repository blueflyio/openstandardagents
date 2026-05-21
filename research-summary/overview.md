# Agentic AI, Protocols, Standards, and Security Landscape

As of 2026-05-21.

## Executive synthesis

The 2025-2026 agentic AI landscape is converging on a layered stack rather than a single winner. MCP standardizes how agents connect to tools and data; A2A standardizes opaque agent-to-agent task collaboration; AG-UI standardizes agent-to-frontend event streams; ACP provides lightweight REST-native agent messaging; ANP explores decentralized agent discovery and identity; ATP offers sandboxed code execution as a tool protocol; OSSA defines portable agent contracts; and DUADP provides federated discovery for those contracts and other agent resources [S01][S04][S07][S11][S13][S14][S15][S16][S17].

Universities and research groups frame this moment as comparable to early internet protocol formation. Harvard's Agent Protocols Tech Tree argues that open protocols reveal what builders must agree on and may shape which agent behaviors become easiest to build [S32]. MIT's AI Agent Index documents rapid deployment but weak transparency: high-autonomy systems often lack disclosed safety evaluations and there are no established standards for agent web conduct [S30]. MIT Sloan separately describes 2026 as a level-set year: agentic AI is not yet ready for prime time because hallucinations and prompt injection remain serious blockers, but agents may still handle most transactions in many large business processes within five years [S31]. Cornell's eCornell materials show education moving from RAG and LLM fundamentals into enterprise-ready controls, LangGraph state machines, OWASP threat models, approval gates, and monitoring [S33][S34].

Security is the largest gap between demos and deployment. Gravitee's 2026 survey of 900+ executives and practitioners found 80.9% of technical teams past planning, only 14.4% with full security approval, 88% with confirmed or suspected incidents, and only 21.9% treating agents as independent identities [S25]. NIST launched an AI Agent Standards Initiative and points to an NCCoE concept project on software and AI agent identity and authorization [S28][S29]. OWASP's 2025 LLM Top 10 makes the same practical point: prompt injection and excessive agency become severe when agents have excessive functionality, permissions, or autonomy [S26][S27].

## What DUADP and OSSA are

OSSA, the Open Standard for Software Agents, is not a runtime framework or communication protocol. It is a portable contract layer: schema-validated YAML manifests that describe an agent's identity, capabilities, security, compliance, lifecycle, cost controls, and deployment/export targets. The public site positions OSSA between tool/agent protocols and deployment platforms: MCP answers tool access, A2A answers inter-agent communication, and OSSA answers what the agent is and under what governance it can operate [S01]. The npm package `@bluefly/openstandardagents` latest is 0.5.1, Apache-2.0, with exports for schemas, validation, generation, migration, mesh, trust, agent-card generation, and an MCP server; the local package description calls it an infrastructure bridge between protocols and deployment platforms [S02][S03].

DUADP, the Decentralized Universal AI Discovery Protocol, is the discovery layer paired with OSSA. The public site describes it as DNS for AI agents: federated DNS plus WebFinger plus gossip so agents can publish and discover agents, skills, tools, and registries without a central broker. Its current homepage reports protocol version 0.1.4, 36 indexed resources, DID-backed identity, GAID lookup handles, signature/provenance checks, trust-tier policy inputs, a federated search mesh, and 17 MCP tools over REST/MCP for discovery, search, publishing, validation, federation, governance, identity, health, and metrics [S04]. The local UADP draft spec defines a conforming node as one that serves `/.well-known/uadp.json`, at least one of `/uadp/v1/skills` or `/uadp/v1/agents`, JSON responses, and OSSA-formatted payloads [S05]. The npm package `@bluefly/duadp` latest is 0.1.4, Apache-2.0, TypeScript-first, with client, server, validate, crypto, DID, and conformance exports [S06].

Together, OSSA and DUADP map naturally to the identity/discovery/execution split in the repository README: OSSA defines signed, policy-aware agent identity and governance; DUADP discovers and federates those resources with DID-verified nodes and trust tiers; runtimes such as Kubernetes, Claude, LangChain, Drupal, GitLab, or Cursor execute the work [S02].

## Strategic themes

1. Protocol specialization is healthy. MCP, A2A, AG-UI, ACP, ANP, ATP, OSSA, and DUADP solve different layers. Treating them as substitutes leads to confused architectures; combining them creates a layered control plane [S01][S23][S24][S35].
2. Identity is becoming a first-class primitive. DUADP, ANP, NIST, Gravitee, and protocol-security papers all point toward agent-specific identity, signed manifests/cards, DID-style identifiers, audit trails, and policy-bound authorization [S04][S14][S25][S28][S36].
3. Production success depends on boring controls. Human-in-the-loop gates, explicit tool permissions, cost ceilings, tracing, evaluation, circuit breakers, scoped credentials, and rollout stages matter more than general-purpose autonomy [S22][S23][S25][S26][S27].
4. Open-source frameworks are converging on durable execution, memory, observability, and multi-agent orchestration. LangGraph, CrewAI, OpenAI Agents SDK, AutoGen, and LlamaIndex all expose different abstraction levels for the same production needs [S18][S19][S20][S21][S38].
5. Governance remains immature. MIT's index shows transparency gaps; Gravitee shows security approval and identity gaps; NIST is still at standards-convening and concept-paper stages [S25][S28][S30].

## Recommended operating model

For a trustworthy 2026 agent stack, use a contract-first approach. Define each agent with OSSA-like manifests; discover agents and skills through DUADP or A2A Agent Cards; connect tools through MCP or ATP; route agent-to-agent work over A2A or ACP depending on scope; stream UI state through AG-UI; enforce authorization outside the model with least-privilege credentials; and monitor every run, tool call, approval, budget, and policy decision [S01][S04][S07][S11][S13][S15][S16][S17][S27].

## Limitations

Firecrawl was unavailable because the CLI could not authenticate in this headless automation, so collection used direct web fetch/search, npm metadata, GitHub metadata, and local repository documents. The eCornell certificate landing page timed out, so Cornell coverage combines official course pages plus search-result metadata for the certificate structure [S33][S34]. Some sources are vendor blogs; where possible, primary protocol docs, official announcements, NIST/OWASP, and arXiv papers are used as anchors.
