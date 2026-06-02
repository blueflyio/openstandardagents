# Tech Blogs and Engineering Publications

Research snapshot: June 2, 2026. Citation keys map to `reading-list.md`.

## Source quality note

Official docs and primary project pages are cited in `protocols.md` and `frameworks.md`. This file focuses on engineering interpretation and production guidance. Ruh.ai's direct article page for "AI Agent Protocols 2026: Complete Guide" returned only shell/client-rendered content through direct fetch, but search snippets confirmed the article title, January 16, 2026 date, and its MCP/A2A/ACP topic. I therefore treat Ruh.ai as partially available and triangulate protocol claims with primary sources [T29].

## 47Billion: "AI Agents in Production"

47Billion's production report is the most detailed practical source in this set [T19]. It distinguishes four autonomy levels: prompt chaining, branching workflows, tool-using agents, and multi-agent systems. The authors argue that most production use cases should stay at Level 2-3 rather than jumping to open-ended multi-agent designs [T19].

The report compares AutoGen, CrewAI, and LlamaIndex:

- AutoGen is powerful for exploratory multi-agent conversations but expensive and hard to debug when agents loop or disagree [T19].
- CrewAI is a pragmatic middle ground for structured multi-step tasks and was faster to build with in their table-reservation comparison [T19].
- LlamaIndex excels when the problem is document-heavy and retrieval-centric [T19].

Its production case study is an AI sales training simulator for a global insurance company. Hard lessons include strict tool boundaries, smart summarization for 30-45 minute conversations, unexpected input handling, non-negotiable cost monitoring, response-time variability, and long refinement cycles [T19].

The most actionable production table:

| System type | Production posture | Needed controls |
|---|---|---|
| Simple workflows | Ready | Error handling, validation, monitoring |
| Tool-using agents | Ready with guardrails | Output validation, cost limits, fallbacks |
| Structured multi-agent | Cautiously ready | Heavy guardrails, HITL checkpoints, progressive rollout |
| Open-ended multi-agent | Not ready for critical paths | Too unpredictable [T19] |

The report recommends MCP for tools, A2A for external agents, and AG-UI for user interaction. It argues that adopting standards early reduces custom integrations and lets teams focus on product logic [T19].

## Ruh.ai: "AI Agent Protocols 2026"

Ruh.ai's blog index lists "AI Agent Protocols 2026: The Complete Guide to Standardizing AI Communication" dated January 16, 2026. The snippet says protocols such as MCP, A2A, and ACP standardize how AI agents communicate with tools and each other, reducing integration complexity, preventing vendor lock-in, and enabling scalable, secure multi-agent systems for enterprises [T29].

The direct page did not expose article body content to the fetch tool [T29]. Because of that limitation, I do not rely on Ruh.ai for unique statistics. Its accessible framing is consistent with the primary docs: MCP covers agent-to-tool integration, A2A covers agent-to-agent interoperability, and ACP is now converging into A2A [T03] [T06] [T25] [T29].

## Gravitee: "State of AI Agent Security 2026"

Gravitee's report is the strongest empirical industry security source collected [T15]. It surveys 919 executives and practitioners and concludes that adoption is outpacing control. The report's most important figures are:

- 80.9% of technical teams have moved past planning into active testing or live use.
- Average organization manages 37 agents.
- Only 47.1% of an organization's agents are actively monitored or secured.
- Only 14.4% have full IT/security approval for the entire agent fleet.
- 88% report confirmed or suspected AI agent security/privacy incidents in the previous year.
- Only 21.9% treat agents as independent identity-bearing entities.
- 45.6% use API keys and 44.4% use generic tokens for A2A authentication.
- 57.4% cite insufficient observability when building agents and MCP servers [T15].

Gravitee's qualitative incidents show common patterns: read-only agents making elevated API calls, prompt injection forwarded into agent-to-agent channels, agents attempting to send sensitive information outside the organization, shared service accounts granting broad access, and unexpected API calls discovered through logs [T15].

The practical recommendation is identity-aware enforcement and continuous monitoring. Periodic audits do not match autonomous execution speed [T15].

## Dev.to security guides

Dev.to security posts provide practitioner patterns rather than formal standards. The most useful guide in this set identifies seven risks: prompt injection, excessive permissions, hallucinated actions, no attribution, replay attacks, no kill switch, and opaque policy violations [T31].

The guide's core argument is that traditional authentication proves who called an API but not whether the model-selected action is legitimate [T31]. It proposes an intent envelope and verification layer:

- Agent identity and action.
- Timestamp and nonce for replay resistance.
- Signature over intent.
- Verification of signature, declared action, constraints, revocation, timestamp, and nonce before tool execution.
- Structured audit log after execution [T31].

This pattern is directionally aligned with NIST/NCCoE and Harvard JOLT: agents need identity, delegation, authorization, auditing, and revocation as first-class infrastructure [T14] [T20] [T31].

## Harvard JOLT: Institutional origins of the agentic web

Harvard JOLT's article is a governance and legal analysis rather than an engineering blog, but it is highly relevant to web agents [T20]. It uses the Amazon-Perplexity dispute over autonomous shopping as a case study for whether agentic access will be governed by platform discretion or interoperable protocols [T20].

The article argues that Amazon's concern about covert human simulation and security vulnerabilities cannot be dismissed, while Perplexity's argument that a user-authorized agent represents the user raises a real delegation question [T20]. The article's answer is not platform-only or agent-only. It distinguishes delegation, which governs on whose behalf the agent acts, from platform permission, which governs where it may act [T20].

The key recommendation is Know Your Agent (KYA): cryptographic identity, principal-agent linkage, delegation parameters, and auditability [T20]. This is a strong conceptual complement to DUADP's DID-based discovery and OSSA's signed manifest model [T01] [T02] [T20].

## GitLab Duo Agent Platform

GitLab's GA announcement is a platform-level example of agents moving from individual coding assistance into governed lifecycle workflows [T27]. GitLab argues that code authoring is only about 20% of developer time; faster code generation can create downstream bottlenecks in review, security, compliance, bug fixes, CI/CD, and planning [T27].

GitLab's solution combines context-aware Agentic Chat, foundational agents, custom agents, external agents, and flows [T27]. It also includes MCP Client support for external tools and model selection controls for privacy/security/compliance [T27].

From a standards perspective, GitLab is notable because it shows how protocol support becomes a platform capability. MCP support is not just an SDK feature; it is wrapped in group-level controls, user approval flows, workspace/user configuration, and governance visibility [T27].

## Monday.com ATP commentary

Monday.com's Agent Tool Protocol is a critique of traditional function calling and tool-list exposure [T26]. The website argues that agents should write and execute code against official APIs in a secure sandbox rather than serially call predeclared tools [T26].

ATP's claimed advantages are on-demand API discovery, less context pollution, parallel execution, filtering/mapping/reducing in code, OpenAPI integration, MCP compatibility, granular permissions, approvals, logging, and V8 isolation [T26]. It is still early, but it reflects a broader production concern: as tool catalogs grow, dumping all tool schemas into context is inefficient and potentially unsafe [T26].

## Cross-source engineering recommendations

1. Start with bounded workflows, not open-ended multi-agent autonomy [T19].
2. Define cost budgets before launch; multi-agent systems can multiply token use [T19].
3. Use standards by boundary: MCP for tools, A2A for agent collaboration, AG-UI for frontend control, OSSA for contracts, DUADP for discovery [T01] [T02] [T03] [T07] [T08].
4. Implement human-in-the-loop as a trust feature, not a failure [T07] [T17] [T19].
5. Treat tool calls as security-sensitive actions that need runtime policy enforcement [T14] [T15] [T31].
6. Build observability into every agent path: traces, budgets, approval records, tool inputs/outputs, and peer-agent delegations [T15] [T19] [T27].
7. Prefer narrow, specialized agents over general agents when reliability matters [T19].
8. Use progressive rollout: internal pilot, limited beta, GA only after monitoring and iteration [T19].

## Credibility grading

| Source | Credibility for facts | Best use |
|---|---|---|
| Official protocol docs / GitHub READMEs | High for stated design and metadata | Protocol architecture and current repo state |
| npm metadata | High for package versions, bins, dependencies | Package facts |
| MIT/Cornell/Harvard/NIST | High for academic/policy claims | Governance, transparency, education |
| Gravitee | Medium-high for survey statistics | Industry security posture; vendor bias possible |
| 47Billion | Medium for production heuristics | Engineering lessons and cost heuristics |
| Dev.to | Medium-low for anecdotes/tools | Practitioner patterns; verify before adopting |
| Ruh.ai direct fetch | Limited | Topic/date confirmation only; direct body not available |
