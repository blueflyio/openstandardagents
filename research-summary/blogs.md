# Industry blogs and engineering publications

## Purpose

This file synthesizes non-academic but credible engineering and industry sources. These sources are useful because they describe what breaks in production: reliability, cost, observability, human review, protocol adoption, and security controls.

## 47Billion: agents in production

47Billion's 2026 engineering article is one of the most practical sources because it is organized around production lessons rather than demos [S46]. It frames an AI agent as software that perceives its environment, reasons, acts toward a goal, and learns from feedback. The core implementation pattern is ReAct: reason, act, observe, and repeat until completion or failure [S46].

### Autonomy spectrum

47Billion recommends thinking in levels rather than treating "agent" as binary [S46]:

| Level | Pattern | Production implication |
| --- | --- | --- |
| 1 | Prompt chaining | Deterministic and easy to debug |
| 2 | Workflows with branching | Good for predefined conditional paths |
| 3 | Tool-using agents | Sweet spot for many production cases with guardrails |
| 4 | Multi-agent systems | Powerful but expensive and hard to debug |

Their recommendation is that Level 2-3 is the production sweet spot for most cases; Level 4 is compelling in demos but painful in production [S46].

### Framework lessons

47Billion's comparative findings:

- AutoGen: powerful and intuitive for exploratory multi-agent conversations, but prone to circular conversations, high token usage, repeated tool calls, and difficult debugging [S46].
- CrewAI: more structured, predictable, and faster for task-based workflows; less flexible for open-ended dynamic scenarios [S46].
- LlamaIndex: strongest for document-heavy and RAG-centric workflows, but not the best general orchestration layer [S46].
- OpenAI Agents SDK: minimalist primitives - agents, handoffs, guardrails, tracing - and a good fit when teams are already in the OpenAI ecosystem [S46].
- LangGraph: more verbose than CrewAI but flexible for stateful graph workflows with loops, saved state, and resumes [S46].

### Cost model

47Billion provides practical cost estimates [S46]:

| Approach | Cost per task | Tokens per task | Use case |
| --- | --- | --- | --- |
| Simple workflow | USD 0.10-0.50 | 1,000-3,000 | Linear deterministic work |
| CrewAI multi-agent | USD 0.50-2.00 | 3,000-10,000 | Structured multi-step work |
| AutoGen multi-agent | USD 2.00-5.00 | 5,000-25,000 | Exploratory collaboration |
| LlamaIndex RAG | USD 0.20-1.00 | 1,000-5,000 | Document processing |

The key warning is that multi-agent cost is multiplicative, not additive, because agents often see conversation history, tool outputs, and each other's generated text [S46].

### Reliability playbook

Recommended controls:

- Structured outputs with validation.
- Conservative temperature for deterministic tasks.
- Strict tool whitelists.
- Maximum tool-call counts and cost limits.
- Human approval gates for irreversible actions.
- Progressive rollout from internal pilot to beta to general availability.
- Continuous refinement, because initial agent behavior is rarely production-ready [S46].

The article's strongest operational recommendation is progressive autonomy: start with more human involvement, then reduce it as the system proves itself [S46].

## Ruh.ai: protocol selection guide

Ruh.ai's 2026 protocol guide summarizes MCP, A2A, and ACP as the three major communication standards and argues that communication barriers are a primary cause of enterprise implementation failures [S47].

It cites Gartner's 2025 research prediction that 40% of enterprise applications will integrate AI agents by 2026 [S47]. Treat this as an industry-analyst claim reported by Ruh.ai rather than a primary Gartner source in this packet.

### Decision framework

Ruh.ai's protocol guidance:

| Use case | Suggested protocol |
| --- | --- |
| Agent needs many data sources/tools | MCP |
| Multiple specialized agents collaborate | A2A |
| Quick REST-style prototyping or legacy integration | ACP |
| Mixed enterprise architecture | MCP for tools plus A2A for coordination |

The guide also covers security and compliance considerations: least privilege, OAuth 2.0 or scoped tokens, audit trails, mTLS/HMAC/message integrity checks, rate limits, circuit breakers, network segmentation, and zero-trust architecture [S47].

Important limitation: ACP has since merged into A2A under the Linux Foundation, so ACP should be treated as a migration or historical path rather than an independent long-term standard [S34].

## Gravitee: AI agent security

Gravitee's security report is the most statistics-heavy industry source in this packet [S48]. It argues that agents have become production infrastructure before identity, authorization, and monitoring controls caught up.

Critical statistics:

- 80.9% of technical teams moved beyond planning into testing or production.
- Only 14.4% report full security/IT approval for all agents.
- 88% reported confirmed or suspected incidents in the survey period reported on February 4, 2026.
- Only 21.9% treat AI agents as independent identities.
- 45.6% still use shared API keys for agent-to-agent authentication.
- More than half of agents operate without security oversight or logging [S48].

Actionable recommendations:

- Treat agents as first-class security principals.
- Replace shared API keys with independent identities and scoped authorization.
- Shift from periodic manual audits to continuous identity-aware enforcement.
- Ensure all agent actions are monitored, logged, and attributable [S48].

## DEV security guide

The DEV production security guide is practitioner-oriented and complements the Gravitee/NIST identity framing with controls engineers can implement [S50]. Its five layers are:

1. Network egress controls.
2. Workspace filesystem isolation.
3. Input sanitization and prompt-injection defense.
4. Tool execution guardrails.
5. Audit logging and tamper-evident trails [S50].

The most useful insight is that appsec assumptions change. Traditional APIs validate structured input and execute predefined code paths. Agents accept natural language, generate tool arguments dynamically, loop through reasoning steps, retrieve untrusted context, and may call tools with real permissions [S50].

Production takeaway: network and filesystem isolation should be installed before the agent becomes "smart." If an indirect prompt injection succeeds but cannot reach credentials, external exfiltration endpoints, or sensitive files, the blast radius is much smaller [S50].

## GitLab Duo Agent Platform announcement

GitLab's GA announcement provides a strong enterprise-platform example [S45]. Its premise is the "AI paradox" in software delivery: faster coding alone does not improve total innovation velocity enough, because only about 20% of a developer's time is spent writing code [S45].

GitLab's answer is an agent platform across the full SDLC:

- Agentic Chat for analysis, coding, CI/CD, and security.
- Planner Agent and Security Analyst Agent.
- Custom agents via AI catalog.
- External agents including Claude Code and Codex CLI.
- Flows for issue-to-MR, CI/CD conversion, pipeline fixing, code review, and software development in IDEs.
- Governance, visibility, model selection, self-hosted model support, group-based access controls, LDAP/SAML integration, and credits [S45].

For this research, GitLab is important because it shows how agent platforms are being embedded into existing systems of record. Governance is stronger when agents operate where source code, issues, reviews, pipelines, permissions, and security findings already live [S44][S45].

## Harvard policy/technology commentary

Harvard's Agent Protocols Tech Tree is partly a blog post and partly a research artifact [S10]. Its main contribution is not a protocol spec; it is a map of the emerging protocol landscape and a governance argument. Open protocols reveal what builders agree on, and if agents are decentralized and easy to build, protocols become one way to steer behavior [S10].

Harvard's agentic web policy writing adds the institutional concern: agent identity, principal-agent linkage, delegation, and auditability must be solved before large-scale bot-bot interaction crowds out human-oriented web assumptions [S20].

## Synthesis: credible production guidance

Across the industry sources, the repeatable recommendations are:

1. Start narrow. Broad autonomous agents are less reliable than specialized agents with well-defined tasks [S46].
2. Choose protocols by layer, not ideology. MCP for tools, A2A for agents, AG-UI for frontend, OSSA/DUADP for contract/discovery pilots [S30][S46][S47].
3. Measure cost from day one. Multi-agent token usage can grow faster than expected [S46].
4. Use human approval as a production control, not a failure of autonomy [S46].
5. Treat agent identity as a security primitive [S48][S49].
6. Isolate egress and filesystem access before exposing agents to sensitive data [S50].
7. Log attempted actions, not only successful final outputs [S48][S50].
8. Avoid bespoke integrations where standards exist, but do not assume standards enforce policy by themselves [S26][S46].

## Blog-source limitations

- Vendor blogs can overstate adoption or ROI; use their statistics as directional unless corroborated by primary reports.
- 47Billion and Ruh.ai provide useful engineering frameworks but are not standards bodies [S46][S47].
- Gravitee's security statistics are survey-based and vendor-published, but they are directly relevant because they report practitioner/executive controls and incidents [S48].
- HBR and MIT Press sources may be paywalled or partially accessible to unauthenticated readers; they are used for organizational/governance framing rather than low-level technical facts [S21][S22][S23][S24].
