# Security and Governance

Research snapshot: June 2, 2026. Citation keys map to `reading-list.md`.

## Executive findings

Agent security has shifted from "will the model say something wrong?" to "what can an autonomous principal actually do?" The highest-risk failure modes are prompt injection, excessive permissions, hallucinated actions, credential misuse, missing agent identity, weak delegation, missing audit trails, and lack of real-time revocation [T13] [T14] [T15] [T31].

The common control theme is runtime enforcement. Prompt instructions can reduce risk, but they cannot be the enforcement boundary. Tool calls, A2A delegations, registry publishing, federation joins, and high-risk actions need deterministic authorization, least privilege, monitoring, and audit logs before and after execution [T14] [T15] [T31].

## Key empirical data

| Source | Finding | Security implication |
|---|---|---|
| MIT AI Agent Index | 24/30 agents launched or received major agentic updates in 2024-2025 [T11] | Deployment velocity is high; governance has less time to mature |
| MIT AI Agent Index | 25/30 disclose no internal safety results; 23/30 have no third-party testing [T11] [T12] | Capability claims outpace independent assurance |
| MIT AI Agent Index | No established web-conduct standards; browser agents may bypass anti-bot systems [T11] [T12] | Agent identity and web traffic policy are unresolved |
| Gravitee | 80.9% of technical teams are testing or running agents in live environments [T15] | Agents are already production infrastructure |
| Gravitee | Only 14.4% have full IT/security approval for the agent fleet [T15] | "Shadow AI" is a central governance gap |
| Gravitee | 88% report confirmed or suspected security/privacy incidents in the previous year [T15] | Incidents are normal, not hypothetical |
| Gravitee | Only 21.9% treat agents as independent identities [T15] | Shared API keys and service accounts undermine attribution |
| Gravitee | 45.6% use API keys and 44.4% use generic tokens for A2A authentication [T15] | Authentication is often coarse and non-attributable |
| Gravitee | 57.4% cite insufficient observability as a primary concern when building agents/MCP servers [T15] | Logging, traceability, and audit trails are underbuilt |

## Threat model

### Prompt injection

Prompt injection exploits the fact that LLMs process instructions and untrusted data in the same language channel. MIT Sloan identifies prompt injection as a primary reason companies are slowing agent adoption and keeping humans in the loop [T13]. Practitioner guides emphasize that prompt injection becomes more dangerous when agents have production write access: a compromised summarizer writes a bad summary, but a compromised tool-using agent can send messages, issue refunds, delete records, or exfiltrate data [T31].

Controls:

- Treat all retrieved content, user input, web pages, emails, documents, and API responses as untrusted.
- Separate instructions from data where possible.
- Require tool-call validation before execution.
- Use human approvals for irreversible or high-risk operations.
- Log retrieved documents, prompt assembly, tool requests, permission decisions, and outcomes [T31].

### Excessive permissions

Many agents run with service accounts or API keys designed for backend services, not autonomous decision makers [T15] [T31]. Gravitee reports that most organizations do not treat agents as first-class identities, and many rely on shared API keys or generic tokens [T15]. This creates broad blast radius: a prompt-injected or hallucinating agent can act within technically valid credentials but outside intended purpose.

Controls:

- Unique identity per agent, deployment, and version.
- Dedicated service accounts with least privilege.
- Tool allowlists and default-deny access.
- Scoped OAuth/OIDC delegation where agents act on behalf of users.
- Explicit policy evaluation for each action, not just coarse authentication [T14] [T15] [T31].

### Hallucinated actions

LLMs can invent nonexistent tools, call existing tools with fabricated parameters, or pursue an action that is not actually justified by the user's goal [T31]. Strict tool schemas help but do not solve authorization. The runtime must validate that the action is both syntactically valid and permitted in context.

Controls:

- Typed schemas for tool inputs and outputs.
- Tool-call validators before execution.
- Monetary, domain, row-level, and rate constraints.
- Guardrails that explain denial reasons in structured form.
- Replayable traces for incident response [T31].

### Invisible delegation and agent chains

Agent-to-agent systems create chains of command. Gravitee reports that 25.5% of deployed agents are capable of both creating and instructing other agents, while only 24.4% of organizations have full visibility into which agents are interacting with others [T15]. A2A and DUADP make inter-agent collaboration easier; governance has to make it accountable.

Controls:

- A2A authorization policies that bind tasks to the initiating principal and allowed purpose.
- Delegation tokens with audience, scope, expiry, and revocation.
- Signed Agent Cards or OSSA manifests.
- Trace IDs across A2A calls, MCP tool calls, and UI approvals.
- Federation policy gates for new peers [T01] [T08] [T14] [T15].

### Web conduct and traffic identity

MIT reports no established standards for how agents should behave on the web and notes that some browser agents bypass anti-bot protections or mimic human browsing [T11] [T12]. Harvard JOLT argues that agentic web governance needs Know Your Agent standards: identity, principal-agent linkage, delegation parameters, and auditability [T20].

Controls:

- Cryptographic agent identity instead of fragile User-Agent strings.
- Machine-readable delegation and purpose.
- Policy-aware access decisions at sites and APIs.
- Separate treatment of human and agent traffic.
- Public web conduct declarations for browser agents [T11] [T12] [T20].

## NIST/NCCoE identity and authorization direction

NIST/NCCoE released a concept paper on February 5, 2026 for "Accelerating the Adoption of Software and Artificial Intelligence Agent Identity and Authorization" [T14]. The paper proposes exploring how existing identity standards and best practices can be applied to AI agents. It asks for input on use cases, challenges, standards, technologies, identification, authorization, auditing, non-repudiation, and controls to prevent or mitigate prompt injection [T14].

The important point is that NIST frames AI agents as software systems that autonomously perform tasks and need access to diverse data sets, tools, and applications. The benefit cannot be realized without applying identification and authorization controls to mitigate risks [T14].

The standards family under discussion includes OAuth 2.0/2.1, OpenID Connect, SPIFFE/SPIRE, SCIM, NGAC, Zero Trust Architecture, Digital Identity Guidelines, token/assertion protection, and MCP [T14]. This suggests that agent identity work is likely to build on enterprise IAM and workload identity rather than replacing them wholesale.

## Governance control model

| Control plane | What it governs | Example implementation |
|---|---|---|
| Identity | Who/what is acting? | DID, workload identity, SPIFFE ID, signed OSSA manifest, DUADP node DID [T01] [T14] |
| Delegation | On whose behalf and for what purpose? | OAuth/OIDC delegated authorization, KYA principal-agent linkage [T14] [T20] |
| Authorization | Is this specific action allowed now? | Cedar/ABAC policies, MCP gateway enforcement, tool-call validators [T02] [T14] [T31] |
| Discovery trust | Can this agent/resource be found and trusted? | DUADP trust tiers, signatures, federation witnesses, revocation mesh [T01] |
| Execution safety | Can the run be bounded? | Max iterations, cost budgets, timeouts, circuit breakers, structured outputs [T19] [T31] |
| Human oversight | When must a person approve? | AG-UI approval events, LangGraph interrupts, CrewAI human inputs, GitLab flows [T07] [T17] [T21] [T27] |
| Observability | What happened and why? | OpenTelemetry traces, A2A trace IDs, audit logs, reasoning escrow, run histories [T15] [T19] [T33] |
| Revocation | How do we stop compromised agents? | Kill switch, credential rotation, DUADP revocation state, denylist propagation [T01] [T31] |

## OSSA/DUADP security relevance

OSSA and DUADP address several gaps identified by MIT, NIST, and Gravitee. OSSA's local README describes W3C DIDs/GAIDs, signed manifests, Cedar policy bounds, NIST control mapping, SBOM/provenance, and observability config [T33]. DUADP provides GAID lookup, WebFinger resolution, DID verification, signature proof, trust tiers, governance endpoints, revocation mesh, and federation witnesses [T01].

This does not mean OSSA/DUADP solve all security problems. They provide structured inputs for enforcement. A deployment still needs policy engines, IAM integration, runtime gateways, monitoring, and operational incident response.

## Recommended baseline for production agents

1. Require a unique agent identity for every deployed agent and version.
2. Store a signed contract/manifest that declares capabilities, tools, trust tier, data classes, autonomy level, budgets, and human approval points.
3. Expose tools through MCP or another gateway that can enforce action-level policy.
4. Use A2A only with signed Agent Cards, scoped delegation, and trace propagation.
5. Put human approvals in the UI/runtime for destructive, financial, external-communication, privilege-changing, or sensitive-data actions.
6. Log every prompt assembly, retrieved context item, tool call, authorization decision, delegation, user approval, and output.
7. Define revocation paths before launch.
8. Monitor costs, iteration counts, tool error rates, denied actions, and unusual peer-agent interactions.
9. Treat browser/web agents as web principals with explicit identity and conduct policies.
10. Run red-team tests for prompt injection, indirect prompt injection, over-permissioning, replay, hallucinated tool calls, and data exfiltration.

## Unresolved gaps

- No mature universal standard for agent identity across human web traffic, API traffic, A2A, MCP, and registries.
- Limited public agent-specific safety evaluations and third-party testing.
- Weak standardization for agent web conduct and robots/CAPTCHA handling.
- Fragmented accountability across model vendors, agent frameworks, orchestration platforms, tool owners, and deploying organizations.
- Cost, latency, and safety trade-offs remain highly workload-specific.
