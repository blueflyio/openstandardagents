# Security and Governance for Agentic AI (2025-2026)

Date of synthesis: April 15, 2026

## Executive view

Security evidence across industry and research points to a common pattern:

- Agent adoption is rapid.
- Identity and authorization controls are immature.
- Prompt injection and over-privileged tool access are active failure paths.

## 1) Enterprise security posture data

### Gravitee 2026 report signals

From Gravitee’s State of AI Agent Security (published February 2026):

- 81% (or 80.9%) of technical teams are past planning (testing or production).
- Only 14.4% report full security/IT approval for their entire agent fleet.
- 88% report confirmed or suspected incidents in the last year.
- Only about 22% treat agents as independent identities.
- Shared API keys are still common in agent-to-agent auth flows.[T22][T23]

This suggests organizations are not blocked by awareness; they are blocked by operationalization (identity architecture, enforcement, and visibility).

## 2) Core threat model (what repeatedly breaks)

### A) Indirect prompt injection

Indirect prompt injection attacks place malicious instructions in external data that agents consume (documents, web content, form fields, metadata).  
Recent peer-reviewed work (AGENTVIGIL, EMNLP Findings 2025) reports high attack success rates in benchmark and real-like settings against agent stacks.[T37]

### B) Excessive permissions / excessive agency

Agents frequently run with more credentials and tool rights than required for each step. If compromised by prompt injection, they can execute unauthorized actions with those privileges.  
This pattern is repeatedly discussed in practical security guidance and incident narratives.[T24][T23]

### C) Low observability and delayed audits

Periodic/manual review cannot keep up with high-velocity autonomous actions. Continuous policy enforcement, runtime logs, and auditability are repeatedly identified as missing controls.[T23]

## 3) Identity and authorization as infrastructure requirements

### NIST/NCCoE direction (February 2026)

NIST NCCoE’s concept paper calls for broader identity and access approaches for software/AI agents, explicitly including:

- Identification,
- Authorization,
- Auditing and non-repudiation,
- Prompt-injection mitigation controls.[T21]

This aligns with observed incident patterns and points toward formal standards and reference architectures for agent IAM.

### Protocol-level response trend

Multiple projects are embedding trust metadata and stronger identity semantics:

- DID-based identity patterns (for example ANP, DUADP materials),
- Signed descriptors/artifacts in agent ecosystems,
- Policy evaluation models tied to trust tiers and environment controls.[T11][T01][T03]

## 4) University and policy perspectives

- MIT Sloan: agentic AI progress is real, but reliability and prompt-injection exposure mean broad unsupervised deployment is premature; human-in-the-loop remains necessary in current enterprise phases.[T20]
- MIT AI Agent Index: safety and transparency disclosures lag capability claims, and web conduct standards remain unsettled.[T19]
- Harvard policy commentary: platform control vs open protocol governance is becoming a central institutional question for the “agentic web,” especially around identity, delegation, and accountability.[T40]

## 5) Recommended control model (practical)

### Minimum baseline controls for production

1. **Agent identity as first-class principal**
   - Unique identities per agent/service account.
   - Avoid shared keys and inherited super-credentials.

2. **Least-privilege tool access**
   - Scope tool permissions by task stage.
   - Time-limit and context-limit credentials.

3. **Policy enforcement at runtime**
   - Explicit allow/deny policy checks before high-risk tool actions.
   - Human approval for irreversible or regulated operations.

4. **Provenance and audit**
   - Log tool invocations, prompts/context sources, and resulting actions.
   - Preserve replayable traces for incident analysis.

5. **Prompt-injection resilience**
   - Treat all external content as untrusted.
   - Isolate high-risk tool calls behind policy gates and output validation.

## 6) Security maturity scoring lens (suggested)

Organizations can score each agent workflow on:

- Identity maturity (none/shared/unique+attested),
- Authorization precision (coarse/fine-grained/contextual),
- Observability depth (basic logs/trace-level evidence),
- Human oversight posture (none/selective/risk-tiered mandatory),
- Incident response readiness (ad hoc/playbooked/automated containment).

This mirrors the risks seen in 2026 reports while avoiding protocol-vendor lock-in.

