# Agentic AI ecosystem research overview

Research run date: 2026-06-03. Relative date language from sources is rendered here as absolute dates where possible. Citation keys such as `[duadp-site]` resolve in `reading-list.md`.

## Executive synthesis

The agent ecosystem in early 2026 is becoming a layered infrastructure stack rather than a single framework category. A useful mental model is: MCP connects agents to tools and data, A2A/ACP connect agents to other agents, AG-UI connects agents to user interfaces, DUADP discovers agents across domains, and OSSA defines the portable contract that declares what an agent is allowed to do and how it can be deployed [anthropic-mcp] [a2a-spec] [ag-ui-readme] [duadp-site] [ossa-site].

Harvard Library Innovation Lab frames this moment as similar to early internet protocol formation: open protocols expose what builders have agreed must interoperate, and they shape behavior by making some architectures easier to build than others [harvard-aptt]. MIT's 2025 AI Agent Index shows why this matters: 24 of 30 prominent agents were launched or materially updated in 2024-2025, but safety transparency is thin, web conduct standards are absent, and only 4 of 13 frontier-autonomy agents disclosed agent-specific safety evaluations [mit-index] [mit-index-details].

Production guidance is now converging around progressive autonomy. Simple workflows and constrained tool-using agents can be production-ready with validation, monitoring, and cost controls. Structured multi-agent systems need strong guardrails and human-in-the-loop checkpoints. Open-ended multi-agent autonomy is still not reliable enough for critical paths [47billion-production] [mit-sloan-2026].

Security is the binding constraint. Gravitee's 2026 survey found 80.9% of technical teams beyond planning, only 14.4% with full security approval, 88% with confirmed or suspected incidents, and only 21.9% treating agents as independent identities [gravitee-2026]. NIST/NCCoE's February 2026 concept paper therefore focuses directly on identity, authorization, auditing, non-repudiation, and controls against prompt injection for software and AI agents [nist-agent-identity].

## What DUADP is

DUADP, the Decentralized Universal AI Discovery Protocol, is a discovery layer for AI agents. It positions itself as "DNS for AI agents" and combines DNS TXT records, WebFinger, gossip federation, W3C DIDs, GAIDs, trust tiers, and MCP/REST endpoints so agents can publish themselves and find one another without a central registry [duadp-site].

The public site reports protocol version 0.1.4, a `.well-known/duadp` endpoint, 17 MCP tools, federation support, 36 indexed registered resources, and a governance model mapping to NIST AI RMF with Cedar policies and trust tiers [duadp-site]. The npm package `@bluefly/duadp` latest is 0.1.4, Apache-2.0, created 2026-03-06, modified 2026-03-09, and exposes TypeScript SDK entry points for client, server, validation, crypto, DID, and conformance plus a `duadp` CLI [npm-duadp].

DUADP's central claim is that MCP and A2A do not answer discovery. MCP standardizes tool access. A2A standardizes agent-to-agent task exchange. DUADP adds cross-domain discovery, identity verification, federation, and trust filtering before an agent decides who to contact [duadp-site].

## What OSSA is

OSSA, the Open Standard for Software Agents, is a portable agent contract layer. The local package and site describe OSSA as neither a protocol like MCP/A2A nor a framework like LangChain/CrewAI, but the "missing middle layer" that defines agent identity, capabilities, compliance, lifecycle, tools, deployment targets, cost controls, human oversight, and trust metadata in a schema-validated YAML manifest [local-readme] [ossa-site].

The package `@bluefly/openstandardagents` latest is 0.5.1, Apache-2.0, created 2025-11-19, modified 2026-03-28, and exposes schemas, validation, generation, migration, agent-card generation, trust services, workspace validation, and an MCP server through npm exports and CLI binaries such as `ossa`, `ossa-dev`, `ossa-version`, and `ossa-mcp` [npm-ossa] [local-package].

The OSSA site presents the layer as "Every Agent Needs a Contract." It defines portable manifests that can export to Docker, Kubernetes, LangChain, CrewAI, GitLab Duo Agent, Claude/Cursor-style agent surfaces, MCP, A2A, npm, and Drupal integrations, with a trust model that includes GAID/DID identity, signed manifests, SBOM/provenance pointers, Cedar policies, and compliance metadata [ossa-site].

OSSA and DUADP are complementary in the Bluefly stack: OSSA defines the agent and its governance contract; DUADP discovers that agent and filters it through identity and trust signals [local-readme] [duadp-site].

## Ecosystem themes

### 1. Protocols are separating by layer

The clearest 2026 trend is protocol specialization. MCP is the agent-to-tool/data layer. A2A is the task-oriented agent-to-agent layer. AG-UI is the agent-to-user-interface event layer. ACP started as a lightweight REST-native agent communication protocol but is now being folded into A2A under the Linux Foundation. ANP explores decentralized identity, negotiation, and semantic application protocols for an agentic web. ATP and AGTP are newer proposals focused on code-execution/tool aggregation and transport-level agent traffic differentiation respectively [anthropic-mcp] [a2a-spec] [ag-ui-readme] [ibm-acp] [lf-acp-a2a] [anp-readme] [monday-atp] [agtp-draft].

### 2. Identity is becoming a first-order primitive

NIST/NCCoE asks how agents should be identified, authorized, audited, and constrained, including prompt-injection mitigations [nist-agent-identity]. Gravitee's survey shows why: many teams still use shared API keys, only a minority treat agents as independent identities, and more than half of agents lack monitoring or logging [gravitee-2026]. DUADP and OSSA directly respond with DIDs/GAIDs, signed manifests, trust tiers, revocation, provenance, and policy-aware discovery [duadp-site] [ossa-site].

### 3. Governance is moving from documents to runtime enforcement

The strongest security research argues that prompts are not enforceable controls. Production agents need deterministic checks before side effects occur: per-action authorization, sandboxing, structured validation, least-privilege credentials, signed audit trails, replayability, and human approval for high-risk actions [oap-paper] [dev-security-guide] [cacm-guardians]. MIT Sloan similarly recommends dynamic, risk-based oversight because too much supervision negates autonomy while too little creates operational and compliance risk [mit-sloan-agentic].

### 4. Adoption is outpacing readiness

MIT Sloan reports that more than one third of surveyed companies are already deploying agentic AI and another 44% are planning to do so, but leaders face tensions around scalability/adaptability, supervision/autonomy, and retrofit/reengineering [mit-sloan-agentic]. Gravitee reports broad production movement but weak approval, identity, and monitoring coverage [gravitee-2026].

### 5. Open-source frameworks are maturing unevenly

OpenAI Agents SDK, LangGraph, CrewAI, LlamaIndex, and Microsoft AutoGen/Microsoft Agent Framework reflect different philosophies: minimal primitives, graph-state orchestration, role/task crews, document/RAG tooling, and enterprise multi-agent orchestration. Repo metadata shows substantial community attention, but maturity differs. AutoGen is now in maintenance mode and points new users toward Microsoft Agent Framework [openai-agents-python] [openai-agents-js] [langgraph-readme] [crewai-readme] [llamaindex-readme] [autogen-readme].

## Strategic implications

For builders, the safest architecture is compositional. Start with explicit OSSA-like manifests or equivalent contracts; expose tools through MCP; use A2A only when independent agents must collaborate; use AG-UI when a live user-facing workflow needs streaming status, state, and approvals; add DUADP-like discovery only when agents must be findable across domains or organizations [ossa-site] [a2a-spec] [ag-ui-readme] [duadp-site].

For security teams, agent governance should be treated like a non-human identity and runtime control-plane problem. Require per-agent identities, scoped/short-lived credentials, policy-as-code, pre-action authorization, sandboxed execution, audit logs, revocation, and cost/iteration budgets [nist-agent-identity] [gravitee-2026] [oap-paper] [mit-tech-review-control-plane].

For executives, the high-value question is not whether agents are "ready" in general, but which workflows can tolerate probabilistic planning under bounded autonomy. MIT Sloan's guidance is to build reusable internal capabilities and testing capacity while keeping humans in the loop until reliability and security improve [mit-sloan-2026].
