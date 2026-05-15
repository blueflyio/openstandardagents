# Agentic AI, Protocols, Standards, and Security: Overview

Prepared: May 15, 2026.

This report uses tether citation IDs such as `[T01]`; the full bibliography is in
`reading-list.md`.

## Executive synthesis

Agentic AI is moving from demos into infrastructure, but the ecosystem is still
standardizing its basic contracts. The strongest pattern across the sources is a
layered stack: MCP connects agents to tools and data, A2A and related protocols
connect agents to other agents, AG-UI connects agents to front ends, DUADP adds
federated discovery, and OSSA defines a portable agent contract with identity,
capability, governance, and export metadata [T05][T07][T09][T20][T21].

The near-term opportunity is interoperability. Organizations that adopt open
protocols can avoid custom M x N integrations, reduce vendor lock-in, and make
agent behavior observable across tool, agent, UI, and deployment boundaries
[T06][T23][T24]. The near-term risk is governance lag: agents are already
deployed with production permissions, while identity, authorization, auditing,
and safety disclosure are immature [T04][T18][T19].

## What DUADP and OSSA are

DUADP, the Decentralized Universal AI Discovery Protocol, is best understood as
the discovery layer for an open agent ecosystem. Its site describes the problem
as "no DNS for AI" and positions DUADP as a federated discovery mesh that uses
DNS TXT records, WebFinger, gossip federation, GAID identifiers, W3C DID-style
identity, Ed25519 signatures, trust tiers, and MCP/REST interfaces so agents,
skills, and tools can be published and found across domains [T20][T21].

OSSA, the Open Standard for Software Agents, is best understood as the contract
layer. Its website and package metadata describe a vendor-neutral YAML/JSON
manifest standard for defining what an agent is, what it may access, which
policies govern it, and how it exports to platforms such as MCP, A2A, LangChain,
CrewAI, Docker, Kubernetes, GitLab Duo, Claude Code, Cursor, Drupal, and npm
[T22][T23][T24]. OSSA explicitly says it does not replace MCP or A2A; instead,
it gives agents a portable contract that can reference those protocols [T22].

The npm packages line up with those roles. `@bluefly/openstandardagents` version
0.5.1 is the OSSA CLI/SDK package for validating, generating, migrating, and
exporting agent manifests; `@bluefly/duadp` version 0.1.4 is the TypeScript SDK
for discovery, publishing, validation, federation, DID resolution, and protocol
conformance [T52][T53]. In short: OSSA defines the agent; DUADP helps the
network discover, verify, and federate that definition.

## Main themes

### 1. Protocols are replacing bespoke integrations

Anthropic's MCP announcement framed the integration problem clearly: every data
source formerly required custom connectors, while MCP offers an open standard
for secure two-way connections between AI applications and data/tool servers
[T05]. Google's A2A launch makes the complementary case for inter-agent
coordination across vendors, frameworks, and enterprise systems [T07]. CopilotKit
then frames AG-UI as the missing user-facing stream between agent backends and
front-end state [T09].

The result is not one dominant protocol yet. It is a layered protocol map:

- tool and context access: MCP [T05][T06]
- agent-to-agent tasks: A2A and, historically, ACP [T07][T08][T13]
- UI/event streams: AG-UI [T09][T10]
- discovery and identity: DUADP and ANP [T11][T20]
- portable contracts: OSSA and LangChain Agent Protocol-style serving APIs
  [T12][T22]

### 2. Academic and policy work emphasizes transparency gaps

Cornell's agentic AI certificate teaches a practical arc from LLM intuition to
RAG, tool-using agents, multi-agent workflows, MCP, governance, security, and
human oversight [T01]. Harvard's Agent Protocols Tech Tree argues that protocols
matter because agents are simple to recreate and hard to govern through a single
company or state [T02]. MIT's 2025 AI Agent Index documents 30 deployed systems
and finds accelerated releases, thin public safety disclosure, fragmented
accountability, concentration around a few foundation model families, and
unsettled web-conduct norms [T03][T16].

### 3. Production guidance converges on scoped autonomy

MIT Sloan's 2026 guidance says agentic AI is "not ready for prime time" because
hallucinations, mistakes, prompt injection, and human oversight still limit
fully autonomous use, but it expects agents to handle most transactions in many
large-scale business processes within five years [T17]. The 47Billion production
case study reaches a similar engineering conclusion: simple workflows and
tool-using agents are production-ready with validation, cost limits, fallback
paths, and human gates; open-ended multi-agent systems remain risky for critical
paths [T25].

### 4. Security is now an identity and authorization problem

Gravitee's 2026 survey of 919 executives and practitioners reports that 80.9%
of technical teams are beyond planning, only 14.4% have full security approval
for all deployed agents, 88% report confirmed or suspected incidents, and only
21.9% treat agents as independent identities [T18][T19]. NIST/NCCoE's February
2026 concept paper and CAISI initiative are therefore well-timed: both ask how
identity, authorization, auditing, non-repudiation, and prompt-injection
mitigations should apply to software and AI agents [T14][T15].

## Practical implications

1. Treat agents as first-class principals. Give every agent and agent instance a
   unique identity, scoped credentials, short-lived sessions, and auditable tool
   calls [T14][T19][T27].
2. Separate protocol layers. Use MCP for tool access, A2A/ACP-style interfaces
   for agent coordination, AG-UI for front-end streams, and discovery/contract
   layers such as DUADP and OSSA where portable governance is needed
   [T05][T07][T09][T20][T22].
3. Start with constrained workflows. The most credible production sources
   recommend prompt chains, structured workflows, and tool-using agents before
   open-ended multi-agent autonomy [T17][T25].
4. Make observability mandatory. Record identity, prompt/input sources, tool
   calls, policy decisions, costs, and traces so incidents can be reconstructed
   [T18][T27][T28].
5. Use human approval for irreversible actions. Destructive writes, external
   communications, permission changes, and high-cost operations should require
   explicit approval or policy gates [T06][T25][T27][T28].

## Important limitations

Some figures come from vendor-sponsored or consultancy publications rather than
peer-reviewed research; they are useful indicators but should not be treated as
neutral population estimates [T18][T25][T26]. Some pages, including OSSA's
website, show v0.5.0 while npm metadata reports `@bluefly/openstandardagents`
v0.5.1; this report uses npm metadata for package versioning and website
content for protocol positioning [T22][T52].
