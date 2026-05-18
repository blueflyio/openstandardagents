# Overview: Agentic AI, Protocols, Standards, and Security

Research snapshot compiled on May 18, 2026.

## Executive synthesis

Agentic AI is moving from demonstrations into production infrastructure, but the ecosystem is still missing the mature identity, governance, and interoperability layers that made the web reliable at scale. The current stack is separating into layers: MCP for agent-to-tool context, A2A/ACP/ANP for agent-to-agent communication, AG-UI for agent-to-user interaction, DUADP for decentralized discovery, and OSSA for portable agent contracts and governance metadata [R01] [R05] [R09] [R11] [R13] [R17] [R29].

The strongest pattern across sources is that no single protocol covers the whole lifecycle. MCP connects an AI application to tools, resources, prompts, and context; A2A coordinates opaque agents through Agent Cards and task lifecycles; AG-UI streams typed UI events between agents and front ends; DUADP indexes and resolves agents across domains using DNS, WebFinger, gossip federation, and DID identity; and OSSA defines the portable contract for an agent: identity, capabilities, trust boundaries, compliance, cost, and deployment targets [R02] [R06] [R10] [R12] [R14] [R15].

The second pattern is a governance gap. MIT's 2025 AI Agent Index found that 24 of 30 indexed agents were released or received major agentic updates in 2024-2025, but 25 of 30 disclosed no internal safety results and 23 of 30 disclosed no third-party testing. It also found no settled web conduct standards for browser agents, with some systems designed to bypass bot protections [R23]. Gravitee's 2026 survey found a similar operational gap: 80.9 percent of technical teams are actively testing or running agents, 14.4 percent have full security/IT approval for their entire agent fleet, and 88 percent reported confirmed or suspected incidents [R39].

The third pattern is that identity is becoming the control plane. NIST/NCCoE's February 2026 concept paper asks for input on applying identity standards and best practices to software and AI agents, including identification, authorization, auditing, non-repudiation, and prompt-injection controls [R28]. DUADP and OSSA explicitly position W3C DID-based Global Agent Identifiers, signed manifests, Cedar policies, trust tiers, revocation, audit logs, and SBOM/provenance pointers as a practical identity-and-governance stack for agent discovery and deployment [R01] [R02] [R05] [R08].

## What DUADP and OSSA are

DUADP, the Decentralized Universal AI Discovery Protocol, is best understood as "DNS plus WebFinger plus gossip federation for AI agents." It lets domains publish discoverable agents, skills, and tools through `.well-known` endpoints, DNS TXT records, WebFinger resolution, federated peer gossip, DID identity, and REST/MCP interfaces. The public site describes 17 MCP tools and a reference node that exposes discovery, search, publish, validation, federation, identity, governance, health, and metrics endpoints [R01] [R02].

OSSA, the Open Standard for Software Agents, is not positioned as a transport protocol or agent framework. It is the contract layer between protocols and runtimes: a schema-validated YAML/JSON manifest describing an agent's identity, role, model configuration, tools, policies, compliance metadata, trust boundaries, lifecycle, observability, and export targets. OSSA's website frames it as "Define once, export everywhere," while the local package description calls it an infrastructure bridge between agent protocols and deployment platforms [R05] [R06] [R07] [R08].

Together, DUADP and OSSA define a three-part stack: OSSA provides identity and the signed contract; DUADP discovers and filters agents across a federated network; and execution occurs in runtimes such as Kubernetes, GitLab Duo, Claude, OpenAI, LangChain, CrewAI, Drupal, or MCP/A2A-compatible systems [R03] [R08]. The npm packages reinforce this split: `@bluefly/openstandardagents` version 0.5.1 exposes schemas, validation, generation, migration, agent-card, SDK, trust, MCP-server, and workspace validation exports, while `@bluefly/duadp` version 0.1.4 exposes client, server, validation, crypto, DID, and conformance modules [R04] [R07].

## Current protocol landscape

| Layer | Main examples | Primary job | Maturity signal |
| --- | --- | --- | --- |
| Agent contract | OSSA | Define identity, capabilities, governance, deployment | npm 0.5.1; spec 0.5.0/0.5.1 materials [R06] [R07] |
| Discovery | DUADP, ANP | Resolve agents and capabilities across domains | DUADP live node and npm 0.1.4; ANP 1,296 GitHub stars [R01] [R04] [R16] [R34] |
| Tool/context | MCP | Connect agents to tools, resources, prompts, sampling | Official SDKs, reference servers, broad IDE/vendor adoption [R09] [R10] |
| Agent-agent | A2A, ACP, ANP | Delegate tasks, share messages, coordinate work | A2A under Linux Foundation with 23,835 GitHub stars; ACP folded into A2A [R12] [R17] [R34] |
| Agent-user UI | AG-UI | Stream events, state deltas, tool progress, HITL | 13,613 GitHub stars and broad framework integrations [R13] [R14] [R34] |
| Code-first tool execution | ATP | Let agents execute sandboxed TypeScript/JavaScript against APIs/MCP | Monday.com repo, npm packages, V8 sandbox design [R19] |

## Production reality

Production reports emphasize that agents are useful but fragile. 47Billion's field report argues that reliable systems usually start with simple workflows and tool-using agents, while open-ended multi-agent systems remain expensive and difficult to debug. It recommends cost monitoring, strict tool constraints, output validation, human approval gates, conservative rollout, and protocol adoption through MCP, A2A, and AG-UI [R37]. MIT Sloan similarly warns that agentic AI is "not ready for prime time" because hallucinations, mistakes, and prompt injection still require human-in-the-loop guardrails, even while predicting agents will handle most transactions in many large-scale business processes within five years [R24].

Security literature is converging on the same defenses. The DEV security guide stresses least privilege for tools, dedicated service accounts, validation of tool arguments, semantic checkers, and runtime policy enforcement before actions execute [R40]. arXiv security surveys extend this into multi-agent risks: collusion, swarm attacks, cross-agent propagation of privacy breaches and jailbreaks, protocol vulnerabilities in MCP/ACP/ANP/A2A, and the need for dynamic trust management, cryptographic provenance, sandboxing, monitoring, containment, and attribution [R30] [R31].

## Strategic takeaways

1. Treat agents as principals, not scripts. Each agent needs a unique identity, delegated authority, audit trail, revocation path, and least-privilege credentials [R28] [R39].
2. Use layered protocols instead of one-off integrations. MCP, A2A, AG-UI, DUADP, and OSSA are complementary layers, not mutually exclusive standards [R05] [R10] [R12] [R13] [R29].
3. Preserve human oversight at risk boundaries. Human-in-the-loop is not a temporary weakness; it is an operating model for irreversible, high-cost, regulated, or ambiguous actions [R20] [R24] [R37] [R40].
4. Design for observability and cost from the start. Agent loops multiply token usage and failure modes; tracing, budgets, action logs, state history, and replay packets should be architectural primitives [R15] [R33] [R37].
5. Prefer narrow, contract-backed agents. Production evidence favors specialized agents with explicit manifests, typed tools, scoped policies, and well-defined journeys over broad autonomous systems [R06] [R35] [R37].
