# Output D1: OSSA-to-CAISI Mapping Note

**Deliverable Title:** Open Standard Agents (OSSA) to NIST CAISI Framework Alignment
**Date:** March 5, 2026
**Target Audience:** NIST CAISI AI Agent Standards Initiative

## 1. Introduction
This document maps the technical implementations of the Open Standard for Software Agents (OSSA) v0.4.6 Specification into the NIST Artificial Intelligence Risk Management Framework (AI RMF 1.0) and NIST Special Publication 800-53 Rev. 5 controls.

By utilizing OSSA schemas and Cedar policy enforcement, agencies can immediately transition multi-agent prototypes into accredited Federal production environments.

## 2. NIST SP 800-53 Rev. 5 Security Controls Mapping

| OSSA Construct | SP 800-53 Control | Implementation Notes |
| :--- | :--- | :--- |
| **W3C DIDs (GAID)** | **IA-2** (Identification and Authentication) | Unique Global Agent Identifiers established via W3C DIDs ensure agents are persistently identifiable and traceable across trust boundaries. |
| **Trust Tiers (`security.tier`)** | **AC-2** (Account Management) | The implementation of agent capability tiers (`tier_1_read` through `tier_4_system_admin`) defines precise capability bounds prior to execution. |
| **Cedar Governance Pre-Checks** | **AC-3** (Access Enforcement) | [CedarGovernanceProvider](file:///Users/flux423/Sites/blueflyio/WORKING_DEMOs/openstandardagents/src/services/governance/cedar-provider.ts#18-127) intercepts action requests before tool execution, evaluating the principal agent against resource authorization constraints. |
| **Token Efficiency & Budgeting** | **SC-5** (Denial of Service Protection) | OSSA manifest `token_efficiency` parameters throttle execution boundaries, preventing runaway inference loops and resource exhaustion (financial DoS). |
| **Threat Modeling Blocks** | **PM-16** (Threat Awareness Program) | The declarative `security.threat_model` array enables orchestrators to reroute tasks when an agent lacks required isolation capabilities for a specific threat landscape. |
| **UADP Content Signatures** | **SI-7** (Software, Firmware, and Information Integrity) | Cryptographic guarantees from the UADP registry attest to the integrity and provenance of published agent configurations. |

## 3. NIST AI RMF 1.0 Core Functions Alignment

### Map
OSSA provides intrinsic "Map" capabilities by forcing humans to declare the agent's function explicitly inside the `metadata` and `spec.cognition` structure. Model capabilities and required tools are transparent.

### Measure
Export pipelines automatically attach OpenTelemetry hooks and Dragonfly TimescaleDB logs, allowing operators to measure agent fidelity, hallucination rates, and decision pathways dynamically. The new `quality_requirements` thresholds mandate minimum scoring bounds before an agent workflow is permitted.

### Manage
The declarative nature of OSSA allows risk response strategies to be pushed globally. For example, revoking an agent's DID in the UADP registry instantly prevents orchestration planes from pulling that agent, managing risk in real-time.

### Govern
The OSSA [PolicyBuilder](file:///Users/flux423/Sites/blueflyio/WORKING_DEMOs/openstandard-ui/components/policy/PolicyBuilder.tsx#3-98) output natively couples with Cedar/OPA, ensuring legal, ethical, and organizational safety guardrails are executed deterministically before any non-deterministic LLM output interacts with APIs.

## 4. Conclusion
The updates implemented in the base OSSA toolchain ([CedarGovernanceProvider](file:///Users/flux423/Sites/blueflyio/WORKING_DEMOs/openstandardagents/src/services/governance/cedar-provider.ts#18-127) integration and `Governance/Tier` schema additions) satisfy the programmatic requirements of the NIST CAISI AI Agent Initiative. OSSA manifests function as robust contract boundaries mitigating critical AI implementation risks.
