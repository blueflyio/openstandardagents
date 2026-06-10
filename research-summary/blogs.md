# Industry Blogs and Engineering Publications

Research current as of 2026-06-10. Source keys refer to `reading-list.md`.

## 47Billion: production realism

47Billion’s “AI Agents in Production” article treats agent deployment as an engineering discipline rather than a novelty demo. Its main protocol framing is the same layered stack found elsewhere:

- MCP for agent-to-tool and agent-to-data access.
- A2A for agent-to-agent coordination.
- AG-UI for agent-to-user/front-end interaction [S36].

The most useful contribution is its production-readiness table:

| System type                    | Production view                                                                |
| ------------------------------ | ------------------------------------------------------------------------------ |
| Simple workflows               | Ready with error handling, input validation, monitoring.                       |
| Tool-using agents              | Ready with guardrails, output validation, cost limits, fallbacks.              |
| Structured multi-agent systems | Cautiously ready with heavy guardrails, HITL checkpoints, progressive rollout. |
| Open-ended multi-agent systems | Not ready for critical paths because of unpredictability [S36].                |

Recommended actions include structured outputs, conservative model settings for deterministic tasks, tool whitelisting, progressive rollout, internal pilots, cost monitoring before production, and early documentation of internal APIs that could become MCP servers [S36].

## Ruh.ai: protocol decision framework

Ruh.ai’s 2026 guide positions protocols as the answer to integration barriers. It cites Gartner’s 2025 research that 40% of enterprise applications will integrate AI agents by 2026, and argues communication barriers remain the primary cause of implementation failures [S37].

Its decision framework:

| Need                                                      | Protocol |
| --------------------------------------------------------- | -------- |
| Agents need tools, data, APIs, applications               | MCP      |
| Multiple agents must coordinate across vendors or systems | A2A      |
| Lightweight HTTP-based messaging or quick prototypes      | ACP      |

The blog’s most important recommendation is sequencing. Do not implement every protocol because it exists. Start with the boundary that is blocking the product, then add layers as complexity grows [S37].

## Gravitee: adoption outpaces control

Gravitee’s 2026 State of AI Agent Security report supplies the strongest adoption and incident statistics:

- 80.9% of technical teams are beyond planning.
- 14.4% have full IT/security approval for the entire fleet.
- 47.1% of agents are actively monitored or secured on average.
- 88% of organizations reported confirmed or suspected security/privacy incidents in the last year.
- 21.9% treat agents as independent identities.
- 45.6% use shared API keys for agent-to-agent authentication.
- 27.2% use custom, hardcoded authorization logic [S38], [S39].

The engineering takeaway is that API gateways and static security reviews are not enough. Agents need identity-aware enforcement, policy-aware routing, runtime logging, and central discovery of agent fleets [S38], [S39].

## DEV Community: execution-layer security

The DEV Community guide on AI agent authentication and authorization is practically useful because it focuses on the execution layer. Its example failure is a production support agent prompt-injected into sending a Slack message to 14,000 customers because the agent had the credentials and permissions [S40].

Key recommendations:

- use OAuth 2.1 delegated authorization for user-scoped actions;
- grant time-bound, granular scopes;
- put a gateway or chaperone between agents and tools;
- default deny and whitelist tool access;
- block self-escalation;
- use human approval for high-risk operations;
- maintain audit logs and replayable traces [S40].

This aligns with OWASP’s Excessive Agency guidance: minimize functionality, permissions, and autonomy [S41].

## Harvard/Berkman and Harvard Journal of Law and Technology: agentic web governance

Harvard’s work frames agents as an internet-governance problem. The Agent Protocols Tech Tree explains that open protocols are where the builder community exposes what it agrees on and what it wants to make easy [S06]. The Berkman Klein workshop asks whether agent identification and interchange standards should arise from industry, regulation, or new collaboration models similar to early internet protocols [S07].

The Harvard Journal of Law and Technology commentary sharpens the issue: the agentic web will be governed either by proprietary platform rules or by open protocols that enable portable identity, verifiable delegation, and accountable behavior [S08].

Actionable takeaway: teams building open agent infrastructure should invest in Know Your Agent-style identity, capability disclosure, provenance, delegation, and accountable control surfaces rather than only endpoint APIs [S08].

## Web infrastructure publications: bot traffic and agent channels

CNBC’s coverage of HUMAN Security’s State of AI Traffic report says automated traffic grew almost eight times faster than human traffic in 2025, and agentic traffic from autonomous agents grew nearly 8,000% over the prior year [S43]. Fastly frames 2026 as a web infrastructure tipping point where nearly half of traffic is bot traffic, and the operational question becomes intent, not just bot blocking [S44].

The HTTP Agent Profile draft proposes one infrastructure path:

- cryptographic authentication of agent traffic with HTTP Message Signatures;
- privacy-preserving human tokens to separate human and agent traffic;
- HTTP 402-based payment challenges and micropayment mechanisms for agent access [S45].

This is relevant to OSSA/DUADP because it confirms that agent identity and discovery need to connect to web infrastructure, not only application registries.

## Framework comparison blogs

The framework comparison literature is consistent:

- **LangGraph** is preferred for explicit state machines, branching, debugging, recovery, and production workflows [S28], [S36].
- **CrewAI** is preferred for rapid role-based business workflows and structured specialist collaboration [S29], [S36].
- **AutoGen** is strong for conversational multi-agent research and iterative collaboration but can have token/cost overhead [S30], [S36].
- **LlamaIndex** is strongest when retrieval and document grounding are the core problem [S31].
- **OpenAI Agents SDK** is lightweight and provider-aware, with agents, handoffs, guardrails, tracing, and model adapters [S27].

Cost guidance across blogs: framework license cost is usually secondary to token volume, retries, observability, hosted execution, vector queries, and human review. Teams should define cost-per-task budgets and alert thresholds before broad rollout [S36], [S37].

## Engineering recommendations distilled from blogs

1. **Do not start with open-ended autonomy.** Start with bounded, boring, high-volume workflows.
2. **Instrument before rollout.** Trace requests, plans, tool calls, validations, commits, cost, and latency.
3. **Constrain I/O.** Use JSON Schema, typed tool definitions, and output validation.
4. **Whitelist tools.** Agents cannot hallucinate APIs if the execution layer only exposes allowed capabilities.
5. **Use progressive delivery.** Internal pilot, beta, canary, then broader rollout.
6. **Budget per path.** Global caps are not enough; apply per-task and per-agent limits.
7. **Separate identity from intent.** OAuth proves who is calling; runtime policy must also decide whether the action is appropriate.
8. **Treat agents as service accounts plus decision engines.** They need lifecycle, scopes, review, revocation, and audit.
9. **Use protocols to reduce bespoke glue.** Adopt MCP/A2A/AG-UI/DUADP/OSSA where they match a boundary, but avoid protocol maximalism [S36], [S37], [S40].

## Limitations

Some blog statistics are vendor-provided and should be treated as directional unless backed by methodology details. Gravitee’s report is the most concrete survey source in this set, but teams should still validate its findings against their own telemetry and risk posture [S38], [S39].
