# Agentic AI Ecosystem Research Overview

Prepared on June 1, 2026.

## Executive synthesis

The agent ecosystem in early 2026 is converging around a layered stack rather
than a single universal standard. MCP standardizes agent-to-tool and
agent-to-data access; A2A standardizes cross-agent task exchange; AG-UI
standardizes agent-to-frontend interaction; OSSA defines a portable agent
contract; and DUADP addresses decentralized discovery and trust-aware routing
[S01][S02][S19][S21][S23]. This division of responsibilities is important:
agents need connectivity, identity, discovery, deployment, runtime control, and
auditable governance, and no single protocol covers the full lifecycle.

OSSA and DUADP are best understood as infrastructure layers around the
mainstream communication protocols. OSSA is not a framework and not a transport
protocol; it is a manifest/contract format for defining agent identity,
capabilities, tools, autonomy, compliance, governance, and export targets
[S02][S03][S04]. DUADP is the companion discovery layer: it uses DNS/WebFinger,
federation, DIDs, signatures, trust tiers, and MCP/REST surfaces so agents,
skills, and tools can be found across organizational boundaries [S01][S05].
The concise relationship is: OSSA defines the agent; DUADP discovers and
verifies it.

Academic and public-interest research frames this moment as analogous to early
internet standardization. Harvard's Agent Protocols Tech Tree argues that open
protocols reveal what builder communities have working and what behaviors are
being made easy or hard by design [S09][S10]. Cornell's agentic AI curriculum
bridges LLM fundamentals into RAG, tools, memory, multi-agent workflows, MCP,
and governance/security oversight [S07][S08]. MIT's AI Agent Index documents
rapid deployment, higher autonomy, sparse safety disclosures, and missing web
conduct standards across 30 deployed agent systems [S11][S12][S18].

Security evidence shows that adoption is ahead of governance. Gravitee's 2026
survey reports that 81% of teams are beyond planning, only 14.4% have full
security approval for their full agent fleet, 88% report confirmed or suspected
security/privacy incidents, and only about 22% treat agents as independent
identity-bearing entities [S57][S58]. NIST/NCCoE's February 2026 concept paper
responds directly to this gap by exploring how identity, authentication,
authorization, auditing, and non-repudiation standards should apply to software
and AI agents [S59][S60].

## What the ecosystem is about

Agentic AI is moving from single chat interfaces to systems that can perceive a
goal, plan, call tools, coordinate with other agents, preserve memory, and take
actions in external systems. That shift changes the engineering problem from
"generate a good answer" to "control a semi-autonomous actor." MIT Sloan
summarizes the tension: agentic AI is not fully ready for prime time because of
hallucinations, mistakes, prompt injection, and hijacking risk, yet agents are
expected to handle most transactions in many large-scale business processes
within five years [S13].

The practical stack is therefore becoming:

| Layer | Emerging answer | Main question |
| --- | --- | --- |
| Tool/context access | MCP | What systems can the agent use? |
| Agent collaboration | A2A, ACP history, ANP | Which agents can it delegate to? |
| User interaction | AG-UI | How does the human supervise live work? |
| Contract/deployment | OSSA | What is the agent allowed to be and do? |
| Discovery/trust | DUADP, ANP, KYA patterns | How do agents find and verify each other? |
| Runtime governance | NIST/NCCoE, OWASP, control planes | Who authorizes each action? |

## Why OSSA matters

OSSA targets the M x N configuration problem. Without a portable agent
contract, every framework and deployment target needs its own description of
agent identity, tools, model settings, compliance metadata, cost limits,
observability, and lifecycle behavior. The OSSA site claims production
deployments often duplicate 40-60% of agent configuration across platforms and
positions the OSSA YAML manifest as the OpenAPI-like contract for agents
[S02]. The npm package is Apache-2.0, published as `@bluefly/openstandardagents`
v0.5.1, and exports schemas, validators, migration/generation services,
trust/governance services, a CLI, and an MCP server [S04][S06].

OSSA's key contribution is not another message bus. It is the normalized agent
definition: GAID/DID identity, signed manifests, SBOM/provenance hooks, Cedar
policy declarations, human-in-the-loop controls, observability, compliance
metadata, cost controls, and platform exports to LangChain, CrewAI, MCP, npm,
agent skills, Docker, Kubernetes, GitLab Duo, Cursor, Drupal, and other targets
[S02][S03][S04]. In a standards landscape where MCP answers "how does an agent
access tools?" and A2A answers "how do agents exchange tasks?", OSSA answers
"what exactly is this agent, what may it access, and what governance applies?"

## Why DUADP matters

DUADP addresses a separate missing piece: agents cannot collaborate if they
cannot discover each other. The DUADP homepage describes the project as "DNS
for AI agents" with DNS TXT records, WebFinger, federation, gossip propagation,
DID identity, cryptographic signatures, trust tiers, REST endpoints, and 17 MCP
tools for discovery, publishing, validation, federation, identity, governance,
and health [S01]. The npm package `@bluefly/duadp` v0.1.4 is an Apache-2.0
TypeScript SDK with client, server router, validation, crypto, DID resolution,
and conformance exports [S05].

DUADP's strongest architectural idea is that discovery results should be
policy-relevant, not just search results. A GAID provides a portable lookup
handle, WebFinger resolves it to endpoints, the DID document supplies
verification methods, signatures prove integrity, and trust tiers feed policy
decisions [S01][S05]. This maps directly onto the industry security direction:
agents need independent identities, scoped authority, revocation, audit trails,
and provenance before they are allowed to act [S57][S59][S61].

## Strategic observations

1. **Protocols are specializing.** MCP, A2A, AG-UI, OSSA, DUADP, ANP, and ATP
   solve different layers. Treating them as mutually exclusive is a category
   error [S19][S21][S23][S25][S31].
2. **Discovery is becoming a security control.** DUADP, ANP, KYA concepts, and
   NIST's identity work all assume agents must be verified before interaction,
   not merely located [S01][S15][S25][S59].
3. **Frameworks are maturing around state and observability.** LangGraph
   emphasizes state graphs and durable checkpoints; CrewAI emphasizes
   role-based crews and flows; OpenAI Agents SDK emphasizes agents, handoffs,
   guardrails, tracing, and provider flexibility [S33][S37][S38][S40].
4. **Security must be externalized from the model.** OWASP's 2025 guidance
   highlights prompt injection and excessive agency; mitigations require
   least privilege, external authorization, tool scoping, approval gates, and
   full audit trails [S61].
5. **Cost and reliability are architectural concerns.** Production blogs warn
   that multi-agent systems need per-agent spend attribution, loop detection,
   rate limits, budget caps, rollout gates, and observability before scale
   [S50][S55].

## Recommended posture

For organizations adopting agents in 2026, the safest pattern is to define each
agent with a portable contract, publish discoverable metadata, authenticate the
agent as its own non-human identity, constrain every tool and data permission,
evaluate each action outside the model, and record audit evidence for every
delegation and side effect. OSSA plus DUADP is one coherent implementation of
that pattern: OSSA declares the contract and governance surface; DUADP makes
that contract discoverable, verifiable, and routable across a federation
[S01][S02][S04][S05].
