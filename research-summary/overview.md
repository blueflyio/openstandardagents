# Agentic AI, Protocols, Standards, and Security: Overview

Research current as of 2026-06-10. Source keys such as `[S16]` refer to `reading-list.md`.

## Executive synthesis

Agentic AI is shifting from isolated assistants to networked software actors. The common pattern is simple: an LLM or model router, a control loop, memory or state, tools, and a policy layer. The hard part is no longer building a demo agent; it is making agents discoverable, accountable, interoperable, and safe when they hold credentials and can take actions across enterprise systems.

The ecosystem is converging into layers:

| Layer | Main question | Representative standards |
| --- | --- | --- |
| Tool and context access | What can this agent use? | MCP, ATP |
| Agent-to-agent work exchange | How do agents delegate tasks? | A2A, ACP |
| Agent-to-user interaction | How does an agent stream state into UI? | AG-UI |
| Discovery and identity | How does an agent find and trust another actor? | DUADP, ANP, Agent Cards, DIDs, GAIDs |
| Contract and governance | What is this agent authorized to be and do? | OSSA, Cedar/policy bindings, NIST/NCCoE identity work |

OSSA and DUADP fit into this map as complementary infrastructure, not as replacements for MCP or A2A. OSSA is a portable contract layer for identity, capabilities, governance metadata, validation, and export across runtimes. DUADP is a federated discovery layer that uses DNS/WebFinger/gossip, GAIDs, DIDs, signatures, and trust tiers to help agents find and evaluate published resources [S01], [S02], [S03], [S04].

## What DUADP is

DUADP, the Decentralized Universal AI Discovery Protocol, is best understood as “DNS plus registry plus trust signals for AI agents.” Its public site describes a discovery mesh based on DNS TXT records, WebFinger resolution, gossip federation, DID identity, GAID lookup handles, and policy-aware trust tiers [S01]. The npm package `@bluefly/duadp` provides a TypeScript SDK with a typed client, Express server router, GAID resolution, consolidated inspection, Ed25519 signing/verification, DID resolution, and conformance tests [S02].

DUADP is not the agent runtime. It answers: where is the agent, skill, or tool; what node published it; what trust tier or signature evidence applies; and how can other systems resolve it across organizational boundaries [S01], [S02].

## What OSSA is

OSSA, the Open Standard for Software Agents, is a manifest and validation standard. Its own positioning is explicit: MCP connects agents to tools, A2A connects agents to agents, and OSSA defines the portable contract that describes the agent itself [S03]. The npm package `@bluefly/openstandardagents` ships schemas, a CLI, validator utilities, reference OpenAPI contracts, `.well-known` discovery material, and subpath exports for schema and validation use cases [S04].

In practical terms, OSSA is closer to “OpenAPI for agents” than to a framework. It describes identity, role, tools, capabilities, governance, policy bindings, discovery metadata, and runtime interoperability. That contract can then be exported to platforms such as Docker, Kubernetes, LangChain, CrewAI, GitLab Duo, Claude/Cursor environments, Drupal, MCP, and A2A surfaces [S03], [S04].

## Major findings

1. **Protocols are specializing by boundary.** MCP has become the dominant agent-to-tool/data standard; A2A addresses cross-agent task exchange; AG-UI targets front-end event streams; ANP and DUADP focus on discovery, identity, and agentic-web interconnection; LangChain Agent Protocol standardizes production serving APIs such as runs, threads, and store [S16], [S17], [S19], [S21], [S23].
2. **Academic and policy groups are focused on transparency and governance gaps.** Cornell’s curriculum teaches the full path from LLM behavior and RAG to multi-agent protocols and governance [S05]. Harvard/Berkman Klein treats protocols as a way to shape the agent ecosystem before it hardens [S06], [S07]. MIT’s 2025 AI Agent Index shows that deployed agents expose far more capability information than safety information [S09], [S11].
3. **Security is behind adoption.** Gravitee reports that 80.9% of technical teams are past planning, yet only 14.4% have full security approval for the entire agent fleet, 88% report confirmed or suspected incidents, and only 21.9% treat agents as independent identities [S38], [S39].
4. **Identity and delegation are now first-class standards problems.** NIST/NCCoE’s 2026 concept paper frames AI agents as software actors needing identification, authorization, auditing, non-repudiation, and prompt-injection controls, using existing standards such as OAuth, OIDC, SPIFFE/SPIRE, SCIM, NGAC, zero trust, and MCP where possible [S15].
5. **Framework maturity is high, but governance is uneven.** CrewAI, AutoGen, LlamaIndex, LangGraph, and OpenAI Agents SDK all have substantial adoption, but each optimizes a different architecture. None removes the need for scoped credentials, runtime policy enforcement, observability, evaluation, and human approval on high-impact actions [S27], [S28], [S29], [S30], [S31], [S36].

## Practical architecture recommendation

A production agent architecture in 2026 should avoid treating any single protocol or framework as sufficient. A defensible stack looks like this:

1. **Define the agent contract.** Use a portable manifest layer for identity, role, tools, permissions, cost bounds, governance metadata, and human approval rules. OSSA is directly designed for this layer [S03], [S04].
2. **Expose tools through typed, policy-enforced interfaces.** MCP is the default for tool/data access; ATP is an emerging code-execution alternative for API aggregation and sandboxed programmatic work [S16], [S26].
3. **Use A2A or ACP only when agents really need peer delegation.** Avoid multi-agent complexity until there is a bounded workflow, clear ownership, and observability [S17], [S24], [S36].
4. **Separate UI events from task exchange.** Use AG-UI-style event streams when the problem is front-end state, progress, tool-call display, or user intervention [S19].
5. **Give each agent an identity.** Avoid shared API keys. Use distinct agent/workload identity, delegated user authorization, short-lived tokens, least privilege, and audit trails [S15], [S38], [S40].
6. **Use discovery with trust evidence.** DUADP and ANP point toward a future where agents publish resolvable identities, capabilities, signatures, and provenance instead of being found through ad hoc registries [S01], [S21].
7. **Instrument and gate side effects.** Trace every step, enforce schema validation, add circuit breakers and budgets, and require human approval for irreversible operations [S36], [S40], [S41], [S42].

## Open gaps

- **No universal web-conduct standard exists.** MIT’s index explicitly finds no established standards for how agents should behave on the web, and many agents do not disclose web access, robots.txt, CAPTCHA, or safety practices [S09], [S11].
- **Multi-hop delegation remains unresolved.** NIST frames delegation and accountability as core questions; token chains and capability-token proposals are emerging but not broadly standardized [S15].
- **Protocol security is immature.** MCP simplifies integrations but introduces tool poisoning, name squatting, prompt injection, and confused-deputy risks if hosts trust tool metadata or grant broad authority [S13], [S41], [S42].
- **Agent traffic economics are unsettled.** Human/bot traffic is nearing parity, agentic traffic is growing quickly, and proposals such as HTTP Agent Profile are emerging for cryptographic agent authentication and payment-aware access [S43], [S44], [S45].

## Bottom line

The agent ecosystem resembles an early internet moment because the permanent shape is not settled. The safest and most interoperable path is layered: MCP/A2A/AG-UI for communication boundaries, OSSA for portable agent contracts and governance, DUADP/ANP-style discovery and identity for the agentic web, and NIST/OWASP-aligned runtime controls for security. Teams should build small, bounded, observable workflows first, and only increase autonomy when identity, authorization, cost limits, evaluation, and human override are in place.
