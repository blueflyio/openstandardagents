# Industry Blogs and Engineering Publications

Research snapshot compiled on May 18, 2026.

## 47Billion: production lessons

47Billion's "AI Agents in Production" is valuable because it reports implementation experience rather than only protocol theory. Its central finding is that the gap between demos and production systems is wide: frameworks are real, but reliability, cost, debugging, and human oversight dominate production work [R37].

The article's framework comparison is pragmatic:

- AutoGen is powerful for exploratory multi-agent conversations but expensive and difficult to debug [R37].
- CrewAI is a structured middle ground for role/task-based workflows and was faster in their reservation-system comparison [R37].
- LlamaIndex is best when the job is document processing and RAG [R37].
- LangGraph is more flexible for stateful graph workflows but requires more explicit design [R37].
- OpenAI Agents SDK is a minimalist framework with agents, handoffs, guardrails, and tracing [R37].

47Billion's protocol stack maps cleanly to the rest of this report: MCP for agent-to-tool communication, A2A for agent-to-agent communication, and AG-UI for agent-to-UI communication [R37]. Its recommendation is to adopt standards early to avoid bespoke integration and spend more effort on product behavior [R37].

Actionable recommendations from 47Billion:

1. Start with simple workflows and only add agents where the workflow requires autonomy.
2. Use cost monitoring from day one.
3. Constrain tool use with whitelists and maximum iteration counts.
4. Validate structured outputs instead of trusting raw model text.
5. Add human-in-the-loop gates before irreversible actions.
6. Roll out progressively from internal pilots to beta users to general availability.
7. Prefer narrow specialized agents over general agents [R37].

## Ruh.ai: protocol decision framework

Ruh.ai's 2026 guide frames protocols as the antidote to N-by-M integration complexity. It cites Gartner's prediction that 40 percent of enterprise applications will integrate task-specific AI agents by 2026, up from less than 5 percent in 2025, and argues that communication barriers are a primary cause of implementation failures [R38].

The guide divides major protocols into:

- MCP for agent-to-tool connections.
- A2A for multi-agent coordination and task delegation.
- ACP for lightweight REST messaging [R38].

Its decision framework is straightforward: choose MCP when context, tools, audit trails, and ecosystem support matter; choose A2A when agents need dynamic discovery, delegation, and cross-organizational communication; choose ACP where REST simplicity and quick deployment matter more than advanced features [R38].

Security recommendations include least privilege, authentication per protocol layer, scoped access, audit trails, rate limiting, circuit breakers, network segmentation, and zero-trust architecture [R38].

## Gravitee: security and identity gap

Gravitee's 2026 report is the strongest source for quantitative security adoption risk. It found [R39]:

- 80.9 percent of technical teams are actively testing or running agents in production.
- 14.4 percent have full security/IT approval for their entire agent fleet.
- 88 percent confirmed or suspected AI agent security incidents in the past year.
- 92.7 percent of healthcare organizations reported confirmed or suspected incidents.
- 47.1 percent of an organization's agents are actively monitored or secured on average.
- 21.9 percent of teams treat agents as independent identities.
- 45.6 percent rely on shared API keys for agent-to-agent authentication.
- 27.2 percent use custom hardcoded authorization logic.

The actionable conclusion is that agent security must shift from periodic manual audits to continuous identity-aware enforcement. Agents should be treated as first-class security principals, not as invisible extensions of human accounts or generic service accounts [R39].

## DEV Community security guide

The DEV guide is a concise engineering threat model. It identifies the agent anatomy as LLM, memory, planning/reasoning, and tools; the security focus is securing autonomy and privilege across the full action chain [R40].

Its most useful threat examples are indirect prompt injection, tool inversion, privilege escalation, and multi-step data exfiltration through agent reasoning [R40]. Its most useful controls are Principle of Least Privilege, dedicated service accounts, granular tool wrappers, tool input validation, runtime guardrails, semantic checkers, HITL approval, runtime protection, and continuous red teaming [R40].

The guide's key engineering principle is to treat tool-call arguments from the model as untrusted input. Tool calls require the same validation and authorization discipline as any external API request [R40].

## Harvard Journal of Law and Technology: institutional design

Harvard JOLT's agentic web essay is not an implementation guide; it is a governance warning. The Amazon-Perplexity dispute shows that the agentic web can evolve toward platform-controlled permission or toward portable protocol credentials that represent users across environments [R27].

The essay argues that agent identification is non-negotiable, but the authority model should distinguish delegation by the user from permission by the platform. It proposes Know Your Agent standards with agent identity, principal-agent linkage, delegation limits, revocability, auditability, and behavioral records [R27].

This source complements NIST/NCCoE's identity paper. Both suggest that identity, authorization, auditing, and delegation will determine whether agents become accountable extensions of users or opaque automation routed through proprietary gates [R27] [R28].

## GitLab: agent platform in DevSecOps

GitLab's general availability announcement shows how agentic AI is being packaged inside enterprise software delivery platforms. Rather than only helping write code, GitLab Duo Agent Platform orchestrates agents across issues, merge requests, pipelines, code review, CI/CD, security, and compliance [R36].

Key platform components include context-aware Agentic Chat, prebuilt Planner and Security Analyst agents, custom agents through an AI Catalog, external Claude Code and Codex CLI integrations, foundational flows, model selection, group-based access control, and usage/activity visibility [R36].

GitLab's framing highlights a production architecture principle: agents perform better and are easier to govern when embedded in the system of record where context, permissions, artifacts, and audit logs already live [R36].

## Cross-blog synthesis

Industry sources agree on four points:

1. Protocols reduce integration debt but do not remove security work [R37] [R38] [R39].
2. Identity and least privilege are the most urgent security gaps [R39] [R40].
3. Narrow, observable agents outperform broad autonomous systems in production [R37].
4. Human oversight is an intentional control surface, not a temporary workaround [R24] [R37] [R40].

## Watch items

- Whether A2A absorbs ACP design patterns fully or the REST-native ACP style remains independently influential [R17] [R18].
- Whether AG-UI becomes a de facto front-end event standard through framework integrations [R13] [R14].
- Whether enterprise security vendors converge on agent-specific identity products or extend existing IAM/zero-trust platforms [R28] [R39].
- Whether DUADP/OSSA-style discovery plus contract manifests become a recognized layer between communication protocols and execution frameworks [R01] [R05] [R06].
