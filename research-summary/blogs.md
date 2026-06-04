# Tech Blogs and Engineering Publications

Report date: 2026-06-04

## 47Billion: production reality check

47Billion's "AI Agents in Production: Frameworks, Protocols, and What Actually Works in 2026" is one of the most detailed engineering sources reviewed. It reports lessons from multiple proof-of-concept projects and a production deployment for a global insurance company [FORTYSEVEN].

Main production lessons:

- The useful autonomy range for many production systems is Level 2-3: workflows with branching and tool-using agents. Open-ended multi-agent systems are powerful but costly and hard to debug [FORTYSEVEN].
- ReAct-style loops are the core execution pattern: reason, act, observe, repeat [FORTYSEVEN].
- Framework choice matters less than boundary clarity, evaluation, monitoring, and runtime controls [FORTYSEVEN].
- Human-in-the-loop is not a weakness; it is required for trustworthy production systems, especially regulated workflows [FORTYSEVEN].

Framework comparison:

- AutoGen: natural conversation paradigm and powerful exploratory collaboration, but high token usage, circular conversations, and difficult debugging [FORTYSEVEN].
- CrewAI: pragmatic task-based middle ground for structured multi-step work; faster to develop in their table-reservation comparison [FORTYSEVEN].
- LlamaIndex: strongest for RAG-heavy document workflows and event-driven document processing [FORTYSEVEN].

Protocol position:

- MCP: agent-to-tool/data standard [FORTYSEVEN].
- A2A: agent-to-agent collaboration standard using Agent Cards [FORTYSEVEN].
- AG-UI: agent-to-frontend event protocol for streaming, state sync, tool visualization, and HITL approvals [FORTYSEVEN].

Cost notes:

| Approach | Cost per task | Token range |
| --- | ---: | ---: |
| Simple workflow | $0.10-$0.50 | 1,000-3,000 |
| CrewAI multi-agent | $0.50-$2.00 | 3,000-10,000 |
| AutoGen multi-agent | $2.00-$5.00 | 5,000-25,000 |
| LlamaIndex RAG | $0.20-$1.00 | 1,000-5,000 |

Actionable guidance:

- Start simple and add complexity only when needed [FORTYSEVEN].
- Set up cost monitoring before deploying agents [FORTYSEVEN].
- Use structured outputs and validation [FORTYSEVEN].
- Constrain tool use and add maximum iteration counts [FORTYSEVEN].
- Pilot internally, then beta with selected users, then GA [FORTYSEVEN].
- Do not build custom integration code when MCP, A2A, or AG-UI already fit the boundary [FORTYSEVEN].

## Ruh.ai: protocol guide limitation

Search results identified Ruh.ai's "AI Agent Protocols 2026: Complete Guide" as relevant to MCP, A2A, ACP, and a Gartner-style 40% enterprise-application adoption claim [RUH-SEARCH]. However, direct fetch of the Ruh.ai page returned only generic site wrapper text and no substantive article body [RUH-FETCH].

Because the full content was not retrievable in this environment, this report does not treat Ruh.ai as a primary evidence source. Its search-result summary is consistent with other available sources: MCP handles tool access, A2A handles agent collaboration, ACP has merged toward A2A, and protocol choice should follow architecture boundaries [RUH-SEARCH] [A2A-GOOGLE] [MCP-DOCS] [ACP-LFAI].

## Gravitee: State of AI Agent Security 2026

Gravitee's 2026 report is one of the most useful practitioner data sources. It surveyed 919 participants across executive and technical audiences and concludes that agent security is an execution/control problem, not just an awareness problem [GRAVITEE-REPORT].

Key numbers:

- 80.9% of technical teams are past planning and actively testing or running agents [GRAVITEE-REPORT].
- Only 14.4% have full IT/security approval for the entire agent fleet [GRAVITEE-BLOG] [GRAVITEE-REPORT].
- Only 47.1% of agents are actively monitored or secured on average [GRAVITEE-BLOG].
- 88% reported confirmed or suspected AI agent security/privacy incidents in the last year [GRAVITEE-BLOG] [GRAVITEE-REPORT].
- Only 21.9% treat agents as independent identity-bearing entities [GRAVITEE-REPORT].
- 45.6% still rely on shared API keys for agent-to-agent authentication [GRAVITEE-BLOG].
- 27.2% use custom hardcoded authorization logic [GRAVITEE-BLOG].

Recommendations:

- Move from periodic audits to continuous, identity-aware enforcement [GRAVITEE-BLOG].
- Treat agents as first-class security principals rather than human extensions or generic service accounts [GRAVITEE-REPORT].
- Add centralized governance before departmental "Shadow AI" becomes production infrastructure [GRAVITEE-REPORT].
- Connect MCP/tool access to IAM/IdP and runtime authorization rather than hardcoded credentials [GRAVITEE-REPORT].

## Dev.to security guide

The Dev.to guide "Building Production-Ready AI Agents: A Complete Security Guide (2026)" is not an academic source, but it provides a practical security pattern that aligns with NIST and Gravitee: authenticate the agent, but also verify every action [DEV-SECURITY].

Seven risks highlighted:

1. Prompt injection [DEV-SECURITY].
2. Excessive permissions [DEV-SECURITY].
3. Hallucinated actions [DEV-SECURITY].
4. No attribution [DEV-SECURITY].
5. Replay attacks [DEV-SECURITY].
6. No kill switch [DEV-SECURITY].
7. Opaque policy violations [DEV-SECURITY].

Core architecture:

- LLM plans an action.
- Agent creates a signed intent envelope.
- Verification layer checks signature, nonce, timestamp, declared action, constraints, and revocation status.
- Tool executes only if verification passes.
- Structured audit log records the decision and outcome [DEV-SECURITY].

This maps well to OSSA/DUADP:

- OSSA can hold declared action/capability/policy metadata.
- DUADP can support identity, DID resolution, signature/provenance evidence, trust tier, and revocation.
- A runtime policy engine or gateway still needs to enforce decisions before tool execution.

## TechPolicy.Press: web rules and verifiable agent identity

TechPolicy.Press argues that AI agents are rewriting the web's rules of engagement by bypassing the human-facing flows that publishers, merchants, and platforms rely on for attention, advertising, conversion, and authorization [TECHPOLICY].

The article highlights several weaknesses in current bot governance:

- `robots.txt` is voluntary and not a binding access-control mechanism [TECHPOLICY].
- User-agent strings can be spoofed [TECHPOLICY].
- CAPTCHAs are increasingly defeatable [TECHPOLICY].
- Platforms have started using computer fraud statutes and technical access-control claims because the dispute is not only about content but about "experiential control" [TECHPOLICY].

Proposed direction:

- Web Bot Auth for provider-level cryptographic signatures [TECHPOLICY].
- CAIP-122 for wallet/account-level identity [TECHPOLICY].
- x402 for HTTP 402 payment/authorization flows and on-behalf-of user-level authorization [TECHPOLICY].
- Machine-readable policy layer, identity layer, and enforcement/logging layer [TECHPOLICY].

This matters for open agent protocols because discovery without identity becomes a spam and abuse vector. DUADP, ANP, signed Agent Cards, Web Bot Auth, and similar mechanisms should be viewed as part of a broader shift from claimed identity to verifiable identity.

## GitLab engineering/product publications

GitLab's Duo Agent Platform GA announcement is a strong example of agentic AI being integrated into a governed enterprise workflow system rather than shipped as a standalone chatbot [GITLAB-GA].

Key design themes:

- Agentic Chat uses GitLab lifecycle context from issues, merge requests, pipelines, and security findings [GITLAB-GA].
- Foundational agents are prebuilt for planning and security analysis [GITLAB-GA].
- Custom agents and flows are created and shared through AI Catalog [GITLAB-GA] [GITLAB-PRODUCT].
- External agents include Claude Code and OpenAI Codex CLI [GITLAB-GA].
- Flows automate multi-step work such as issue-to-MR, CI/CD conversion, pipeline fixes, code review, and IDE development [GITLAB-GA].
- MCP Client support connects IDE-based agents to Jira, Confluence, Slack, Playwright, Grafana, and other MCP tools with group controls and user approval [GITLAB-GA].
- Governance includes usage visibility, group-based access controls, model selection, and self-hosted model options [GITLAB-GA] [GITLAB-PRODUCT].

Takeaway: GitLab's model shows the "agent platform" direction: agents plus flows plus catalog plus governance plus integrated context.

## Google developer protocol guide

Google's developer guide to AI agent protocols emphasizes that the acronym overload is less confusing when each protocol is mapped to a boundary. MCP connects agents to tools and data. A2A connects agents to other agents. UCP standardizes commerce. AP2 handles payment authorization. A2UI defines what to render. AG-UI defines how to stream it [GOOGLE-PROTO-GUIDE].

The practical guidance is to adopt protocols as needed, not all at once. Most systems start with MCP for data/tool access; multi-agent communication, commerce, payments, rich UI, and streaming are added as requirements expand [GOOGLE-PROTO-GUIDE].

## MindStudio and other comparison articles

MindStudio's comparison of MCP, A2A, and AG-UI is useful because it explains what each does not do. MCP is not a real-time UI or HITL protocol. A2A is not a tool connector. AG-UI is not a tool protocol; it standardizes interactive agent UIs, streaming, state, partial outputs, tool-call rendering, and mid-task human input [MINDSTUDIO-SEARCH].

This reinforces the architectural recommendation: design by boundary, not by vendor.

## Blog-derived action plan

1. Inventory agent workflows and classify them by autonomy level.
2. Start with boring, bounded, high-volume workflows before open-ended multi-agent autonomy.
3. Pick protocols by boundary: MCP for tools, A2A for agents, AG-UI for UI, OSSA for contracts, DUADP for discovery.
4. Put cost budgets, iteration limits, and token tracking in the first version.
5. Require HITL for irreversible/high-risk actions.
6. Build an agent catalog with ownership, manifest, tools, policy, evaluation, and incident owner.
7. Treat shared API keys as a migration risk and move toward unique agent identities.
8. Keep an eye on web identity and payment/authorization protocols for public-facing agents.
