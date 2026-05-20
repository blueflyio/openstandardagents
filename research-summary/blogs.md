# Tech Blogs and Engineering Publications

Prepared: 2026-05-20

## 47Billion: production frameworks and protocols

47Billion's 2026 production write-up is valuable because it is grounded in implementation experience rather than protocol marketing. It compares AutoGen, CrewAI, LlamaIndex, OpenAI Agents SDK, LangGraph, MCP, A2A, and AG-UI through the lens of what actually ships [S18].

The core message is that agent autonomy is a spectrum. Prompt chains and branching workflows are predictable; tool-using agents add useful autonomy; multi-agent systems are powerful but expensive and hard to debug. Their recommendation is to keep most production systems at structured workflow or bounded tool-agent levels unless there is a clear need for open-ended multi-agent collaboration [S18].

Their framework conclusions:

- AutoGen is powerful for exploratory multi-agent conversations but can loop, consume large amounts of tokens, and be hard to debug.
- CrewAI is a pragmatic middle ground for structured multi-step tasks.
- LlamaIndex is strongest for document-heavy and RAG-centric applications.
- LangGraph is valuable when explicit state, loops, checkpoints, and human-in-the-loop control matter.
- OpenAI Agents SDK is useful for teams that want a small primitive set and built-in tracing [S18].

The same article frames MCP, A2A, and AG-UI as complementary protocol layers: MCP for tools, A2A for agents, and AG-UI for frontends. It argues that teams adopting these standards early reduce bespoke integration work and can focus more effort on product logic [S18].

47Billion also provides actionable cost ranges:

| Approach | Cost estimate per task | Recommendation |
| --- | --- | --- |
| Simple workflow | $0.10-$0.50 | Use for deterministic tasks. |
| CrewAI multi-agent | $0.50-$2.00 | Use for structured multi-step tasks. |
| AutoGen multi-agent | $2.00-$5.00 | Reserve for exploratory collaboration. |
| LlamaIndex RAG | $0.20-$1.00 | Use for document processing. |

Their reliability playbook emphasizes structured outputs, validation, lower temperatures for deterministic tasks, tool-use constraints, progressive rollout, cost monitoring, HITL checkpoints, and iterative refinement [S18].

## Ruh.ai: 2026 protocol guide

Ruh.ai's 2026 guide presents MCP, A2A, and ACP as the three major AI agent protocols and argues that communication barriers are a primary cause of implementation failures [S19].

The guide cites Gartner's 2025 prediction that 40% of enterprise applications will integrate task-specific AI agents by 2026, up from less than 5% in 2025 [S19]. This statistic should be treated as an analyst-sourced claim via Ruh.ai because direct Gartner content may be gated.

Ruh.ai's decision framework is straightforward:

- Use MCP for sophisticated agents that need multiple data sources, compliance, audit trails, and tool invocation.
- Use A2A for multi-agent workflows, cross-organizational communication, dynamic discovery, and vendor-neutral orchestration.
- Use ACP when rapid deployment, REST familiarity, or legacy integration matter more than advanced features.
- Use a hybrid model when tool access and agent coordination are both required [S19].

The security section recommends least privilege, OAuth/mTLS/signed tokens, HMAC/integrity checks, rate limiting, circuit breakers, network segmentation, zero trust, and monitoring with OpenTelemetry, Prometheus, and Grafana [S19].

## Gravitee: State of AI Agent Security 2026

Gravitee's 2026 report is one of the strongest quantitative sources. It surveyed more than 900 executives and technical practitioners and found that agent deployment has outpaced governance [S17].

Critical statistics:

- 81% of teams are past planning.
- 80.9% of technical teams are in active testing or production.
- Only 14.4% report full security/IT approval for the entire agent fleet.
- 88% report confirmed or suspected incidents.
- Only 21.9% treat agents as independent identities.
- 45.6% still use shared API keys for agent-to-agent authentication.
- 27.2% use custom hardcoded authorization logic.
- Only 47.1% of agents are actively monitored or secured on average [S17].

The recommendation is to shift from periodic manual audits to continuous identity-aware enforcement. Gravitee's report is also useful because it treats the agent problem as infrastructure security, not simply model behavior [S17].

## Dev.to: authentication and authorization guide

The Dev.to guide gives an implementation-oriented explanation of why traditional service-account auth fails for agents. Agents are non-deterministic actors whose tool choices depend on runtime reasoning, so the blast radius equals all granted permissions [S20].

The guide's most actionable concept is the tool gateway: a security layer between the agent runtime and every tool. The gateway verifies session identity, checks rate limits, evaluates authorization policy, handles human approval, sanitizes parameters, executes tools, and logs audit events [S20].

The guide also names important anti-patterns:

- Shared API keys.
- God-mode database access.
- Trusting agent reasoning as a reason to escalate privileges.
- No emergency kill switch.
- Missing distinction between human and agent actions in logs [S20].

## Harvard Library Innovation Lab and Harvard JOLT

Harvard LIL's APTT blog is not an engineering playbook, but it is a strong policy/architecture lens. It argues that protocols are the best way to observe and shape the rapidly changing agent ecosystem because agents are technically simple to build and hard to regulate centrally [S23].

Harvard JOLT's agentic web article examines institutional governance. It uses the Amazon-Perplexity dispute to show that transparent agent identification is essential, but also warns against a future where each platform defines its own closed agent access regime. It favors portable, protocol-mediated credentials, verifiable delegation, and KYA-style standards [S24].

Together, the Harvard sources point to the same governance conclusion as the engineering sources: identity and protocols are public-interest infrastructure, not optional developer convenience [S23][S24].

## GitLab engineering and product publication

GitLab's GA announcement for Duo Agent Platform gives a concrete example of a major DevSecOps platform operationalizing agentic workflows across planning, coding, CI/CD, security, and review [S29].

Important product patterns:

- Agentic Chat with lifecycle context from issues, merge requests, pipelines, and security findings.
- Foundational agents for planning and security analysis.
- Custom agents and flows through an AI Catalog.
- External agents such as Claude Code and OpenAI Codex CLI.
- MCP client support with approval flows and group-level controls.
- Governance, visibility, model selection, and self-hosted deployment options [S29].

GitLab is relevant to the broader standards question because it shows that enterprise platforms want both agent extensibility and centralized governance.

## Common recommendations across publications

1. **Start narrow.** Narrow agents beat general agents for production reliability [S18].
2. **Use protocol standards early.** MCP, A2A, AG-UI, ACP, OSSA, and DUADP reduce bespoke integrations when used in the correct layer [S01][S02][S18][S19].
3. **Instrument cost from day one.** Multi-agent systems multiply token usage through history sharing, retries, and loops [S18].
4. **Treat HITL as infrastructure.** Approval gates, review/edit flows, escalation, and feedback loops are required for trust, compliance, and recovery [S18][S20].
5. **Give agents identities.** Shared credentials and generic service accounts break accountability [S17][S20][S21].
6. **Use gateways and policies.** Tool calls should be intercepted, validated, authorized, rate-limited, and audited [S20].
7. **Progressively roll out.** Internal pilot, beta with selected users, monitored expansion, and rollback/kill mechanisms are safer than big-bang autonomy [S18][S20].

## Limitations

Several industry statistics cited by blogs ultimately point to analyst or vendor research that may require registration or paywall access. In those cases, this report cites the accessible blog source and flags the provenance rather than treating it as independently verified primary data.
