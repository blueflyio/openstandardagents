# Agentic AI Landscape Research Summary

Prepared: 2026-05-20

## Executive synthesis

Agentic AI is moving from demos into production infrastructure, but the ecosystem is still at the "rough consensus and running code" stage. The most important pattern is protocol layering: MCP connects agents to tools and data, A2A and ACP connect agents to other agents, AG-UI connects agents to user interfaces, and discovery/identity proposals such as DUADP, OSSA, ANP, and NIST's agent identity work try to make agents findable, governable, and accountable [S01][S02][S04][S05][S06][S08][S09][S21].

OSSA and DUADP should be understood as complementary infrastructure, not another agent framework. OSSA defines a portable agent contract: identity, capabilities, governance, lifecycle, cost, compliance, and export targets. DUADP defines the discovery layer: federated DNS/WebFinger-style lookup, gossip federation, DID-backed identity, GAIDs, and policy-aware trust tiers. In short: OSSA defines what an agent is; DUADP helps agents find and verify it [S01][S02][S03].

The main risk is that autonomy is arriving before governance. MIT's 2025 AI Agent Index found accelerating releases, rising autonomy, a transparency gap in safety disclosures, unsettled web-conduct norms, and accountability fragmentation across model providers, scaffolding layers, and deployments [S07]. MIT Sloan's 2026 guidance similarly argues that agentic AI is not yet ready for prime time because hallucinations, mistakes, and prompt injection remain material blockers, even though agents are expected to handle many business transactions within five years [S08].

Security research converges on a small set of controls: unique agent identities, least-privilege tool access, short-lived scoped credentials, policy enforcement between the agent and tools, human approval for high-risk actions, immutable audit trails, and continuous monitoring. Gravitee's 2026 survey shows why this is urgent: 81% of teams are past planning, only 14.4% have full security approval, 88% report confirmed or suspected incidents, and only about 22% treat agents as independent identities [S17]. NIST/NCCoE's 2026 concept paper is aligned with that direction, asking the community to define identification, authorization, auditing, non-repudiation, and prompt-injection controls for software and AI agents [S21].

## What the ecosystem is becoming

1. **Protocol stack, not one standard.** No single protocol covers the full lifecycle. MCP is strongest for tools and resources; A2A for peer task delegation; ACP for simple REST-native messaging; AG-UI for frontend event streams; ANP and DUADP for open-network discovery and decentralized identity; OSSA for deployment and governance contracts [S04][S05][S06][S09][S10][S11][S12].

2. **Contracts and manifests are becoming as important as code.** Agent Cards, OSSA manifests, DUADP well-known manifests, ACP metadata, AG-UI event schemas, and MCP tool schemas all express "what can this agent/system do, under what constraints, and how do I call it?" [S02][S03][S05][S06][S09][S10].

3. **Production practice favors narrow agents and progressive autonomy.** Engineering reports from 47Billion argue that simple workflows and tool-using agents are production-ready with guardrails, while open-ended multi-agent systems remain expensive and hard to debug. Their cost examples range from simple workflows at about $0.10-$0.50 per task to open exploratory multi-agent systems at about $2-$5 per task [S18].

4. **Identity is the central security primitive.** The strongest proposals treat agents as non-human identities with their own credentials, trust tiers, revocation, and audit history. This aligns OSSA/DUADP, ANP, NIST, Gravitee, OWASP, and practitioner security guidance [S01][S02][S11][S17][S20][S21][S22].

5. **Web governance is unresolved.** Harvard's APTT frames protocols as the best way to shape agent behavior because agents are easy to build and hard to regulate centrally [S23]. MIT's index notes that browser agents can ignore robots.txt or bypass anti-bot systems, while Harvard JOLT frames the agentic web as a contest between platform-controlled governance and portable protocol-based credentials [S07][S24].

## OSSA and DUADP in the standards map

| Layer | Examples | Primary question | OSSA/DUADP fit |
| --- | --- | --- | --- |
| Tool access | MCP | What tools/data can the agent use? | OSSA can declare MCP servers and exports. |
| Agent communication | A2A, ACP | How do agents coordinate tasks? | OSSA can export Agent Cards and A2A metadata. |
| UI interaction | AG-UI | How does the agent stream state to users? | OSSA can model UI/runtime capabilities; AG-UI handles events. |
| Discovery | DUADP, ANP | How do agents find and verify each other? | DUADP is the direct discovery layer. |
| Contract/governance | OSSA, NIST controls, OWASP guidance | What is the agent allowed to do? | OSSA is the portable contract layer. |

## Recommended interpretation

For builders, the conservative architecture is: define agents and trust boundaries in OSSA; expose tool access through MCP; publish discovery metadata through DUADP and/or A2A Agent Cards; use A2A or ACP for cross-agent task exchange; use AG-UI when humans interact with long-running agents; enforce authorization through a gateway and policy engine before tools execute.

For governance teams, the key decision is whether agents are treated as privileged scripts, shared service accounts, or first-class identities. The evidence strongly supports the third option. Shared API keys, default-permit tool catalogs, unbounded retries, and missing audit logs are recurring failure modes [S17][S20][S21][S22].

For standards work, the highest-value gap is the contract layer between protocols and deployments. MCP, A2A, ACP, and AG-UI describe communication surfaces. OSSA-like manifests, DUADP-like discovery records, and NIST-style identity/authorization profiles describe whether a particular agent should be trusted to use those surfaces in a specific environment.

## Report contents

- `academia.md`: Cornell, Harvard, MIT, NIST, arXiv/ACM-style research, and governance sources.
- `protocols.md`: MCP, A2A, AG-UI, ANP, LangChain Agent Protocol, ACP, OSSA, DUADP, and emerging protocols.
- `frameworks.md`: OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex, GitLab Duo Agent Platform, npm packages, and GitHub projects.
- `security.md`: Security statistics, threat models, identity controls, authorization patterns, governance proposals.
- `blogs.md`: Industry publication synthesis from 47Billion, Ruh.ai, Gravitee, Dev.to, Harvard policy writing, and related engineering sources.
- `reading-list.md`: Source keys and consulted links.

## Limitations

Some business publications and analyst reports, including HBR, McKinsey, Gartner, and some vendor PDFs, were only partially accessible without paywall or form submission. Where direct access was limited, this report favors accessible primary pages, official protocol docs, academic abstracts, and vendor blog summaries with clearly marked source IDs.
