# Agentic AI landscape overview

Source review date: 2026-05-23.

## Executive synthesis

Agentic AI is moving from chat-centric prototypes toward systems that can use tools, delegate work, discover other agents, maintain state, and take side-effecting actions. The ecosystem is converging around layered standards rather than one universal protocol: MCP connects agents to tools and data, A2A and ACP connect agents to other agents, AG-UI connects agents to frontends, ANP and DUADP focus on discovery and decentralized identity, and OSSA focuses on the portable contract that describes what an agent is allowed to do and how it should be deployed [S03][S06][S08][S10][S11][S13].

The core pattern is an "internet stack" for agents. Tool access, peer communication, discovery, UI events, package manifests, identity, policy, provenance, and runtime observability are separating into different layers. Harvard's Agent Protocols Tech Tree argues that open protocols reveal what builders have working and what they are choosing to standardize; in this moment, protocols may shape agent behavior more than model regulation alone because agents are cheap to build and hard to police after deployment [S15].

The security picture is not mature enough for unbounded autonomy. MIT Sloan's 2026 guidance says agentic AI is not yet ready for high-stakes mainstream use because hallucinations and prompt injection remain operational blockers, although it expects agents to handle most transactions in large-scale business processes by approximately 2031 [S17]. MIT's 2025 AI Agent Index documents transparency gaps: only 4 of 13 frontier-autonomy agents disclose agentic safety evaluations, 25 of 30 disclose no internal safety results, 23 of 30 have no third-party testing, and web-conduct standards are not established [S16].

## What DUADP is

DUADP, the Decentralized Universal AI Discovery Protocol, is a discovery layer for AI agents. Its public site describes it as "DNS for AI agents": agents publish discoverable resources, nodes resolve them through DNS TXT records, WebFinger and well-known endpoints, and federation spreads registrations through a gossip mesh [S01]. DUADP uses DID-based identity so a Global Agent Identifier can resolve to endpoints and verification material. It also exposes REST endpoints and 17 MCP tools for discovery, publishing, validation, federation, governance, identity, health, and metrics [S01].

The npm package `@bluefly/duadp` is the TypeScript SDK and CLI. As of the 2026-05-23 npm snapshot it is version 0.1.4, Apache-2.0 licensed, published from the GitLab repository `blueflyio/duadp/duadp`, and exposes `duadp` as a CLI plus client, server, validation, crypto, DID, and conformance entry points [S02].

## What OSSA is

OSSA, the Open Standard for Software Agents, is a portable manifest and contract layer. It is not positioned as a transport protocol or agent framework; it defines an agent once in YAML or JSON and exports that definition to deployment targets such as MCP, A2A, Docker, Kubernetes, LangChain, CrewAI, GitLab Duo, Claude/Cursor-style agent environments, Drupal, and npm packaging [S03][S05]. Its public site frames the gap as: MCP says how an agent accesses tools, A2A says how agents communicate, but neither defines the portable contract describing identity, capabilities, compliance, lifecycle, security and trust [S03].

The npm package `@bluefly/openstandardagents` is the OSSA CLI, schemas and SDK surface. As of the 2026-05-23 npm snapshot it is version 0.5.1, Apache-2.0 licensed, and exports schemas, validation, generation, migration, mesh, agent-card generation, trust services, workspace validation, and an MCP server. The CLI binaries include `ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, and `ossa-mcp` [S04].

## Main themes

1. **Interoperability is splitting by boundary.** MCP is agent-to-tool; A2A and ACP are agent-to-agent; AG-UI is agent-to-frontend; ANP and DUADP are discovery/identity; OSSA is manifest/contract [S03][S06][S08][S10][S11][S13][S35].
2. **Identity is the bottleneck.** NIST/NCCoE is explicitly seeking input on agent identification, authentication, authorization, auditing, non-repudiation and prompt-injection controls [S18]. Gravitee reports that only 21.9% of teams treat agents as independent identities, while 45.6% still use shared API keys for agent-to-agent authentication [S19][S34].
3. **Production needs an operations layer beyond protocols.** MCP standardizes tool discovery and invocation, but 2026 production analysis identifies missing primitives such as identity propagation, adaptive tool budgeting and structured error semantics [S42]. AgentOps guidance converges on trace IDs, per-step logs, cost attribution, eval drift, tool success metrics, circuit breakers and rollout gates [S28][S42].
4. **Governance is moving into manifests and gateways.** OSSA uses manifest-level compliance, human-in-the-loop, cost controls, Cedar policies, signatures and trust tiers [S03][S05]. Gravitee and similar approaches place an identity-aware control plane between agents and tools so each call can be authorized before execution [S34].
5. **Open-source frameworks are converging around durable, inspectable orchestration.** LangGraph emphasizes graph state, checkpoints, durable execution and interrupts; OpenAI Agents SDK emphasizes agents, sandbox agents, handoffs, guardrails, sessions and tracing; CrewAI emphasizes role-based crews and event-driven flows; LlamaIndex emphasizes RAG, data workflows and document agents [S22][S23][S24][S26].

## Compact protocol map

| Layer | Examples | Main question answered |
| --- | --- | --- |
| Tool/context | MCP | What tools and data can the agent use? |
| Agent contract | OSSA | What is this agent, with what identity, policy and deployment shape? |
| Agent discovery | DUADP, ANP, registries | How does one agent find another trusted agent? |
| Agent-to-agent work | A2A, ACP, LangChain Agent Protocol | How do agents delegate, run, stream and persist tasks? |
| Agent-to-user UI | AG-UI | How does a user-facing app receive state, messages and events? |
| Security/governance | NIST/NCCoE, OWASP, Gravitee, Cedar/OpenFGA/AuthZen | Who is allowed to do what, under which constraints, with which audit trail? |

## Practical recommendations

- Start with a narrow agent and an explicit contract. Define identity, capabilities, tool permissions, cost budgets, HITL points, data classes, audit events and revocation behavior before exposing production tools [S03][S18][S19].
- Use MCP for tool/data access, then add A2A or ACP only when there are multiple independently deployed agents that need task delegation or messaging [S07][S08][S13][S35].
- Put a gateway or policy enforcement point between agents and tools. Do not rely on prompts, model self-discipline or a broad API key as an authorization boundary [S19][S20][S21][S34].
- Treat every side-effecting action as untrusted until verified. Validate action parameters, scopes, user delegation, current risk context and cost/latency budgets before execution [S18][S20][S42].
- Instrument runs before broad rollout: trace ID, tool calls, inputs/outputs, token/cost, latency, errors, approvals and final outcome [S22][S23][S28][S42].

## Limitations

Several sources are vendor or consultancy publications rather than peer-reviewed work. Where possible, this report anchors claims in official protocol documentation, university research, government concept papers, GitHub repository metadata, and npm registry metadata. Some 2026 guides cite proprietary surveys or paywalled reports; those claims are included only when corroborated by accessible summaries or primary pages [S19][S28][S29][S40].
