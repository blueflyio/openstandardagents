  
**OPEN STANDARD AGENTS (OSSA)**

NIST CAISI AI Agent Standards Initiative — Project Submission

| Submitting Organization | BlueFly.io / Open Standard Agents (OSSA) |
| :---- | :---- |
| Contact | Thomas Scola — thomas@openstandardagents.org |
| Initiative | NIST CAISI AI Agent Standards Initiative (Feb. 17, 2026\) |
| Response Also Covers | CAISI RFI (Docket NIST-2025-0035) — Deadline March 9, 2026 |
| Submission Date | March 5, 2026 |
| OSSA Specification | v0.4 — https://openstandardagents.org/spec/v0.4 |
| npm Package | @bluefly/openstandardagents — npmjs.com |
| License | MIT Open Source |

**Executive Summary**

**Thomas Scola** submits this response in support of the CAISI initiative on behalf of the Open Standard for Software Agents (OSSA), an open-source, schema-driven specification for interoperable, secure AI agents.

Thomas Scola is a technologist, open-source architect, and AI infrastructure strategist with over two decades at the intersection of government-grade platforms and community-driven innovation. He is the founder of the BlueFly.io Collective — a distributed team of 70+ global professionals — and a Customer Success Architect at GitLab, where he holds eight professional certifications and advises GitLab’s largest enterprise and government customers on DevSecOps strategy, agentic AI adoption, and secure software delivery.

Thomas has been a core contributor to Drupal since 2003 — one of the most widely deployed open-source platforms powering government and enterprise digital infrastructure worldwide. His years at Acquia, Drupal’s primary commercial steward, sharpened his expertise in cloud-native architecture, compliance frameworks, and the operational realities of delivering secure, scalable platforms at federal scale.

At GitLab, Thomas works at the frontier of agentic AI — helping the world’s most complex organizations adopt GitLab Duo, GitLab’s AI-native development platform, build agent management capabilities, and integrate autonomous workflows safely into regulated pipelines. It is this firsthand experience — watching agents fail at the boundaries of trust, authorization, and interoperability — that drove him to act.

Thomas created the Open Standard Agents (OSSA) specification because no production-ready, open-source standard existed to govern how AI agents identify themselves, request authorization, declare their capabilities, and behave safely across organizational boundaries. OSSA is his answer to that gap — and this submission to NIST CAISI is his commitment to ensuring that answer becomes a public good.

OSSA v0.4 is the first agent specification to natively combine W3C Decentralized Identifiers (DIDs), Cedar (Amazon's formally verified policy language) for pre-execution authorization, cryptographic manifest attestation, and machine-readable resource governance in one composable schema. OSSA aligns with the NIST AI Risk Management Framework (AI RMF) 1.0 and maps to NIST SP 800-53 Rev. 5 control families (AC, AU, SC, IA) for federal deployment.

We offer OSSA as a concrete, production-ready reference implementation for federal AI agent security frameworks. This document addresses RFI priority questions 1a, 1d, 2a, 2e, 3a, 3b, 4a, 4b, and 4d; and provides a parallel Project Submission Statement for the AI Agent Standards Initiative.

**Part I — Project Submission Statement**

The following statement is submitted for consideration in current NIST CAISI AI agent standards and security activities.

**Submitted Project Assets**

**Project website:** https://openstandardagents.org/

**npm package:** https://www.npmjs.com/package/@bluefly/openstandardagents

**What We Are Submitting**

OSSA is an open, manifest-first approach for defining AI agents once and enabling deployment portability across multiple runtime ecosystems. The submission includes:

* A machine-readable manifest model for agent definitions

* A CLI implementation for validation and developer workflows

* Target export patterns for operational environments

* Public documentation and versioned package distribution

**Current Technical Value**

OSSA is positioned to contribute practical implementation evidence to standards work across four dimensions:

| Dimension | Value Delivered |
| :---- | :---- |
| **Interoperability** | One contract transforms across toolchains and deployment contexts |
| **Portability** | Manifest-driven definitions reduce framework lock-in |
| **Governance Readiness** | Schema and CLI validation create a foundation for auditable controls |
| **Developer Adoption** | npm distribution supports repeatable installation and update paths |

**Alignment with NIST CAISI Priorities (2026)**

* CAISI RFI on securing AI agent systems (announced Jan. 12, 2026; responses due March 9, 2026\) — OSSA provides concrete implementation inputs for threat modeling and control validation.

* CAISI listening sessions on barriers to AI adoption (announced Feb. 20, 2026; registration interest due March 20, 2026\) — OSSA provides ecosystem feedback from implementation experience.

* AI Agent Standards Initiative (announced Feb. 17, 2026; updated Feb. 18, 2026\) — OSSA provides an existing open implementation vehicle for interoperability and trust-oriented standards.

**Proposed Collaboration Scope**

1. Agent identity and authorization metadata for manifests

2. Conformance test fixtures and reproducible validation outputs

3. Secure export mappings across runtime targets

4. Public feedback loops with CAISI/NCCoE activities

**Deliverables**

* D1: OSSA-to-CAISI mapping note (security, interoperability, governance)

* D2: Draft conformance profile and validation fixture set

* D3: Reference implementation updates and documentation

* D4: Pilot report with findings, gaps, and standardization recommendations

**Near-Term Timeline**

| Phase | Activity |
| :---- | :---- |
| **Weeks 1–2** | Submission alignment and requirements mapping |
| **Weeks 3–4** | Conformance and security profile drafting |
| **Weeks 5–6** | Multi-target validation and refinement |
| **Week 7** | Publication of pilot outcomes and proposed next steps |

**Part II — RFI Question Responses (Docket NIST-2025-0035)**

***Question 1a — Agent Identity: Persistent Global Identifier***

How should agent identity be established and maintained across deployments and restarts?

OSSA implements a mandatory Global Agent Identifier (GAID) using W3C DID syntax. The GAID persists across container restarts, framework migrations, and redeployments because it is bound to the agent's registry entry and W3C DID document — not to ephemeral runtime state.

* Syntax: did:ossa:\<uuid\> or did:web:\<host\>:\<path\> (e.g., did:web:openstandardagents.org:agents:content-agent)

* Resolution: The identity extension in every OSSA manifest contains a full W3C DID document conformant to W3C DID Core 1.0. Verifying parties resolve the GAID to obtain verificationMethod, authentication, and serviceEndpoint entries.

* Persistence: The manifest is the source of truth. Registries (including UADP-compliant nodes) store and serve the manifest; the GAID remains immutable for the lifetime of that identity. Revocation is explicit, not implicit.

| Recommendation: *NIST should mandate that federal AI agents have a persistent, globally resolvable identifier (GAID) that survives restarts and redeployments, with resolution via a standard such as W3C DID Core.* |
| :---- |

***Question 1d — Revocation and Identity Lifecycle***

How should agent identity be revoked or invalidated?

OSSA and its Universal Agent Discovery Protocol (UADP) support immediate, auditable revocation via four mechanisms:

5. Registry-level revocation: PUT /registry/revoke/{agentId} marks the agent revoked and excludes it from discovery by default.

6. Event-driven notification: UADP emits a uadp.agents.revoked event (AsyncAPI 3.0) so consumers receive revocation updates in real time without polling.

7. DID document signal: A revoked: true flag on the relevant VerificationMethod, or a dedicated CredentialRegistry serviceEndpoint, allows DID resolvers to return revocation status.

8. Auditability: Revocation events include agentId, timestamp, and optional revokedBy (DID of the revoking principal).

| Recommendation: *NIST should require revocation endpoints conforming to W3C DID Core CredentialRegistry conventions and mandate real-time revocation propagation (e.g., event streams) so cached credentials and discovery results can be invalidated promptly.* |
| :---- |

***Question 2a — Authorization Model and Pre-Authorization***

What authorization model should apply to agent actions?

OSSA uses Cedar (Amazon's formally verified policy language) for authorization. Every tool invocation is pre-authorized: the compliance engine evaluates principal (agent DID), action, and resource against Cedar policies before tool execution. There is no 'run first, audit later' path for sensitive operations.

* Principal hierarchy: Human user (session/OAuth) → Orchestrator Agent (tier\_3\_write\_elevated) → Worker Agents (tier\_1\_read, tier\_2\_write\_limited) → tool calls. The originating principal DID is carried through the chain and logged.

* Tier taxonomy: OSSA defines four tiers (see Exhibit C). Each tier maps to a capability set; Cedar policies reference principal.tier and resource attributes.

* Delegation: When Agent A delegates to Agent B, A issues a signed delegation credential (OSSA VC). B presents it with its DID, and Cedar checks both A's policy and delegation scope to prevent privilege escalation.

| Recommendation: *NIST should adopt a formally verified policy language (e.g., Cedar) for high-assurance agent authorization and require pre-authorization before tool execution in federal contexts.* |
| :---- |

***Question 2e — Interoperability of Authorization Across Systems***

How can authorization policies interoperate across organizations or systems?

OSSA enables interoperability through three layered mechanisms:

9. Machine-readable tiers and capabilities: The manifest declares security.tier and security.capabilities. Any system reading the OSSA manifest can map the agent to local policy constructs (e.g., Cedar entities, ABAC attributes).

10. DID as a cross-system principal: The same GAID/DID is used in the OSSA registry, Cedar policies, and A2A delegation. Federated environments can anchor trust to did:web:agency-a.gov and did:web:agency-b.gov, then map DIDs to local roles.

11. A2A extension: The a2a.schema.json extension defines the envelope for agent-to-agent messages, including sender DID and optional delegation credential. Receiving systems can verify credentials and enforce policy based on sender DID and scope.

| Recommendation: *NIST should standardize a minimal agent credential format (e.g., a W3C Verifiable Credentials profile) carrying GAID, scope, and expiry so authorization can interoperate across organizational boundaries without custom integrations.* |
| :---- |

***Question 3a — Tool Disclosure and Attestation***

How should agent tools be disclosed and attested?

OSSA requires declarative tool disclosure in the manifest. Every tool the agent may call is listed with name, description, input/output schema, rate limits, and required capability. There is no implicit or runtime-only tool set. Example manifest entry:

`tools:  - name: execute_drush_command    description: Execute Drush CLI command on Drupal site    parameters: { command: string, site_alias?: string }    rate_limit: 10/minute    requires_capability: write_drupal_site    mcp_resource_uri: mcp://fleet-manager/tools/drush`

* MCP (Model Context Protocol): Tools are exposed via MCP; the MCP server is registry-backed and validated against OpenAPI specs at https://api.blueflyagents.com.

* Attestation: The manifest can be signed (UADP x-signature block). Consumers requiring the verified-signature trust tier accept only agents whose manifest signature verifies.

| Recommendation: *NIST should require that all agent tools be declared in a machine-readable manifest before deployment and that tool-calling endpoints (e.g., MCP) require authentication (mTLS or API key) in federal contexts.* |
| :---- |

***Question 3b — Tool Security and Rate Limiting***

How should tool invocation be secured and constrained?

OSSA addresses tool security through three enforced mechanisms:

12. Pre-authorization: Cedar gates every tool call. Unauthorized calls never reach the tool server.

13. Rate limits in the manifest: Each tool declares rate\_limit (e.g., 10/minute). Platform components enforce these limits; they are not advisory.

14. Input schema validation: Tool parameters are defined with JSON Schema, enabling gateway rejection of invalid or out-of-scope input.

| Recommendation: *NIST should define rate-limit enforcement as a requirement (not optional) and require mutual TLS or equivalent authentication for tool-calling protocols (e.g., MCP) in federal deployments.* |
| :---- |

***Question 4a — Resource and Token Governance***

How should agent resource consumption (e.g., tokens, API calls) be governed?

OSSA's token-efficiency extension enforces resource budgets at the specification level:

* Budgets: max\_tokens\_per\_call, max\_calls\_per\_session, and max\_total\_session\_tokens cap consumption.

* Optimization controls: Optional techniques (caching, compression, redundancy elimination) are declared so deployers can align with cost and safety goals.

* Attribution: Every invocation is logged with agent\_gaid, principal\_did, and token\_count, enabling cost and audit attribution to a principal.

| Recommendation: *NIST should mandate resource budgets in agent specifications for federal deployments and require every invocation to be attributable to a principal (user or agent DID) for audit and cost accounting.* |
| :---- |

***Question 4b — Observability and Audit***

What observability and audit requirements should apply to agent operations?

OSSA implementations (Dragonfly, AgentDash, compliance engine) produce structured audit logs for every agent execution with the following logged fields:

| Log Field | Purpose |
| :---- | :---- |
| **`timestamp / duration_ms`** | Execution timing for SLA and anomaly detection |
| **`agent_gaid`** | Persistent agent identity across deployments |
| **`tool_name`** | Specific tool invoked |
| **`principal_did`** | User or agent initiating the call |
| **`cedar_decision`** | Permit/deny decision and matching policy |
| **`token_count`** | Resource consumption for budget enforcement |
| **`exit_status`** | Success/failure for incident correlation |

Full execution traceability from user principal through agent chain to tool call is maintained. Dragonfly's Reporter Agent publishes to TimescaleDB and AgentDash; failure detection triggers automated GitLab issues and notifications (sub-minute MTTD for regression-class failures).

| Recommendation: *NIST should require structured audit logs for all agent tool invocations in federal deployments, including the authorizing policy decision, and mandate full execution traceability from user principal through agent chain to tool call.* |
| :---- |

***Question 4d — Threat Mitigation and Security Controls***

What threats should agent security frameworks mitigate, and how?

The following threat matrix maps threats to OSSA controls and corresponding NIST SP 800-53 Rev. 5 control families:

| Threat | OSSA Control | NIST 800-53 Family |
| :---- | :---- | :---- |
| Identity spoofing | GAID \+ DID resolution \+ x-signature verification (trust tiers) | IA — Identification & Authentication |
| Privilege escalation | Cedar pre-authorization, tier/capability bounds, scope-limited delegation credentials | AC — Access Control |
| Unbounded resource use | token-efficiency budgets, per-tool rate limits | SC — System & Comms Protection |
| Tool abuse / injection | Declarative tool disclosure, pre-authorization, MCP mTLS | AC, SC |
| Revocation lag | UADP real-time revocation events, registry filtering | IA, AU — Audit & Accountability |
| Audit evasion | Immutable structured logs, principal-attributed per invocation | AU — Audit & Accountability |

| Recommendation: *NIST should align federal agent security requirements with a threat model that includes identity, authorization, resource governance, and revocation, and reference machine-readable controls (e.g., OSCAL) for mapping to NIST SP 800-53 Rev. 5\.* |
| :---- |

**Part III — Additional Technical Context**

**Framework Interoperability**

OSSA has adapters for LangChain, LangGraph, CrewAI, AG2, kagent (K8s), MCP, A2A, and Drupal AI. A common identity layer (GAIDs/DIDs) lets these frameworks resolve the same agent identity across platforms — directly supporting NIST's interoperability mandate.

**Alignment with NIST AI RMF 1.0**

| RMF Function | OSSA Component | Description |
| :---- | :---- | :---- |
| **GOVERN** | Cedar policies, governance extension | Policy-as-code authorization; governance metadata in manifest |
| **MAP** | Registry, discovery, evals | Agent catalog, UADP discovery protocol, evaluation harness |
| **MEASURE** | token-efficiency, Dragonfly, TimescaleDB | Resource budgets, telemetry pipeline, time-series observability |
| **MANAGE** | Fleet Manager, AgentDash, revocation | Lifecycle management, dashboard, real-time revocation via UADP |

**Standards Foundation**

OSSA is grounded in established open standards to maximize interoperability and adoption:

* Identity: W3C DID Core 1.0 for GAID syntax and resolution

* Authorization: Cedar policy language (formally verified; used in AWS) for pre-authorization

* APIs: OpenAPI 3.1 (UADP REST), AsyncAPI 3.0 (UADP events)

* Controls: Threat matrix maps to NIST SP 800-53 Rev. 5 families AC, AU, SC, IA-5; OSCAL can represent control implementations

* Tools: Model Context Protocol (MCP) for tool disclosure; attestation through signed manifests (x-signature)

* Credentials: W3C Verifiable Credentials for delegation and attestation

**Open Source Availability**

**Specification:** https://openstandardagents.org/spec/v0.4

**Schema:** openstandardagents repository (JSON Schema, MIT License)

**npm Package:** @bluefly/openstandardagents

**Drupal Integration:** drupal/ai\_agents\_ossa

We invite NIST to review OSSA v0.4 as a reference implementation and welcome collaboration in the ITL AI Agent Standards Initiative.

**References**

[OSSA Project Site: https://openstandardagents.org/](https://openstandardagents.org/)

[OSSA npm Package: https://www.npmjs.com/package/@bluefly/openstandardagents](https://www.npmjs.com/package/@bluefly/openstandardagents)

[CAISI AI Agent Security RFI: https://www.nist.gov/news-events/news/2026/01/caisi-issues-request-information-about-securing-ai-agent-systems](https://www.nist.gov/news-events/news/2026/01/caisi-issues-request-information-about-securing-ai-agent-systems)

[CAISI Listening Sessions: https://www.nist.gov/news-events/news/2026/02/caisi-host-listening-sessions-barriers-ai-adoption](https://www.nist.gov/news-events/news/2026/02/caisi-host-listening-sessions-barriers-ai-adoption)

[CAISI Overview: https://www.nist.gov/caisi](https://www.nist.gov/caisi)

[AI Agent Standards Initiative: https://www.nist.gov/caisi/ai-agent-standards-initiative](https://www.nist.gov/caisi/ai-agent-standards-initiative)

[NIST AI RMF 1.0: https://www.nist.gov/itl/ai-risk-management-framework](https://www.nist.gov/itl/ai-risk-management-framework)

[W3C DID Core 1.0: https://www.w3.org/TR/did-core/](https://www.w3.org/TR/did-core/)

[Cedar Policy Language: https://www.cedarpolicy.com/](https://www.cedarpolicy.com/)

[W3C Verifiable Credentials: https://www.w3.org/TR/vc-data-model/](https://www.w3.org/TR/vc-data-model/)

[OSCAL: https://pages.nist.gov/OSCAL/](https://pages.nist.gov/OSCAL/)

[NIST SP 800-53 Rev. 5: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)

*Submitted by Thomas Scola, Founder — BlueFly.io Collective  |  Customer Success Architect — GitLab*

Contact: thomas@openstandardagents.org  |  https://openstandardagents.org  |  https://bluefly.io