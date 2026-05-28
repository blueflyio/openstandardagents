# Agentic AI ecosystem overview

Research compiled as of 2026-05-28.

## Executive synthesis

The 2026 agent ecosystem is separating into layers. MCP connects agents to tools and data, A2A connects agents to other agents, AG-UI connects agents to frontends, and discovery/identity protocols such as DUADP and ANP try to answer how agents are found and trusted. OSSA sits in a different layer: it is a portable contract/manifest standard for describing what an agent is, what it can access, how it is governed, and how it exports to runtimes such as Docker, Kubernetes, LangChain, CrewAI, GitLab Duo, and MCP/A2A adapters [T01][T03][T04].

The core technical gap is not that agents are hard to build. Harvard Library Innovation Lab frames agents as "models using tools in a loop," which makes them easy to reproduce and hard to govern centrally. That is why open protocols matter: they are the artifacts where builders agree on what must interoperate, just as TCP/IP, DNS, SMTP, HTTP, and SSL did for the early internet [T09].

Production adoption is ahead of governance. MIT's 2025 AI Agent Index found that 24 of 30 prominent agents launched or had major agentic updates in 2024-2025, but only 4 of 13 high-autonomy agents disclosed agentic safety evaluations; 25 of 30 disclosed no internal safety results, and 23 of 30 had no third-party testing information [T10]. Gravitee's 2026 survey similarly found 80.9% of technical teams past planning, but only 14.4% with full security approval and 88% reporting confirmed or suspected incidents [T38].

## What OSSA and DUADP are

| Item | What it is | Primary role | npm package status |
| --- | --- | --- | --- |
| OSSA / Open Standard for Software Agents | Vendor-neutral YAML/JSON agent manifest and CLI/MCP tooling | Contract layer: identity, capabilities, governance, policy, cost, lifecycle, exports | `@bluefly/openstandardagents` v0.5.1, Apache-2.0 [T03][T07] |
| DUADP / Decentralized Universal AI Discovery Protocol | Federated discovery, publishing, identity, and registry mesh for agents/skills/tools | Discovery layer: DNS/WebFinger/gossip, GAID/DID verification, trust-tier routing | `@bluefly/duadp` v0.1.4, Apache-2.0 [T02][T05][T07] |

OSSA is explicitly not an agent framework and not a communication protocol. It is closer to OpenAPI for agents: a schema-validated contract that can be validated, converted, inspected, migrated, and exported to many deployment targets [T01][T04]. Its package exposes schemas, validation, generation, migration, agent-card generation, trust services, workspace validation, and an MCP server [T03].

DUADP is the companion discovery layer. It lets any node publish a `.well-known` discovery surface and registry endpoints for agents, skills, and tools. Its TypeScript SDK includes a client, Express router, validators, Ed25519 signing/verification helpers, DID resolution, and conformance tests [T05]. The public site extends that into a broader live network story: DNS TXT bootstrap, WebFinger, gossip federation, GAID lookup, DID proofs, Cedar policy inputs, NIST trust profiles, and 17 MCP tools [T02].

## Important OSSA/DUADP doc drift

There is a version and naming drift to track. The public OSSA site presents v0.5.0 in places, while the local package and npm metadata are v0.5.1 [T01][T03][T07]. Local spec files use "UADP" and `/.well-known/uadp.json`, while the DUADP npm README and public website use "DUADP" and variants such as `/.well-known/duadp.json` or `/.well-known/duadp` [T02][T05][T06]. The concepts are aligned, but the public-facing protocol name and endpoint spelling should be normalized before downstream implementers rely on the docs.

## The current protocol stack

| Layer | Protocols | Main question answered |
| --- | --- | --- |
| Agent-to-tool/context | MCP | How does an agent access tools, data, resources, and prompts? [T18] |
| Agent contract | OSSA | What is this agent, what can it do, and under what governance rules? [T01] |
| Agent-to-agent tasking | A2A, ACP, ANP | How do agents discover capabilities, authenticate, delegate tasks, and exchange state? [T19][T20][T22][T24] |
| Agent-to-user interface | AG-UI | How do agent state, UI intent, messages, tool calls, approvals, and streaming events flow to a frontend? [T21] |
| Discovery and registry | DUADP, ANP, Agent Cards, WebFinger | How do agents and tools become findable across organizational boundaries? [T02][T20][T22] |
| Code-first tool execution | ATP | How can an agent safely execute code against tools/APIs rather than only call fixed functions? [T25][T35] |

MCP is the most mature tool/data integration standard. A2A is the strongest cross-agent communication standard by adoption signal, with 150+ supporting organizations and an Apache-2.0 Linux Foundation project [T18][T19][T20]. AG-UI is filling the frontend gap; ANP and DUADP address identity/discovery; ATP explores secure sandboxed code execution for complex tool workflows [T02][T21][T22][T25].

## Academic and policy signal

Universities are converging on three themes: practical architectures, open protocols, and governance. Cornell's program teaches LLM fundamentals, RAG, tool/memory agents, multi-agent workflows, MCP, and governance/risk/security in one architecture curriculum [T08]. Harvard LIL maps protocols as a "tech tree" because protocols reveal what builders are forced to agree on [T09]. MIT's AI Agent Index documents transparency gaps and lack of web-conduct standards, while MIT Sloan cautions that agentic AI is not ready for prime time due to hallucinations and prompt injection, despite expecting agents to handle most transactions in many large-scale business processes within five years [T10][T11].

## Framework signal

Frameworks divide by control model:

- LangGraph is strongest for stateful, auditable, checkpointed workflows where graph structure, pause/resume, and human approval gates matter [T29][T30].
- CrewAI is strongest for fast role-based multi-agent teams and business-process prototypes, with "crews" and event-driven "flows" [T31].
- OpenAI Agents SDK offers a minimal primitive set: agents, handoffs/agents-as-tools, guardrails, sessions, and tracing, including TypeScript/npm support via `@openai/agents` [T26][T27][T28].
- LlamaIndex remains strongest for data-heavy agentic RAG and document workflows [T33].
- AutoGen remains historically important, but Microsoft now recommends Microsoft Agent Framework for new projects as AutoGen moves toward maintenance mode [T32].
- GitLab Duo Agent Platform shows the enterprise-platform direction: foundational agents, custom agents, external agents, repeatable flows, MCP client, governance, activity visibility, and model selection in one SDLC platform [T34].

## Security and governance themes

The dominant risks are prompt injection, over-permissioned tools, hallucinated actions, weak identity, shared credentials, unaudited agent-to-agent delegation, and protocol-level vulnerabilities [T13][T15][T16][T38][T39][T40]. The strongest recommendations are structural rather than prompt-based:

1. Treat agents as first-class identities, not anonymous scripts or human-user extensions [T12][T38].
2. Enforce authorization outside the model with policy engines, middleware, ABAC/PBAC, Cedar/OPA-style decisions, and fail-closed behavior [T01][T12][T14][T39].
3. Scope tools to least privilege; remove shell/code execution unless the task truly requires it [T39][T40].
4. Use human approval for destructive, irreversible, financial, legal, or high-risk actions [T11][T30][T36][T39].
5. Keep append-only audit logs, distributed traces, provenance, and versioned prompts/manifests outside the agent's write scope [T14][T16][T34][T36][T38].

## Bottom line

The market is building the agentic web's equivalent of DNS, HTTP, OAuth, OpenAPI, and Kubernetes at the same time. The durable architecture is likely layered: MCP for tools, A2A/ANP for agent communication, AG-UI for user interaction, DUADP for discovery and federation, OSSA for the portable contract, and policy/audit infrastructure around every side effect. Teams should start with narrow, high-value agents, adopt standards early, and require verifiable identity, least privilege, telemetry, and human approval gates before allowing autonomous production actions [T01][T02][T18][T19][T36][T38].
