# Overview: agentic AI protocols, standards, frameworks, and security

Generated: 2026-05-29.

## Executive synthesis

Agentic AI is shifting from single-chat assistants to systems that plan, call
tools, coordinate with other agents, and act across enterprise systems. The
sources reviewed show the same core pattern: no single protocol is becoming
"the agent standard." Instead, a layered stack is emerging. MCP connects agents
to tools and data, A2A and ACP connect agents to other agents, AG-UI connects
agents to human-facing applications, and identity/discovery layers such as ANP,
DUADP, KYA, and NIST's agent identity work try to make those interactions
governable [S18][S20][S23][S25][S29][S12].

The ecosystem resembles early web infrastructure. Harvard LIL's Agent Protocols
Tech Tree argues that open protocols reveal what builders have made interoperable
and what they think matters; protocols also shape which agent behaviors become
easy to build [S07][S08]. MIT's 2025 AI Agent Index adds a warning: autonomy is
rising faster than safety and transparency disclosures. Of 30 deployed agents,
25 disclosed no internal safety results, 23 disclosed no third-party testing,
and web-conduct norms remain unsettled [S09].

The central production gap is not "can an agent act?" It is "can a system prove
which agent acted, with whose authority, under which policy, and with what
audit trail?" Gravitee's 2026 survey found that 81 percent of teams are beyond
planning, but only 14.4 percent have full security approval for their agent
fleet; 88 percent reported confirmed or suspected incidents; and only 21.9
percent treat agents as independent identities [S49][S50]. NIST NCCoE's 2026
concept paper directly targets this gap by asking how OAuth, OIDC, SPIFFE/SPIRE,
SCIM, NGAC, MCP, auditing, non-repudiation, and prompt-injection controls should
apply to software and AI agents [S12].

## What DUADP and OSSA are

OSSA, the Open Standard for Software Agents, is best understood as an agent
contract and portability layer. It is not positioned as a communication protocol
like MCP/A2A or as a runtime framework like LangGraph/CrewAI. It defines a
schema-validated agent manifest that can be exported to deployment targets such
as Docker, Kubernetes, LangChain, CrewAI, Claude-style skills, GitLab Duo Agent
Platform, MCP, A2A, and npm packaging [S02][S03][S04]. The OSSA homepage frames
the gap as the "M x N problem": every framework and platform has its own agent
configuration, so a portable manifest reduces duplicated configuration and
keeps governance metadata in one artifact [S02].

DUADP, the Decentralized Universal AI Discovery Protocol, is the discovery layer
that complements OSSA. It describes itself as "DNS for AI agents": DNS TXT
records, WebFinger, a federated gossip mesh, DIDs, GAIDs, signature verification,
trust tiers, and policy inputs help agents find each other without a central
broker [S01][S05]. DUADP exposes REST endpoints and 17 MCP tools for discovery,
search, publishing, validation, federation, governance, identity, and health
[S01]. In the BlueFly stack, OSSA defines the agent contract and DUADP discovers
that contract across the open web [S01][S03].

The npm packages reflect that split. `@bluefly/openstandardagents` v0.5.1 is an
Apache-2.0 TypeScript package with `ossa`, `ossa-dev`, `ossa-version`,
`ossa-validate-all`, and `ossa-mcp` binaries. Its npm description says it is an
infrastructure bridge between protocols and deployment platforms [S04].
`@bluefly/duadp` v0.1.4 is an Apache-2.0 TypeScript SDK/CLI for discovery and
federation, with `duadp` as its binary and dependencies for JSON schema
validation, YAML, canonicalization, and DID resolution [S05].

## Emerging stack model

| Layer | Representative standards | What it answers |
| --- | --- | --- |
| Agent contract | OSSA, KYA-style manifests | What is this agent, what can it do, who governs it? [S02][S11] |
| Discovery and identity | DUADP, ANP, DIDs, WebFinger, SPIFFE/SPIRE | How is the agent found and authenticated? [S01][S25][S12] |
| Tool and context access | MCP, ATP | What tools/data can the agent invoke? [S18][S31] |
| Agent coordination | A2A, ACP, LangChain Agent Protocol | How do agents delegate work and maintain task state? [S20][S29][S27] |
| User interaction | AG-UI | How do humans see, guide, and approve agent work? [S23] |
| Runtime/framework | OpenAI Agents SDK, LangGraph, CrewAI, LlamaIndex, Microsoft Agent Framework | How are workflows implemented and operated? [S33][S36][S38][S41][S40] |
| Governance/security | NIST NCCoE, OWASP, Gravitee, CSA-style controls | How are identity, authorization, risk, and incidents controlled? [S12][S52][S49] |

## Key opportunities

- Standardize at boundaries, not inside every agent. MCP, A2A, ACP, AG-UI,
  DUADP, and OSSA each cover a different boundary. Treating them as substitutes
  leads to confusion; treating them as layers gives a migration path [S21][S47].
- Move identity before execution. Agent identity should be established before
  a tool call, delegation, or financial/data action. DIDs, SPIFFE/SPIRE, OIDC,
  and signed manifests are converging on the need for agent-specific principals
  rather than inherited human credentials [S01][S12][S25][S49].
- Use manifests as governance surfaces. Portable manifests can carry tool
  scopes, trust tiers, cost budgets, SBOM/provenance, human-in-the-loop
  thresholds, and compliance metadata [S02][S03].
- Design for observability from the first workflow. Production sources call for
  per-tool latency, task traces, audit logs, policy decisions, and structured
  errors rather than opaque model transcripts [S36][S45][S56].

## Key risks

- Prompt injection remains a category-level vulnerability. OpenAI, OWASP, and
  academic work recommend constraining blast radius instead of assuming perfect
  detection [S57][S52][S13].
- Excessive agency turns ordinary LLM errors into operational incidents. OWASP
  defines excessive agency as damaging actions caused by excess functionality,
  permissions, or autonomy, often triggered by hallucinations or direct/indirect
  prompt injection [S53].
- Identity is underdeveloped. Gravitee found widespread use of shared API keys
  and service accounts; NIST is now scoping a demonstration project for agent
  identity and authorization [S49][S12].
- Web-conduct norms are not settled. MIT found most agents do not clearly state
  robots.txt/CAPTCHA/web access behavior; Harvard JOLT and bot-traffic reports
  argue that AI agents need portable identity and governance to avoid crowding
  out human web activity [S09][S11][S54][S55].

## Recommended operating posture

1. For new production agents, define a portable contract first: owner, purpose,
   data classes, allowed actions, tools, budgets, approval thresholds, identity,
   and revocation path.
2. Use MCP for agent-to-tool integration, but wrap it with identity-aware
   routing, least privilege, tool filtering, structured errors, and audit logs
   [S18][S56].
3. Add A2A or ACP only when agent-to-agent delegation crosses runtime, team, or
   vendor boundaries [S21][S29].
4. Use AG-UI or an equivalent event stream when a human needs progress,
   tool-call visibility, state changes, or approvals in real time [S23][S47].
5. Treat each deployed agent as a non-human identity with lifecycle management,
   revocation, monitoring, and incident response [S12][S49][S58].
