# Security and Governance Research

_Report date: 2026-03-11_

## 1) Threat model baseline for agentic systems

The most recurrent production threats across sources:

1. **Prompt injection** (direct and indirect)  
2. **Excessive permissions / over-broad credentials**  
3. **Hallucinated or unsafe actions** (especially with tool execution)  
4. **Weak identity and authorization semantics for autonomous software actors**

These are repeatedly described as architecture and control-plane problems, not just model-quality issues.[SRC-39][SRC-40][SRC-46]

## 2) Empirical security state (2026 snapshot)

Gravitee’s 2026 State of AI Agent Security reporting indicates an adoption-governance gap:

| Metric | Reported value |
|---|---:|
| Teams beyond planning phase | 81% |
| Teams with full security approval | 14.4% |
| Organizations reporting confirmed/suspected incidents | 88% |
| Teams treating agents as independent identities | <22% (report framing) |

Source context: Gravitee report + associated methodology/post (900+ respondents claimed). Use as directional evidence; verify with independent surveys when making regulatory commitments.[SRC-37][SRC-38]

## 3) Identity and authorization direction (NIST/NCCoE)

NIST’s AI Agent Standards Initiative and linked NCCoE direction prioritize:
- trusted, interoperable, secure agent adoption,
- industry-led standards and open protocol participation,
- and concrete identity/authorization implementation guidance for software/AI agents.[SRC-41]

Implication: teams should design for **agent-native IAM** now (unique identities, scoped delegation, full auditability), even before final standards settle.

## 4) University and index signals on transparency and control

MIT AI Agent Index and companion publication emphasize transparency gaps and weak public disclosure in ecosystem interaction/safety fields, including unclear web-conduct practices and limited safety-evaluation reporting coverage.[SRC-43][SRC-45]  
MIT Sloan practical guidance similarly warns that current hallucination/prompt-injection risk still necessitates meaningful human oversight.[SRC-46]

## 5) Engineering controls that recur across sources

### Minimum viable control stack
1. **Per-agent identity** (no shared keys for autonomous actions)  
2. **Policy-based authorization** (least privilege + action-level checks)  
3. **Tool/output sanitization and prompt-injection defenses**  
4. **Deterministic pre-execution gates for irreversible actions**  
5. **Tracing + immutable audit logs + incident replay**

This aligns across enterprise guidance, practitioner security articles, and standards initiatives.[SRC-39][SRC-40][SRC-41]

### Control maturity model (practical)
- **Level 1**: single agent, shared credentials, basic logging (high risk).  
- **Level 2**: separate service identities, scoped permissions, tool allowlists.  
- **Level 3**: policy-as-code, context filtering, HITL for high-risk actions.  
- **Level 4**: cross-agent trust fabric, federated identity, continuous verification.

## 6) Recommended governance checklist (2026)

- Maintain an **agent inventory** (owner, model, tools, permissions, data scope).
- Require **risk classification** before enabling autonomous action.
- Enforce **credential segmentation** and short-lived delegated tokens.
- Add **approval workflows** for finance/security/compliance-impacting actions.
- Simulate prompt-injection and tool-misuse scenarios in pre-prod.
- Track **mean-time-to-detect** and **mean-time-to-contain** for agent incidents.

## 7) Residual risk

Even with strong controls, unresolved risks remain:
- cross-protocol trust translation (MCP/A2A/other stacks),
- emergent behavior in multi-agent loops,
- and legal accountability for delegated autonomous decisions.

Treat 2026 deployments as high-change systems requiring continuous red-team and governance iteration.
