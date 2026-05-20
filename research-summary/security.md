# Security and Governance Research

Prepared: 2026-05-20

## Core risk model

Agent security differs from classic application security because agents choose actions at runtime. A deterministic service has fixed call paths; an agent may select different tools, parameters, and delegation steps depending on user prompts, retrieved context, and model behavior. This makes the blast radius equal to the agent's whole permission set unless every tool call is constrained by identity, authorization, policy, and monitoring [S20][S22].

The main risks are:

- Prompt injection and indirect prompt injection through web pages, documents, emails, tickets, or tool outputs.
- Excessive permissions and "default permit" tool catalogs.
- Hallucinated tool calls or fabricated APIs.
- Irreversible or high-impact actions without human approval.
- Memory poisoning and cross-session contamination.
- Data leakage across agents, tools, contexts, or vendors.
- Cost attacks from loops, retries, or denial-of-wallet behavior.
- Agent impersonation, missing provenance, and weak non-human identity controls.
- Multi-agent cascading failures, collusion, or delegated misuse [S17][S20][S21][S22][S26][S27].

## Gravitee 2026 security statistics

Gravitee's State of AI Agent Security 2026 report surveyed more than 900 executives and technical practitioners and found a major gap between adoption and governance [S17].

Key findings:

| Metric | Finding |
| --- | --- |
| Teams beyond planning | 81% |
| Technical teams in active testing or production | 80.9% |
| Organizations with full security/IT approval | 14.4% |
| Confirmed or suspected incidents | 88% |
| Healthcare incident rate | 92.7% |
| Agents actively monitored or secured | 47.1% average |
| Teams treating agents as independent identities | 21.9% |
| Teams using shared API keys for agent-to-agent auth | 45.6% |
| Teams using custom hardcoded authorization logic | 27.2% |

The strongest conclusion is that agent security cannot be bolted on through periodic review. Agents need continuous, identity-aware enforcement and first-class audit trails [S17].

## NIST/NCCoE: identity and authorization

NIST/NCCoE's February 2026 concept paper proposes a project focused on applying identity standards and best practices to software agents and agentic AI [S21].

The project scope asks for input on:

- Current and planned AI agent use cases.
- Unique challenges compared with traditional software.
- Current or emerging identity and access-management standards.
- Technologies used to support AI agents.
- Identification, authorization, auditing, and non-repudiation.
- Controls to prevent and mitigate prompt injection [S21].

The significance is that federal guidance is moving toward concrete non-human identity architecture. This aligns with OSSA/DUADP's DID, GAID, signature, trust-tier, and Cedar policy model [S01][S02][S03].

## OWASP guidance

OWASP's Agentic AI Threats and Mitigations guidance treats agentic AI as a threat-model problem for autonomous systems powered by LLMs and generative AI [S22].

OWASP's broader GenAI security resources emphasize:

- Prompt injection as a primary risk.
- Excessive agency and autonomy without oversight.
- Tool abuse and privilege escalation.
- Memory and context poisoning.
- High-impact action abuse.
- Cascading failures in multi-agent systems.
- Cost exhaustion and denial-of-wallet attacks [S22].

Recommended controls include least privilege, explicit authorization, input validation, memory protection, approval thresholds, and monitoring. These overlap heavily with NIST and practitioner guidance [S20][S21][S22].

## Practitioner security architecture

The Dev.to production security guide provides a practical architecture for secure agent tool calls [S20].

The proposed model includes:

1. **Unique agent identity.** Every agent instance has an agent ID, type, version, owner, environment, expiration, allowed tools, denied tools, and maximum session limits.
2. **Short-lived credentials.** Credentials should expire in minutes or hours, be scoped to required tools, and be tied to specific sessions.
3. **Delegated authorization.** Agents acting for users should use OAuth 2.1/PKCE or equivalent scoped consent flows.
4. **Tool gateway.** Every tool call passes through a policy enforcement point with authentication, authorization, rate limits, parameter validation, approval flows, and audit logging.
5. **Human-in-the-loop risk matrix.** Low-risk actions can auto-approve, medium-risk actions can proceed with review, high-risk actions require synchronous approval, and critical actions are blocked.
6. **Defense in depth.** Input filtering before the agent, tool-call validation at the gateway, output filtering after the agent, behavioral anomaly detection, kill switches, and immutable logs [S20].

This architecture maps cleanly to MCP servers as tool security boundaries, OSSA manifests as policy declarations, and DUADP/NIST identity work as discovery and IAM layers [S01][S02][S04][S20][S21].

## MIT and academic risk findings

MIT's 2025 AI Agent Index found that safety transparency lags behind capabilities. Only 4 of 13 frontier-autonomy agents disclosed any agentic safety evaluations; 25 of 30 agents disclosed no internal safety results; and 23 of 30 had no third-party testing information [S14].

MIT also found unsettled web conduct standards. Browser agents may ignore robots.txt or bypass anti-bot systems, and only one indexed agent used cryptographic request signing [S14]. This is a direct governance gap for the agentic web.

Recent academic security surveys identify a broader autonomy-induced threat surface:

- Memory poisoning.
- Tool misuse.
- Reward hacking.
- Deferred decision hazards.
- Irreversible tool chains.
- Protocol vulnerabilities in MCP, ACP, A2A, ANP, and other inter-agent systems.
- Multi-agent risks such as collusion, coordinated attacks, and systemic propagation [S26][S27].

## Identity and trust architecture

A robust agent security model should treat agents as first-class non-human identities:

- **Identity:** Each agent has a stable identifier, cryptographic key, owner, version, and deployment environment.
- **Delegation:** The system records the human, organization, or upstream process that authorized the agent to act.
- **Authorization:** Tool access is explicit, contextual, time-bound, and least-privilege.
- **Provenance:** Manifests, tool schemas, SBOMs, and runtime actions are signed or tamper-evident.
- **Discovery trust:** Discovery results include trust tiers, signatures, revocation state, and federation witnesses.
- **Auditability:** Logs distinguish human actions from agent actions and can reconstruct each tool decision.
- **Revocation:** A compromised identity can be revoked across registries and federation peers [S01][S02][S03][S17][S20][S21][S24].

OSSA and DUADP directly support this architecture through signed manifests, GAIDs, DIDs, Cedar policies, trust tiers, evidence APIs, and revocation/federation concepts [S01][S02][S03].

## Governance controls

Recommended controls for production or regulated agents:

| Control area | Minimum requirement |
| --- | --- |
| Identity | Unique agent ID, owner, version, environment, expiry. |
| Credentials | Short-lived, scoped, no shared API keys. |
| Tool access | Default deny, allowlisted tools, parameter schemas. |
| Authorization | Policy engine before tool execution. |
| Human approval | Required for irreversible or high-impact actions. |
| Context | Filter untrusted content and classify sensitive data. |
| Memory | Bound session scope; protect and expire memory. |
| Observability | Trace prompts, decisions, tools, cost, latency, outputs. |
| Audit | Immutable, tamper-evident logs with agent identity. |
| Cost | Budgets, max iterations, retry limits, denial-of-wallet detection. |
| Testing | Red-team prompt injection, tool misuse, and protocol abuse. |
| Incident response | Kill switch, credential revocation, federation revocation. |

## Web governance and KYA

Harvard JOLT's agentic web analysis argues that agents must identify themselves transparently, but that identity should not be trapped inside proprietary platform systems. Portable credentials, verifiable delegation, and auditability can create "Know Your Agent" standards analogous to KYC in finance [S24].

A minimum KYA standard would answer:

- Who is this agent?
- Who authorized it?
- What capabilities and tools does it have?
- What scope and limits apply?
- Can its authority be revoked?
- What evidence proves it stayed inside mandate?

This KYA model is consistent with NIST/NCCoE's identity project and with OSSA/DUADP's agent identity and discovery architecture [S01][S02][S21][S24].

## Security conclusions

1. Agents must not inherit broad service-account permissions.
2. Shared API keys are a primary anti-pattern.
3. Every tool call needs policy enforcement before execution.
4. Human approval is not a temporary crutch; it is a governance control for high-risk actions.
5. Discovery without trust evidence is unsafe at scale.
6. Protocols should carry identity, delegation, revocation, and audit metadata, not only payloads.
7. The ecosystem needs standard safety disclosures and third-party testing, because current transparency is insufficient [S14][S17][S21].
