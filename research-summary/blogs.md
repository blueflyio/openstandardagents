# Tech Blogs and Engineering Publications

Prepared as of May 30, 2026.

## 47Billion: production lessons

47Billion's production article is one of the most concrete engineering sources consulted. It argues that 2025 demos made agent systems look easy, but production deployments exposed fragility, cost, debugging difficulty, and the need for clear boundaries [S24]. Its autonomy spectrum is useful: prompt chains, branching workflows, tool-using agents, and multi-agent systems. The article recommends Level 2-3 systems for most production use cases and treats open-ended multi-agent systems as high-risk for critical paths [S24].

The framework comparison is pragmatic. AutoGen is powerful for exploratory multi-agent conversations but token-hungry and hard to debug. CrewAI is more structured and production-friendly for multi-step tasks. LlamaIndex is strongest for RAG-heavy document workflows. OpenAI Agents SDK is a lightweight option with four core primitives. LangGraph is strongest for stateful graph execution. Parlant is noteworthy for controlled customer-facing conversations [S24].

The most actionable 47Billion guidance:

- Start with simple workflows before multi-agent systems.
- Add tool-use constraints and maximum iteration counts.
- Use human approval gates for irreversible or regulated actions.
- Monitor cost from day one.
- Validate structured outputs instead of trusting raw LLM text.
- Use MCP, A2A, and AG-UI instead of custom integration when feasible.
- Plan for refinement: prompt and behavior tuning is the real production work [S24].

## Ruh.ai: protocol decision framing

Ruh.ai's 2026 protocol guide summarizes MCP, A2A, and ACP as the three major communication standards for agentic systems [S25]. Its headline statistic is Gartner's prediction that 40% of enterprise applications will integrate AI agents by the end of 2026, up from less than 5% in 2025 [S25]. The guide frames communication barriers as a primary cause of implementation failures and recommends using the right protocol for the right edge: MCP for agent-to-tool, A2A for multi-agent coordination, and ACP for lightweight REST messaging [S25].

This aligns with the rest of the research: teams should not ask which single protocol wins. They should ask which boundary they are standardizing. Tool access, agent coordination, UI streaming, discovery, and contract packaging are different boundaries.

## Gravitee: security survey and identity crisis

Gravitee's State of AI Agent Security 2026 report is the strongest quantitative security source. It surveyed 900+ executives and technical practitioners and found rapid adoption combined with weak governance [S26]. The critical findings are 80.9% of technical teams beyond planning, only 14.4% with full security approval, 88% with confirmed or suspected incidents, only 21.9% treating agents as identity-bearing entities, and 45.6% relying on shared API keys for agent-to-agent authentication [S26].

The recommendation is to shift from periodic audits to continuous, identity-aware enforcement. This supports the need for manifests, registries, first-class agent identity, scoped credentials, and runtime policy gates [S26].

## DEV Community: MCP security and tool tunneling

The DEV Community MCP security guide focuses on what happens when MCP servers are exposed through tunnels or remote connections [S29]. It describes tool poisoning, rug-pull mutation of tool definitions, cross-server shadowing, supply-chain attacks, covert tool invocation, resource theft, excessive privilege, and context bleeding [S29].

The most useful pattern from the guide is the MCP gateway. Instead of exposing MCP servers directly, route calls through a gateway that inspects JSON-RPC requests before tools execute. The gateway can enforce semantic rate limits, human approval triggers, intent detection, sandboxing, server allowlists, scoped tokens, and audit logging [S29]. This is exactly the kind of external enforcement layer that prompt-only guardrails cannot provide.

## Harvard JOLT: institutional origins of the agentic web

The Harvard JOLT commentary uses the Amazon-Perplexity dispute to show the governance crossroads for agentic web access: proprietary platform control versus portable, protocol-based credentials [S28]. It argues that transparent agent identification is non-negotiable but that authority could be anchored in interoperable protocols rather than walled-garden platform mechanisms [S28].

Its Know Your Agent proposal is an actionable governance template: cryptographic agent identity, principal-agent linkage, delegation parameters, revocability, auditability, and behavioral record-keeping [S28]. This directly supports identity layers such as DIDs, GAIDs, signed Agent Cards, signed OSSA manifests, and DUADP trust tiers [S01][S02][S11][S28].

## Imperva: bots in the agentic age

Imperva's 2026 Bad Bot Report article reports that automated traffic accounted for more than 53% of all web traffic in 2025, up from 51% the year before [S30]. It also reports that 27% of bot attacks target APIs, with financial services accounting for 24% of bot attacks and 46% of account takeover incidents [S30].

The security lesson is that agents blur the line between legitimate and malicious automation. Traditional bot detection is not enough when a legitimate user may delegate action to an agent. Businesses need automation control: identity, intent, access governance, API-level monitoring, and differentiated policies for machine actors [S30].

## GitLab engineering/product sources

GitLab's Duo Agent Platform GA announcement shows agentic AI becoming a governed enterprise product surface, not only an SDK category [S23]. GitLab includes Agentic Chat, foundational agents such as Planner and Security Analyst, custom agents through an AI Catalog, external agents like Claude Code and Codex CLI, multi-agent flows, MCP client support, group controls, model selection, and usage visibility [S23].

The platform's governance features matter as much as its agents. Group-based access, model selection, self-hosted options, user approval for external tools, and visibility into agent actions are all production requirements highlighted by the security sources [S23][S26][S27].

## Synthesis: actionable recommendations from blogs

1. Treat agents as a system architecture problem, not a prompt feature.
2. Start narrow; narrow agents are more reliable than general agents.
3. Select protocols by boundary: MCP for tools, A2A/ACP for agents, AG-UI for UI, DUADP/ANP for discovery, OSSA for contract manifests.
4. Use human approvals as part of trust-building, not as an admission of failure.
5. Budget for evaluation, tracing, and behavioral tuning.
6. Implement identity and runtime enforcement before expanding autonomy.
7. Prefer open protocols and manifests to hidden platform-specific configuration.
