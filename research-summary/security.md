# Security and Governance Research (2025-2026)

## Executive findings

Across sources, the same pattern repeats: technical capability is scaling faster than operational controls.

- **81%** of teams moved past planning, but only **14.4%** have full security approval.
- **88%** report confirmed or suspected incidents.
- Only about **22%** treat agents as independent identities.[R42][R43]

This is aligned with NIST/NCCoE’s framing that identity, authorization, auditing, and prompt-injection controls must be adapted specifically for software/AI agents.[R55]

---

## Primary threat model categories

## 1) Prompt injection and instruction hijack

Prompt injection remains a dominant risk: untrusted content can redirect behavior, trigger unsafe tool use, or leak sensitive context.[R44][R45][R63]

Research and practitioner guidance emphasize that no single mitigation is sufficient; layered controls are required (input filters, context isolation, policy gates, runtime checks).[R45][R63]

## 2) Excessive permissions and confused-deputy behavior

Agents often inherit broad service-account permissions, creating mismatch between intended authority and actual runtime capability.[R42][R44]

This leads to confused-deputy risk where legitimate credentials are used for unintended actions.

## 3) Hallucinated or mis-scoped actions

Even without explicit attack prompts, model/planner errors can produce incorrect tool calls or dangerous parameterization.[R44][R54]

## 4) Weak identity and poor attribution

Shared API keys and generic service identities reduce accountability and make incident response difficult. Multi-agent delegation chains further complicate provenance.[R42][R43][R55]

## 5) Monitoring and audit latency

Periodic audits are misaligned with high-speed autonomous actions; many organizations report partial visibility across deployed agent fleets.[R43]

---

## Empirical sources and signals

## Gravitee 2026 report data

The report’s strongest contribution is not only incident percentages but systems-level observations:

- monitoring coverage gaps,
- identity fragmentation,
- reliance on hardcoded/shared auth methods,
- mismatch between executive confidence and technical observability.[R42][R43]

## MIT AI Agent Index transparency gap

MIT Index findings reinforce governance concerns: capability disclosures outpace safety/evaluation disclosures, especially for high-autonomy systems.[R51][R52]

## Web-agent security benchmarks

WASP benchmark results show realistic prompt injections can partially succeed against state-of-the-art agents in a substantial share of tested scenarios.[R63]

## Conference/workshop security analysis

ICSE/RAIE 2025 workshop paper "Security of AI Agents" identifies framework-level vulnerabilities and proposes defense mechanisms from a system-security perspective.[R60]

---

## Identity and authorization frameworks

## NIST/NCCoE concept direction

NCCoE’s concept paper calls for public input and practical demonstrations around:

- identification/authentication of software + AI agents,
- authorization and delegation controls,
- auditing and non-repudiation,
- prompt-injection prevention/mitigation controls.[R55]

## Protocol ecosystem implications

As A2A, MCP, and related standards expand, identity and policy must be layered consistently across:

1. agent-to-tool paths,
2. agent-to-agent delegation,
3. user-agent approvals/escalations.[R07][R10][R14]

---

## Control recommendations (actionable)

1. **Identity first:** unique identity per agent instance/class of agent; avoid shared credentials by default.[R42][R55]
2. **Policy at execution boundary:** enforce action-level policy before tool invocation, not only at login time.[R44][R55]
3. **Least privilege + bounded delegation:** dynamic scopes tied to context/task and revocation support.[R43][R55]
4. **Prompt/data isolation:** separate untrusted content handling from privileged action planning paths.[R45]
5. **High-risk human approval gates:** irreversible or high-impact actions require explicit user/org confirmation.[R44][R53]
6. **Continuous monitoring:** move from periodic audit to near-real-time event/trace analysis for agent actions.[R43]
7. **Failure-safe design:** timeout, circuit-breaker, and kill-switch patterns for agent workflows.[R40][R44]

---

## Governance posture for 2026

The most resilient posture is to treat agents as **first-class security principals** with:

- explicit delegated authority,
- constrained execution rights,
- auditable action traces,
- and lifecycle governance (creation, approval, runtime, retirement).

Absent that shift, deployment growth will continue to outpace control maturity.

