# Agentic AI Landscape Overview

As of 2026-05-26.

## Executive synthesis

Agentic AI has moved from experiments into production infrastructure, but the ecosystem is still assembling the basic layers that made the web reliable: identity, discovery, transport, authorization, observability, and governance. The most important finding is that the emerging standards are complementary, not interchangeable. MCP standardizes agent access to tools and data. A2A and its converged ACP lineage standardize agent-to-agent task delegation. AG-UI standardizes agent-to-frontend event streams. ANP and DUADP emphasize discovery and decentralized identity. OSSA defines a portable agent contract that can reference those protocols and export to runtime platforms. [mcp-intro] [a2a-readme] [ag-ui-docs] [anp-readme] [duadp-site] [ossa-site]

The production lesson is conservative: narrow, bounded agents are working sooner than broad autonomous agents. Industry practitioners report that simple workflows and tool-using agents are production-ready with validation, cost caps, monitoring, and human checkpoints, while open-ended multi-agent systems remain fragile and expensive. 47Billion's production retrospective is especially direct: most use cases should start with Level 2 or Level 3 autonomy, add multi-agent collaboration only when specialization is necessary, and treat guardrails as infrastructure rather than polish. [47billion-production]

Security and governance are lagging adoption. Gravitee's 2026 survey of 919 executives and practitioners found that 80.9 percent of technical teams are beyond planning, only 14.4 percent have full IT/security approval for their agent fleet, 88 percent reported confirmed or suspected agent security or privacy incidents, and only 21.9 percent treat agents as independent identities. NIST/NCCoE's 2026 concept paper therefore focuses on applying identity, authentication, authorization, auditing, and non-repudiation practices to software and AI agents. [gravitee-2026] [nist-agent-identity]

Academic and policy work reinforces the same direction. Cornell's agentic AI curriculum bridges LLM fundamentals, RAG, tool-using agents, multi-agent workflows, MCP, and governance/security. Harvard's Agent Protocols Tech Tree frames open protocols as the "rough consensus and running code" layer that can shape agent behavior. MIT's 2025 AI Agent Index documents rapid deployment, rising autonomy, and major transparency gaps: 24 of 30 indexed agents launched or had major agentic updates in 2024-2025, 25 of 30 disclose no internal safety results, and no established standards govern web conduct. [cornell-agentic] [harvard-aptt] [mit-index]

## What DUADP and OSSA are

DUADP is the Decentralized Universal AI Discovery Protocol. It positions itself as "DNS for AI agents": agents, skills, and tools can be published to a federated discovery mesh using DNS TXT records, WebFinger, gossip federation, Global Agent Identifiers (GAIDs), W3C DIDs, signatures, trust tiers, revocation, provenance, governance endpoints, and MCP-compatible tools. The public site reports `@bluefly/duadp` v0.1.4, 36 indexed resources, and 17 MCP tools exposed by DUADP nodes. [duadp-site] [duadp-npm]

OSSA is the Open Standard for Software Agents. It is not a runtime framework and not a transport protocol; it is a portable manifest and contract layer. OSSA defines what an agent is, which tools and protocols it uses, its identity, governance, compliance, cost controls, observability, memory, team topology, and export targets. The current package `@bluefly/openstandardagents` v0.5.1 describes OSSA as the infrastructure bridge between agent protocols and deployment platforms, with exports to Docker, Kubernetes, LangChain, CrewAI, MCP, A2A agent cards, npm, GitLab Duo, Cursor, Claude Skills, and other targets. [ossa-site] [ossa-npm]

Together, OSSA and DUADP form a three-layer model:

| Layer | Main question | Main artifact |
| --- | --- | --- |
| OSSA identity/contract | What is this agent allowed to be and do? | Signed YAML/JSON manifest, GAID/DID, Cedar policy, SBOM |
| DUADP discovery | Where is the agent and how trustworthy is it? | Well-known endpoint, WebFinger record, registry entry, federation witness |
| Runtime execution | How does work run? | LangGraph, CrewAI, Kubernetes, GitLab Duo, MCP server, A2A endpoint |

This makes OSSA/DUADP different from MCP and A2A. MCP and A2A move messages. OSSA and DUADP publish, verify, discover, and govern the agents participating in those message flows. [ossa-readme] [duadp-site]

## Major themes

### 1. The agent protocol stack is layering

The strongest sources converge on a stack:

- MCP: agent-to-tool and agent-to-data access, using servers, clients, tools, resources, prompts, and JSON-RPC style interactions. [anthropic-mcp] [mcp-intro]
- A2A: agent-to-agent discovery and task delegation, using Agent Cards, tasks, messages, artifacts, streaming, push notifications, and enterprise auth schemes. [google-a2a] [a2a-readme] [a2a-llms]
- AG-UI: agent-to-user-interface state, streaming, user interactions, interrupts, tool visualization, and frontend event synchronization over HTTP/WebSockets. [ag-ui-docs]
- Agent Protocol: framework-agnostic production APIs for runs, threads, agents, store/memory, and live streaming. [langchain-agent-protocol]
- ANP/DUADP: agent identity, discovery, secure communication, federation, and trust metadata. [anp-readme] [duadp-site]
- OSSA: portable manifest, deployment, governance, and conformance layer above those protocols. [ossa-site]

### 2. Identity is the central governance gap

Shared API keys and inherited human credentials are incompatible with autonomous action. NIST asks how to identify, authorize, audit, and provide non-repudiation for software and AI agents. Gravitee's field data shows that fewer than 22 percent of teams treat agents as independent identities, while many rely on API keys or generic tokens. Harvard JOLT's agentic web commentary argues for Know Your Agent standards: verifiable identity, principal-agent linkage, bounded delegation, revocability, and audit records. [nist-agent-identity] [gravitee-2026] [harvard-jolt-agentic-web]

### 3. Tool access is where agents become risky

MCP is becoming the default tool interface, but it also concentrates risk at the point where agents reach real systems. Recent research on MCP security identifies tool poisoning, rug pulls, cross-server data leakage, privilege escalation, server impersonation, memory/context poisoning, and session/replay risks. MCPShield proposes defense in depth: capability-based access control, cryptographic tool attestation, information-flow tracking, and runtime policy enforcement. [mcp-shield] [protocol-threat-modeling]

### 4. Web conduct and bot governance are unresolved

MIT's index states that no established standards govern agent web behavior and that many agents disclose little about robots.txt, CAPTCHA handling, or anti-bot controls. HUMAN Security reports that automated traffic grew eight times faster than human traffic in 2025, AI-driven monthly traffic grew 187 percent, and agentic AI traffic grew 7,851 percent year over year. The policy question is shifting from "block bots" to "authenticate, authorize, and govern useful agents." [mit-index] [human-ai-traffic]

### 5. Production reliability needs SRE-style controls

Production sources emphasize:

- schema and semantic validation at every boundary;
- distributed traces for each delegation chain;
- per-agent SLO ownership;
- circuit breakers for low-quality sub-agent results;
- per-request, per-task, per-user, and per-tenant budgets;
- HITL approval gates for irreversible or regulated actions;
- progressive rollout from internal users to limited beta to general availability. [47billion-production] [mcp-production-patterns] [growth-production-stack]

## Practical recommendations

1. Start with a bounded single-agent or workflow design before adding agent-to-agent delegation.
2. Use MCP for tool access, but place identity-aware policy enforcement in front of sensitive tools.
3. Use A2A for cross-team, cross-vendor, or opaque specialist-agent collaboration; avoid it for tightly coupled internal graph nodes that share memory.
4. Use AG-UI when user-facing applications need streaming progress, shared state, approvals, and interrupts.
5. Publish a machine-readable agent contract: OSSA manifests, A2A Agent Cards, MCP server descriptions, and DUADP/WebFinger discovery records are converging on this need.
6. Treat every deployed agent as a first-class security principal with its own lifecycle, scope, audit trail, and revocation path.
7. Keep humans in the loop for irreversible actions, high-value transactions, policy exceptions, and low-confidence outputs.

## Key uncertainties

- Governance: which layer will become authoritative for agent identity and delegation: platform policy, enterprise IAM, W3C DID credentials, NIST guidance, or a new cross-industry trust registry?
- Security: whether protocol-level attestation and signed tool manifests become mandatory or remain optional ecosystem practices.
- Economics: whether multi-agent token and infrastructure costs can fall enough for broad autonomous workflows outside high-value domains.
- Standards consolidation: ACP has merged into A2A, but ANP, AGNTCY ACP, DUADP, OASF, KYA, and agent-permissions proposals still overlap in identity/discovery scope. [lfai-acp-a2a] [agntcy-acp] [anp-readme] [duadp-site]
