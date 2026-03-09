# NIST CAISI RFI Response – AI Agent Security Standards
## BlueFly.io / Open Standard for Software Agents (OSSA)
### Response to: CAISI Request for Information on AI Agent Security Standards
### Docket: NIST-2025-0035 | regulations.gov
### Deadline: March 9, 2026
### Contact: info@blueflyagents.com | https://openstandardagents.org

---

## EXECUTIVE SUMMARY

BlueFly.io submits this response in support of the CAISI initiative on behalf of the **Open Standard for Software Agents (OSSA)** — an open-source, schema-driven specification for interoperable, secure AI agents. OSSA v0.4 is the first agent specification to natively combine **W3C Decentralized Identifiers (DIDs)** [W3C DID Core 1.0], **Cedar** (Amazon's formally verified policy language) for pre-execution authorization, **cryptographic manifest attestation** (x-signature trust tiers), and **machine-readable resource governance** (token-efficiency extension) in a single composable schema. OSSA aligns with the **NIST AI Risk Management Framework (AI RMF) 1.0** (GOVERN, MAP, MEASURE, MANAGE) and maps to **NIST SP 800-53 Rev. 5** control families (AC, AU, SC, IA) for federal deployment. We support NIST's initiative and offer OSSA as a concrete, production-ready reference implementation for federal AI agent security frameworks. This response addresses the RFI's priority questions explicitly (1a, 1d, 2a, 2e, 3a, 3b, 4a, 4b, 4d) and is accompanied by four exhibits: schema excerpt (A), UADP protocol table (B), trust tier table (C), and threat matrix (D).

---

## RESPONSE TO QUESTION 1a — Agent Identity: Persistent Global Identifier

**Question 1a (as construed):** How should agent identity be established and maintained across deployments and restarts?

OSSA implements a mandatory **Global Agent Identifier (GAID)** using W3C DID syntax. The GAID persists across container restarts, framework migrations, and re-deployments because it is bound to the agent's entry in a registry and to a W3C DID Document, not to ephemeral runtime state.

- **Syntax:** `did:ossa:<uuid>` or `did:web:<host>:<path>` (e.g. `did:web:openstandardagents.org:agents:content-agent`).
- **Resolution:** The `identity` extension in every OSSA manifest contains a full W3C DID Document conformant to [W3C DID Core 1.0](https://www.w3.org/TR/did-core/) (see Exhibit A). Verifying parties resolve the GAID to obtain `verificationMethod`, `authentication`, and `serviceEndpoint` entries.
- **Persistence:** The manifest is the source of truth. Registries (including UADP-compliant nodes) store and serve the manifest; the GAID is immutable for the lifetime of that agent identity. Revocation is explicit (registry flag or DID document update), not implicit (e.g. key rotation without identity change).

We recommend NIST mandate that federal AI agents have a persistent, globally resolvable identifier (GAID) that survives restarts and redeployments, with resolution via a standard such as W3C DID Core.

---

## RESPONSE TO QUESTION 1d — Revocation and Identity Lifecycle

**Question 1d (as construed):** How should agent identity be revoked or invalidated?

OSSA and its Universal Agent Discovery Protocol (UADP) support immediate, auditable revocation:

1. **Registry-level revocation:** An admin or authorized principal calls `PUT /registry/revoke/{agentId}`. The agent is marked revoked; discovery endpoints exclude it by default.
2. **Event-driven notification:** UADP emits a `uadp.agents.revoked` event ([AsyncAPI 3.0](https://www.asyncapi.com/)) so all consumers are notified in real time without polling (see Exhibit B).
3. **DID document:** A `revoked: true` flag on the relevant `VerificationMethod` or a dedicated `CredentialRegistry` ServiceEndpoint allows DID resolvers to return revocation status.
4. **Auditability:** Revocation events include `agentId`, `timestamp`, and optional `revokedBy` (DID of the revoking principal).

We recommend NIST require revocation endpoints conforming to W3C DID Core ServiceEndpoint type `CredentialRegistry` and support for real-time revocation propagation (e.g. event streams) so cached credentials and discovery results can be invalidated promptly.

---

## RESPONSE TO QUESTION 2a — Authorization Model and Pre-Authorization

**Question 2a (as construed):** What authorization model should apply to agent actions?

OSSA uses **Cedar** (Amazon's formally verified policy language) for authorization. Every tool invocation is **pre-authorized**: the compliance-engine evaluates the principal (agent DID), action, and resource against Cedar policies before the tool executes. No "run first, audit later" for sensitive operations.

- **Principal hierarchy:** Human user (session/OAuth) → Orchestrator Agent (tier_3_write_elevated) → Worker Agents (tier_1_read, tier_2_write_limited) → Tool calls. The originating principal's DID is carried through the chain and logged.
- **Tier taxonomy:** OSSA defines four tiers (see Exhibit C). Each tier maps to a capability set; Cedar policies reference `principal.tier` and resource attributes.
- **Delegation:** When Agent A delegates to Agent B, A issues a signed delegation credential (OSSA VC); B presents it with its DID. Cedar checks both A's policy and the delegation scope. This prevents privilege escalation.

We recommend NIST adopt a formally-verified policy language (e.g. [Cedar](https://www.cedarpolicy.com/)) for high-assurance agent authorization and require **pre-authorization** before tool execution in federal contexts.

---

## RESPONSE TO QUESTION 2e — Interoperability of Authorization Across Systems

**Question 2e (as construed):** How can authorization policies interoperate across organizations or systems?

OSSA enables interoperability through:

1. **Machine-readable tier and capabilities:** The manifest declares `security.tier` and `security.capabilities`. Any system that can read the OSSA manifest can map the agent into a local policy (e.g. Cedar entities, ABAC attributes).
2. **DID as cross-system principal:** The same GAID/DID is used in the OSSA registry, in Cedar policies, and in A2A delegation. Federated environments can anchor trust to `did:web:agency-a.gov` and `did:web:agency-b.gov` and map DIDs to local roles.
3. **A2A extension:** The `a2a.schema.json` extension defines the envelope for agent-to-agent messages, including the sender's DID and optional delegation credential. Receiving systems can verify the credential and enforce policy based on the sender's DID and scope.

We recommend NIST standardize a minimal agent credential format (e.g. [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) profile) that carries GAID, scope, and expiry so that authorization can interoperate across organizational boundaries without custom integrations.

---

## RESPONSE TO QUESTION 3a — Tool Disclosure and Attestation

**Question 3a (as construed):** How should agent tools be disclosed and attested?

OSSA requires **declarative tool disclosure** in the manifest. Every tool the agent may call is listed with name, description, input/output schema, rate limits, and required capability. There is no "implicit" or runtime-only tool set:

```yaml
tools:
  - name: execute_drush_command
    description: "Execute Drush CLI command on Drupal site"
    parameters: { command: string, site_alias?: string }
    rate_limit: 10/minute
    requires_capability: write_drupal_site
    mcp_resource_uri: "mcp://fleet-manager/tools/drush"
```

- **MCP (Model Context Protocol):** Tools are exposed via MCP; the MCP server is registry-backed and validated against OpenAPI specs at https://api.blueflyagents.com.
- **Attestation:** The manifest itself can be signed (UADP `x-signature` block). Consumers that require `verified-signature` trust tier only accept agents whose manifest signature verifies (see Exhibit C).

We recommend NIST require that all agent tools be declared in a machine-readable manifest before deployment and that tool-calling endpoints (e.g. MCP) require authentication (mTLS or API key) in federal contexts.

---

## RESPONSE TO QUESTION 3b — Tool Security and Rate Limiting

**Question 3b (as construed):** How should tool invocation be secured and constrained?

OSSA addresses this in three ways:

1. **Pre-authorization:** Cedar gates every tool call (see 2a). Unauthorized calls never reach the tool server.
2. **Rate limits in manifest:** Each tool declares `rate_limit` (e.g. 10/minute). The platform (e.g. MCP bridge, compliance-engine) enforces these; they are not advisory.
3. **Input schema:** Tool parameters are defined with JSON Schema; invalid or out-of-scope inputs can be rejected at the gateway.

We recommend NIST define rate-limit enforcement as a requirement (not optional) and require mutual TLS or equivalent authentication for tool-calling protocols (e.g. MCP) in federal deployments.

---

## RESPONSE TO QUESTION 4a — Resource and Token Governance

**Question 4a (as construed):** How should agent resource consumption (e.g. tokens, API calls) be governed?

OSSA's `token-efficiency` extension (see Exhibit A) enforces resource budgets at the specification level:

- **Budgets:** `max_tokens_per_call`, `max_calls_per_session`, `max_total_session_tokens` cap consumption.
- **Optimization:** Optional techniques (cache, compression, redundancy elimination) are declared so deployers can align with cost and safety goals.
- **Attribution:** Every agent invocation is logged with `agent_gaid`, `principal_did`, and `token_count` (Dragonfly/AgentDash telemetry), enabling cost and audit attribution to a principal.

We recommend NIST mandate resource budgets in agent specifications for federal deployments and require that every invocation be attributable to a principal (user or agent DID) for audit and cost accounting.

---

## RESPONSE TO QUESTION 4b — Observability and Audit

**Question 4b (as construed):** What observability and audit requirements should apply to agent operations?

OSSA implementations (e.g. Dragonfly, AgentDash, compliance-engine) produce structured audit logs for every agent execution:

- **Logged fields:** `timestamp`, `agent_gaid`, `tool_name`, `principal_did`, `cedar_decision` (permit/deny), `duration_ms`, `token_count`, `exit_status`.
- **Traceability:** The full chain from user principal through A2A delegation to tool execution is recorded. Revocation and policy changes can be audited.
- **Incident response:** Dragonfly's Reporter Agent publishes to TimescaleDB and AgentDash; failure detection triggers automated GitLab issues and notifications (sub-minute MTTD for regression-class failures in our deployment).

We recommend NIST require structured audit logs for all agent tool invocations in federal deployments, including the authorizing policy decision, and mandate full execution traceability from user principal through agent chain to tool call.

---

## RESPONSE TO QUESTION 4d — Threat Mitigation and Security Controls

**Question 4d (as construed):** What threats should agent security frameworks mitigate and how?

Exhibit D provides a threat matrix mapping threats to OSSA controls. Summary:

- **Identity spoofing:** Mitigated by GAID + DID resolution and x-signature verification (trust tiers).
- **Privilege escalation:** Mitigated by Cedar pre-authorization and tier/capability bounds; delegation credentials are scope-limited.
- **Unbounded resource use:** Mitigated by token-efficiency budgets and rate limits.
- **Tool abuse:** Mitigated by declarative tool disclosure, pre-authorization, and MCP authentication.
- **Revocation lag:** Mitigated by UADP real-time revocation events and registry filtering.

We recommend NIST align federal agent security requirements with a threat model that includes identity, authorization, resource governance, and revocation, and that standards reference machine-readable controls (e.g. [OSCAL](https://pages.nist.gov/OSCAL/)) for mapping to NIST SP 800-53 Rev. 5.

---

## ADDITIONAL SECTIONS (Summary)

**Interoperability:** OSSA has adapters for LangChain, LangGraph, CrewAI, AG2, kagent (K8s), MCP, A2A, and Drupal AI. A common identity layer (GAIDs/DIDs) allows these frameworks to resolve the same agent identity across platforms.

**NIST AI RMF Alignment:** OSSA maps to the four functions of the [NIST AI RMF 1.0](https://www.nist.gov/itl/ai-risk-management-framework) (January 2023): GOVERN (Cedar policies, governance extension); MAP (registry, discovery, evals); MEASURE (token-efficiency extension, Dragonfly telemetry, TimescaleDB); MANAGE (Fleet Manager, AgentDash, revocation).

**Research and standards alignment:** OSSA is grounded in established standards: (1) **Identity:** W3C DID Core 1.0 for GAID syntax and resolution. (2) **Authorization:** Cedar policy language (formally verified; used in AWS) for pre-authorization. (3) **APIs:** OpenAPI 3.1 (UADP REST), AsyncAPI 3.0 (UADP events). (4) **Controls:** Threat matrix (Exhibit D) maps to NIST SP 800-53 Rev. 5 families AC, AU, SC, IA-5; OSCAL can represent control implementations. (5) **Tools:** Model Context Protocol (MCP) for tool disclosure; tool attestation via signed manifest (x-signature).

**Open Source:** OSSA is MIT-licensed. Spec: https://openstandardagents.org/spec/v0.4. Schema: openstandardagents repo (JSON Schema). NPM: `@bluefly/openstandardagents`. Drupal: `drupal/ai_agents_ossa`.

We invite NIST to review OSSA v0.4 as a reference implementation and welcome collaboration in the ITL AI Agent Standards Initiative.

---

*Submitted by BlueFly.io Platform Team — Contact: info@blueflyagents.com*

**Attachments:** Exhibit A (Schema Excerpt), Exhibit B (UADP Table), Exhibit C (Trust Tier Table), Exhibit D (Threat Matrix).
