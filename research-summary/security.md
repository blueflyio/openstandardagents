# Security and governance research

Generated on 2026-05-31.

## Executive summary

The core security problem in agentic AI is not only model hallucination. It is control over autonomous software principals that can choose tools, call APIs, delegate work, create other agents, and act faster than human review cycles. Current enterprise security models still treat many agents as human extensions, shared service accounts, or API-key clients, which creates gaps in identity, authorization, attribution, and revocation [S22], [S36].

## Empirical security data

Gravitee's 2026 State of AI Agent Security report surveyed 919 executives and practitioners. Its most important findings are:

- 80.9% of technical teams are past planning and actively testing or running agents [S36].
- Only 14.4% of organizations have full IT/security approval for their entire agent fleet [S36].
- 88% of organizations reported confirmed or suspected AI agent security or privacy incidents within the previous year [S36].
- Healthcare respondents reported a 92.7% confirmed or suspected incident rate [S36].
- Only 21.9% treat AI agents as independent, identity-bearing entities [S36].
- 45.6% rely on shared API keys for agent-to-agent authentication; 44.4% use generic tokens; only 17.8% use mTLS [S36].
- Only 23.7% use an existing IAM/IdP as an authorization server for agentic/MCP infrastructure [S36].
- 57.4% cite insufficient observability, logging, monitoring, or audit trails as a primary security concern when building agents and MCP servers [S36].
- Only 7.7% audit agent activity daily; 37.5% rely on monthly reviews [S36].

MIT's 2025 AI Agent Index adds disclosure evidence:

- Only 4 of 13 high-autonomy agents disclose agentic safety evaluations [S19].
- 25 of 30 disclose no internal safety results, and 23 of 30 have no third-party testing information [S19].
- Web conduct practices are unsettled, with some agents designed to bypass anti-bot protections [S19].

## Threat model

### Prompt injection

Prompt injection is especially dangerous for agents because the LLM decides what action to take. Traditional authentication proves who called an API, but not whether the LLM-selected action is legitimate [S37].

Controls:

- Treat all external language and retrieved content as untrusted data.
- Separate instructions from untrusted content.
- Put a deterministic verification layer between model intent and tool execution.
- Require human approval for high-impact or irreversible actions.
- Log prompt assembly, retrieved documents, tool requests, permission decisions, and execution traces [S37].

### Excessive permissions

Agents often inherit service-account permissions that were designed for backend services, not autonomous decision-makers. A compromised or confused agent with broad database or admin access can exceed its intended scope [S36], [S37].

Controls:

- Least-privilege credentials per agent and per tool.
- Read-only connections by default.
- Scoped API tokens instead of shared broad keys.
- Policy checks before every tool call.
- Revocation and kill switches [S22], [S36], [S37].

### Hallucinated actions and parameters

LLMs can fabricate API calls, tool names, or parameters. Even if the API rejects impossible calls, real functions with fabricated parameters can produce dangerous behavior [S37].

Controls:

- Strict tool allowlists.
- JSON schema validation for every tool input and output.
- Structured errors with machine-readable policy reasons.
- Max iteration and max tool-call counts.
- Low-temperature or deterministic settings for operational workflows [S32], [S37].

### Agent-to-agent delegation and chain-of-command risk

Gravitee found that 25.5% of deployed agents can both create and instruct other agents, while only 24.4% of organizations have full visibility into agent-to-agent interactions [S36]. This creates autonomous authority chains that can bypass human-centric authorization.

Controls:

- Treat agent creation/delegation as privileged actions.
- Require signed manifests or Agent Cards with explicit ownership, scope, and trust tier.
- Enforce policy at the transport/gateway layer before delegation is accepted.
- Capture distributed traces across agent handoffs [S01], [S03], [S07], [S36].

### Web conduct and bot identity

MIT reports no established standards for agent behavior on the web, and Imperva reports automated traffic exceeded 53% of web traffic in 2025 [S19], [S38]. Google is testing Web Bot Auth to give sites cryptographic certainty about bot/agent identity instead of relying on spoofable user-agent strings or IP ranges [S21].

Controls:

- Signed request identity for agents and crawlers.
- Website-side verification of agent signatures and delegated authority.
- Clear robots.txt/terms/access policies for agents.
- Rate limits and behavior-based monitoring [S19], [S21], [S38].

## NIST/NCCoE identity and authorization concept paper

On 2026-02-05, NIST/NCCoE published a concept paper seeking input for a project on applying identity standards and best practices to software and AI agents [S22]. The motivation is direct: AI agents can access diverse data, tools, and applications, and organizations need appropriate identification and authorization controls [S22].

The paper asks for feedback on:

- Agent use cases.
- Unique AI-agent challenges compared with other software.
- Current and emerging identity/access standards.
- Technologies for identification, authorization, auditing, non-repudiation, and prompt-injection mitigation [S22].

The concept paper's most important architectural direction is to treat agents as identities. It references applying standards and best practices, including OAuth-style authorization, policy-based controls, logging, transparency, auditing, and non-repudiation [S22].

## How OSSA and DUADP map to security needs

OSSA directly addresses pre-execution governance:

- It gives each agent a portable manifest.
- It can declare tools, autonomy, compliance requirements, budgets, observability, and HITL points.
- It supports DID/GAID identity, signed manifests, SBOM/provenance pointers, and Cedar policy metadata [S01], [S02].

DUADP addresses discovery-time trust:

- It publishes agents, skills, and tools through standard endpoints.
- It uses DIDs, Ed25519 signatures, trust tiers, and federation metadata.
- It includes validation, signing, verification, DID resolution, and conformance testing in the SDK [S03], [S04].

Together, they provide a path to answer four governance questions before runtime:

1. Which agent is this?
2. Who published it and what evidence backs that claim?
3. What is it allowed to access or do?
4. How can it be discovered, revoked, audited, and constrained?

## Recommended control architecture

1. **Agent manifest**: Require an OSSA-like manifest before deployment. It should include owner, purpose, LLM, tools, autonomy level, data classes, compliance frameworks, cost limits, HITL points, and observability [S01], [S02].
2. **Agent identity**: Assign a unique identity per agent/version/deployment. Avoid shared API keys and inherited human accounts [S22], [S36].
3. **Signed intent envelope**: Before tool execution, verify action, parameters, timestamp, nonce, signature, declared capability, constraints, and revocation status [S37].
4. **Policy enforcement point**: Enforce Cedar/OPA/PBAC/ABAC-style policies outside the LLM. The model can propose; policy decides [S01], [S22], [S37].
5. **Scoped tool credentials**: Use tool-specific and action-specific credentials. Rotate them and revoke compromised agents independently [S36].
6. **Protocol-aware gateway**: Apply identity-aware enforcement to MCP, A2A, and DUADP interactions, not only REST APIs [S03], [S05], [S07], [S36].
7. **Continuous monitoring**: Capture every model call, tool call, policy decision, agent handoff, cost event, and HITL approval with correlation IDs [S32], [S36].
8. **Runtime limits**: Enforce max iterations, budgets, p95/p99 latency budgets, tool-call quotas, and circuit breakers [S32].
9. **Human oversight**: Require approval gates for irreversible, financial, privileged, external-message, and sensitive-data actions [S16], [S20], [S32].
10. **Red-team and regression evaluation**: Test prompt injection, over-permissioning, hallucinated tools, replay, stale credentials, and data exfiltration paths continuously [S19], [S36], [S37].

## Governance recommendations

- Maintain an agent inventory. Spreadsheets become stale; agent registries and discovery endpoints should be part of asset management [S36].
- Make agent ownership explicit. Every agent should have a business owner and an engineering/security owner.
- Require change control for prompts, tools, policies, and manifests.
- Version and pin custom agents and flows, as GitLab's AI Catalog does for stable configurations [S31].
- Adopt progressive autonomy: start with more HITL and reduce only when evidence supports it [S20], [S32].
- Prefer narrow agents over general agents. Narrow scope reduces policy complexity and evaluation ambiguity [S32].
- Publish safety evidence. MIT's Index shows the ecosystem has a safety disclosure gap; organizations should document evals, system cards, red-team results, and incident controls [S19].

## Open issues

- Agent web conduct still lacks settled standards [S19].
- Existing OAuth scopes are often too coarse for per-action agent authorization [S37].
- MCP standardizes connectivity but not full production governance, identity propagation, or adaptive tool budgeting [S32], [S36].
- A2A's adoption is growing, but organizations still need policy models for cross-agent delegation and trust [S07], [S36].
- DUADP and OSSA are promising but early, with low public download/star counts compared with MCP/A2A/AG-UI [S02], [S04].
