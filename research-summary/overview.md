# Agentic AI ecosystem overview

Compiled on June 9, 2026. This overview synthesizes the requested sources into
a practical map of agentic AI protocols, standards, frameworks, governance, and
security.

## Executive synthesis

The agent ecosystem is converging around a layered stack rather than a single
monolithic standard. MCP standardizes agent-to-tool and agent-to-context access
[S17][S18]. A2A, ACP, ANP, and related protocols standardize how agents discover
or communicate with other agents [S19][S20][S22][S24]. AG-UI standardizes the
agent-to-user-interface event stream [S21]. OSSA and DUADP sit adjacent to these
protocols: OSSA is a portable manifest/contract layer for identity,
capabilities, deployment, compliance, lifecycle, security, and trust metadata
[S02][S03]; DUADP is a decentralized discovery layer that helps agents find one
another through DNS TXT records, WebFinger, GAIDs, DIDs, gossip federation, and
registry APIs [S01][S05].

The ecosystem resembles early internet standardization. Harvard's Agent
Protocols Tech Tree argues that open protocols show what builders have agreed
on and what is actually catching on [S09]. The Berkman Klein workshop framed
autonomous agents as a legal, technical, and governance challenge requiring
agent identification, oversight, and technical interventions [S10]. W3C's
WebAgents report similarly notes that many emerging agent protocols build on web
standards but still have unclear alignments, overlaps, and standardization gaps
[S16].

Production readiness is uneven. MIT's AI Agent Index documents rapid deployment
but large transparency gaps: only 4 of 30 prominent agents provide
agent-specific system cards, 25 of 30 disclose no internal safety results, and
23 of 30 lack third-party testing disclosures [S11]. MIT Sloan's 2026 guidance
warns that agentic AI is not ready for unsupervised broad deployment because of
hallucinations, mistakes, and prompt-injection hijacking, while still expecting
agents to handle most transactions in many large-scale business processes within
five years [S12]. Reliability research reinforces this caution: accuracy gains
have not translated into proportional gains in consistency, robustness,
predictability, and safety [S14].

The most important security shift is from "what the model says" to "what the
agent does." A UK AI Security Institute paper tracked 177,436 MCP tools created
between November 2024 and February 2026 and found that action tools grew from
27% to 65% of usage; software development accounts for 67% of all agent tools
and 90% of MCP server downloads [S15]. This means governance must monitor tool
capabilities, agent identity, delegation, permissions, audit trails, and runtime
actions, not just chat outputs [S12][S35][S38].

## What DUADP and OSSA are

DUADP, the Decentralized Universal AI Discovery Protocol, addresses the missing
"DNS for AI agents" problem. It lets agents publish themselves and be discovered
without a central broker. The public site describes a stack of DNS TXT records,
WebFinger, federated gossip, GAID lookup handles, DID documents, signature
verification, provenance, Cedar policies, and REST/MCP interfaces [S01]. Its npm
package, `@bluefly/duadp`, is a TypeScript SDK at version `0.1.7`, Apache-2.0,
with a `duadp` CLI and 9 downloads during the npm reporting week ending June 2,
2026 [S05][S06].

OSSA, the Open Standard for Software Agents, addresses the "agent contract"
problem. The site positions OSSA as the layer that says what an agent is:
identity, capabilities, compliance, lifecycle, security, trust, cost controls,
human-in-the-loop policies, state, MCP references, A2A agent cards, and export
targets [S02]. The local repo describes `@bluefly/openstandardagents` as an
infrastructure bridge between protocols such as MCP/A2A and deployment targets
such as Docker, Kubernetes, LangChain, CrewAI, Claude Skills, and others [S03].
The npm registry reports latest version `0.5.6`, Apache-2.0, and 42 downloads
for the week ending June 2, 2026 [S04][S06]. This checkout's local
`package.json` is `0.5.1`, so the public package is ahead of the checked-out
manifest [S03][S04].

Together, OSSA and DUADP map to an emerging division of labor:

| Layer | Main question | Examples |
| --- | --- | --- |
| Tool/context | What can the agent use? | MCP [S17][S18] |
| Agent contract | What is the agent and how is it governed? | OSSA [S02][S03] |
| Discovery | How do agents find one another? | DUADP, A2A Agent Cards, ANP descriptions [S01][S19][S22] |
| Agent communication | How do agents coordinate tasks? | A2A, ACP, ANP, LangChain Agent Protocol [S19][S23][S24] |
| User interaction | How does the user see/control the run? | AG-UI [S21] |
| Governance | Who authorized this action and can it be audited? | NIST identity work, KYA, runtime policy engines [S35][S37][S42] |

## Adoption and maturity signals

MCP has the strongest package-level adoption signal among the sources gathered:
`@modelcontextprotocol/sdk` recorded 35,499,180 downloads in the npm week ending
June 2, 2026 [S07]. The MCP TypeScript SDK repository had 12,632 GitHub stars
when queried on June 9, 2026 [S32]. The official docs list broad client support
across Claude, ChatGPT, VS Code, Cursor, MCPJam, and other tools [S18].

A2A has strong enterprise and repository momentum. Google's launch post listed
more than 50 technology and service-provider partners [S19], while Google Cloud
later reported support from 150+ organizations and a v0.3 release with gRPC,
signed security cards, and stronger SDK support [S20]. The A2A GitHub project
had 24,206 stars on June 9, 2026 [S32].

Open-source frameworks are mature enough for production pilots, but they solve
different problems. LangGraph is the orchestration runtime for stateful,
long-running, durable workflows [S27]. CrewAI emphasizes autonomous crews and
event-driven flows [S28]. LlamaIndex is strongest around document/RAG agents and
event-driven workflows [S30]. OpenAI Agents SDK supplies a lightweight
multi-agent framework with agents, handoffs, guardrails, sessions, tools, and
tracing [S26]. AutoGen remains influential but its GitHub repo now warns that it
is in maintenance mode and recommends Microsoft Agent Framework for new projects
[S29].

GitLab Duo Agent Platform is an example of enterprise agent packaging. Its
January 2026 GA includes foundational agents, custom agents built through an AI
Catalog, and external agents such as Claude Code and OpenAI Codex integrated
with GitLab-managed credentials [S31].

## Main risks

The most repeated risks are prompt injection, excessive permissions, weak agent
identity, insufficient logging, hallucinated or brittle actions, and unsafe
composition across protocols [S12][S35][S36][S38][S41]. Gravitee's 2026 report
is the clearest enterprise-security signal: 81% of teams are beyond planning,
only 14.4% have full security approval, 88% report confirmed or suspected
incidents, and only about 22% treat agents as independent identities [S35].

Security research has moved beyond generic prompt filters. Hou et al. identify
16 MCP threat scenarios across malicious developers, external attackers,
malicious users, and inherent security flaws [S38]. Agent Security Bench covers
10 scenarios, 400+ tools, 27 attack/defense methods, and reports high attack
success rates for prompt injection and related attacks [S40]. ACM's "Guardians
of the Agents" argues for generate-verify-execute workflows and formal checks
before irreversible actions are executed [S39].

## Practical recommendations

1. Use MCP for tool/context access, but front it with an authorization gateway,
   scoped credentials, signed server metadata, and audit logging [S17][S18][S38].
2. Use A2A or ACP only when multi-agent coordination is actually required; start
   with single-agent workflows and deterministic tool flows when possible
   [S33][S34].
3. Treat OSSA-style manifests as the contract of record for identity,
   capabilities, lifecycle, cost, compliance, HITL, and trust metadata [S02][S03].
4. Use DUADP-style discovery only with verifiable identity, signatures,
   revocation, trust tiers, and policy checks; discovery without trust increases
   attack surface [S01][S35].
5. Move security to the action boundary: deny-by-default tools, short-lived
   scoped tokens, pre-execution policy checks, human approval for irreversible
   actions, and kill switches [S36][S39][S42].
6. Measure production readiness with reliability profiles, not only benchmark
   task success: consistency, robustness, predictability, and safety matter for
   high-stakes deployment [S14].
7. Maintain runtime telemetry and incident response around prompts, tool calls,
   permissions, approvals, trace IDs, and delegated actions [S35][S36][S41].
