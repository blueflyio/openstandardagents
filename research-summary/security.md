# Security and Governance Research (2025-2026)

Date finalized: April 18, 2026.

## 1) Security posture in practice: adoption ahead of control

The Gravitee 2026 report (919 respondents) describes a common pattern:

- Agents are already production infrastructure.
- Security controls are unevenly deployed.
- Runtime visibility is partial in many enterprises. [S01][S02]

Reported indicators:

- 81%+ of teams are beyond planning.
- Only 14.4% report full security approval coverage.
- 88% report confirmed/suspected incidents.
- Roughly one-fifth treat agents as independent identities. [S01][S02]

Interpretation: the bottleneck is less “whether to adopt agents” and more “how to make agent execution auditable, identity-bound, and policy-enforced.”

## 2) Core threat classes

Across practitioner and research sources, three threat classes recur:

1. **Prompt injection / indirect prompt injection**
2. **Excessive permissions / over-privileged tools**
3. **Hallucinated or manipulated actions through tool chains**

These are consistently highlighted in enterprise guidance and technical writeups [S03][S04], and are supported by growing benchmark-focused research on tool-call interception and execution-layer governance [A10][A11].

## 3) Identity and authorization gap

NIST NCCoE’s concept paper frames agent IAM as an immediate standards problem:

- identification
- authentication
- authorization
- auditing/non-repudiation
- prompt-injection containment controls [A05]

This aligns with field evidence that shared API keys and role ambiguity make accountability fragile in multi-agent systems [S02].

### Practical implication

Treat autonomous software agents as first-class principals. Avoid “agent-as-shared-service-account” patterns for anything beyond low-risk prototypes.

## 4) Governance architecture trends in 2026

A stronger research trend is moving from high-level “safety policy” toward layered runtime governance:

- execution sandboxing
- intent verification before tool execution
- zero-trust inter-agent authorization
- immutable or tamper-evident audit logs [A11]

This is consistent with enterprise expectations for continuous monitoring and policy enforcement, rather than periodic compliance snapshots [S02].

## 5) Enterprise governance challenges

### 5.1 Confidence vs coverage mismatch

Executives may report confidence while operational controls remain partial [S02]. This creates a “confidence paradox”: policy confidence without end-to-end enforcement.

### 5.2 Shadow agent deployments

Team-level experimentation can outpace central security approval [S01][S02], increasing ungoverned tool/API exposure.

### 5.3 Incomplete observability

If tool invocations and inter-agent handoffs are not centrally logged, incident forensics and accountability degrade significantly [S02].

## 6) Recommended control stack (implementation-oriented)

### Identity and access

- Per-agent credentials and short-lived tokens
- Scope-limited permissions by task/tool
- Revocation path and emergency disable

### Runtime controls

- Tool allowlists and parameter validation
- Action approval gates for irreversible side effects
- Circuit breakers for unusual action loops

### Data and context controls

- Trusted-source boundaries for retrieved context
- Injection-resistant preprocessing and provenance tagging
- Context minimization for sensitive operations

### Audit and operations

- Structured logs for every tool call and delegation
- Trace correlation IDs across agent workflows
- Incident playbooks for compromised agent behavior

### Governance and assurance

- Risk-tiered autonomy policy (low/medium/high impact actions)
- Human-in-loop defaults for high-risk domains
- Regular red-team/security evaluation cycles [S04][A10]

## 7) Security metrics to track

Minimal operational KPI set:

- percentage of agents with unique identity
- percentage of tool calls policy-checked
- average permission scope per agent
- incident rate by threat class (prompt/tool/access)
- mean time to detection and containment
- percentage of high-risk actions with human approval

## 8) Relationship to protocol and framework choices

Protocol standardization (MCP/A2A/AG-UI/etc.) does not automatically provide governance completeness. Protocols solve interoperability; security still requires:

- explicit policy layer
- identity lifecycle
- runtime enforcement
- observability [P01][P02][P04][A11]

This is the central distinction between connectivity and control.

---

For citation keys and URLs, see `reading-list.md`.
