# Agentic AI Protocols, Standards, Frameworks, and Security - Overview

Report date: 2026-06-04

This folder summarizes current agentic AI research and production practice across academia, open protocols, open-source frameworks, npm packages, blogs, and security guidance. Source keys such as `[MCP-ANN]` and `[DUADP-NPM]` are defined in `reading-list.md`.

## Executive synthesis

Agent infrastructure is separating into layers. MCP is becoming the agent-to-tool and agent-to-context layer. A2A is becoming the agent-to-agent task delegation layer. AG-UI is filling the agent-to-user-interface streaming layer. LangChain Agent Protocol defines production serving APIs for runs, threads, agents, streaming, and long-term memory. ANP and DUADP focus on open-network discovery and decentralized identity. OSSA sits differently: it is not a runtime framework or transport protocol, but a portable contract layer for describing, validating, governing, and exporting agents across runtimes and platforms [MCP-ANN] [A2A-GOOGLE] [AGUI-GH] [LANGCHAIN-AP] [ANP-GH] [DUADP-WEB] [OSSA-WEB].

OSSA and DUADP are best understood as a complementary identity/discovery/governance stack. OSSA defines the agent contract: manifest schema, identity, capabilities, tools, policy bindings, compliance metadata, validation, and export targets. DUADP discovers those contracts: DNS/WebFinger-style discovery, GAID resolution, DID-backed identity, gossip federation, trust tiers, and MCP/REST endpoints for finding, publishing, validating, and inspecting agents, skills, and tools [OSSA-WEB] [OSSA-NPM] [DUADP-WEB] [DUADP-NPM].

The npm registry shows both packages are early but actively moving. `@bluefly/openstandardagents` latest stable release is `0.5.6`, published 2026-06-03, with 99 package files, Apache-2.0 licensing, and schemas/CLI/validation utilities. `@bluefly/duadp` latest release is `0.1.7`, published 2026-06-03, with 39 package files, Apache-2.0 licensing, and TypeScript SDK support for DUADP client, server router, validation, crypto, DID resolution, and conformance testing [OSSA-NPM] [DUADP-NPM].

Academic and policy sources frame the same issue from different angles: agents are easy to assemble, hard to govern, and moving into production faster than standards and disclosure regimes can mature. Cornell's eCornell program teaches the path from LLM fundamentals to RAG, tool-using agents, multi-agent workflows, MCP, and governance/security trade-offs. Harvard's Agent Protocols Tech Tree treats open protocols as the "x-ray" of what builders agree on. MIT's AI Agent Index documents 30 deployed agents and finds rapid deployment, rising autonomy, weak safety disclosure, and no settled web-conduct standards [CORNELL] [HARVARD-APTT] [MIT-INDEX] [MIT-DETAILS].

Security is the central bottleneck. MIT Sloan says agentic AI is not ready for prime time because hallucinations, mistakes, and prompt injection still require human-in-the-loop controls. Gravitee's 2026 survey finds 80.9% of technical teams past planning, only 14.4% with full security/IT approval for all agents, 88% with confirmed or suspected incidents, and only 21.9% treating agents as independent identities. NIST/NCCoE's 2026 concept paper asks how existing identity and authorization standards can be applied to software and AI agents, including identification, authorization, auditing, non-repudiation, and prompt-injection mitigation [MIT-SLOAN-2026] [GRAVITEE-BLOG] [GRAVITEE-REPORT] [NIST-NCCOE].

## What the requested sites are about

### openstandardagents.org

OpenStandardAgents.org presents OSSA as the "OpenAPI for agents": a formal manifest and contract layer that describes what an agent is, what tools it can use, what policy boundaries apply, how it can be discovered, and how it can be exported. Its home page explicitly says MCP connects tools and A2A connects agents, but neither defines the portable agent contract. OSSA is positioned between protocol transports and deployment targets such as LangChain, CrewAI, Kubernetes, Docker, GitLab Duo, Claude Code, Cursor, Drupal, MCP, A2A, and npm [OSSA-WEB].

Key OSSA concepts:

- Portable YAML manifests with schema validation and export fidelity across many targets [OSSA-WEB] [OSSA-NPM].
- Identity and trust metadata, including GAID/DID concepts, signed manifests, Cedar policy integration, and compliance metadata [OSSA-WEB].
- Governance fields for human-in-the-loop requirements, compliance regimes, cost controls, observability, lifecycle, and runtime infrastructure [OSSA-WEB].
- CLI and MCP surfaces for validating, scaffolding, converting, inspecting, generating agent cards, publishing, diffing, and migrating manifests [OSSA-WEB] [OSSA-NPM].

### duadp.org

DUADP is the Decentralized Universal AI Discovery Protocol. It addresses the discovery question: if MCP connects agents to tools and A2A connects agents to agents, how does an agent find another agent, skill, tool, or registry in the first place? DUADP uses DNS TXT records, well-known endpoints, WebFinger-style resolution, GAID identifiers, DID-based identity, signature/provenance checks, trust tiers, and gossip federation to turn siloed registries into a discoverable mesh [DUADP-WEB] [DUADP-NPM].

Key DUADP concepts:

- `/.well-known/duadp` or `/.well-known/duadp.json` discovery manifests [DUADP-WEB] [DUADP-NPM].
- GAID handles such as `agent://discover.duadp.org/agents/code-reviewer` that resolve to endpoints and DID identities [DUADP-WEB].
- DID and Ed25519-backed signature verification for identity, provenance, and trust-tier decisions [DUADP-WEB] [DUADP-NPM].
- REST and MCP endpoints/tools for discovery, search, publishing, validation, federation, identity, governance, health, and metrics [DUADP-WEB].
- TypeScript SDK exports for client, server, validation, crypto, DID resolution, and conformance tests [DUADP-NPM].

## Main ecosystem themes

1. Protocols are becoming specialized, not unified into one mega-standard. MCP, A2A, AG-UI, Agent Protocol, ANP, ACP, DUADP, and OSSA each solve different boundaries. Treating them as substitutes creates architectural gaps [ARXIV-INTEROP] [GOOGLE-PROTO-GUIDE] [FORTYSEVEN].

2. Discovery and identity are under-specified across the broader ecosystem. A2A Agent Cards and MCP servers help with local or enterprise integrations, but open-network discovery and trust need additional layers such as ANP, DUADP, DIDs, signed requests, and registry governance [A2A-GOOGLE] [ANP-GH] [DUADP-WEB] [TECHPOLICY].

3. Contract metadata is becoming as important as runtime code. Enterprises need to know an agent's role, tools, autonomy bounds, policy bindings, cost budget, provenance, and allowed deployment surfaces before the agent executes. This is the gap OSSA targets [OSSA-WEB] [OSSA-NPM].

4. Production readiness favors bounded workflows first. The most credible engineering guidance recommends starting with simple workflows and tool-using agents, then adding structured multi-agent systems only after evaluation, cost monitoring, guardrails, and HITL checkpoints are in place [FORTYSEVEN] [MIT-SLOAN-2026].

5. Security has shifted from "model quality" to "control of action." Prompt injection and hallucination matter because agents can invoke tools, mutate systems, spend money, and delegate to other agents. The recommended control plane includes unique agent identities, least privilege, task-scoped credentials, deterministic tool validation, policy-as-code, revocation, and continuous audit logs [NIST-NCCOE] [GRAVITEE-REPORT] [DEV-SECURITY] [ARXIV-SECURITY].

## Key risks and gaps

- Transparency gaps: MIT found 25 of 30 agents disclose no internal safety results and 23 of 30 have no third-party testing information [MIT-INDEX] [MIT-DETAILS].
- Web conduct: MIT reports no established standards for how agents should behave on the web; some browser agents bypass anti-bot systems or ignore `robots.txt` [MIT-INDEX] [MIT-DETAILS].
- Identity deficit: Gravitee reports only 21.9% of teams treat agents as independent identities, while 45.6% still use shared API keys for agent-to-agent authentication [GRAVITEE-REPORT].
- Authorization fragility: Gravitee reports 27.2% of technical teams use custom hardcoded authorization logic for agent/MCP interactions [GRAVITEE-BLOG].
- Slow-burn threats: 2026 security surveys highlight under-studied multi-agent coordination, ecosystem, memory-poisoning, and governance-layer risks that can accumulate across sessions [ARXIV-SECURITY] [ARXIV-ATTACKS].

## Practical recommendations

1. Use MCP for tool/data access and A2A for cross-agent task delegation, but do not expect either to carry all identity, governance, discovery, or contract metadata [MCP-DOCS] [A2A-GOOGLE].
2. Add a portable contract layer for agents. OSSA is a concrete candidate for manifest validation, governance metadata, policy declarations, discovery metadata, and multi-platform export [OSSA-WEB] [OSSA-NPM].
3. Add a discovery layer if agents need to find capabilities across teams or organizations. DUADP is designed for DNS/WebFinger/gossip discovery with GAID/DID trust evidence [DUADP-WEB] [DUADP-NPM].
4. Treat every agent as a security principal. Give it unique identity, scoped credentials, policy-bound actions, revocation, and auditability [NIST-NCCOE] [GRAVITEE-REPORT].
5. Keep autonomy progressive. Start with bounded workflows, add HITL gates for irreversible actions, and only expand autonomy after real telemetry, evaluation, and incident response are in place [FORTYSEVEN] [MIT-SLOAN-AGENTIC].

## Folder guide

- `academia.md`: University, academic, and policy research.
- `protocols.md`: Protocol comparison and layer-by-layer notes.
- `frameworks.md`: Open-source framework and npm package analysis.
- `security.md`: Threat models, identity, authorization, and governance.
- `blogs.md`: Industry and engineering publication synthesis.
- `reading-list.md`: Source keys, links, and limitations.
