# Security and governance research

Research run date: 2026-06-03. Citation keys resolve in `reading-list.md`.

## Executive security findings

Agent security is not just prompt security. Agents combine untrusted inputs, privileged data access, tool execution, memory, delegation, and long-running state. That creates failures traditional chatbot guardrails do not cover: prompt injection, excessive permissions, hallucinated actions, identity confusion, memory poisoning, delegation abuse, tool/API parameter manipulation, and runaway cost loops [dev-security-guide] [arxiv-attack-defense] [oap-paper].

The control objective is to move enforcement out of the model and into the runtime. Strong designs intercept each consequential action before it happens, evaluate declarative policy, constrain credentials, sandbox execution, log the decision, and escalate high-risk operations to humans [oap-paper] [cacm-guardians] [mit-tech-review-control-plane].

## Adoption and incident data

Gravitee's State of AI Agent Security 2026 survey is the strongest quantitative security source gathered in this run. It surveyed more than 900 executives and technical practitioners and found adoption far ahead of governance [gravitee-2026].

| Metric | Result |
| --- | ---: |
| Technical teams beyond planning | 80.9% |
| Teams past planning, rounded | 81% |
| Full security/IT approval for entire agent fleet | 14.4% |
| Average share of agents actively monitored or secured | 47.1% |
| Confirmed or suspected incidents in prior year | 88% |
| Healthcare confirmed or suspected incidents | 92.7% |
| Teams treating agents as independent identities | 21.9% |
| Teams relying on shared API keys for agent-to-agent auth | 45.6% |
| Technical teams using custom hardcoded authorization logic | 27.2% |
| Deployed agents able to create/task another agent | 25.5% |

The key inference is that "Shadow AI" is already a security condition: agents are touching production data before security teams can identify, monitor, or approve them [gravitee-2026].

MIT AI Agent Index provides a complementary transparency signal. Only 4 of 13 frontier-autonomy agents disclosed any agentic safety evaluations; 25 of 30 disclosed no internal safety results; 23 of 30 disclosed no third-party testing information; and there are no established standards for web conduct [mit-index] [mit-index-details].

## NIST/NCCoE identity and authorization

NIST/NCCoE published the concept paper "Accelerating the Adoption of Software and Artificial Intelligence Agent Identity and Authorization" on 2026-02-05, with public comments due 2026-04-02. The paper proposes a project to demonstrate how identity standards and best practices can apply to software agents, especially agentic AI applications [nist-agent-identity].

NIST's feedback questions are directly aligned with production agent risk:

- How are organizations using or planning to use AI agents?
- What new problems do AI agents create compared to other software?
- What standards guide AI agent identity and access management?
- What technologies support AI agents?
- How should systems handle identification, authorization, auditing, non-repudiation, and prompt-injection controls? [nist-agent-identity]

Secondary coverage of the concept paper identifies likely technology families: OAuth 2.0/2.1 and extensions, OpenID Connect, SPIFFE/SPIRE, SCIM, Next Generation Access Control, MCP, NIST SP 800-207 Zero Trust Architecture, SP 800-63-4 Digital Identity Guidelines, and NISTIR 8587 token/assertion protection [nist-secondary].

## Major threat categories

### Prompt injection and context poisoning

Prompt injection remains the dominant agent threat because agents ingest untrusted content and may confuse data with instructions. Indirect prompt injection can be embedded in web pages, documents, emails, retrieved chunks, or tool outputs, then trigger unauthorized tool calls [arxiv-attack-defense] [dev-security-guide].

The agent-specific concern is consequence. A chatbot may produce a bad response; an agent may transfer money, delete records, send emails, run shell commands, or delegate to another agent based on the injection [oap-paper] [dev-security-guide].

### Excessive permissions and shared credentials

Agents often run with API keys, service accounts, or inherited human credentials that are too broad for the current task. Gravitee found 45.6% of teams still relying on shared API keys for agent-to-agent authentication, making attribution and revocation weak [gravitee-2026].

The remedy is per-agent identity, least privilege, short-lived/task-scoped credentials, clear delegation boundaries, and revocation. DUADP and OSSA address this at discovery/contract layers through DID/GAID identity, signed manifests, trust tiers, and Cedar policies [duadp-site] [ossa-site].

### Hallucinated or manipulated actions

Agents can fabricate tools, call real tools with wrong parameters, or be manipulated into dangerous parameters within an authorized capability. Traditional API authentication only confirms access; it does not prove that the particular action is consistent with task, purpose, context, risk, and limits [dev-security-guide] [oap-paper].

Pre-action authorization solves this by checking tool name, parameters, agent passport, policy packs, assurance level, limits, and approval requirements before execution [oap-paper].

### Delegation-chain abuse and multi-agent propagation

Multi-agent systems create additional risks: prompt infection spreading between agents, delegation without attenuation, compromised sub-agents, authority laundering, and unclear accountability when agents create or task other agents [arxiv-multiagent-security] [arxiv-protocol-exploits] [agtp-draft].

A secure delegation model should monotonically narrow authority. A child or delegated agent should never receive more authority than its parent, and delegation chains should be auditable [oap-paper] [dev-security-guide].

### Web conduct and bot indistinguishability

MIT AI Agent Index found no established standards for web behavior, and browser agents often ignore robots.txt or bypass anti-bot systems [mit-index-details]. Imperva reports automated bot traffic exceeded human traffic in 2025, reaching more than 53% of web traffic, with AI agents now acting on behalf of users and blurring legitimate/malicious traffic distinctions [imperva-bad-bot].

AGTP is a response to this problem at the protocol layer: it argues that HTTP cannot distinguish agent-generated from human traffic and proposes mandatory agent identity and authority scope in a dedicated transport [agtp-draft].

## Governance and control patterns

### Pattern 1: Per-agent identity

Treat agents as first-class non-human identities. Assign unique IDs, provenance, owner, purpose, model/runtime, tool inventory, credential scope, revocation status, and audit stream [nist-agent-identity] [gravitee-2026].

OSSA's GAID/DID and signed manifest approach and DUADP's WebFinger/DID/signature/trust-tier pipeline are examples of this direction [ossa-site] [duadp-site].

### Pattern 2: Deterministic pre-action authorization

Use a blocking hook before every tool call. The decision must be deterministic, fail-closed, auditable, and outside the model's reasoning path. OAP formalizes this as `authorize(tool_call, passport, policy) -> decision, audit_entry`, where decisions are ALLOW, DENY, or ESCALATE [oap-paper].

This control can block prompt-injected actions even if the model has been persuaded, because the model is only requesting a tool call; the runtime enforces policy before the side effect [oap-paper] [dev-security-guide].

### Pattern 3: Sandboxed execution

Sandboxing contains blast radius for code execution, file access, network egress, and subprocess risks. It does not replace pre-action authorization because it may allow legitimate-looking API calls that violate business policy. The OAP paper explicitly treats pre-action authorization, sandboxed execution, and model-based screening as complementary [oap-paper].

### Pattern 4: Human-in-the-loop for high-risk actions

Use human approval gates for irreversible, high-value, regulated, destructive, or ambiguous actions: payments, deletes, access-control changes, production deploys, legal commitments, medical/financial advice, data export, and external communications [47billion-production] [mit-sloan-agentic].

MIT Sloan warns that too much supervision negates autonomy, while too little creates risk. The practical answer is dynamic, risk-based oversight, not blanket approval for every step [mit-sloan-agentic].

### Pattern 5: Continuous monitoring and replayable audit

Capture every prompt-visible context source, tool request, policy decision, credential used, output artifact, human approval, and external side effect. Gravitee's finding that only 47.1% of agents are actively monitored or secured shows monitoring is a major gap [gravitee-2026].

Audit records should be replayable and tamper-evident. OAP proposes Ed25519-signed authorization records; AgentMint-style systems and similar runtime guardrails use signed receipts and hash chains [oap-paper] [dev-security-guide].

### Pattern 6: Cost and loop controls

Agents can enter expensive loops, repeatedly call tools, expand context, spawn sub-agents, or run long conversations. Production systems need maximum tool calls, maximum iterations, per-task budgets, token/inference cost alerts, and termination policies [47billion-production].

## Governance frameworks and standards

| Framework / source | Relevance |
| --- | --- |
| NIST/NCCoE agent identity concept paper | Enterprise identity, authorization, auditing, non-repudiation, prompt-injection controls [nist-agent-identity] |
| NIST AI RMF | Risk management mapping; DUADP and OSSA claim alignment [duadp-site] [ossa-site] |
| OWASP LLM Top 10 / Agentic AI Top 10 | Threat taxonomy for prompt injection, tool misuse, identity abuse, memory poisoning, cascading failures [arxiv-attack-defense] [microsoft-governance-toolkit] |
| MIT AI Agent Index | Transparency, autonomy, safety disclosure, web conduct evidence [mit-index] |
| OAP / pre-action authorization | Concrete architecture for deterministic per-tool-call policy [oap-paper] |
| Agentic Operating Model | Organizational governance: cognitive, coordination, control, governance layers [cmr-agentic-enterprise] |
| Control-plane architecture | Central layer governing who can run which agents, with what permissions, policies, models, tools, and auditability [mit-tech-review-control-plane] |

## Recommended baseline controls

1. Maintain an agent inventory with owner, purpose, runtime, model, tools, data classes, credentials, and external endpoints.
2. Require unique per-agent identity; prohibit shared API keys for production agent-to-agent or agent-to-tool access.
3. Scope credentials by task and time; prefer just-in-time credentials and revocation.
4. Enforce allowlisted tools and strict schemas for all tool inputs/outputs.
5. Intercept every write/destructive/external action with pre-action authorization.
6. Require human approval for irreversible, regulated, high-value, or high-blast-radius operations.
7. Sandbox code execution and constrain filesystem, network, subprocess, and environment access.
8. Treat tool output and retrieved content as untrusted input.
9. Log prompts, retrieved context identifiers, tool calls, policy decisions, approvals, outputs, and side effects with tamper-evident records.
10. Set cost, token, iteration, runtime, and sub-agent spawning budgets.
11. Test with adversarial scenarios before production and continuously after release.
12. Publish safety/system cards or equivalent disclosures for agents exposed to users or third parties.

## How OSSA/DUADP map to controls

OSSA addresses contract-time governance: schema validation, signed manifests, SBOM/provenance, GAID/DID identity, Cedar policies, compliance metadata, human-in-the-loop declarations, cost controls, observability config, and export fidelity [ossa-site] [local-readme].

DUADP addresses discovery-time governance: GAID lookup, WebFinger resolution, DID verification, signature/provenance checks, trust-tier gating, revocation mesh, federation witnesses, and policy-aware publishing/search [duadp-site].

Neither eliminates runtime enforcement requirements. They make identity, declaration, discovery, and policy metadata portable so that runtimes and gateways can make stronger decisions before execution [duadp-site] [ossa-site] [oap-paper].
