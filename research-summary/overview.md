# Overview: agentic AI protocols, standards, and security

Compiled on 2026-05-25.

## Executive synthesis

The agent ecosystem is converging into a layered stack rather than a single winning standard. MCP connects agents to tools and data. A2A connects agents to other agents. AG-UI connects agent backends to user-facing applications. OSSA describes the portable contract for an agent, and DUADP provides discovery so agents, skills, and tools can be found across organizational boundaries [S1][S2][S21][S23][S25].

The core governance gap is identity and authorization. MIT's 2025 AI Agent Index found rapid releases, rising autonomy, and weak safety transparency: 24 of 30 agents were released or materially updated in 2024-2025; only 4 of 13 frontier-autonomy agents disclosed agentic safety evaluations; 25 of 30 disclosed no internal safety results; and 23 of 30 had no third-party testing information [S10][S11]. NIST/NCCoE's 2026 concept paper responds to the same gap by asking how identification, authentication, authorization, auditing, non-repudiation, and prompt-injection mitigations should apply to software and AI agents [S13][S14].

The production reality is mixed. Cornell's agentic AI curriculum now treats LLM fundamentals, RAG, tools, memory, multi-agent patterns, MCP, governance, risk, security, and human oversight as one continuum [S7]. MIT Sloan says agentic AI is "not ready for prime time" in 2026 because hallucinations and prompt injection still make unsupervised transactions risky, while still projecting that agents could handle most transactions in many large-scale business processes within roughly five years [S12].

## What DUADP is

DUADP is the Decentralized Universal AI Discovery Protocol. Its stated purpose is to be "DNS for AI agents": a federated discovery layer where agents, skills, and tools can publish themselves through DNS TXT records, `.well-known` endpoints, WebFinger, gossip federation, and DID-backed identity [S1][S5]. The website describes a live protocol version of `0.1.4`, 36 registered resources, federation enabled, and 17 MCP tools for discovery, search, publishing, validation, governance, federation, identity, health, and metrics [S1].

The npm package `@bluefly/duadp` is the TypeScript SDK for this protocol. As queried on 2026-05-25, npm latest is `0.1.4`, created 2026-03-06 and last modified 2026-03-09. The package exposes a CLI (`duadp`) plus subpath exports for client, server, validation, crypto, DID resolution, and conformance testing [S4]. Its README describes 15 core HTTP protocol endpoints, Express server integration, Ed25519 signing, DID resolution for `did:web` and `did:key`, and conformance tests [S5].

## What OSSA is

OSSA is the Open Standard for Software Agents. It is not positioned as a transport protocol or an agent runtime framework. It is the contract layer: a schema-validated YAML manifest describing identity, capabilities, tools, security, lifecycle, compliance, trust, deployment intent, and export targets [S2][S6]. The homepage frames the problem as an M x N configuration burden across frameworks and platforms, and presents OSSA as "define once, export everywhere" for 23+ platforms including LangChain, CrewAI, Kubernetes, Docker, GitLab Duo, Claude Code, Cursor, Drupal, MCP, A2A, and npm [S2].

The npm package `@bluefly/openstandardagents` is the installable OSSA CLI and SDK. As queried on 2026-05-25, npm latest is `0.5.1`, package creation began 2025-11-19, and version `0.5.1` was published in March 2026. It exposes the `ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, and `ossa-mcp` binaries plus subpath exports for schemas, validation, generation, migration, types, OpenAPI extensions, mesh, agent-card, SDK, version management, kagent, trust, and workspace validation [S3]. The local changelog says v0.5 added agent identity, security posture, and protocol declarations; v0.5.1 added CAOE cognition types, role manifests, MCP dependency-injection wiring, proxy support, and security cleanup [S6].

## OSSA + DUADP together

OSSA and DUADP are complementary:

| Layer | Main question | Bluefly component | Primary artifacts |
| --- | --- | --- | --- |
| Identity and contract | What is this agent allowed to be and do? | OSSA | YAML manifest, GAID/DID, signatures, policies, SBOM, exports |
| Discovery | Where can this capability be found and verified? | DUADP | `.well-known` endpoints, WebFinger, DNS TXT, gossip, registry entries |
| Execution | How does work run? | Runtime/framework | Kubernetes, LangGraph, CrewAI, GitLab Duo, Claude, Cursor, Drupal |

The local OSSA README summarizes the relationship as "OSSA defines the agent. DUADP discovers it" and maps OSSA to agent DID, signed manifests, Cedar policies, and NIST controls, while DUADP supplies federated DNS/WebFinger discovery, cross-node gossip, policy-aware capability routing, and trust-tier gating [S6].

## Common themes across sources

1. Protocols are becoming infrastructure. Harvard LIL argues that open protocols reveal what builder communities agree on and can shape agent behavior, much as TCP/IP and DNS shaped the internet [S8][S9].
2. Separation of layers matters. MCP, A2A, AG-UI, OSSA, DUADP, ANP, ACP, and Agent Protocol overlap less when treated as layers: tools/data, agent collaboration, UI streaming, contracts, discovery/identity, network negotiation, lightweight messaging, and production serving APIs [S21-S34].
3. Identity is unresolved. NIST/NCCoE, Gravitee, OSSA/DUADP, ANP, and Harvard JOLT all point toward cryptographic identity, delegated authority, trust tiers, revocation, auditability, and policy enforcement as foundational [S1][S2][S13][S15][S26][S48].
4. Production agents need deterministic guardrails. Security sources repeatedly warn that prompts are not policy. Tool calls need external authorization, least privilege, short-lived scoped credentials, audit logs, and human approval for high-risk actions [S48-S52].
5. The web itself will change. MIT reports no settled standards for how agents should behave on the web, while HUMAN Security reports agentic AI traffic grew 7,851% year over year in 2025 and now includes autonomous checkout activity [S10][S11][S53].

## Recommended operating model

For a new production agent program in 2026, start with a narrow, auditable workflow. Use MCP for tool/data access, add AG-UI only when a real-time user interface needs state and interrupt semantics, and add A2A when independent agents across frameworks or organizations must delegate work [S22][S24][S25][S34][S54]. Define the agent contract in a portable manifest such as OSSA when deployment, governance, or export to multiple platforms matters [S2][S3]. Publish and resolve agents through a discovery layer such as DUADP when cross-domain lookup, trust tiers, or federation is required [S1][S5].

Security should be designed before pilots leave the sandbox: unique agent identity, default-deny tools, policy evaluation before execution, scoped ephemeral credentials, provenance, revocation, observability, and human approval for irreversible actions [S13][S14][S48-S52]. Reliability should include health/readiness endpoints, per-tool latency and success metrics, circuit breakers, retries with jitter, timeout budgets, graceful degradation, caching, chaos testing, and pre-deploy evaluation gates [S46][S55].
