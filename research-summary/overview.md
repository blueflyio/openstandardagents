# Agentic AI Landscape Overview

Compiled on May 19, 2026.

## Executive synthesis

Agentic AI has shifted from prototypes to production infrastructure, but the
ecosystem is still forming its basic interoperability and trust layers. The
most important pattern is specialization by layer: MCP standardizes
agent-to-tool context and tool use, A2A standardizes agent-to-agent task
delegation, AG-UI standardizes agent-to-user interaction, OSSA standardizes the
portable agent contract, and DUADP addresses open discovery for agents, skills,
and tools [S03][S04][S05][S07][S08][S09].

The second pattern is that governance is lagging deployment. MIT's 2025 AI
Agent Index found that 24 of 30 prominent agents launched or received major
agentic updates in 2024-2025, but only 4 of 13 frontier-autonomy agents
disclosed any agentic safety evaluation; 25 of 30 disclosed no internal safety
results [S15]. Gravitee's 2026 survey of more than 900 practitioners found
80.9% of technical teams past planning, only 14.4% with full security approval,
88% with confirmed or suspected incidents, and only 21.9% treating agents as
independent identities [S28].

The third pattern is a move from platform-centric systems to protocol-centric
agent infrastructure. Harvard's Library Innovation Lab frames protocols as an
"x-ray" of builder priorities: they reveal what communities are forced to agree
on and shape which kinds of agents become easy to build [S13]. Harvard JOLT
extends that point into governance: the agentic web may be governed by
proprietary platform rules, or by open protocols for portable identity,
verifiable delegation, auditability, and accountable behavior [S18].

## What OSSA and DUADP are

OSSA, from openstandardagents.org, is not an agent runtime or transport
protocol. It is a portable manifest and contract layer for software agents,
roughly analogous to OpenAPI for REST APIs. A single YAML manifest can declare
identity, capabilities, MCP tools, A2A configuration, lifecycle, compliance,
cost controls, observability, trust metadata, and deployment targets. The npm
package `@bluefly/openstandardagents` is version 0.5.1, published March 28,
2026, with CLI commands such as `ossa init`, `ossa validate`, and `ossa export`
[S01][S25].

DUADP, from duadp.org, is the discovery layer paired with OSSA. It positions
itself as "DNS for AI": agents, skills, and tools publish standard endpoints,
can be found through DNS TXT records and WebFinger, and can federate through a
gossip mesh. DUADP uses W3C DID concepts, Global Agent Identifiers (GAIDs),
signature verification, trust tiers, and governance metadata. The npm package
`@bluefly/duadp` is version 0.1.4, published March 9, 2026, and provides a
TypeScript client, Express router, validation, Ed25519 signing, DID resolution,
and conformance testing [S02][S26].

Together, OSSA and DUADP form a proposed stack: OSSA defines the agent contract,
DUADP discovers and verifies it, and existing runtimes such as Kubernetes,
LangGraph, CrewAI, Claude, OpenAI Agents SDK, Drupal, or GitLab Duo execute it
[S01][S02][S25][S26].

## Architectural map

| Layer | Main standard or project | Role |
| --- | --- | --- |
| Agent contract | OSSA | Portable manifest, compliance, trust, export targets |
| Discovery | DUADP, ANP | Find and verify agents across domains or open networks |
| Tool/context access | MCP | Connect agents to tools, resources, prompts, data |
| Agent collaboration | A2A, ACP | Delegate tasks and exchange messages across agents |
| User interaction | AG-UI | Stream state, messages, tool calls, and HITL events to frontends |
| Runtime/framework | OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex | Build, orchestrate, run, and observe agents |
| Governance/security | NIST, OWASP, Gravitee, MIT Index | Identity, authorization, least privilege, safety evaluation |

## Key opportunities

- Standardized integration can reduce custom connector sprawl. Anthropic
  describes MCP as a replacement for fragmented custom integrations between AI
  systems and enterprise data sources [S03]. Google describes A2A as a way for
  agents from different vendors and frameworks to collaborate securely [S04].
- Contract-first definitions can make governance auditable. OSSA manifests
  consolidate identity, tools, data access, human-in-the-loop controls, cost
  controls, observability, and compliance metadata in a single artifact [S01].
- Discovery and identity are becoming first-class requirements. DUADP and ANP
  both emphasize decentralized identifiers, verifiable capabilities, and
  federation rather than central registries [S02][S09].
- Production practice is converging around constrained autonomy. 47Billion's
  production lessons recommend Level 2-3 workflows for most near-term use cases,
  heavy guardrails for structured multi-agent systems, and human checkpoints for
  regulated or irreversible actions [S27].

## Key challenges

- Safety disclosure and web conduct norms are immature. MIT's 2025 AI Agent
  Index found no established standards for how web agents should behave, and
  noted that some browser agents are designed to bypass anti-bot protections
  [S15][S16].
- Identity is weak in deployed systems. Gravitee reports that most teams still
  rely on shared API keys or hardcoded logic, which undermines attribution and
  non-repudiation when agents create or task other agents [S28].
- Agent security is not only model security. OWASP's LLM01 and LLM06 show how
  prompt injection, excessive functionality, excessive permissions, and
  excessive autonomy can turn valid credentials into damaging actions [S30][S31].
- Evaluation remains hard. The MIT Index argues that layered architectures
  distribute responsibility across model providers, agent builders, tools, and
  deployments, making model-only evaluation insufficient for agentic risks
  [S16].

## Practical recommendations

1. Treat each agent as an identity-bearing principal, not a hidden extension of
   a human user or shared service account [S20][S28].
2. Start with narrow, tool-using workflows before deploying open-ended
   multi-agent autonomy [S27].
3. Use MCP for tool exposure, A2A or ACP only when agent collaboration is a real
   requirement, and AG-UI when the product needs live state, streaming, or
   human approval surfaces [S03][S04][S07][S08].
4. Define agent contracts in a manifest or equivalent source of truth. For OSSA
   adopters, keep the `.ossa.yaml` manifest as the governed artifact and export
   to runtimes from it [S01][S25].
5. Apply complete mediation outside the LLM. Tool calls should be authorized by
   deterministic policy, scoped credentials, allow-lists, approval gates, and
   audit logs [S20][S30][S31].
6. Measure cost, latency, tool-call count, approval rate, safety violations,
   and incident traces from the first pilot [S27][S28].

## Reading path

- For academic and governance context, start with `academia.md`.
- For interoperability standards, read `protocols.md`.
- For implementation options, read `frameworks.md`.
- For threat models and controls, read `security.md`.
- For production lessons from practitioner blogs, read `blogs.md`.
- For citation keys and source limitations, read `reading-list.md`.
