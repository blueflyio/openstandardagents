# Agentic AI Landscape Overview

Prepared on May 24, 2026.

## Executive synthesis

Agentic AI is moving from isolated demos to production infrastructure, but the
ecosystem is still missing the equivalent of the early web's stable layers for
identity, discovery, authorization, and conduct. The clearest pattern across the
sources is a layered stack: MCP connects agents to tools and data, A2A and ACP
connect agents to other agents, AG-UI connects agents to user interfaces, DUADP
and ANP address discovery and identity, and OSSA defines a portable contract for
what an agent is allowed to do and how it should be deployed [S01] [S02] [S03]
[S04] [S05] [S06] [S07] [S08].

The university and policy sources frame this as an early-internet moment.
Harvard Library Innovation Lab argues that open protocols are an "x-ray" of
what builders are forced to agree on and may shape agent behavior because agents
are simple to reproduce: a model, a loop, and tools [S15]. MIT's 2025 AI Agent
Index shows how fast deployed agents are advancing while transparency lags:
24/30 indexed agents launched or received major agentic updates in 2024-2025,
25/30 disclose no internal safety results, and there are no established web
conduct standards for browser agents [S16]. MIT Sloan's 2026 guidance is more
cautious: agentic AI is not yet ready for prime time because hallucinations,
mistakes, and prompt injection remain unresolved, but agents may handle most
transactions in many large-scale business processes within five years [S17].

Security is the main constraint on adoption. Gravitee's 2026 survey of 919
respondents reports that 80.9% of technical teams are past planning, only 14.4%
have full security approval for their agent fleet, 88% report confirmed or
suspected agent incidents, and only 21.9% treat agents as independent identities
[S18]. NIST/NCCoE's February 2026 concept paper asks the community to define how
identification, authentication, authorization, auditing, non-repudiation, and
prompt-injection controls should apply to AI and software agents [S19].

## What DUADP and OSSA are

DUADP, the Decentralized Universal AI Discovery Protocol, positions itself as
"DNS for AI Agents." Its public site describes federated DNS and WebFinger
discovery, gossip federation, W3C DID identity, verifiable credentials, trust
tiers, REST endpoints, and 17 MCP tools for discovery, publishing, validation,
federation, governance, and health [S01]. The npm package
`@bluefly/duadp` is the TypeScript SDK and CLI for this protocol, version 0.1.4,
Apache-2.0, with the package description "DUADP -- Decentralized Universal AI
Discovery Protocol SDK for TypeScript" [S32].

OSSA, the Open Standard for Software Agents, is not a runtime or transport
protocol. The local repository and public site describe it as a portable agent
contract layer: a schema-validated YAML manifest for identity, capabilities,
security, compliance, lifecycle, cost, and deployment metadata that can export to
multiple runtimes and platforms [S02] [S28] [S29]. The npm package
`@bluefly/openstandardagents` is version 0.5.1, Apache-2.0, and describes OSSA as
an infrastructure bridge between agent protocols such as MCP/A2A and deployment
platforms such as Docker, Kubernetes, LangChain, CrewAI, Claude Skills, and
others [S31].

Together, DUADP and OSSA form a local stack: OSSA defines the agent contract,
DUADP discovers and verifies it, and the execution runtime runs it. The repo's
README explicitly separates those layers as identity/governance, discovery, and
execution [S28]. In `ai.json`, this project also identifies itself through a
DUADP URI and points at `https://discover.duadp.org` for discovery [S30].

## Key themes

### 1. The protocol stack is becoming modular

The strongest sources no longer treat "the agent protocol" as one standard.
They split the problem into interoperable layers. Anthropic's MCP is for
agent-to-tool and agent-to-data access [S03]. Google's A2A is for agent-to-agent
task delegation, capability discovery, long-running tasks, and multimodal
collaboration [S04]. AG-UI standardizes event streams between backend agents and
front-end applications [S05]. Agent Protocol standardizes task and step APIs for
running and benchmarking agents [S06]. ANP focuses on DID-based identity,
encrypted communication, meta-protocol negotiation, and capability description
for an "Agentic Web" [S07]. IBM BeeAI's ACP is a lightweight REST protocol, now
folded into A2A under Linux Foundation governance [S08].

### 2. Production advice converges on constrained autonomy

47Billion's production analysis recommends simple workflows and tool-using
agents before open-ended multi-agent systems; it calls Level 2-3 autonomy the
production sweet spot and says open-ended multi-agent systems are not yet ready
for critical paths [S20]. Cornell's program teaches a similar progression:
LLM intuition, RAG grounding, tools and memory, agentic protocols, then
governance and human oversight [S14]. LangGraph's graph/checkpoint model and
OpenAI Agents SDK's guardrails, sessions, handoffs, and tracing show the same
engineering direction: make agent execution explicit, resumable, inspectable,
and interruptible [S10] [S11] [S35].

### 3. Security has shifted from model quality to control

The most important controls are outside the model: distinct agent identities,
least privilege, scoped short-lived credentials, deny-by-default tool access,
runtime authorization gates, human approval for irreversible actions, immutable
audit trails, and continuous monitoring [S18] [S19] [S23] [S24] [S25] [S26].
The system prompt is not an authorization boundary. Prompt injection becomes a
privilege-escalation issue when the agent holds real credentials or can call
write-capable tools [S23].

### 4. Adoption is running ahead of governance

Industry sources report fast adoption but uneven controls. Gravitee's survey
shows a large approval and monitoring gap [S18]. MIT's Index documents missing
safety disclosure and web-conduct standards [S16]. Harvard's agentic-web and
traffic sources show that automated and agentic traffic is becoming a major
internet actor, complicating bot detection, measurement, and human/agent
distinction [S26] [S27].

## Practical recommendations

1. Start with a narrow, high-value workflow; avoid broad autonomous agents until
   controls are mature [S20].
2. Expose tools through MCP where possible, with tool-level metrics,
   authentication, filtering, and readiness checks [S03] [S20].
3. Use A2A or ACP only when independent agents truly need delegation,
   long-running status, or cross-vendor coordination [S04] [S08].
4. Treat each agent as a first-class workload identity with scoped credentials,
   policy decisions outside the model, and per-action audit logs [S18] [S19].
5. Require human approval for deletion, payment, production deploys, external
   sends, privilege changes, and other high-impact actions [S23] [S24].
6. Use a contract/discovery layer such as OSSA plus DUADP when agents must be
   portable, discoverable, signed, and governed across runtimes [S01] [S02].

## Source limitations

Firecrawl was unavailable in this unattended environment because the CLI required
authentication and no API key was configured. Sources were collected with
available read-only web, npm, GitHub, and local repository tools. Some sources
are paywalled or partially summarized by search snippets, especially Harvard
Business Review and some PDFs; these are marked in the reading list.
