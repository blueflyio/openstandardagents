# Tech blogs and engineering publications

Prepared on 2026-06-05. Citation keys resolve in [reading-list.md](./reading-list.md).

## Executive synthesis

Industry writing in 2026 is converging on a pragmatic stack: MCP for agent-to-tool access, A2A for agent-to-agent coordination, AG-UI for agent-to-frontend interaction, and framework-specific runtimes such as LangGraph, CrewAI, OpenAI Agents SDK, and LlamaIndex underneath [S36], [S37]. The best engineering posts also agree that production readiness depends on guardrails, observability, cost controls, progressive rollout, and identity-aware security rather than just picking a framework [S36], [S38], [S40].

The most credible engineering pattern is layered, not monolithic:

- Use MCP when a single agent needs tools, APIs, databases, or workflows [S07], [S36], [S37].
- Use A2A only when independently deployed agents need to delegate tasks or coordinate [S08], [S09], [S37].
- Use AG-UI when the user experience needs event streams, interrupts, state updates, and real-time progress [S10], [S11], [S36].
- Use deterministic authorization and audit layers around all side effects [S25], [S38], [S40].

## 47Billion: production frameworks, protocols, and what works

47Billion's production guide is useful because it avoids treating all agents as equally ready. It separates simple workflows, tool-using agents, structured multi-agent systems, and open-ended multi-agent systems [S36]. Their conclusion is conservative: simple workflows are production-ready with error handling, validation, and monitoring; tool-using agents are production-ready with guardrails, output validation, cost limits, and fallbacks; structured multi-agent systems are cautiously production-ready with heavy guardrails and human checkpoints; open-ended multi-agent systems are not yet suitable for critical paths [S36].

The post reinforces the MCP/A2A/AG-UI division. MCP handles tool and data integration, A2A handles multi-agent coordination, and AG-UI handles frontend-agent interaction [S36]. The practical recommendation is to adopt standards early to reduce bespoke integrations, but not to confuse protocol adoption with production hardening [S36].

The cost section is especially actionable. 47Billion gives approximate per-task cost bands: simple workflows around $0.10-$0.50, CrewAI multi-agent around $0.50-$2.00, autonomous agents around $2.00-$5.00, and LlamaIndex RAG around $0.20-$1.00 [S36]. The exact numbers will vary by model, token volume, tool count, and retries, but the structure is correct: cost should be measured per request, per agent type, and per pipeline, with circuit breakers for runaway loops [S36].

47Billion's reliability playbook recommends progressive rollout: internal users, selected beta customers, then general availability, with monitoring at each stage [S36]. It also recommends iterative refinement, smaller specialized models where possible, cost monitoring before production, guardrails, HITL patterns, and framework selection based on use case rather than hype [S36].

## Ruh.ai: protocol selection and enterprise adoption

Ruh.ai's 2026 guide frames agent protocols as the answer to communication barriers in enterprise deployments [S37]. It cites Gartner's forecast that 40% of enterprise applications will integrate AI agents by 2026, up from less than 5% in 2025 [S37]. The guide's core taxonomy is MCP for agent-to-tool communication, A2A for multi-agent coordination, and ACP for lightweight REST messaging [S37].

The strongest takeaway is the decision framework:

- Use MCP when the agent needs APIs, databases, files, tools, or enterprise data.
- Use A2A when agents from different teams, vendors, or frameworks must coordinate.
- Use ACP-like REST messaging only when a lightweight internal pattern is enough, noting that ACP has since merged into A2A [S15], [S16], [S37].

Ruh.ai's framing is directionally useful but should be updated for the 2026 standards state: ACP is no longer a parallel strategic bet; it is part of the A2A consolidation path under Linux Foundation [S16]. The report is still valuable for describing why communication barriers cause integration failures and why teams should avoid proprietary glue where open protocols fit [S37].

## Gravitee: adoption outpaces control

Gravitee's State of AI Agent Security 2026 is one of the most important industry reports because it adds survey data to what otherwise might be anecdotal security concern [S38], [S39]. The report surveyed 919 executives and practitioners and found that 81% of teams are beyond planning, only 14.4% have full IT/security approval for the agent fleet, and only 47.1% of agents are actively monitored or secured on average [S38], [S39].

The identity numbers are the clearest call to action. Only 21.9% of teams treat AI agents as independent identities, 45.6% rely on shared API keys for agent-to-agent authentication, and 27.2% use custom hardcoded authorization logic [S38]. That pattern creates weak auditability, brittle permissions, and poor revocation.

The incident number is also severe: 88% of organizations reported confirmed or suspected AI agent security or privacy incidents in the prior year, with healthcare even higher at 92.7% in Gravitee's reporting [S38], [S39]. Gravitee's conclusion matches NIST and OWASP: most incidents are caused by missing governance, identity, and runtime policy enforcement rather than "rogue models" alone [S38], [S43].

Actionable recommendations:

- Treat every agent as a nonhuman principal with its own identity.
- Replace shared API keys with scoped, rotating, auditable credentials.
- Put a centralized control plane around agent access and policy.
- Monitor agent actions, not only model outputs.
- Build incident response for agent compromise, credential revocation, and replayable audit trails [S25], [S38].

## Dev.to production security guide

The Dev.to security guide is not a standards document, but it is useful as a practitioner checklist [S40]. It names seven critical agent risks, including prompt injection, excessive permissions, and hallucinated actions [S40]. Its strongest engineering point is that traditional authentication is insufficient because agent risk is per action, not just per session [S40].

The guide recommends a verification layer before function execution. That layer checks signatures, declared capabilities, monetary limits, domain restrictions, revocation state, timestamps, and nonces before allowing an action [S40]. This is aligned with NIST's identity/authorization focus and with OSSA/DUADP's emphasis on signed manifests, DID-backed identity, and trust-tier enforcement [S01], [S03], [S25].

The guide also distinguishes prevention from consequence limitation. Cryptographic verification does not stop prompt injection from influencing the model, but it can stop an injected model from executing unauthorized actions [S40]. This is the right production mental model: assume the model can be manipulated; constrain the tools and side effects.

## Harvard and agentic web policy framing

The Harvard Library Innovation Lab APTT post is the best located Harvard source for the prompt's policy/protocol framing [S20]. It argues that agents are changing too fast for experts to fully understand and that protocols are crucial because they give agents their tools and shape which kinds of agents are easy to build [S20]. That makes protocols a governance surface, not just an engineering convenience.

A separate exact "Harvard policy review" source matching the prompt's bot-traffic claim was not found in the accessible searches. For the traffic claim, the report uses Malwarebytes' summary of Imperva's 2025 Bad Bot Report, which states that bot traffic exceeded human traffic and breaks traffic into 37% bad bots and 14% good bots, plus HUMAN Security's 2026 benchmark showing automated traffic growing faster than human traffic and AI-driven traffic up 187% from January to December 2025 [S44], [S46].

The policy implication is clear: the web needs mechanisms to distinguish human users, benign automation, malicious bots, and user-delegated AI agents. The HTTP Agent Profile draft proposes HTTP Message Signatures, privacy-preserving human tokens, and HTTP 402 for agent access economics [S45]. That direction complements DUADP and ANP: agents need verifiable identity, not just browser mimicry [S03], [S12], [S45].

## Other engineering observations

The Monday.com ATP materials argue that tool calling becomes inefficient when agents preload many tools before reasoning [S17]. ATP instead lets agents search APIs on demand and execute JavaScript/TypeScript in an isolated VM with endpoint annotations and approvals [S17]. This is early, but it identifies a real production issue: MCP servers can multiply, and teams often build custom gateways to aggregate them [S17].

The GitLab Duo Agent Platform materials show how agent platforms are moving into existing developer workflows rather than standing alone [S34], [S35]. Foundational agents, custom agents, external agents, AI Catalogs, model selection, and managed credentials are all platform-level features for governing agent use in a DevSecOps lifecycle [S34]. This is a different path from open-source libraries, but the same protocol and security principles apply.

MIT Technology Review's 2026 CEO-focused guide captures the executive version of the same engineering point: treat agents like powerful semi-autonomous users and enforce controls at the boundaries where they touch identity, tools, data, and outputs [S52]. It recommends inventory and evidence for agents, models, prompts, tools, datasets, vector stores, approvals, and high-impact actions [S52]. This is consistent with NIST, Gravitee, and OWASP, and it supports moving agent governance from a final checklist into deployment architecture [S25], [S38], [S43], [S52].

HBR-branded market research located through Workato reports an "enterprise AI trust gap": only 6% of companies fully trust AI agents to autonomously run core business processes, while 86% plan to increase investment over the next two years; 31% cite cybersecurity and privacy concerns, and only 20% believe infrastructure is ready [S53]. Because the accessible source is a partner summary rather than the full primary report, these numbers should be treated as directional. They still reinforce the broader theme: investment intent is ahead of trust, infrastructure, data readiness, and governance [S53].

## Actionable recommendations distilled from industry sources

1. Start with one bounded workflow and one or two high-value tools. Do not begin with open-ended multi-agent autonomy [S36].
2. Adopt MCP for tool access, but wrap it with allowlisting, metadata scanning, and runtime policy enforcement [S07], [S41], [S42].
3. Add A2A only when agents are independently deployed and need to exchange tasks across framework or organizational boundaries [S08], [S09], [S37].
4. Use AG-UI only when the application needs a real-time user interface around agent progress and state [S10], [S11].
5. Give agents independent identities and short-lived credentials; stop using shared API keys for production agents [S25], [S38].
6. Budget at multiple levels: request, agent type, workflow, tenant, and organization. Add loop detection and spend circuit breakers [S36].
7. Require HITL approvals for destructive or irreversible actions, but avoid approving every low-risk read-only step [S19], [S43].
8. Store audit trails with prompt/input, retrieved context, tool metadata, action parameters, policy decisions, approvals, and side effects [S25], [S27].
9. Roll out progressively and measure accuracy, incident rate, cost, latency, tool failures, and override frequency [S36].
10. Prefer standards-backed interfaces and manifests so agents can move between frameworks, platforms, and governance systems without rewriting definitions [S01], [S02], [S03].
