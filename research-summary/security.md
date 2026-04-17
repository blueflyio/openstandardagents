# Security and Governance (2025-2026)

Last updated: April 17, 2026

## Executive summary

Security data and guidance in 2025-2026 point to a consistent conclusion: agent systems are already in production, but identity, authorization, and runtime controls are frequently immature relative to deployment scale [SRC-014][SRC-017][SRC-032][SRC-033].

## High-signal empirical findings

### Gravitee 2026 report indicators

From Gravitee’s 2026 survey materials:

- 81% past planning phase,
- only 14.4% with full security approval,
- 88% with confirmed/suspected incidents,
- low treatment of agents as independent identities,
- continued dependence on shared credentials and custom hardcoded authorization logic [SRC-032][SRC-033].

Operational interpretation:

- “Shadow agent” deployment is common.
- Incident frequency is already high in many sectors.
- Identity and observability gaps are primary controls debt, not edge cases.

### MIT AI Agent Index evidence

MIT’s index and supporting documentation highlight:

- weak public disclosure of agent safety evaluations,
- limited third-party testing transparency,
- unresolved web-conduct norms for autonomous browsing agents [SRC-012][SRC-013].

This supports the view that ecosystem-level assurance remains below what is typical for mature enterprise software dependencies.

## Core threat classes

### 1) Prompt injection and instruction-channel confusion

Prompt injection remains a dominant risk because agent runtimes often merge trusted and untrusted text channels (documents, web content, API responses, user input) [SRC-014][SRC-031][SRC-039].

### 2) Excessive permissions and credential overexposure

When an agent has broad standing credentials, compromise of steering logic can become direct privilege abuse. Practitioner examples repeatedly show over-broad write access and credential misuse [SRC-032][SRC-033].

### 3) Hallucinated or unintended actions

In agentic contexts, hallucinations are not only answer quality problems; they can become action integrity failures when tied to real tools and APIs [SRC-014][SRC-039].

### 4) Delegation and chain-of-command opacity

Agent-created/agent-tasked flows can degrade accountability if identity and delegation are not explicit and auditable [SRC-017][SRC-032][SRC-036].

## Identity and authorization architecture

### NIST/NCCoE direction

NCCoE’s 2026 concept paper explicitly targets:

- identification/authentication/authorization patterns for agents,
- least-privilege and zero-trust application to agentic systems,
- delegation and non-repudiation logging,
- mapping to OAuth/OIDC, SPIFFE/SPIRE, SCIM, NGAC, and related standards [SRC-017].

This is a strong signal that governance is moving toward standards-based IAM extension, not ad-hoc policy.

### Delegation standards evolution

MIT Media Lab’s authenticated delegation framework proposes practical extensions to OAuth 2.0 / OIDC for agent-specific credentials and auditable scope control [SRC-036].

### Protocol convergence and governance

ACP’s merger trajectory into A2A under Linux Foundation governance suggests emerging consolidation pressure around fewer inter-agent standards, which can simplify assurance baselines if adopted with policy discipline [SRC-034].

## Recommended controls baseline (2026)

1. **Agent identity as first-class principal**  
   No shared service credentials for broad agent fleets.

2. **Policy-driven authorization with least privilege**  
   Scope tool access per task/session where possible.

3. **Runtime observability and tamper-evident audit trails**  
   Include tool invocations, delegation hops, policy outcomes.

4. **Prompt-injection defense in depth**  
   Separate instruction/data channels, enforce action gating, sanitize high-risk contexts.

5. **Human-in-the-loop at irreversible boundaries**  
   Mandatory approvals for destructive, financial, or external-side-effect operations.

6. **Progressive autonomy rollout**  
   Expand autonomy only after measurable reliability and security thresholds are sustained.

These controls align across academic, standards, and practitioner sources [SRC-014][SRC-017][SRC-030][SRC-032][SRC-036].

## Risk outlook

Near-term risk is less about theoretical superintelligence and more about:

- over-permissioned automation,
- weak identity semantics,
- poor runtime visibility,
- inconsistent protocol and policy enforcement.

The fastest path to safer adoption is standards-backed IAM + strict runtime controls, not model-only hardening.
