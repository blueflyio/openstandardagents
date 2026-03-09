# NIST ITL Concept Paper Response – AI Agent Identity and Authorization
## BlueFly.io / Open Standard for Software Agents (OSSA)
### Response to: ITL AI Agent Identity and Authorization Concept Paper
### Deadline: April 2, 2026
### Contact: info@blueflyagents.com | https://openstandardagents.org

---

## EXECUTIVE SUMMARY

This response addresses NIST ITL's Concept Paper on AI Agent Identity and Authorization. We present OSSA v0.4's concrete implementation of W3C DID-based agent identity, Cedar policy authorization, decentralized agent discovery, and cross-platform credential delegation as a production reference. We support NIST ITL's goal of establishing interoperable identity standards for autonomous AI agents operating in multi-principal, multi-organization environments.

---

## SECTION 1: AGENT IDENTITY ARCHITECTURE

### The Core Problem OSSA Solves

AI agents today suffer from three identity anti-patterns:
1. **Ephemeral identity:** Agents get new identities on each container restart
2. **Namespace collision:** Two agents in different frameworks can have the same conceptual name but no shared identifier
3. **Undiscoverable identity:** No standard way for a verifying party to resolve an agent's capabilities, owner, or authorization scope

### OSSA's Answer: Global Agent Identifier (GAID)

Every OSSA agent has a permanent **GAID** — a `did:ossa:<uuid>` that:
- **Persists** across deployments, restarts, and framework migrations
- **Resolves** to a full W3C DID Document via OSSA registry
- **Binds** to cryptographic keys for authentication
- **Carries** provenance: who created it, when, and under what governance

```yaml
# Minimum viable OSSA identity
gaid: "did:ossa:7f3c1b2a-4e8d-4f9c-b1d3-8e9f0a1b2c3d"
identity:
  "@context": ["https://www.w3.org/ns/did/v1"]
  id: "did:web:openstandardagents.org:agents:content-agent"
  verificationMethod:
    - id: "#key-1"
      type: "Ed25519VerificationKey2020"
      controller: "did:web:openstandardagents.org"
      publicKeyMultibase: "z6MkrCD1csqtgdj8sjra..."
  authentication: ["#key-1"]
  service:
    - id: "#agent-endpoint"
      type: "OSSAAgentService"
      serviceEndpoint: "https://agents.example.com/content-agent"
    - id: "#mcp-endpoint"
      type: "MCPServerService"
      serviceEndpoint: "mcp://mcp-server.example.com/content-agent"
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `did:web` as primary method | Resolves without blockchain; uses existing PKI infrastructure |
| `did:ossa` as secondary | Air-gapped / private environments where HTTP resolution isn't possible |
| Ed25519 as default key type | Fast, small, well-audited; same choice as W3C DID spec examples |
| Revocation via registry | List-based revocation at `ServiceEndpoint` with type `CredentialRegistry` |

---

## SECTION 2: AUTHORIZATION MODEL

### Principal Hierarchy in OSSA

OSSA defines a strict three-tier principal hierarchy:

```
Human User (session token / OAuth)
  └─> Orchestrator Agent (tier_3_write_elevated)
        └─> Worker Agents (tier_1_read, tier_2_write_limited)
              └─> Tool Calls (Cedar-authorized)
```

At each delegation step, the **originating principal's DID** is carried forward and logged. This enables full audit trails from human to tool execution.

### Cedar as the Authorization Engine

OSSA uses **Cedar** (NIST FIPS conformant formally-verified policy language) for authorization:

```cedar
// Cedar policy: content agent CAN trigger Dragonfly tests
// but ONLY on its own registered project
permit(
  principal in Group::"content-team-agents",
  action == Action::"trigger_test",
  resource == DragonflyProject::"drupal-content-module"
)
when {
  principal.tier >= 2 &&
  principal.owner == resource.project_owner &&
  context.hour_of_day >= 8 && context.hour_of_day <= 20
};
```

Cedar's **formal verification** guarantees policies are decidable and don't have hidden conflicts — critical for high-assurance environments.

### A2A Delegation Chain

When Agent A (`tier_3_write_elevated`) delegates to Agent B (`tier_2_write_limited`):

1. Agent A creates a signed **delegation credential** (OSSA VC) binding Agent B's GAID to specific actions
2. Agent B presents this credential + its own DID auth when calling tools
3. Cedar policy engine checks both A's policy AND the delegation scope
4. The full delegation chain is logged: `A → B → tool_call`

This prevents **privilege escalation** via delegation — Agent B cannot exercise permissions Agent A does not itself hold.

---

## SECTION 3: DECENTRALIZED DISCOVERY AND REGISTRY

### How Agents Find Each Other

OSSA defines two complementary discovery mechanisms:

**1. Registry-based (centralized, trusted)**
```http
GET https://openstandardagents.org/api/v1/agents?tier=tier_2_write_limited&tag=drupal
→ [{gaid, name, capabilities, serviceEndpoint, lastValidated}]
```

**2. DID-based (decentralized, self-describing)**
```http
GET https://openstandardagents.org/agents/content-agent/did.json
→ DID Document with ServiceEndpoints, VerificationMethods
```

Fleet Manager (`Drupal_Fleet_Manager`) uses registry-based discovery for orchestration; individual agents resolve DIDs for peer-to-peer communication.

### Registry Security Requirements

| Requirement | OSSA Implementation |
|------------|---------------------|
| Agent entries are signed | Creator's DID signs the manifest; verified at registration |
| Registry is append-only-auditable | TimescaleDB with immutable event log |
| Registry entries have TTL | `expires_at` field in agent-card.schema.json |
| Revoked agents are not discoverable | Registry filters on `revoked: false` by default |

---

## SECTION 4: CONSENT AND SCOPE LIMITATION

OSSA's authorization model enforces **least-privilege by default**:

```yaml
# Tool declarations are mandatory — undeclared tools cannot be called
tools:
  - name: read_agent_status
    requires_capability: read_agent_registry    # narrow scope
  - name: update_agent_manifest  
    requires_capability: write_ossa_manifests   # explicit write scope
    # NOT: write_all, admin, etc.
```

Agents cannot call tools they have not declared. The MCP bridge validates that every tool call matches a declared tool in the manifest before forwarding to the tool server.

---

## SECTION 5: RECOMMENDATIONS FOR NIST ITL STANDARDS

### R1: Establish a Federal GAID Namespace
NIST should define a `did:gov` DID method for federal AI agents, analogous to `did:web` but rooted in `.gov` domain infrastructure. OSSA's `did:ossa` method can serve as a reference implementation.

### R2: Standardize the Agent Credential Format
Define a W3C Verifiable Credential profile for AI agent authorization tokens. OSSA's delegation credential format (GAID + signed scope claim + expiry) is a concrete starting point.

### R3: Mandate Cedar (or Equivalent) for High-Assurance Deployments
Informal policy languages (natural language, JSON rules) are insufficient for formally verifiable authorization. NIST should recommend Cedar as the reference implementation for AICP (AI Capability Policy).

### R4: Define Agent Tier Taxonomy
OSSA's 4-tier model should be standardized:
- **Tier 0:** Read-only, no external calls
- **Tier 1:** Read + query external APIs (no writes)  
- **Tier 2:** Limited write (scoped to declared resources)
- **Tier 3:** Elevated write + orchestration (multi-agent coordination)
- **Tier 4:** System-level (reserved for infrastructure agents only)

### R5: Registry Attestation Requirements
Any AI agent operating in federal contexts should:
1. Be registered in an auditable registry with DID-bound identity
2. Have its manifest cryptographically signed by the deploying organization's DID
3. Undergo periodic re-attestation (recommend: 90-day default)

### R6: Cross-Organization Agent Identity Federation
Define how `did:web:agency-a.gov` agents can be trust-anchored to `did:web:agency-b.gov` environments. OSSA's `a2a.schema.json` extension provides a starting model for cross-organization agent message envelopes.

---

## SECTION 6: OPEN QUESTIONS FOR WORKING GROUP CONSIDERATION

1. **DID method for classified environments:** How should GAIDs work when agent registries cannot be externally resolved? (`did:key` + local key store?)
2. **AI agent signatures on code artifacts:** Should OSSA-generated code commits be signed by the agent's DID key? This creates accountability chains for AI-generated code.
3. **Multi-agent session identity:** When 7 agents work together in a Dragonfly test pipeline, what is the "session identity"? We propose: the Orchestrator Agent's GAID + a session UUID.
4. **Consent revocation latency:** When an agent's credential is revoked, what is the acceptable propagation delay before all systems enforce the revocation? OSSA currently supports immediate revocation via registry, but cached decisions create a window.

---

## APPENDIX: OSSA v0.4 SCHEMA REFERENCES

| Schema | Description | URL |
|--------|-------------|-----|
| `agent-card.schema.json` | Core agent identity and metadata | https://openstandardagents.org/spec/v0.4/agent-card |
| `identity.schema.json` | W3C DID Document for OSSA agents | https://openstandardagents.org/spec/v0.4/extensions/identity |
| `a2a.schema.json` | Agent-to-agent delegation envelope | https://openstandardagents.org/spec/v0.4/extensions/a2a |
| `token-efficiency.schema.json` | Resource budget governance | https://openstandardagents.org/spec/v0.4/extensions/token-efficiency |
| `evals.schema.json` | Capability verification assertions | https://openstandardagents.org/spec/v0.4/extensions/evals |

---

*Submitted by BlueFly.io Platform Team — Contact: info@blueflyagents.com*  
*Repository: https://github.com/openstandardagents/ossa | https://openstandardagents.org*
