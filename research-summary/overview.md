# Agentic AI Protocols, Standards, Frameworks, and Security: Overview

Research snapshot: June 2, 2026. Firecrawl CLI authentication could not be completed in this unattended automation, so web evidence was collected through direct page fetches, search-result snippets, npm metadata, and local repository files. Citation keys map to full sources in `reading-list.md`.

## Executive synthesis

The agent ecosystem is converging into layers rather than a single winning protocol. MCP standardizes how agents use tools and context; A2A standardizes how opaque agents delegate tasks to each other; AG-UI standardizes user-facing, event-based interaction; ANP explores a deeper "agentic web" network layer with decentralized identity and protocol negotiation; OSSA defines portable agent contracts; and DUADP fills the discovery gap by making agents findable through DNS, WebFinger, DIDs, and federation [T01] [T02] [T03] [T04] [T05] [T06] [T07] [T08].

The two BlueFly projects are complementary. OSSA is the contract layer: schema-validated YAML manifests that define identity, capabilities, lifecycle, governance, cost controls, trust, and deployment/export metadata across targets such as Docker, Kubernetes, LangChain, CrewAI, GitLab Duo, MCP, and A2A [T02] [T33] [T34]. DUADP is the discovery layer: a federated agent directory using DNS TXT, `.well-known` endpoints, WebFinger, gossip federation, DID identity, signatures, trust tiers, revocation, governance APIs, and MCP tools [T01] [T35].

Universities and policy groups are treating agents as both a software architecture and a governance problem. Cornell's certificate moves from LLM fundamentals to RAG, tool-using agents, multi-agent workflows, MCP, governance, risk, security, and human oversight [T09]. Harvard's Agent Protocols Tech Tree frames open protocols as the "x-ray" of the builder community's priorities and compares agent protocols to early internet standards such as TCP/IP and DNS [T10]. MIT's 2025 AI Agent Index documents rapid deployment, rising autonomy, and large safety-disclosure gaps across 30 deployed agents [T11] [T12].

The security story is sobering. MIT Sloan warns that agentic AI is not yet ready for mainstream deployment because hallucinations, mistakes, prompt injection, and other attacks continue to require human guardrails, even as Davenport and Bean expect agents to handle most transactions in many large-scale business processes within five years [T13]. NIST/NCCoE is explicitly exploring how identity, authentication, authorization, auditing, non-repudiation, and prompt-injection controls should apply to software and AI agents [T14]. Gravitee's 2026 survey reports that 80.9% of technical teams are actively testing or running agents, only 14.4% have full IT/security approval, 88% report confirmed or suspected incidents, and only 21.9% treat agents as independent identities [T15].

## High-level layer map

| Layer | Main question | Representative standards/projects | Current status |
|---|---|---|---|
| Contract | What is this agent and what may it do? | OSSA, Agent Cards, manifest schemas, Cedar policy metadata | Early but concrete in OSSA v0.5.1 and A2A cards [T02] [T08] [T34] |
| Discovery | How do agents find and verify each other? | DUADP, DNS-AID, A2A Agent Cards, ANP discovery | Active experimentation; DUADP and A2A have working implementations [T01] [T08] [T10] |
| Tool/context | What tools and data may the agent use? | MCP, ATP, OpenAPI-backed gateways | MCP is broadly adopted; ATP is an emerging code-execution alternative [T03] [T04] [T26] |
| Agent-to-agent | How do agents collaborate? | A2A, ACP, ANP meta-protocol | A2A is Linux Foundation-hosted; ACP is merging into A2A [T06] [T08] [T25] |
| Agent-to-user | How does the UI see and control agent work? | AG-UI | Rapid adoption, many SDKs/integrations, event-based model [T07] |
| Runtime/framework | How are workflows built and operated? | OpenAI Agents SDK, LangGraph, CrewAI, AutoGen/MAF, LlamaIndex, Parlant | Mature enough for bounded workflows; open-ended autonomy remains risky [T16] [T17] [T21] [T22] [T23] [T24] |
| Governance/security | Who is accountable, authorized, monitored, revocable? | NIST/NCCoE IAM work, KYA, Cedar/ABAC, OAuth/OIDC/SPIFFE, audit logs | The largest gap; identity and runtime enforcement lag adoption [T14] [T15] [T20] [T31] |

## What changed in late 2025 to early 2026

1. Agent protocols became a stack. Industry analysis and official docs increasingly describe MCP, A2A, and AG-UI as complementary layers rather than alternatives [T07] [T19].
2. A2A moved from a Google-led launch to neutral governance under the Linux Foundation, with Google transferring specification, SDKs, and tooling and more than 100 companies supporting the protocol at the June 23, 2025 announcement [T06].
3. ACP's independent path narrowed. IBM/BeeAI's ACP is now part of A2A under the Linux Foundation, and ACP active development is being wound down in favor of migration paths to A2A [T25].
4. Agent web conduct became a policy issue. MIT found no established standards for agent behavior on the web, while Harvard JOLT argues for Know Your Agent standards covering identity, principal-agent linkage, delegation, and auditability [T11] [T12] [T20].
5. Production guidance shifted from "build autonomous agents" to "bound the workflow." 47Billion reports that simple workflows and tool-using agents can be production-ready with guardrails, but open-ended multi-agent systems remain too unpredictable for critical paths [T19].

## Core conclusions

The most important architecture decision is to separate identity/contract, discovery, tool access, delegation, UI control, runtime orchestration, and enforcement. Systems that collapse these layers into a single prompt or a single framework will be hard to audit, hard to revoke, and hard to migrate.

MCP and A2A solve necessary but different interoperability problems. MCP gives an agent access to tools and data. A2A lets one agent discover and delegate work to another agent while preserving opacity of each agent's internal state, tools, and memory [T03] [T06] [T08]. AG-UI then exposes state, tool progress, streaming, and human-in-the-loop control to users [T07].

OSSA and DUADP occupy the missing infrastructure space around those protocols. OSSA asks for a portable, signed, policy-bearing contract for the agent itself; DUADP asks for a decentralized discovery mechanism so those contracts and capabilities can be found, verified, and governed across domains [T01] [T02] [T33] [T35].

Security controls must move from prompt-level intentions to runtime enforcement. The repeated recommendations across NIST, Gravitee, MIT, Dev.to, 47Billion, and Harvard JOLT are: unique agent identities, least privilege, signed/delegated authority, default-deny tool access, per-action authorization, human approval for high-risk operations, continuous monitoring, revocation, and audit trails [T13] [T14] [T15] [T19] [T20] [T31].
