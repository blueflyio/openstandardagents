# Open-source frameworks, platforms, repositories, and npm packages

Research compiled as of 2026-05-28. GitHub metadata was collected with `gh repo view`; npm metadata was collected with `npm view`.

## Repository comparison

| Project | Primary purpose | Stars | License | Maturity signal |
| --- | --- | ---: | --- | --- |
| Microsoft AutoGen | Multi-agent conversation/orchestration framework | 58,482 | CC-BY-4.0 repo metadata | Historically influential; Microsoft recommends Microsoft Agent Framework for new projects [T32] |
| CrewAI | Role-based autonomous agent crews and flows | 52,351 | MIT | Large community; practical role/task abstraction [T31] |
| LlamaIndex | Data framework for agentic RAG and document agents | 49,721 | MIT | Mature RAG/document-agent ecosystem [T33] |
| LangGraph | Stateful graph runtime for resilient agents | 33,229 | MIT | Strong production-control story: graph state, checkpoints, interrupts [T29][T30] |
| OpenAI Agents SDK Python | Lightweight multi-agent workflow SDK | 26,716 | MIT | Provider-agnostic, 100+ LLMs, tracing/guardrails [T26] |
| A2A | Agent-to-agent interoperability protocol | 24,042 | Apache-2.0 | Strong standards/adoption signal [T19][T20] |
| AG-UI | Agent-user interaction protocol | 13,894 | MIT | Fast-growing UI protocol surface [T21] |
| OpenAI Agents SDK JS | TypeScript/JavaScript agent SDK | 3,137 | MIT | npm package `@openai/agents` v0.11.5 [T27][T28] |
| Agent Network Protocol | Agent-network communication protocol | 1,304 | Apache-2.0 | Early identity/semantic-web oriented protocol [T22] |
| BeeAI ACP | Agent Communication Protocol | 1,004 | Apache-2.0 | Folded into A2A ecosystem [T24] |
| LangChain Agent Protocol | Agent-serving API standard | 595 | MIT | Narrow but useful runs/threads/store standard [T23] |
| monday ATP | Code-first sandboxed tool protocol | 97 | MIT | Young protocol with active npm package family [T25][T35] |
| OSSA mirror | Open Standard for Software Agents | 5 | Apache-2.0 | Primary development on GitLab; npm package v0.5.1 [T03][T07] |
| DUADP mirror | Discovery protocol SDK | 0 | Apache-2.0 | Primary development on GitLab; npm package v0.1.4 [T05][T07] |

## npm package findings

| Package | Version | License | What it provides |
| --- | ---: | --- | --- |
| `@bluefly/openstandardagents` | 0.5.1 | Apache-2.0 | OSSA schemas, CLI, validator/generator/migration services, MCP server, trust exports, agent-card generation [T03][T07] |
| `@bluefly/duadp` | 0.1.4 | Apache-2.0 | DUADP TypeScript SDK: client, Express server router, validators, crypto, DID, conformance, CLI [T05][T07] |
| `@openai/agents` | 0.11.5 | MIT | OpenAI Agents SDK for TypeScript; agents, handoffs/tools, guardrails, tracing [T27][T28] |
| `@mondaydotcomorg/atp-server` | 0.25.0 | MIT | ATP server for sandboxed execution, API aggregation, MCP/OpenAPI integration [T35] |
| `@mondaydotcomorg/atp-client` | 0.24.0 | MIT | ATP client for connecting to servers, executing code, handling callbacks [T35] |
| `@mondaydotcomorg/atp-protocol` | 0.22.3 | MIT | ATP core protocol types, schemas, JSON-RPC messages, execution/callback/tool types [T35] |

## OSSA: `@bluefly/openstandardagents`

OSSA is best understood as the agent contract and export layer. The package description calls it an infrastructure bridge between protocols such as MCP/A2A and deployment platforms such as Docker, Kubernetes, LangChain, CrewAI, Claude Skills, and others [T03].

Important primitives in the package include:

- JSON Schema exports for current and older agent manifests.
- Validation, generation, migration, trust, workspace validation, and version-management services.
- Agent Card generation for A2A-style discovery.
- OpenAPI extension schemas.
- CLI binaries: `ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, and `ossa-mcp`.
- Production MCP server export [T03].

The site emphasizes formal schema validation, conformance testing, cryptographic provenance, GAID identity, Cedar policy integration, cost controls, human-in-the-loop metadata, state management, and 23+ export targets [T01]. That means OSSA is not merely a documentation format; it is intended to be the source artifact for policy, deployment, identity, and portability.

## DUADP: `@bluefly/duadp`

DUADP is the discovery, publishing, and federation layer. The npm package is a TypeScript SDK with both client and server primitives. A DUADP node is any HTTP service that exposes the required discovery and registry endpoints; the SDK can turn an Express app into such a node [T05].

Key SDK primitives:

- `DuadpClient` for discovery and listing skills, agents, and tools.
- `createDuadpRouter` for mounting protocol endpoints.
- `validateResource` for OSSA resource validation.
- `generateKeyPair`, `signResource`, and `verifyResource` for Ed25519 signing.
- `resolveDid` for W3C DID resolution.
- `runConformanceTests` for compliance checks [T05].

Key concepts:

- DUADP Node: HTTP server implementing discovery and `/api/v1/*` endpoints.
- GAID: global agent/resource identifier such as `agent://namespace/kind/name`.
- DID: decentralized identity such as `did:web`.
- Trust tiers: official, verified-signature, signed, community, experimental.
- Federation: gossip-based peer discovery with hop limits and circuit breakers [T05].

The public site adds live-network capabilities: DNS TXT records, WebFinger, federated search, content-hash deduplication, source attribution, NIST governance profile, Cedar policy sets, and 17 MCP tools [T02].

## OpenAI Agents SDK

The OpenAI Agents SDK is a lightweight framework for multi-agent workflows. The Python repository describes support for OpenAI Responses/Chat Completions and 100+ other LLMs, with core concepts including agents, agents-as-tools/handoffs, tools, guardrails, sessions, and tracing [T26]. The TypeScript SDK uses similar primitives and is published as `@openai/agents` v0.11.5 [T27][T28].

Strengths:

- Minimal abstraction surface.
- Built-in tracing and sessions.
- Handoffs for specialist delegation.
- Guardrails for input/output validation.
- Provider-agnostic operation despite OpenAI branding [T26][T27].

Best fit: teams already using OpenAI APIs or TypeScript/Python SDK patterns who need a lighter-weight framework than a graph runtime.

## LangGraph

LangGraph models workflows as stateful graphs. Nodes are computation steps or agents, edges define control flow, and state moves through the graph. Its production value is persistence: checkpointers save graph state at each step into threads, enabling human-in-the-loop workflows, memory, time travel, and fault-tolerant execution [T29][T30].

Human-in-the-loop support is structural. Middleware can inspect proposed tool calls after model output and before execution, interrupt the graph, save state, request a human decision, and resume with approve/edit/reject/respond outcomes [T30].

Best fit: regulated, long-running, cyclic, or failure-sensitive workflows where state, replay, approval gates, and explicit control flow matter more than quick prototyping.

## CrewAI

CrewAI's mental model is human teams. Agents have roles, goals, and backstories; tasks are assigned to agents; crews run sequential or hierarchical collaboration; flows provide event-driven orchestration and state management [T31].

Strengths:

- Natural role/task abstraction that is easy to explain to product and business teams.
- Fast path from idea to prototype.
- Crews for autonomous collaboration.
- Flows for more precise event-driven production pipelines [T31].

Limitations: role-based workflows can hit a complexity ceiling when tasks need complex loops, branching, retries, and durable state. At that point, LangGraph-style explicit state machines are often a better fit [T30][T36].

## LlamaIndex

LlamaIndex is strongest where agents need data. The project describes itself as an open-source framework to build agentic applications, with a strong focus on document agents, parsing, extraction, indexing, and RAG [T33].

Its workflow system supports multi-step RAG, routing, query planning, retrieval, reranking, synthesis, and event-driven agent pipelines [T33]. It is a good choice when the agent's central job is finding, structuring, and reasoning over enterprise or document data.

## AutoGen and Microsoft Agent Framework

AutoGen pioneered multi-agent conversation patterns and remains a major repository by community size. The current README positions AutoGen as a framework for multi-agent AI applications that can act autonomously or alongside humans, but also says Microsoft recommends Microsoft Agent Framework for new projects [T32].

The practical takeaway is to treat AutoGen as an important legacy and research ecosystem, not the default greenfield production framework. Existing AutoGen users should track migration paths into Microsoft Agent Framework [T32].

## GitLab Duo Agent Platform

GitLab Duo Agent Platform is a strong example of enterprise platform packaging. It is not just a coding assistant; it provides agentic chat with GitLab lifecycle context, foundational agents, custom agents, external agents, flows, MCP Client support, governance controls, model selection, and deployment across GitLab.com, Self-Managed, and Dedicated [T34].

Key agent categories:

- Foundational agents: GitLab-built Planner Agent and Security Analyst Agent at GA.
- Custom agents: organization-specific agents managed through AI Catalog.
- External agents: Claude Code and Codex CLI integrated into GitLab workflows [T34].

Key flows:

- Issue to merge request.
- Convert to GitLab CI/CD.
- Fix CI/CD pipeline.
- Code review.
- Software development in IDE [T34].

This platform suggests where enterprise agent products are heading: governed usage, activity visibility, namespace access controls, central model choice, MCP tool access with approvals, and reusable flows instead of isolated chatbots [T34].

## Cost and reliability lessons from production blogs

47Billion's production analysis is useful because it separates demos from operations. It recommends starting at low autonomy levels: prompt chains, branching workflows, and tool-using agents before open-ended multi-agent systems [T36].

Indicative per-task cost ranges from that report:

| Approach | Cost per task | Tokens per task | Best use |
| --- | ---: | ---: | --- |
| Simple workflow | $0.10-$0.50 | 1,000-3,000 | Deterministic tasks |
| CrewAI multi-agent | $0.50-$2.00 | 3,000-10,000 | Structured multi-step tasks |
| AutoGen multi-agent | $2.00-$5.00 | 5,000-25,000 | Exploratory collaboration |
| LlamaIndex RAG | $0.20-$1.00 | 1,000-5,000 | Document queries [T36] |

Reliability recommendations:

- Use structured outputs with validation.
- Keep temperatures conservative for deterministic tasks.
- Whitelist tools and prevent hallucinated tool calls.
- Use progressive rollout.
- Add human-in-the-loop checkpoints.
- Monitor token and cost budgets from day one [T36].

## Framework selection guidance

| Need | Recommended starting point |
| --- | --- |
| Portable agent definition, governance, export | OSSA |
| Federated discovery and trust-tier search | DUADP |
| Tool/data integrations | MCP server plus framework adapter |
| Cross-agent interoperability | A2A Agent Card and task lifecycle |
| UI streaming and approvals | AG-UI |
| Stateful durable workflows | LangGraph |
| Fast role-based teams | CrewAI |
| Document/RAG-heavy agents | LlamaIndex |
| Minimal SDK in Python/TypeScript | OpenAI Agents SDK |
| Enterprise SDLC platform | GitLab Duo Agent Platform |
| Secure code-first tool execution | monday ATP |
