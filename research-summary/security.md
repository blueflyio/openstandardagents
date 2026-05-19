# Security and Governance Research

Compiled on May 19, 2026.

## Summary of major risks

Agent security is fundamentally an identity, authorization, and runtime control
problem. Prompt injection matters, but the worst outcomes occur when injected
or hallucinated instructions are combined with excessive tools, excessive
permissions, excessive autonomy, shared credentials, and weak auditability
[S28][S30][S31].

The recurring threat model is:

1. An agent reads untrusted content, tool output, web content, email, documents,
   or another agent's message.
2. The LLM interprets malicious or ambiguous text as an instruction.
3. The agent selects a tool or delegates to another agent.
4. The tool call is valid under existing credentials, even if the action is
   not authorized by business policy.
5. The system lacks complete mediation, human approval, or usable audit traces.

## Empirical security data

Gravitee's State of AI Agent Security 2026 report surveyed more than 900
executives and technical practitioners [S28]. Its main statistics are:

| Finding | Value |
| --- | ---: |
| Technical teams past planning into testing or production | 80.9% |
| Organizations with full security/IT approval for all agents | 14.4% |
| Organizations with confirmed or suspected agent incidents in prior year | 88% |
| Healthcare organizations with confirmed or suspected incidents | 92.7% |
| Average share of agents actively monitored or secured | 47.1% |
| Teams treating agents as independent identities | 21.9% |
| Teams using shared API keys for agent-to-agent auth | 45.6% |
| Technical teams using custom hardcoded authorization logic | 27.2% |
| Deployed agents able to create and task other agents | 25.5% |

Gravitee's incident follow-up found six common patterns: agents with broader
access than intended, governance arriving after deployment, third-party AI
dependency risk, quiet data leaks through prompts/logs/outputs, prompts used as
an attack surface, and near-misses that forced reactive controls [S40].

The report's conclusion is that most failures are not "rogue models." They are
missing governance, identity, and runtime policy enforcement around autonomous
actors [S28][S40].

## NIST/NCCoE identity and authorization concept paper

NIST NCCoE released the concept paper "Accelerating the Adoption of Software
and Artificial Intelligence Agent Identity and Authorization" on February 5,
2026, with comments due April 2, 2026 [S20]. The proposed project focuses on
applying identity standards and best practices to software agents, especially
agentic AI applications that autonomously perform tasks using enterprise data,
tools, and applications [S20].

NIST's requested feedback areas are directly relevant to production agent
programs:

- Agent deployment use cases.
- Unique challenges compared with other software.
- Current and emerging standards for agent identity and access management.
- Technologies used to support agents.
- Identification, authorization, auditing, and non-repudiation.
- Controls to prevent and mitigate prompt injection [S20].

The NIST paper is important because it validates that agents need explicit
identity and authorization standards. Existing IAM practices can be reused, but
must be adapted for non-human actors that operate autonomously, delegate tasks,
and trigger machine-speed actions [S20][S28].

## OWASP LLM01: Prompt Injection

OWASP defines prompt injection as user prompts or external inputs altering an
LLM's behavior or output in unintended ways [S30]. It distinguishes direct
prompt injection from indirect prompt injection, where malicious instructions
are hidden in external sources such as websites, files, RAG documents, emails,
or tool outputs [S30].

OWASP lists potential impacts: sensitive information disclosure, system prompt
or infrastructure leakage, content manipulation, unauthorized access to
functions, arbitrary command execution in connected systems, and manipulation
of critical decisions [S30].

Recommended mitigations include:

- Constrain model behavior with clear role and task limits.
- Define and validate output formats with deterministic checks.
- Filter inputs and outputs.
- Enforce privilege control and least privilege.
- Require human approval for high-risk actions.
- Segregate and label external content as untrusted.
- Conduct adversarial testing and attack simulations [S30].

## OWASP LLM06: Excessive Agency

OWASP LLM06 is the most directly agentic risk category. It defines Excessive
Agency as the vulnerability that lets damaging actions occur in response to
unexpected, ambiguous, or manipulated LLM outputs [S31].

The root causes are:

- Excessive functionality: tools expose functions the agent does not need.
- Excessive permissions: tools have downstream privileges beyond the task.
- Excessive autonomy: high-impact actions execute without independent approval
  [S31].

OWASP recommends minimizing extensions, minimizing extension functionality,
avoiding open-ended extensions such as arbitrary shell or URL fetch tools,
minimizing downstream permissions, executing extensions in the user's context
with scoped OAuth, requiring user approval for high-impact actions, enforcing
complete mediation in downstream systems, sanitizing inputs and outputs, and
logging/monitoring extension activity [S31].

## MIT AI Agent Index security implications

MIT's 2025 AI Agent Index shows that deployed agents are becoming more capable
faster than their safety disclosures are maturing [S15]. The strongest security
findings are:

- 25 of 30 indexed agents disclose no internal safety results.
- 23 of 30 disclose no third-party testing information.
- Only 4 of 13 frontier-autonomy agents disclose agentic safety evaluations.
- Browser agent conduct standards remain unsettled.
- Some browser agents ignore robots.txt or bypass anti-bot systems.
- Only one agent in the Index used cryptographic request signing [S15][S16].

The Index implies that security programs cannot rely on vendor transparency
alone. Enterprises need their own agent inventory, permission mapping, runtime
telemetry, red-team tests, and contract controls [S15][S16].

## Identity and authorization patterns

### Treat agents as first-class principals

Agents should have unique identities, scoped credentials, lifecycle state,
owners, and revocation paths. Shared API keys and generic service accounts
make it impossible to attribute actions and investigate delegation chains
[S20][S28].

### Bind principal, agent, and scope

Agent requests should answer four questions: which agent is acting, on whose
behalf, for which task, and under what policy constraints. Harvard JOLT's Know
Your Agent framing adds identity, principal-agent linkage, delegation
parameters, revocability, auditability, and behavioral records [S18].

### Use least privilege and complete mediation

Authorization should be enforced by deterministic policy at the tool,
gateway, API, database, and workflow layers, not by relying on the LLM to
decide whether an action is allowed [S31]. Practical controls include
read-only credentials for debugging agents, narrow OAuth scopes, short-lived
tokens, allow-listed tools, and separate credentials by task [S42].

### Require approval for irreversible actions

Human-in-the-loop is not a product weakness; it is a control boundary. Approval
gates are especially important for financial transactions, destructive
database changes, external communications, policy changes, deployments, and
actions that affect regulated data [S27][S30][S31][S42].

## Threat and control matrix

| Threat | Failure mode | Controls |
| --- | --- | --- |
| Direct prompt injection | User text overrides agent behavior | Instruction/data separation, output validation, policy checks [S30] |
| Indirect prompt injection | Web/email/document/tool output contains hidden commands | Treat external content as untrusted, sandbox tools, adversarial tests [S30][S41] |
| Excessive agency | Agent takes damaging valid actions | Minimize tools, permissions, autonomy; complete mediation [S31] |
| Tool inversion | Legitimate tool used for illegitimate purpose | Intent validation, tool-specific policies, approval gates [S41] |
| Shared credentials | No attribution or blast-radius control | Agent identities, scoped tokens, rotation, audit trails [S20][S28] |
| Multi-agent lateral movement | Compromised agent influences peers | Signed inter-agent calls, trust boundaries, least privilege [S18][S42] |
| Cost attack | Looping tools/tokens/runaway calls | Max iterations, budget thresholds, rate limits, anomaly alerts [S27] |
| Data leakage | Sensitive data in prompts, logs, outputs, messages | Data classification, context filtering, redaction, retention limits [S40][S42] |
| Hallucinated action | Agent invents a tool, API, or authority | Strict tool registry, schema validation, deterministic error handling [S27][S31] |

## Governance checklist

Before an agent reaches production, document:

1. Owner, purpose, model(s), runtime, and deployment environment.
2. Agent identity, credential source, token lifetime, scopes, and revocation.
3. Tools, APIs, databases, event streams, and downstream systems accessible.
4. Data classes the agent may read, write, store, or transmit.
5. Autonomy tier and actions requiring human approval.
6. Prompt injection assumptions and tests.
7. Tool-call allow-list and deny-list.
8. Logging, tracing, retention, and incident response path.
9. Cost controls: token budget, tool-call budget, rate limits, alert thresholds.
10. Evaluation: safety tests, regression tests, red-team scenarios, and
    third-party or internal review evidence.

## Where OSSA and DUADP fit security

OSSA centralizes security declarations in a manifest: identity, tools,
autonomy, human-in-the-loop rules, Cedar policies, compliance frameworks,
observability, SBOM/provenance, and trust metadata [S01][S25]. DUADP extends
that into discovery: GAIDs, DIDs, signatures, trust tiers, federation
witnesses, revocation, governance, and NIST trust evaluation endpoints [S02].

This pairing does not replace IAM, gateways, or runtime authorization. It gives
them a portable artifact and discovery surface to evaluate before an agent is
called [S01][S02][S25][S26].

## Residual risk

No current source claims prompt injection can be fully solved. OWASP explicitly
notes that foolproof prevention is unclear because of the nature of generative
models [S30]. The practical security posture should therefore assume
compromise or error is possible, constrain blast radius, require approval for
irreversible actions, and preserve evidence for incident response.
