# Industry blogs and engineering publications

Research compiled as of 2026-05-28.

## 47Billion: production agents are useful but fragile

47Billion's "AI Agents in Production" is one of the most concrete engineering writeups found. Its main thesis is that demos hide the gap between compelling agent behavior and reliable production systems [T36].

Key takeaways:

- The ReAct loop is the common foundation: reason, act, observe, repeat [T36].
- Production systems should start at lower autonomy levels: prompt chains, branching workflows, and tool-using agents before open-ended multi-agent systems [T36].
- CrewAI is pragmatic for structured multi-step tasks; AutoGen is powerful but token-heavy and hard to debug; LlamaIndex is strongest for document/RAG workloads [T36].
- Human-in-the-loop is not a limitation; it is a trust requirement for approvals, review/edit, escalation, and feedback loops [T36].
- MCP, A2A, and AG-UI are complementary infrastructure: tools, agents, and UI respectively [T36].

47Billion's cost model is especially useful:

| Approach | Cost per task | Tokens per task |
| --- | ---: | ---: |
| Simple workflow | $0.10-$0.50 | 1,000-3,000 |
| CrewAI multi-agent | $0.50-$2.00 | 3,000-10,000 |
| AutoGen multi-agent | $2.00-$5.00 | 5,000-25,000 |
| LlamaIndex RAG | $0.20-$1.00 | 1,000-5,000 [T36] |

Its reliability playbook: structured outputs, conservative temperatures, tool-use constraints, progressive rollout, cost monitoring, smart summarization, and iterative refinement [T36].

## Ruh.ai: protocol selection framework

Ruh.ai's 2026 guide presents MCP, A2A, and ACP as three major protocol categories. It cites Gartner's 2025 forecast that 40% of enterprise applications will integrate AI agents by 2026 and argues that communication barriers are a primary cause of implementation failures [T37].

The decision framework:

- Use MCP when one agent needs secure access to many tools, databases, APIs, or resources [T37].
- Use A2A when multiple specialized agents need dynamic discovery, task delegation, cross-organization communication, or vendor-neutral orchestration [T37].
- Use ACP for lightweight REST-oriented deployments, legacy integration, rapid prototyping, or teams that want simple HTTP patterns [T37].
- Combine MCP and A2A for most mature enterprise architectures [T37].

Security guidance from Ruh.ai includes least privilege, strong authentication, message integrity checks, rate limiting, circuit breakers, network segmentation, zero trust, and compliance-aware audit trails [T37].

## Gravitee: adoption has outrun security

Gravitee's 2026 report is the clearest security data point. It surveyed 900+ executives and practitioners and concludes that agents have become production infrastructure before security models caught up [T38].

Fast facts:

- 80.9% of technical teams are past planning.
- 14.4% have full security/IT approval.
- 88% reported confirmed or suspected incidents.
- 92.7% healthcare incident rate.
- 21.9% treat agents as independent identities.
- 45.6% still rely on shared API keys for agent-to-agent authentication [T38].

Gravitee's recommendation is identity-aware continuous enforcement. Periodic audits and shared credentials do not work when agents can autonomously create tasks, delegate work, and act at machine speed [T38].

## DEV Community security guides

Two DEV security posts reinforce practical engineering controls:

- "LLM Security Vulnerabilities Engineers Need to Know in 2026" says prompts, retrieved context, and model outputs are untrusted. It recommends authorization outside the model, least-privilege tools, explicit confirmation for destructive actions, secret redaction, source logging, schema validation, dependency/model artifact scanning, prompt-injection tests, and review of prompt/retrieval changes [T39].
- "I Scanned 5 Common LangChain Agent Patterns" found all scanned patterns over-permissioned. The fix is task-specific scopes: read-only database roles, fine-grained PATs, narrower OAuth scopes, removing unnecessary tools, and treating shell/Python REPL as maximum-blast-radius tools [T40].

Both posts align with NIST and Gravitee: identity, authorization, and logging must be implemented in infrastructure, not in the prompt [T12][T38][T39][T40].

## Harvard policy and agentic web commentary

Harvard JOLT's "Institutional Origins of the Agentic Web" argues for Know Your Agent standards. Its minimum elements are agent identity, principal-agent linkage, delegation parameters, and auditability/behavioral record-keeping [T17].

This connects to bot-traffic reports. Imperva says automated bot traffic reached 53% of web traffic in 2025 [T41]. HUMAN Security says AI-driven traffic grew 187% over 2025 and agentic traffic grew 7,851% year over year [T42]. These numbers make web-conduct standards urgent, because agents increasingly transact, retrieve, and act through interfaces built for humans [T10][T41][T42].

## Google Developers and protocol boundaries

Google's developer framing is helpful because it separates protocol responsibilities:

- MCP connects agents to tools and data.
- A2A connects agents to other agents.
- UCP/AP2 address commerce/payment use cases.
- A2UI/AG-UI address UI rendering and streaming interaction [T37].

The architectural lesson is to add protocols only when the requirement appears. Most agents start with MCP for data access; teams add A2A for cross-agent coordination and AG-UI for interactive frontends [T36][T37].

## GitLab: enterprise SDLC agents

GitLab's GA announcement shows how agentic AI is being productized for the software lifecycle. The platform includes context-aware agentic chat, foundational agents, custom agents, external agents, flows, MCP Client, model selection, governance, activity visibility, and group-level access controls [T34].

Important details:

- Planner Agent breaks down and prioritizes work.
- Security Analyst Agent triages vulnerabilities and security signals.
- Custom agents are built and shared through AI Catalog.
- External agents include Claude Code and Codex CLI.
- Flows automate issue-to-MR, CI/CD conversion, CI/CD fixes, code review, and IDE software-development work [T34].

GitLab's framing is valuable because it embeds agents into existing workflow, permission, audit, and model-selection systems rather than shipping a standalone chatbot [T34].

## Blog-derived recommendations

1. Do not start with open-ended multi-agent systems. Start with simple workflows and graduate only when the task requires it [T36].
2. Use standards instead of bespoke connectors: MCP for tools, A2A for agents, AG-UI for UI, DUADP for discovery where a registry/federation layer is required [T02][T18][T19][T21][T36].
3. Set cost budgets and monitoring before production rollout [T36].
4. Add human approval before irreversible actions and high-risk tool calls [T30][T36][T39].
5. Treat agent identity as a security principal and avoid shared API keys [T12][T38].
6. Version prompts, manifests, policies, and model selections so incidents can be reconstructed [T01][T34][T36].
7. Prefer narrow, specialized agents with clear boundaries over general agents with broad tools [T36][T40].

## Source limitations

Some blog statistics are vendor reported. Use them as operational signals, not as definitive peer-reviewed measurements. The most reliable statistics in this set are from official pages and named survey/report sources: MIT AI Agent Index, Gravitee, Imperva, HUMAN Security, and NIST/NCCoE [T10][T12][T38][T41][T42].
