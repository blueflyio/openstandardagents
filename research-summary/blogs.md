# Industry Blogs and Engineering Publications

This document separates vendor/engineering commentary from primary standards and academic sources. These sources are useful for adoption patterns, cost models, operational lessons, and practitioner recommendations, but claims should be cross-checked against official documentation where possible.

## 47Billion: AI Agents in Production

47Billion's 2026 production report is valuable because it discusses actual framework evaluation and a production deployment rather than only abstract protocol descriptions [S36]. The authors tested AutoGen, CrewAI, LlamaIndex, and OpenAI Agents SDK patterns, then reported lessons from an AI sales-training simulator for a global insurance company [S36].

Key insights:

- Most production use cases fit Level 2-3 autonomy: deterministic workflows with branching or single tool-using agents [S36].
- Open-ended multi-agent systems are powerful but expensive and difficult to debug [S36].
- CrewAI was faster and more structured for a table-reservation workflow than AutoGen in their experience [S36].
- LlamaIndex was strongest for document-heavy, RAG-centric workflows [S36].
- Human-in-the-loop is a trust and compliance requirement, not a temporary weakness [S36].
- MCP, A2A, and AG-UI are complementary: MCP for tools, A2A for agents, AG-UI for frontends [S36].

Cost model from the report:

| Approach | Cost per task | Tokens per task | Best fit |
| --- | --- | --- | --- |
| Simple workflow | $0.10-$0.50 | 1,000-3,000 | Linear tasks |
| CrewAI multi-agent | $0.50-$2.00 | 3,000-10,000 | Structured multi-step work |
| AutoGen multi-agent | $2.00-$5.00 | 5,000-25,000 | Exploratory collaboration |
| LlamaIndex RAG | $0.20-$1.00 | 1,000-5,000 | Document queries |

Actionable recommendations:

- Start narrow and add autonomy only when workflow complexity demands it.
- Implement cost monitoring before production rollout.
- Use structured outputs and validation.
- Enforce tool constraints and maximum tool-call counts.
- Roll out progressively from internal users to beta to general availability.
- Adopt MCP/A2A/AG-UI rather than building custom integration layers when standards fit [S36].

## Ruh.ai: AI Agent Protocols 2026 Guide

Ruh.ai's May 6, 2026 guide frames protocols as enterprise interoperability infrastructure [S37]. It cites Gartner's forecast that 40% of enterprise applications will integrate task-specific AI agents by 2026, up from less than 5% in 2025 [S37].

The guide emphasizes three protocol layers:

- MCP: agent-to-tool/data connections using JSON-RPC 2.0 and standardized tool/resource schemas [S37].
- A2A: agent-to-agent coordination using Agent Cards, HTTP/SSE, OAuth/API keys/mTLS, task management, and dynamic delegation [S37].
- ACP: REST-based lightweight messaging for fast integration, multimodal payloads, async-first workflows, and no-SDK environments [S37].

The decision framework is practical:

- Use MCP when one agent needs many tools, context management, audit trails, or strong ecosystem support [S37].
- Use A2A when specialized agents need dynamic discovery, delegation, or cross-organizational communication [S37].
- Use ACP when rapid deployment, legacy system integration, or REST familiarity matters more than advanced protocol features [S37].
- Use hybrid approaches for production multi-agent systems [S37].

The guide also lists security controls: least privilege, strong authentication, scoped OAuth, message integrity, rate limiting, circuit breakers, zero-trust segmentation, and audit trails [S37].

## Gravitee: State of AI Agent Security 2026

Gravitee's report is one of the clearest practitioner data points for adoption outpacing governance [S38]. It surveyed more than 900 executives and technical practitioners and found:

- 80.9% of technical teams are past planning and in active testing or production [S38].
- Only 14.4% have full security approval for their entire agent fleet [S38].
- 88% report confirmed or suspected incidents in the last year [S38].
- Only 21.9% treat agents as independent identities [S38].
- 45.6% rely on shared API keys for agent-to-agent authentication [S38].
- 27.2% use custom hardcoded authorization logic [S38].
- 47.1% of agents are actively monitored or secured on average [S38].

The report's most important recommendation is to shift from periodic/manual audits to continuous, identity-aware enforcement [S38]. It argues that agents must become first-class security principals rather than invisible extensions of human accounts or generic service accounts [S38].

## Dev.to: Agent authentication and authorization guide

The Dev.to security guide is useful as an implementation-oriented checklist for production agent auth [S39]. It starts from a scenario where a support agent with broad credentials is prompt-injected into sending a bulk Slack message, then generalizes the problem: agents are non-deterministic actors whose tool choices depend on runtime reasoning [S39].

Recommended architecture:

1. Unique agent identity.
2. Short-lived, scoped credentials.
3. OAuth 2.1 with PKCE for delegated user authorization.
4. Granular scopes such as `orders:read` rather than broad `orders:full`.
5. A tool gateway that intercepts every action.
6. Risk-based human approval.
7. Input filtering, output filtering, and behavioral anomaly detection.
8. Immutable audit logging with trace IDs, policy decisions, cost, and model metadata [S39].

The guide's anti-patterns are worth turning into review checks:

- Shared API keys.
- "God mode" permissions.
- Trusting agent reasoning to self-escalate permissions.
- No emergency kill switch [S39].

## Harvard Journal of Law and Technology: Institutional Origins of the Agentic Web

The Harvard JOLT commentary uses the Amazon-Perplexity Comet dispute to show that agent governance is no longer theoretical [S44]. Its core question is whether autonomous agents will be governed by proprietary platform rules or by open protocols that support portable identity, verifiable delegation, and accountable behavior [S44].

The article's most reusable concept is Know Your Agent (KYA). KYA would establish:

- Agent identity.
- Principal-agent linkage.
- Delegation parameters.
- Auditability and behavioral records [S44].

For technical teams, this maps to manifest metadata, signed delegation artifacts, policy scopes, trace records, and revocation. It also explains why protocol-based identity should not be treated as optional nice-to-have metadata [S44].

## Harvard Kennedy School Student Policy Review: Wrangling with Explosive AI Growth

The HKS Student Policy Review article adds a network/infrastructure lens [S46]. It notes that bots already represent about 50% of internet traffic and argues that more capable autonomous bots could create super-exponential bot-to-bot activity that crowds out human traffic [S46].

Recommendations include:

- More efficient bot-bot communication protocols.
- More digital infrastructure investment.
- Stronger methods for distinguishing humans from automated traffic.
- Next-generation verification, including voluntary proof-of-personhood, secure hardware authentication, or decentralized reputation networks.
- Reliability-engineering style AI governance with redundancy, monitoring, and human review in sensitive applications [S46].

This source is useful for understanding why agent protocols are not only software architecture. They may become network-scale governance and infrastructure concerns.

## Cross-blog themes

1. Protocols are converging into complementary layers rather than one winner [S36][S37].
2. Cost and reliability are the first production constraints teams hit [S36].
3. Human-in-the-loop and progressive rollout are repeated across sources [S36][S39][S45].
4. Identity-aware enforcement is the core security theme [S38][S39][S44].
5. The web needs agent identification and bot/human distinction standards [S10][S44][S46].

## Action checklist for teams

- Inventory every agent and give it an owner.
- Give every agent a unique identity and short-lived credentials.
- Convert internal APIs into MCP servers only behind a gateway with authz and audit.
- Use OSSA-like manifests to document tools, scopes, trust boundaries, cost limits, and oversight rules.
- Use DUADP/ANP-style discovery only with signed resource metadata and revocation.
- Use A2A only where independent agents truly need delegation.
- Add AG-UI or equivalent event streaming when humans need to approve, interrupt, or understand agent behavior.
- Track tokens, cost, retries, tool-call loops, latency, success rate, and intervention rate.
