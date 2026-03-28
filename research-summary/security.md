# Security and Governance for Agentic AI (2025-2026)

This document summarizes major threat evidence, governance frameworks, and practical controls for agentic systems. Citations use keys in `reading-list.md`.

## 1) Security posture snapshot (2026)

The strongest quantitative signal in this research set is that deployment maturity now exceeds governance maturity:

- 81% of teams are past planning,
- only 14.4% report full security/IT approval,
- 88% report confirmed or suspected incidents,
- only about 22% treat agents as independent identities,
- many teams still rely on shared credentials [T45][T46][T44].

Even with vendor-report caveats, this pattern aligns with technical literature: expanded attack surface from tool use, autonomy, and cross-agent workflows is outpacing default enterprise controls [T50][T48][T49].

## 2) Main threat classes

### 2.1 Prompt injection (direct and indirect)

Prompt injection remains the most frequently cited high-severity risk because it can redirect agent behavior without breaking classical authentication [T48][T49][T53].

- WASP benchmark results show high partial attack success in realistic web-agent workflows [T48].
- WebInject demonstrates successful optimization-based injection against multimodal web agents [T49].

### 2.2 Over-permissioned tools and authorization drift

Agent runtime identities often inherit broad service permissions intended for backend systems, creating large blast radii when agent reasoning fails or is manipulated [T46][T53].

### 2.3 Weak identity and attribution

When many agents share API keys or generic service accounts, incident attribution, revocation, and forensic chain-of-custody degrade significantly [T46][T47].

### 2.4 Low observability and delayed audits

Periodic/manual audits are too slow for autonomous workflows; low real-time monitoring coverage creates long dwell times for policy violations [T46].

### 2.5 Multi-agent chain-of-command risk

As agents begin delegating to other agents, authorization models that are valid for single-agent flows can fail under transitive delegation, especially without visibility into A2A interactions [T46][T50].

## 3) Governance and standards direction

## 3.1 NIST/NCCoE direction

The NCCoE concept paper explicitly frames software/AI agent identity and authorization as a standards gap and requests feedback on:

- identification/authentication,
- authorization,
- auditing and non-repudiation,
- controls to prevent/mitigate prompt injection [T47].

This is significant because it signals movement from abstract AI policy toward concrete identity and control primitives for agent ecosystems.

### 3.2 University and policy framing

- MIT work emphasizes transparency and safety-evaluation disclosure deficits in deployed agents [T10][T11].
- Harvard protocol/governance writing highlights institutional stakes for who controls agent behavior norms: platform-level control vs open protocol ecosystems [T08][T14].

## 4) Control model: minimum viable secure agent architecture

Across sources, the most defensible near-term model is:

1. **Unique agent principal identity**
   - Avoid shared keys; issue per-agent credentials and lifecycle controls [T46][T47].

2. **Policy-mediated authorization**
   - Enforce action-level policies (not only endpoint-level auth).
   - Apply least-privilege scopes, contextual restrictions, and high-risk approval gates [T47][T53].

3. **Tool sandboxing and constrained execution**
   - Restrict filesystem/network/process access for code-executing paths.
   - Whitelist tool capabilities where practical [T50][T53].

4. **Continuous observability**
   - Capture tool calls, policy decisions, delegation events, and model context lineage for incident response [T46][T50].

5. **Revocation and kill-switch operations**
   - Support immediate credential/policy revocation and runtime disable paths [T46][T53].

6. **Human-in-the-loop for high-impact actions**
   - Keep explicit approval boundaries for destructive, financial, legal, or regulated actions [T12][T46].

## 5) Mapping major risks to controls

| Risk class | Typical failure mode | Baseline controls |
| --- | --- | --- |
| Prompt injection | Agent follows adversarial hidden/embedded instructions | Context isolation, retrieval/input filtering, output/action guardrails, approval checkpoints [T48][T49][T50] |
| Excessive permissions | Agent executes beyond intended scope | Per-agent identity, scoped tokens, policy engine checks, JIT credentials [T46][T47] |
| Hallucinated actions | Invalid/unsafe tool invocation | Schema validation, tool allowlists, deterministic wrappers, action simulation before commit [T50][T53] |
| Weak attribution | Cannot identify responsible agent/version | Strong identity, signed events, immutable audit trails [T46][T47] |
| Replay/automation abuse | Repeated malicious action requests | Nonce/timestamp checks, anti-replay tokens, rate limits [T47][T53] |
| Delegation escalation | Unbounded cross-agent authority propagation | Delegation policies, chain-of-command visibility, scope attenuation [T46][T50] |

## 6) Practical security roadmap for teams deploying now

### Phase A: Before production

- Build asset inventory of agents, tools, and data permissions.
- Define risk tiers for actions (read-only, bounded write, high-impact write).
- Introduce per-agent identity issuance and short-lived credentials.
- Add policy checks in front of all tool execution.

### Phase B: Early production

- Enable central logging for tool calls + policy outcomes.
- Add detection for anomalous agent action patterns.
- Enforce approval gates for high-risk tiers.
- Run adversarial prompt-injection tests on representative workflows [T48][T49].

### Phase C: Scale-up

- Introduce delegation-aware authorization models.
- Add automated policy regression testing in CI/CD.
- Track security KPIs: unsafe action rate, policy denial rate, time-to-revoke, and monitored-agent coverage [T50][T46].

## 7) Residual risks and open research questions

- Robustly separating instruction from untrusted content remains unsolved in general settings [T48][T49][T50].
- Secure multi-agent delegation semantics are still immature in many production deployments [T46][T50].
- Standardized cross-vendor identity/authorization profiles for agents are still emerging [T47].
- Vendor reports provide valuable signals but need broader independent validation [T44][T45].

## Bottom line

The evidence suggests agentic security is now primarily an **identity-and-governance execution problem**, not an awareness problem. Organizations generally understand the risks; what they still lack is consistent implementation of strong agent identity, policy-mediated tool authorization, and continuous runtime visibility [T46][T47][T50].
