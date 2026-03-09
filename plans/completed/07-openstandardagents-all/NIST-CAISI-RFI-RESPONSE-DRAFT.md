# NIST CAISI RFI Response – AI Agent Security Standards
## BlueFly.io / Open Standard for Software Agents (OSSA)
### Response to: CAISI Request for Information on AI Agent Security Standards
### Submitted: March 2026 | Deadline: March 9, 2026
### Contact: info@blueflyagents.com | https://openstandardagents.org

---

## EXECUTIVE SUMMARY

BlueFly.io submits this response in support of the CAISI initiative on behalf of the **Open Standard for Software Agents (OSSA)** — an open-source, schema-driven specification for interoperable, secure AI agents. OSSA v0.4 is the first agent specification to natively implement W3C Decentralized Identifiers (DIDs), Cedar policy authorization, cryptographic tool attestation, and machine-readable governance constraints in a single composable schema. We support NIST's initiative and offer OSSA as a concrete, production-ready reference implementation for federal AI agent security frameworks.

---

## 1. AGENT IDENTITY AND AUTHENTICATION

### Current Implementation (OSSA v0.4)

OSSA defines a mandatory **Global Agent Identifier (GAID)** using DID syntax (`did:ossa:<uuid>`), resolvable to a full W3C DID Document via the `identity` extension:

```yaml
# agent-card.schema.json — core identity fields
gaid: "did:ossa:a7f3c1-drupal-content-agent"
identity:
  "@context": ["https://www.w3.org/ns/did/v1"]
  id: "did:web:openstandardagents.org:agents:content-agent"
  verificationMethod:
    - id: "did:web:...#key-1"
      type: "Ed25519VerificationKey2020"
      controller: "did:web:openstandardagents.org"
      publicKeyMultibase: "z6MkrCD..."
  authentication: ["did:web:...#key-1"]
  assertionMethod: ["did:web:...#key-1"]
```

**DID Methods Supported:** `did:web`, `did:key`, `did:ossa` (custom method for air-gapped environments)  
**Key Types:** Ed25519, JsonWebKey2020, ECDSA P-256/secp256k1, X25519 for key agreement  
**Revocation:** `revoked: true` on `VerificationMethod`, resolvable via registry endpoint

### Recommendations for Federal Standards

1. **Mandate GAID persistence across deployments.** Agent identity should survive container restarts and re-deployments. OSSA achieves this through registry binding, not ephemeral runtime identity.
2. **Require DID method disclosure.** Agents must declare their DID method in the manifest so verifying parties can resolve without ambiguity.
3. **Require revocation endpoints.** Any agent operating in federal contexts must expose a revocation status endpoint conforming to W3C DID Core `ServiceEndpoint` with type `CredentialRegistry`.

---

## 2. AUTHORIZATION AND ACCESS CONTROL

### Current Implementation (OSSA v0.4 + Cedar Integration)

OSSA integrates **Cedar policy authorization** (Amazon's formally verified policy language) through the `compliance-engine` platform service. Every tool invocation is pre-authorized:

```yaml
# tier-based access control in agent manifest
security:
  tier: tier_2_write_limited    # enforced by Cedar policy engine
  capabilities:
    - read_agent_registry
    - write_ossa_manifests
    - trigger_ci_pipelines
  rate_limits:
    requests_per_minute: 60
    concurrent_executions: 3
```

Cedar enforce pattern (deployed in `Drupal_Fleet_Manager`):
```
permit(
  principal == Agent::"did:ossa:content-agent",
  action == Action::"trigger",
  resource == Dragonfly::"project/drupal-core"
) when { principal.tier == "tier_2_write_limited" };
```

### Recommendations for Federal Standards

1. **Adopt Cedar or equivalent formally-verified policy language** for agent authorization. JSON-based RBAC is insufficient for the combinatorial policies needed when 100s of agents interact.
2. **Define tier taxonomy.** OSSA's 4-tier model (read-only, write-limited, write-elevated, system-elevated) provides a starting framework. NIST should standardize minimum tier definitions.
3. **Require pre-authorization before tool execution,** not post-hoc auditing only. Agents must prove permission before invoking any external system.

---

## 3. TOOL ATTESTATION AND MCP SECURITY

### Current Implementation

OSSA tools are declared in the manifest and exposed via **Model Context Protocol (MCP)**. Tool schemas define input constraints, rate limits, and required capabilities:

```yaml
tools:
  - name: execute_drush_command
    description: "Execute Drush CLI command on Drupal site"
    parameters:
      command: { type: string, required: true }
      site_alias: { type: string, required: false }
    rate_limit: 10/minute
    requires_capability: write_drupal_site
    mcp_resource_uri: "mcp://fleet-manager/tools/drush"
```

MCP servers are registry-backed and validated via OpenAPI specifications hosted at `https://api.blueflyagents.com`.

### Recommendations

1. **Standardize tool manifest disclosure.** All agent tools must be declared in a machine-readable format before deployment, not only at runtime.
2. **Require MCP server authentication.** MCP endpoints should require mutual TLS or API-key authentication. Anonymous MCP servers should be prohibited in federal contexts.
3. **Rate limits as enforceable policy,** not advisory hints. NIST should define rate limit enforcement as a requirement.

---

## 4. TOKEN EFFICIENCY AND RESOURCE GOVERNANCE

### Current Implementation (OSSA `token-efficiency` Extension)

OSSA v0.4 includes a `token_efficiency` extension that enforces resource constraints at the specification level:

```json
// token-efficiency.schema.json
{
  "budget": {
    "max_tokens_per_call": 16384,
    "max_calls_per_session": 100,
    "max_total_session_tokens": 500000
  },
  "optimization": {
    "cache_enabled": true,
    "compression": "semantic",
    "redundancy_elimination": true
  }
}
```

This prevents unbounded resource consumption by autonomous agents, which is a critical safety property for federal deployments.

### Recommendations

1. **Mandate resource budgets in agent specifications.** Unlimited token consumption by autonomous agents poses both cost and security risks.
2. **Require cost attribution.** Every agent invocation should be attributable to a principal (user or agent DID) for audit and cost accounting.

---

## 5. OBSERVABILITY, AUDIT, AND INCIDENT RESPONSE

### Current Implementation (Dragonfly Telemetry + AgentDash)

OSSA agents publish structured telemetry to **Dragonfly** (test orchestration / quality gate) and **AgentDash** (real-time visualization):

- Every agent execution is logged with: `timestamp`, `agent_gaid`, `tool_name`, `principal_did`, `cedar_decision`, `duration_ms`, `token_count`, `exit_status`
- Dragonfly's Reporter Agent publishes metrics to TimescaleDB and AgentDash at `https://agentdash.blueflyagents.com/api/metrics`
- Failure detection triggers automated GitLab issues and Slack notifications

### Recommendations

1. **Require structured audit logs** for all agent tool invocations in federal deployments, including the authorizing Cedar policy decision.
2. **Mandate agent execution traceability** from user principal, through agent chain (A2A delegation), to final tool execution.
3. **Define MTTD/MTTR targets** for AI agent security incidents. OSSA's Dragonfly integration demonstrates sub-minute detection for regression-class failures.

---

## 6. INTEROPERABILITY

OSSA currently has adapters or integrations for:

| Framework | Integration |
|-----------|-------------|
| LangChain | `langchain.schema.json` extension |
| LangGraph | `langgraph.schema.json` extension |
| CrewAI | `crewai.schema.json` extension |
| AG2 (AutoGen) | `ag2.schema.json` extension |
| kagent (K8s) | `kagent.schema.json` extension + CRD generation |
| MCP | First-class: `mcp.schema.json` + MCP bridge |
| A2A Protocol | `a2a.schema.json` extension |
| Drupal AI | `drupal.schema.json` extension |

We strongly support NIST's leadership in establishing a **common identity layer** (GAIDs / DIDs) that all of these frameworks can resolve.

---

## 7. OSSA ALIGNMENT WITH NIST AI RMF

| NIST AI RMF Function | OSSA v0.4 Implementation |
|---------------------|--------------------------|
| **GOVERN** | Cedar policies, tier-based capability declarations, `governance` extension |
| **MAP** | Agent registry at `openstandardagents.org`, `evals` extension for capability mapping |
| **MEASURE** | `token-efficiency` budget tracking, Dragonfly quality gates, TimescaleDB audit |
| **MANAGE** | Fleet Manager orchestration, AgentDash real-time monitoring, automated Rector upgrades |

---

## 8. OPEN SOURCE COMMITMENT

OSSA is MIT-licensed. Specifications, schemas, and tooling are available at:
- **Spec:** https://openstandardagents.org/spec/v0.4
- **Schema:** https://github.com/openstandardagents/ossa (JSONSchema)
- **NPM:** `@bluefly/openstandardagents` (GitLab + npmjs)
- **Drupal Module:** `drupal/ai_agents_ossa`

We invite NIST to review OSSA v0.4 as a reference implementation and welcome collaboration in the ITL AI Agent Standards Initiative.

---

*Submitted by BlueFly.io Platform Team — Contact: info@blueflyagents.com*
