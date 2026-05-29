# Industry blogs and engineering publications

Generated: 2026-05-29.

## Summary

Industry writing in 2026 largely agrees on two points. First, agents need a
protocol stack, not one master protocol: MCP for tools, A2A/ACP for other
agents, AG-UI for frontends, and identity/discovery standards for trust
[S47][S48]. Second, production readiness is dominated by security, observability,
cost control, and rollout discipline rather than clever prompting alone
[S49][S51][S56].

## 47Billion: production stack and protocol adoption

47Billion's 2026 article "AI Agents in Production" presents MCP, A2A, and AG-UI
as complementary infrastructure layers [S47]. It describes MCP as the standard
way agents connect to tools, A2A as the way agents built by different
organizations communicate, and AG-UI as the protocol for agent-to-frontend
communication [S47]. The recommendation is incremental adoption: use MCP for
databases/APIs/search, evaluate A2A for external or partner agent collaboration,
and explore AG-UI where users need real-time feedback and approval workflows
[S47].

The practical production guidance is to avoid bespoke integrations where a
standard boundary is available. 47Billion argues that adopting MCP, A2A, and
AG-UI early reduces custom protocol work and lets teams focus on product logic,
guardrails, monitoring, human-in-the-loop patterns, and microservice integration
[S47].

## Ruh AI: decision framework for MCP, A2A, and ACP

Ruh AI's "AI Agent Protocols 2026" guide frames standardized communication as a
response to integration failures in enterprise agent deployments [S48]. It cites
Gartner's 2025 forecast that 40 percent of enterprise applications will
integrate AI agents by 2026, up from less than 5 percent in 2025 [S48]. The
guide divides the three major protocols this way: MCP for agent-to-tool
connections, A2A for multi-agent coordination, and ACP for lightweight REST
messaging [S48].

Ruh AI's useful contribution is a selection lens: MCP is the default when the
primary need is data/tool access; A2A matters when agents from different
providers or organizations must coordinate; ACP is attractive when teams want a
REST-native, lightweight communication layer [S48].

## Gravitee: adoption has outpaced control

Gravitee's State of AI Agent Security 2026 report is the most security-focused
industry source reviewed [S49][S50]. It reports that 81 percent of teams are
beyond planning, but only 14.4 percent have full security approval for their
agent fleet [S50]. It also reports 88 percent confirmed or suspected incidents
and only 21.9 percent treating agents as independent identities [S49][S50].

The actionable recommendation is identity-aware enforcement. Gravitee argues
that treating agents as extensions of human users or generic service accounts
creates audit and access-control gaps [S49]. The implication for agent platform
builders is clear: use unique agent identities, policy-aware gateways, runtime
monitoring, and continuous security review rather than one-time API key issuance
[S49][S50].

## DEV Community security guides

The DEV Community security guide reviewed here lists seven major production
risks, including prompt injection, excessive permissions, and hallucinated
actions [S51]. Its main engineering recommendation is to treat the model as
untrusted and place a deterministic verification layer between the agent and
tools [S51]. Suggested mechanisms include cryptographic identity, signed intent
envelopes, mandatory action mediation, pre-execution enforcement, least
privilege, human-in-the-loop for high-stakes actions, and detailed audit logs
[S51].

Although DEV Community is not a standards body, the guidance is directionally
consistent with NIST, OWASP, OpenAI, and academic sources: prompts are not a
security boundary, and tool execution needs independent authorization [S12][S52][S57].

## Harvard and bot-traffic policy writing

Harvard JOLT's agentic web article focuses on institutional governance rather
than implementation details [S11]. It argues that agents need portable,
protocol-based credentials that state who the agent is, who authorizes it, what
scope it has, and how its actions can be audited [S11]. This maps closely to
KYA and to the identity gaps described by NIST and Gravitee [S11][S12][S49].

Bot-traffic reports add scale pressure. Imperva reports that automated traffic
exceeded human traffic in 2025, reaching more than 53 percent of all web
traffic [S54]. HUMAN Security reports a 7,851 percent year-over-year increase
in agentic AI traffic in 2025 and says AI systems moved from reading to
transacting on the web [S55]. These figures make agent identity and web-conduct
standards more urgent [S54][S55].

## Production MCP research and engineering commentary

The 2026 paper "Bridging Protocol and Production" argues that MCP is a strong
tool-integration foundation but lacks production primitives for identity
propagation, adaptive tool budgeting, and structured error semantics [S56]. Its
recommended controls include health/readiness endpoints, per-tool p99 latency
metrics, JWT validation, tool-level ACLs, audit logs, idempotency keys,
structured errors, and circuit breakers [S56].

This is the bridge from protocol to operations: standards define how components
communicate, but production systems still need SRE-style budgets, traces,
retries, errors, and readiness probes [S56].

## GitLab Duo Agent Platform: agents embedded in the SDLC

GitLab's GA announcement shows how agentic AI is being productized in software
delivery platforms [S45]. GitLab Duo Agent Platform includes Agentic Chat with
multi-step reasoning over GitLab context, foundational agents such as Planner
and Security Analyst, custom agents in an AI Catalog, and external agents such
as Claude Code and OpenAI Codex [S45].

The docs describe the broader platform surface: custom flows, AGENTS.md project
context generation, MCP connections, security flows, data analyst and planner
agents, and features varying by tier [S46]. GitLab's model is important because
it ties agents to existing authorization, projects, issues, merge requests,
pipelines, security findings, and governance workflows [S45][S46].

## Actionable recommendations synthesized from blogs

1. Avoid building custom integration protocols if MCP, A2A/ACP, or AG-UI fits
   the boundary [S47][S48].
2. Start with lower-risk workflows and progressive rollout. Add autonomy only
   after traces, evals, HITL, and incident response are in place [S47][S49].
3. Use cost controls at multiple levels: per request, per task, per user, and
   per tenant [S56].
4. Treat identity as a first-class feature. Shared keys and inherited user
   permissions are not adequate for autonomous agents [S49][S50].
5. Put governance at the tool/API layer. Policy written in prompts is guidance,
   not enforcement [S51][S52][S57].
6. Design user interfaces for control. Approval workflows, tool-call visibility,
   and state synchronization are product requirements for higher-autonomy agents
   [S23][S47].
