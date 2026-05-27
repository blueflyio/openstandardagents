# Security, Governance, Identity, and Risk

Prepared on May 27, 2026. Citations use tether IDs from `reading-list.md`.

## Security posture in 2026

Agent adoption is ahead of agent governance. Gravitee's State of AI Agent Security 2026 survey of more than 900 executives and practitioners found:

- 80.9% of technical teams are past planning and in active testing or production [S17].
- Only 14.4% report that all agents go live with full security/IT approval [S17].
- On average, only 47.1% of agents are actively monitored or secured [S17].
- 88% report confirmed or suspected AI-agent security incidents during the 12 months preceding Gravitee's February 2026 report; healthcare rises to 92.7% [S17].
- Only 21.9% treat agents as independent identity-bearing entities [S17].
- 45.6% still rely on shared API keys for agent-to-agent authentication [S17].
- 27.2% reverted to custom hardcoded authorization logic [S17].

MIT's AI Agent Index independently finds that safety transparency lags capability disclosure: 25 of 30 agents disclose no internal safety results, 23 of 30 have no third-party testing, and only 4 of 13 frontier-autonomy agents disclose any agentic safety evaluations [S14].

## Threat model

Agent systems add security risks because LLMs can move from text generation to execution. A single prompt-injected or hallucinated decision can become a file write, shell command, database update, email, refund, deployment, or delegated subtask.

The 2026 agentic AI security survey organizes agent security around multiple components: LLMs, memory, tools, external environments, user interfaces, and multi-agent workflows [S28]. Its key attack vectors include:

- Indirect prompt injection through public web pages, documents, emails, or retrieved content [S28].
- Malicious data injection, including data that triggers unsafe downstream operations [S28].
- Tool poisoning or manipulation through malicious tool names, descriptions, or implementations [S28].
- Direct prompt injection from user-controlled input [S28].
- Memory poisoning or leakage [S28].
- Model poisoning, especially when the attacker can influence internal model components [S28].

The same survey identifies common security risks:

- Heterogeneous untrusted interfaces.
- Wrong instruction following.
- Unconstrained data flow.
- Hallucinations and model mistakes.
- Private data leakage.
- Unauthorized action and data corruption.
- Resource drain and denial of service [S28].

## Prompt injection is not just a content problem

Prompt injection is dangerous in agents because injected instructions can steer tool calls. In a chatbot, a bad instruction may produce bad text. In an agent, the same bad instruction may call a privileged API, run shell commands, or poison memory for later runs [S27][S28].

Security controls that live only in prompts are weak because the model is both the policy interpreter and the component under attack. DEV Community guidance summarizes the production principle: prompts are not guardrails; IAM, network filters, credential scoping, runtime isolation, and external policy enforcement are guardrails [S34].

## Identity and authorization

NIST/NCCoE's February 5, 2026 concept paper scopes a project for applying identity standards and best practices to software and AI agents [S16]. The paper asks for input on:

- Use cases for AI agents.
- Unique challenges compared with other software.
- Current and emerging identity/access standards.
- Identification, authorization, auditing, non-repudiation, and prompt-injection controls [S16].

The key direction is to treat agents as distinct principals. Existing human/service-account patterns are insufficient when agents can act autonomously, delegate tasks, or create/instruct other agents [S16][S17].

Relevant identity/control primitives include:

- OAuth/OIDC for delegated API access.
- SPIFFE/SPIRE and workload identity for service-to-service identity.
- W3C DIDs and Verifiable Credentials for portable agent identity.
- WebFinger and well-known endpoints for discovery.
- Policy-based access control, ABAC, Cedar, OPA, or Datalog-like policy engines.
- Signed audit records and non-repudiation [S16][S26][S29].

## Know Your Agent

Harvard JOLT's agentic web commentary argues that KYA standards should establish who an AI agent is, on whose behalf it acts, and under what delegated authority [S26]. At minimum, KYA requires:

1. Agent identity via cryptographically verifiable credentials.
2. Principal-agent linkage.
3. Delegation parameters, including purposes, limits, and revocability.
4. Auditability and behavioral record-keeping [S26].

This maps directly to what DUADP and OSSA attempt to encode technically: GAIDs/DIDs, signed manifests, trust tiers, provenance, governance metadata, and revocation/audit surfaces [S01][S02].

## Recommended control architecture

### 1. Unique identity per agent

Every production agent should have its own identity, independent of the human user and independent of generic service accounts. The identity should carry:

- Agent name/version/build provenance.
- Owner/principal.
- Authorized tools and scopes.
- Trust tier or assurance level.
- Revocation status.
- Audit log correlation identifiers [S16][S17][S26].

### 2. Least privilege and task-scoped credentials

Agents should receive short-lived, narrow credentials. Avoid shared API keys. For high-risk tasks, mint task-specific credentials with explicit expiration, scope, and policy context [S17][S29].

### 3. Pre-action authorization

Tool calls should pass through a blocking authorization point before execution. The OAP paper formalizes this as `authorize(tool_call, passport, policy_pack) -> (decision, audit_log_entry)` with deterministic, fail-closed evaluation and signed audit entries [S29].

Policy should cover:

- Capability allowlists.
- Parameter constraints.
- Data classification constraints.
- Allowed domains/recipients.
- Spending or transaction limits.
- Environment limits.
- Required human approval for high-impact operations [S29].

### 4. Sandboxed execution

Sandboxing contains blast radius when a permitted or missed action does something dangerous. LGA recommends OS-level isolation, path allowlists, network proxying, and separation from the semantic layer [S27]. For browser or coding agents, use microVMs, containers, gVisor/Firecracker-style isolation, or equivalent hardened runtimes.

### 5. Zero-trust inter-agent communication

Multi-agent systems need authentication, minimum-privilege capability tokens, schema validation, TTLs, and provenance checks between agents [S27]. A2A/ACP/ANP can carry task or communication semantics, but they do not remove the need for policy enforcement [S06][S08][S10].

### 6. Immutable or tamper-evident audit logs

Audit records should capture agent identity, principal, tool name, parameters, decision, model/runtime context, timestamps, and evidence. For higher-risk systems, use append-only logs, hash chains, signed records, write-once storage, or event ledgers [S27][S29][S34].

### 7. Human-in-the-loop gates

Use HITL selectively for high-impact actions such as payments, production mutations, destructive shell commands, permission changes, external communications, and legal/medical/financial decisions. Broad HITL for every action undermines productivity; risk-based HITL preserves autonomy where safe [S15][S29][S34].

## Web conduct and bot governance

The public web is becoming machine-dominated. Imperva's 2026 Bad Bot Report says automated traffic accounted for more than 53% of web traffic in 2025, up from 51% in 2024, and APIs were targeted by 27% of bot attacks [S25]. MIT's index says there are no established standards for how agents should behave on the web, and some agents are designed to bypass anti-bot protections [S14].

Controls needed for web-facing agents:

- Agent self-identification where appropriate.
- Respect for robots.txt, API terms, and platform-specific agent policies.
- KYA credentials where agents act on behalf of users.
- Rate limits and business-intent controls.
- Audit trails for browsing, form submission, and transaction actions.
- Distinguishing delegated, authorized agents from malicious automation [S14][S25][S26].

## Security-by-design checklist

| Area | Minimum control |
| --- | --- |
| Identity | Unique agent principal, owner, version, revocation |
| Authentication | No shared keys; short-lived scoped credentials |
| Authorization | Deterministic pre-action policy before tool execution |
| Tooling | Schema validation, parameter constraints, risk classification |
| Runtime | Sandbox, network egress filtering, filesystem isolation |
| Data | Data classification, DLP, no uncontrolled memory writes |
| Multi-agent | Signed messages, TTL capability tokens, provenance |
| Audit | Tamper-evident log of attempted and executed actions |
| HITL | Required for destructive, financial, legal, or production-changing actions |
| Observability | Traces for LLM calls, tool calls, state transitions, costs |
| Incident response | Revoke agent identity, rotate credentials, replay audit trail |

## Residual risks

- Authorized actions can still be wrong if business policy is incomplete.
- Model-based intent classifiers are probabilistic and can be attacked.
- Sandboxes can have escape bugs or overbroad egress.
- Agent memory can preserve poisoned or sensitive information across sessions.
- Multi-agent systems can amplify small failures across delegation chains.
- Protocol adoption can create monoculture risk if common libraries have vulnerabilities.

The safe conclusion is defense in depth: identity, deterministic authorization, sandboxing, observability, auditability, and governance must reinforce each other.
