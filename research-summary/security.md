# Security and governance research

Compiled on June 9, 2026.

## Executive security view

Agent security is an execution-layer problem. Prompt filters and model policies
matter, but they do not reliably control agents that can call tools, write
files, send messages, query databases, deploy code, move money, or delegate work
to other agents [S36][S39]. The control point must be the action boundary:
identity, authorization, policy evaluation, scoped credentials, human approval,
logging, revocation, and incident response around every consequential tool call
[S35][S36][S42].

The empirical data shows that risk is no longer hypothetical. Gravitee's 2026
survey reports that 81% of teams are beyond planning, only 14.4% have full
security approval for their agent fleet, 88% reported confirmed or suspected
security incidents, and fewer than 22% treat agents as independent identities
[S35]. The UK AI Security Institute's MCP-tool study shows action-oriented
tools grew from 27% to 65% of usage between November 2024 and February 2026
[S15]. Agents are increasingly changing external state, not just retrieving
information.

## Major threat categories

### Prompt injection and instruction/data confusion

Direct and indirect prompt injection remain the most cited risks. A malicious
webpage, email, tool result, or tool description can include instructions that
the model treats as higher-priority commands [S36]. This is especially dangerous
when the agent has broad tools or credentials. Dev.to security guides recommend
assuming prompt injection will happen and building a kill chain around the model
with permission boundaries, action gating, input sanitization, output
monitoring, and blast-radius containment [S36].

ACM's "Guardians of the Agents" argues that the structural failure is the model's
inability to reliably distinguish data from instructions [S39]. The proposed
defense is to separate workflow generation from execution, verify the workflow
against formal constraints, and execute only verified workflows [S39].

### Excessive permissions and shared credentials

Excessive agency occurs when an agent has more tool access, data access, or
autonomy than the task requires [S36]. Gravitee reports that most organizations
still rely on shared API keys rather than treating agents as independent
identity-bearing actors [S35]. That creates weak auditability, poor revocation,
and broad blast radius if an agent session is compromised.

Least privilege for agents must include:

- Task-scoped, short-lived credentials rather than static API keys [S36].
- Tool allowlists and endpoint-level policy [S36].
- Separate user, agent, service, and session identities [S35][S37].
- Review of aggregate permission creep over time [S36].
- Revocation events and trust invalidation across registries or discovery
  meshes [S01][S42].

### Hallucinated and brittle actions

Hallucinations are more dangerous when connected to tools. MIT Sloan highlights
hallucinations, mistakes, prompt injection, and hijacking as reasons agentic AI
is not ready for broad unsupervised deployment [S12]. Reliability research shows
that higher task accuracy does not guarantee consistency, robustness,
predictability, or bounded safety [S14]. A system that succeeds 90% of the time
may still be unsafe if failures are severe, silent, or hard to predict.

### Protocol and composition vulnerabilities

Hou et al.'s MCP security analysis maps 16 threat scenarios across malicious
developers, external attackers, malicious users, and inherent security flaws
[S38]. The broader workflow-threat survey catalogs more than 30 attack
techniques across input manipulation, model compromise, system/privacy attacks,
and protocol vulnerabilities in MCP, ACP, ANP, and A2A [S41].

Composition is a special risk. Security properties that hold for one protocol
can fail when protocols share infrastructure, credentials, gateways, or
delegation chains [S41]. For example, an MCP tool result can influence an A2A
delegation, which then emits AG-UI events to a user interface. Each layer needs
clear provenance and policy boundaries.

## NIST/NCCoE identity and authorization work

NIST's National Cybersecurity Center of Excellence released a February 2026
concept paper on applying identity standards and best practices to software and
AI agents [S35]. The paper's goal is to reduce implementation risk by
demonstrating how identity and authorization standards can be applied to
agentic architectures [S35].

The concept paper asks for input on agent identification, authorization,
auditing, non-repudiation, prompt-injection mitigation, and standards used for
agent identity/access management [S35]. It explicitly considers standards and
practices such as OAuth 2.0/2.1, OpenID Connect, SPIFFE/SPIRE, SCIM, NGAC, MCP,
Zero Trust Architecture, digital identity guidelines, and token-protection
guidance [S35].

The core direction is adaptation rather than invention: use mature identity and
authorization primitives, but adapt them to agents that can act autonomously,
delegate, and operate with variable context [S35]. The anti-pattern is a fleet
of agents sharing static API keys or inheriting broad human permissions [S35].

## Runtime governance patterns

### Admission control

Agent Control Protocol research defines ACP as an admission-control layer
between agent intent and system state mutation [S42]. Before execution, an
agent action must pass a cryptographic check validating identity, capability
scope, delegation chain, and policy compliance [S42]. This is not a replacement
for RBAC or Zero Trust; it adds agent-specific governance and auditability on
top [S42].

### Generate-verify-execute

ACM's generate-verify-execute pattern is a practical way to enforce policies
before irreversible operations [S39]. The agent generates a workflow. A verifier
checks it against explicit constraints, preconditions, postconditions, and
invariants. Only then does execution proceed [S39]. This pattern is useful for
coding agents, database agents, email agents, financial agents, and any workflow
with side effects.

### Policy gateways

Security guides recommend a gateway that intercepts every tool call and checks:
tool name, arguments, user identity, agent identity, session, risk level,
environment, data classification, and whether human approval is required
[S36]. The gateway should produce allow, deny, constrain, or route-for-approval
decisions. It should also broker downstream credentials only after authorization
[S36].

### Human-in-the-loop checkpoints

HITL should be targeted, not universal. Require approval for irreversible,
destructive, sensitive, regulated, or high-value actions: sending email,
publishing content, deleting records, changing access controls, moving money,
deploying to production, exporting sensitive data, and invoking physical-world
controls [S36]. Low-risk read-only actions can often be automated once identity,
logging, and rate limits are in place.

## Trust, discovery, and supply chain

Discovery without trust is dangerous. DUADP addresses this by combining GAID
lookup handles, WebFinger resolution, DID documents, signatures, provenance,
revocation, trust tiers, and Cedar policy evaluation [S01]. OSSA addresses it
at the manifest level by declaring identity, capabilities, compliance, cost,
security, trust, and lifecycle data in a portable contract [S02][S03].

The Harvard JOLT KYA model adds institutional framing: an agent should have a
cryptographically verifiable identity, a link to its principal, bounded
delegation parameters, and auditable behavior records [S37]. This matches NIST's
focus on identification, authorization, auditing, and non-repudiation [S35].

## Security controls checklist

| Control | Why it matters | Sources |
| --- | --- | --- |
| Agent identity separate from user identity | Enables audit, revocation, and least privilege | [S35][S37] |
| Short-lived scoped tokens | Limits compromise blast radius | [S36] |
| Deny-by-default tool allowlist | Prevents unauthorized tool expansion | [S36] |
| Pre-execution policy engine | Enforces safety at action boundary | [S39][S42] |
| HITL for irreversible actions | Keeps humans accountable for high-risk changes | [S12][S36] |
| Signed manifests and provenance | Defends against tool poisoning and supply-chain ambiguity | [S01][S02][S38] |
| Runtime traces and immutable logs | Supports forensics and non-repudiation | [S26][S35][S42] |
| Revocation and trust invalidation | Removes compromised agents/keys across systems | [S01][S42] |
| Reliability profile beyond accuracy | Captures brittleness, inconsistency, and safety | [S14] |
| Protocol composition review | Prevents cross-protocol trust-boundary failures | [S41] |

## Recommendations

1. Inventory every agent, tool, MCP server, protocol endpoint, and connected
   data source. Include who owns it, which model it uses, which credentials it
   can access, and whether it can mutate state [S12][S35].
2. Require independent agent identities with lifecycle management, not shared
   API keys [S35].
3. Place a policy gateway before every tool execution surface. Do not rely on
   prompts to enforce access control [S36][S39].
4. Scope credentials by task, session, user, and environment. Rotate and revoke
   automatically [S36].
5. Add HITL checkpoints for high-risk actions, but keep low-risk paths
   automatable to avoid destroying the value of agents [S12][S36].
6. Sign manifests, verify tool/server metadata, and track provenance. Treat tool
   descriptions as untrusted input [S01][S02][S38].
7. Use trace IDs that connect user request, agent identity, prompts, tool calls,
   approvals, outputs, and downstream effects [S26][S35].
8. Test against prompt injection, retrieval poisoning, malicious tool plugins,
   and protocol exploits before production [S40][S41].
9. Measure reliability with consistency, robustness, predictability, and safety
   metrics, not just benchmark success [S14].
10. Review multi-protocol composition explicitly when MCP, A2A, ACP, ANP,
    AG-UI, OSSA, and DUADP are combined [S21][S38][S41].
