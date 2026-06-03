# Industry blogs and engineering publications

Research run date: 2026-06-03. Citation keys resolve in `reading-list.md`.

## 47Billion: AI Agents in Production

47Billion's 2026 production writeup is one of the most actionable engineering sources. It argues that the demo-to-production gap is wide: agents are more capable than older automations but fragile without boundaries, evaluation, cost controls, and human oversight [47billion-production].

Key engineering points:

- ReAct is the dominant execution loop: reason, act, observe, repeat.
- Autonomy is a spectrum: prompt chains, branching workflows, tool-using agents, and multi-agent systems.
- Production sweet spot is often Level 2-3: branching workflows and constrained tool-using agents.
- Open-ended multi-agent systems are still too unpredictable for critical paths.
- Human-in-the-loop is not a weakness; it is a trust and compliance requirement [47billion-production].

Framework comparison from the article:

| Framework | Best fit | Concern |
| --- | --- | --- |
| AutoGen | Exploratory multi-agent collaboration | High token use, circular conversations, difficult debugging |
| CrewAI | Structured multi-step tasks | Less flexible for open-ended scenarios |
| LlamaIndex | RAG and document workflows | Not ideal for pure orchestration |

The cost model is especially useful: simple workflows at $0.10-$0.50 per task, CrewAI multi-agent at $0.50-$2.00, AutoGen multi-agent at $2.00-$5.00, and LlamaIndex RAG at $0.20-$1.00 [47billion-production].

47Billion's protocol conclusion is that MCP, A2A, and AG-UI are complementary. MCP connects tools, A2A connects agents, and AG-UI connects agents to user interfaces. Teams adopting these standards early should spend less effort on bespoke integrations [47billion-production].

## Ruh.ai protocol guide

The named Ruh.ai page, "AI Agent Protocols 2026: Complete Guide," was discoverable but rendered only minimal content through the available fetch path. Search snippets identify it as a guide to MCP, A2A, and ACP, and Ruh's adjacent architecture article discusses standardized protocols, frameworks such as LangGraph/AutoGen/CrewAI, hallucination, cost, security, and enterprise use cases [ruh-protocol-search] [ruh-architecture-search].

Because the full Ruh guide content was not retrievable, this report does not quote specific Ruh claims beyond what search snippets exposed. The source is included in the reading list as partially accessible [ruh-protocol-search].

## Gravitee: State of AI Agent Security 2026

Gravitee's 2026 report is the strongest industry security data source. It surveyed more than 900 executives and practitioners and found the adoption/governance gap: 80.9% of technical teams moved past planning, only 14.4% had full security approval for all agents, 88% reported confirmed or suspected incidents, and only 21.9% treated agents as independent identities [gravitee-2026].

The central recommendation is identity-aware continuous enforcement. Gravitee argues that periodic manual audits are not enough because agents can act, delegate, and access data continuously. Agents must become first-class security principals with logging, authorization, and revocation [gravitee-2026].

## Dev.to security guide

The Dev.to guide is a practical engineering checklist around seven risks, especially prompt injection, excessive permissions, and hallucinated actions. It argues that API keys and OAuth alone are insufficient because they grant coarse access but do not verify each action at runtime [dev-security-guide].

Recommended mitigations include:

- Per-action verification before execution.
- Fine-grained capability declarations.
- Runtime constraint enforcement.
- Instant revocation.
- Signature verification, nonce checks, timestamp windows, and audit receipts.
- Monetary limits, domain restrictions, and human checkpoints for sensitive operations [dev-security-guide].

The strongest takeaway is that prompt injection cannot be solved by prompts. Runtime controls prevent the consequences of prompt injection even when the model is convinced to attempt an unauthorized action [dev-security-guide].

## Google Developer Blog: protocol guide

Google's March 18, 2026 developer guide frames the protocol landscape as a set of complementary standards rather than competing acronyms: MCP for tools/data, A2A for agent delegation, UCP for commerce, AP2 for payment authorization, A2UI for renderable UI, and AG-UI for streaming agent-user interaction [google-protocol-guide].

The guide recommends adding protocols as requirements emerge: start with MCP for data access, then add A2A for multi-agent communication, commerce/payment protocols for transactions, and UI protocols for rich user-facing interactions [google-protocol-guide].

## GitLab Duo Agent Platform GA

GitLab announced GitLab Duo Agent Platform general availability as a governed DevSecOps agent platform. The product combines Agentic Chat, foundational agents, custom agents, external agents, flows, an MCP client, model selection, governance, visibility, and deployment flexibility [gitlab-duo-ga].

Important features:

- Agentic Chat can analyze, code, help with CI/CD, and explain security findings using GitLab context.
- Foundational agents at GA include Planner Agent and Security Analyst Agent.
- Custom agents are built and shared through AI Catalog.
- External agents include Claude Code and OpenAI Codex CLI.
- MCP Client connects IDE agent workflows to Jira, Confluence, Slack, Playwright, Grafana, and other MCP-compatible tools.
- Governance includes group controls, usage/activity visibility, model selection, and self-hosted options [gitlab-duo-ga].

This is a sign that agent platforms are moving from "coding assistant" to governed lifecycle orchestration across planning, code, CI/CD, and security [gitlab-duo-ga].

## Harvard and agentic web policy concerns

The exact "Harvard Policy Review" article referenced in the prompt was not found by targeted search. Harvard Library Innovation Lab's APTT was accessible and is the primary Harvard source in this report [harvard-aptt].

For the agentic-web traffic concern, accessible substitutes include Imperva's 2026 Bad Bot Report coverage and CNBC/Human Security reporting. Imperva reports automated bot traffic exceeded human traffic in 2025, reaching more than 53% of web traffic, and that AI agents now retrieve data, execute workflows, and act on behalf of users through interfaces that can be hard to distinguish from malicious automation [imperva-bad-bot]. CNBC reports automated traffic grew nearly eight times faster than human activity in 2025 and agentic traffic from AI agents grew almost 8,000% in 2025 from a very small 2024 base [cnbc-ai-traffic].

The governance implication matches the prompt's concern: human and agent traffic need clearer distinction, better identity, and protocols for bot-to-bot or agent-to-agent communication that avoid overloading human-facing web interfaces [imperva-bad-bot] [agtp-draft].

## IBM and ACP

IBM Research's ACP page is useful because it shows protocol consolidation. ACP was designed as a REST-native, SDK-optional, multimodal, async-first protocol for agent interoperability across frameworks. It now says ACP is part of A2A under the Linux Foundation [ibm-acp].

That matters for adoption decisions: new work should generally evaluate A2A as the converged path, while learning from ACP's strengths around lightweight HTTP/REST interoperability and multimodal messages [ibm-acp] [lf-acp-a2a].

## monday.com ATP

monday.com's ATP article argues that MCP solves server-side tool exposure but leaves every company building gateways to aggregate many MCP servers. ATP's answer is a sandboxed code-execution protocol where agents write TypeScript/JavaScript to combine APIs, filter data, parallelize work, call LLM subroutines, request approvals, and log progress [monday-atp].

ATP's security argument is that sandboxed code with API annotations, black/white lists, approval gates, and OpenAPI-based official APIs may be safer and cheaper than broad local stdio MCP servers. Its benchmark claims are vendor-reported and should be tested independently before procurement decisions [monday-atp].

## MIT Technology Review and control planes

MIT Technology Review's April 2026 governance article argues that non-human identities are outpacing human identities and will accelerate with agentic AI. It cites Deloitte AI Institute data: nearly 74% of companies plan to deploy agentic AI within two years, but only 21% report mature governance for autonomous agents [mit-tech-review-control-plane].

The article defines a control plane as the central layer that governs who can run which agents, with which permissions, under which policies, and using which models/tools. The key test is whether an organization can answer what an agent did, on whose behalf, using what data, under what policy, and whether it can reproduce or stop the action [mit-tech-review-control-plane].

## Actionable recommendations across blogs

1. Start with deterministic workflows before autonomous multi-agent systems [47billion-production].
2. Use MCP for tool/data access, A2A for cross-agent delegation, and AG-UI for live user interfaces [47billion-production] [google-protocol-guide].
3. Build internal APIs as MCP servers only after documenting auth, least privilege, and logging [47billion-production].
4. Assign every agent an identity and avoid shared API keys [gravitee-2026].
5. Add cost monitoring before production; define per-task budgets and alerts [47billion-production].
6. Use human checkpoints for irreversible or regulated actions [47billion-production] [dev-security-guide].
7. Treat retrieved content and tool output as untrusted [dev-security-guide].
8. Use a control plane for inventory, authorization, model/tool governance, audit, and revocation [mit-tech-review-control-plane].
9. Prefer protocol-composable architectures over bespoke glue code [google-protocol-guide].
10. Validate vendor benchmark claims in your own environment, especially around cost and latency [monday-atp].
