# Security and Governance Research

## Current risk posture (2026)

Security adoption is trailing deployment scale. Gravitee's 2026 survey highlights:
- 81% of teams beyond planning,
- only 14.4% with full security approval,
- 88% reporting confirmed/suspected incidents,
- and fewer than 22% treating agents as independent identities [[R46]][[R47]].

This aligns with MIT's transparency findings: capability disclosure outpaces safety disclosure in deployed agents [[R17]].

## Main threat model clusters

## 1) Prompt injection and context hijack
Agent systems that combine untrusted input and privileged tools remain vulnerable to instruction override and hidden malicious directives [[R48]][[R54]].

## 2) Excessive permissions and over-broad tool scope
Many deployments still rely on shared service credentials/API keys rather than per-agent principal identity. This amplifies blast radius when an agent is manipulated or misfires [[R47]][[R48]].

## 3) Hallucinated or misaligned actions
Execution risk is not just wrong text output; it is wrong **tool action** (writes, transactions, state changes) in real systems [[R18]][[R48]].

## 4) Incomplete monitoring/auditability
Without robust tracing and policy decision logs, incident response and root-cause analysis are weak [[R47]][[R34]][[R36]].

## Identity and authorization frameworks

## NIST/NCCoE direction
NIST launched an AI Agent Standards Initiative (February 2026) and companion concept-paper activity focused on identity, authentication, authorization, auditing, and prompt-injection control requirements for software/AI agents [[R49]][[R50]][[R51]].

This is significant: it formalizes the shift from "model-only safety" to **identity + policy + operational governance** for autonomous systems.

## OSSA/DUADP governance pattern (ecosystem example)
OSSA and DUADP materials position security as layered:
- contract-level identity/policy declarations and signatures,
- discovery-level trust/federation metadata,
- runtime-level enforcement in execution environments [[R06]][[R07]][[R11]].

Whether or not this specific stack becomes dominant, the architecture pattern is consistent with broader zero-trust principles.

## Recommended control architecture (synthesized)

1. **Identity-first agent IAM**
   - Assign per-agent identity (no shared keys where avoidable).
   - Bind credentials to least privilege and revocation workflows.

2. **Pre-action policy enforcement**
   - Evaluate tool calls at execution time (not only at assignment time).
   - Add deny-by-default policies for irreversible operations [[R48]].

3. **Context hygiene and injection resistance**
   - Isolate untrusted content.
   - Use layered filtering/sanitization and constrained tool schemas [[R54]].

4. **Human-in-the-loop for high-impact actions**
   - Mandatory approval gates for financial, legal, infrastructure, and sensitive data actions [[R18]][[R19]].

5. **Continuous observability**
   - Full traceability of prompts, tool calls, policy decisions, and handoffs.
   - Retain evidence for post-incident review and compliance reporting [[R34]][[R36]].

## Governance and web-scale implications

- MIT AI Agent Index reports no established standards for agent web conduct [[R17]].
- Harvard legal/policy commentary frames open protocol governance as a key institutional decision point [[R53]].
- Imperva's bot-traffic findings indicate machine-origin traffic pressure is already substantial at internet scale [[R52]].

Combined implication: governance cannot wait for a single universal protocol; it must be layered and interoperable now.

## Research and implementation gaps

- Standardized red-team benchmarks for autonomous action safety are still nascent.
- Cross-protocol authorization semantics (MCP/A2A/discovery/UI) remain fragmented.
- Incident reporting norms for agent-caused failures are not yet mature or consistently public.
