# Security and governance research

Research compiled as of 2026-05-28.

## High-level risk picture

Agent risk is qualitatively different from chatbot risk because agents take actions. A wrong chatbot answer can mislead a user; a wrong tool-using agent can query a database, send an email, create a ticket, trigger a pipeline, change permissions, or call another agent [T39]. MIT Sloan highlights the same shift: hallucinations and prompt injection become adoption blockers because autonomous agents can complete tasks with minimal supervision [T11].

The dominant risk categories are:

- Prompt injection and indirect prompt injection through webpages, tickets, emails, documents, repositories, and retrieved context [T13][T15][T39].
- Excessive permissions and over-broad tools [T39][T40].
- Hallucinated or nonexistent tool calls and unsafe actions [T36].
- Weak agent identity, shared API keys, and unauditable delegation [T12][T38].
- RAG poisoning, memory poisoning, protocol exploits, and cross-agent manipulation [T15][T16].
- Cost attacks through loops, repeated calls, and token-heavy multi-agent traces [T36].

## Empirical security statistics

Gravitee's 2026 report is the strongest security-adoption dataset found in this research. It surveyed more than 900 executives and technical practitioners [T38].

| Finding | Statistic | Interpretation |
| --- | ---: | --- |
| Teams past planning | 80.9% | Agents are already in testing or production, not hypothetical [T38] |
| Full security/IT approval | 14.4% | Governance is not keeping pace [T38] |
| Confirmed or suspected incidents | 88% | Security failures are common, not edge cases [T38] |
| Healthcare incidents | 92.7% | Sensitive regulated workflows face higher exposure [T38] |
| Agents actively monitored/secured | 47.1% average | More than half may lack oversight/logging [T38] |
| Agents treated as independent identities | 21.9% | Most organizations do not model agents as first-class principals [T38] |
| Shared API keys for agent-to-agent auth | 45.6% | Credential sharing undermines auditability [T38] |
| Hardcoded custom authorization logic | 27.2% | Teams are improvising policy controls [T38] |

MIT's index reinforces the transparency gap. Only 4 of 13 high-autonomy agents disclosed agentic safety evaluations, 25 of 30 disclosed no internal safety results, and 23 of 30 had no third-party testing information [T10].

## NIST/NCCoE direction

NIST NCCoE's 2026 concept paper asks how identity standards and best practices should apply to software and AI agents [T12]. The core topics are:

1. Identification of AI agents as distinct actors.
2. Authentication and authorization for agent principals.
3. Access delegation from humans or organizations to agents.
4. Auditing and non-repudiation of agent actions.
5. Controls to prevent and mitigate prompt injection [T12].

The paper matters because it moves the discussion from high-level responsible AI into concrete IAM design. Agents should not inherit a human's broad credentials or run as generic service accounts. They need their own identities, scoped permissions, revocation paths, and logs that connect each action to the agent, the principal, the delegated authority, and the runtime context [T12].

## Prompt injection

Prompt injection remains the central technical vulnerability. ACM describes it as malicious prompt manipulation that can cause agents to bypass constraints or execute harmful actions [T13]. DEV security guidance emphasizes that all user input, retrieved documents, webpages, emails, tickets, and repository content should be treated as untrusted; prompts are not authorization boundaries [T39].

The practical mitigation pattern:

- Isolate data from instructions.
- Validate retrieved content before model exposure where possible.
- Do not grant the model direct authority to perform irreversible actions.
- Apply deterministic authorization after the model proposes a tool call and before the tool executes.
- Record the triggering input, proposed action, policy decision, tool result, and final output [T14][T39].

## Excessive permissions

Over-permissioning is the most common blast-radius amplifier. A scan of common LangChain patterns found every pattern over-permissioned, typically because agents inherited broad default tools rather than task-specific scopes [T40].

Least-privilege examples from practitioner guidance:

- Use read-only database roles and table-specific permissions.
- Scope GitHub tokens to read-only when the agent only reviews code.
- Use `gmail.readonly` instead of full mailbox access.
- Remove Slack, shell, Python REPL, browser, or write tools unless the task actually requires them [T39][T40].

## Hallucinated actions and tool misuse

47Billion's production report observed agents calling the same tool repeatedly and attempting to use functions that seemed logical but did not exist [T36]. This is not only a reliability issue; it is a security issue because hallucinated intent can become real side effects if the tool layer is permissive.

Recommended controls:

- Strict tool whitelists.
- Schema validation for all tool inputs.
- Maximum tool-call counts per task.
- Cost and token budgets.
- Clear machine-readable errors for denied or unavailable tools.
- Circuit breakers for loops or repeated states [T36].

## Identity and authorization architecture

The emerging consensus is "identity-aware enforcement." Gravitee argues that agents must become first-class security principals rather than extensions of human users or shared service accounts [T38]. NIST asks how existing standards such as OAuth, OIDC, ABAC, delegation, and audit should apply to agents [T12].

OSSA and DUADP map naturally to this model:

- OSSA manifests encode identity, capabilities, trust, governance, policy, observability, cost, and human-oversight metadata [T01][T03][T04].
- DUADP resolves GAIDs through discovery, maps them to DID documents, verifies signatures, records provenance, and turns trust tier into policy input [T02][T05].
- Cedar policies can gate discovery, publishing, federation, or execution based on trust tier, risk, and autonomy bounds [T01][T02].

## Protocol-level threats

Academic surveys now include protocol vulnerabilities as a distinct risk class. One arXiv survey analyzes MCP, ACP, ANP, and A2A as potential exploit surfaces and calls for dynamic trust management, cryptographic provenance tracking, hardened Agentic Web Interfaces, and resilience in federated environments [T16].

Protocol-specific concerns include:

- Tool poisoning through malicious tool descriptions or schemas.
- Agent impersonation through weak or unsigned discovery documents.
- Delegation chain confusion.
- Context leakage between agents.
- Incomplete consent or authority transfer.
- Unverified web access that bypasses site policies [T10][T16][T17].

## Governance controls

| Control | Why it matters | Sources |
| --- | --- | --- |
| Unique agent identity | Enables attribution, revocation, and policy scoping | [T12][T38] |
| Delegated authority record | Links action to principal and approved purpose | [T12][T17] |
| Least-privilege tools | Limits prompt-injection blast radius | [T39][T40] |
| Deterministic policy gate | Keeps authorization outside the model | [T14][T39] |
| Human approval gates | Blocks irreversible or high-risk side effects | [T11][T30][T36] |
| Append-only audit logs | Enables non-repudiation and incident response | [T12][T14][T38] |
| Sandboxing | Contains code execution and unsafe tools | [T15][T25] |
| Structured outputs | Prevents raw model text from becoming action input | [T36][T39] |
| Cost and loop budgets | Stops runaway multi-agent behavior | [T36] |
| Continuous monitoring | Detects drift, incidents, and shadow agents | [T34][T38] |

## Human-in-the-loop and human-on-the-loop

Human involvement remains necessary for trust and safety. MIT Sloan says companies will continue to need humans in the loop to create guardrails, even if that reduces autonomous productivity gains [T11]. LangGraph's HITL middleware shows how to operationalize this: interrupt after model output but before tool execution, persist graph state, gather approve/edit/reject/respond decisions, and resume safely [T30].

The right pattern is progressive autonomy. Start with human approval for high-risk steps, measure reliability, then reduce approval only when evaluation and audit data justify it [T36].

## Internet-scale traffic governance

Bot and agent traffic is changing the web's threat model. Imperva reports that automated bot traffic accounted for more than 53% of all web traffic in 2025, with human traffic at 47% [T41]. HUMAN Security reported AI-driven traffic up 187% from January to December 2025 and agentic traffic up 7,851% year over year [T42].

This supports the case for Know Your Agent standards, signed requests, machine-readable access policies, agent identities, and web-conduct protocols. MIT's AI Agent Index found no established standards for how agents should behave on the web [T10], while Harvard JOLT argues for identity, principal-agent linkage, delegation parameters, and behavioral record-keeping [T17].

## Recommended baseline security profile

For any production agent:

1. Assign a unique agent identity and key material.
2. Publish a signed manifest or Agent Card with capabilities and auth requirements.
3. Scope tools to the minimum required permissions.
4. Enforce policy outside the model before every side effect.
5. Require human approval for destructive, financial, legal, external-send, production-write, or privilege-changing actions.
6. Log tool calls, retrieved sources, prompts, outputs, policy decisions, costs, and trace IDs.
7. Use schema validation for all tool inputs and structured outputs.
8. Sandbox code execution and disable filesystem/network access by default.
9. Add retry, timeout, loop, and budget limits.
10. Test prompt injection, RAG poisoning, tool poisoning, and cross-agent spoofing before rollout [T12][T14][T15][T16][T36][T38][T39].
