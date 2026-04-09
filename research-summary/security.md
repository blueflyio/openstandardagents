# Security and Governance for Agentic AI (2025-2026)

**Research reference date for relative-time normalization:** **March 10, 2026**.

## Security Posture: Adoption Ahead of Controls

Multiple 2026 industry sources report that deployment has outpaced governance. Gravitee reports that 81% of teams are beyond planning, but only 14.4% have full security approval; it also reports that 88% encountered incidents and fewer than 22% model agents as independent identities. These statistics align with broader concerns in academic and policy sources about identity ambiguity and weak assurance models in production agent stacks. [T35][T36][T11][T38]

MIT Sloan and MIT Agent Index materials reinforce the same pattern from a different angle: organizations are accelerating autonomous workflows while transparency and governance mechanisms lag behind capabilities. [T12][T11]

## Primary Threat Classes

### 1) Prompt Injection and Context Poisoning

Prompt injection remains a high-probability vector when agents consume untrusted external content and can trigger tools. Public guidance emphasizes that model-level refusal is insufficient; controls must include pre-tool policy checks and strict data-origin handling. [T37][T40][T43]

### 2) Excessive Permissions / Over-broad Agency

Agents frequently receive broad credentials or coarse service permissions. This permits privilege escalation through benign-looking tool chains, especially when approval boundaries are not explicit per action class. [T35][T37][T43]

### 3) Hallucinated or Misbound Actions

Security discussions now separate "bad text" from "bad actions": action execution against the wrong target, fabricated tool assumptions, or ambiguous references can cause real-world harm. This is increasingly treated as an authorization and transaction-safety problem, not only a model quality issue. [T37][T43]

### 4) Supply Chain and Manifest Trust

Unsigned manifests, weak provenance, and unverified tool endpoints create protocol-level and packaging-level risk. Emerging frameworks push signed metadata, SBOM references, and attestation checks to reduce substitution and poisoning attacks. [T03][T40][T41]

## Governance and Identity Standards Trajectory

### NIST/NCCoE Direction

The NIST NCCoE concept paper (February 5, 2026) explicitly identifies identity, authorization, auditability, and non-repudiation for software/AI agents as a standardization gap. This formalizes an expectation that future enterprise and regulated deployments treat agents as first-class principals with lifecycle identity controls. [T38][T39]

### Decentralized Identity and Verifiable Credentials

W3C DID Core v1.1 and related credential mechanisms are increasingly referenced in agent protocol designs as a way to bind claims to issuers and improve cross-domain trust exchange. Practical maturity is uneven, but the architectural direction is clear: portable identity claims plus verifiable policy context. [T22][T42][T50]

### Protocol-Composition Security Research

Recent academic papers propose stack-level security models and conformance checking for composed protocols. AgentRFC introduces formal principles and conformance concepts for multi-protocol deployments, while related 2026 threat-modeling work catalogs concrete risks across MCP/A2A/ANP-like layers. [T41][T40]

## Security Controls That Recur Across Sources

| Control area | Recommended pattern | Source alignment |
|---|---|---|
| Identity | Distinct per-agent identity; avoid shared API keys | Gravitee, NIST, HBR [T35][T38][T43] |
| Authorization | Least privilege + policy checks before tool calls | Dev.to, NIST, HBR [T37][T38][T43] |
| Data trust | Bound trusted inputs and provenance checks | HBR, arXiv modeling [T43][T40] |
| Execution safety | Hard rule checks for high-impact actions | HBR, industry playbooks [T43][T33] |
| Monitoring | Full audit trails, incident telemetry, replayability | NIST, Gravitee, HBR [T38][T35][T43] |
| Supply chain | Signed manifests, SBOM, attestation verification | OSSA docs, arXiv frameworks [T03][T41] |

## OSSA/DUADP Security-Relevant Positioning

Within the collected materials, OSSA and DUADP present a layered security narrative:

- OSSA: signed manifest model, policy declaration hooks (for example, Cedar), and protocol declaration surfaces intended for deterministic validation before deployment. [T03][T05][T07]  
- DUADP: federated discovery with trust-tier concepts, DID-centric verification language, and policy-filtered routing goals. [T01][T04]

This does not replace runtime enforcement; it creates stronger pre-runtime and discovery-time guarantees that can be connected to enterprise IAM and audit systems. [T03][T38]

## Operational Safeguards (Actionable Checklist)

1. **Assign unique identity per agent instance or service principal**, including rotation and revocation workflows. [T35][T38]  
2. **Implement pre-execution policy gates** for every tool/action invocation. [T37][T43]  
3. **Partition tool scopes** by task class; block broad wildcard capabilities. [T37][T40]  
4. **Require explicit human approval** for high-impact actions (financial, destructive, external side effects). [T12][T43]  
5. **Capture complete execution trails** (input provenance, policy decision, tool arguments, outcomes). [T38][T43]  
6. **Verify artifact provenance** (manifest signatures, package integrity, SBOM references). [T03][T41]  
7. **Run protocol-conformance and adversarial tests** for composed stacks (MCP + A2A + orchestration + UI). [T40][T41]

## Evidence Gaps and Limitations

- Incident-rate and adoption statistics are often vendor-survey based; they are directional and should be cross-validated against internal telemetry. [T35][T36]  
- Some enterprise governance analysis from HBR may be partially paywalled; synthesis here relies on accessible text and summaries. [T43][T44]  
- Open standards are evolving rapidly; protocol versioning and governance affiliation can change across quarters.
