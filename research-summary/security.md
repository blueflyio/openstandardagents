# Security and Governance Research

Prepared on May 24, 2026.

## Core risk model

Agentic AI changes security because the system does not merely answer. It plans,
uses tools, maintains memory, writes to external systems, delegates to other
agents, and may run for long periods with limited human intervention. This turns
classic prompt problems into distributed-systems, identity, authorization, and
audit problems [S16] [S18] [S19] [S21].

The dominant risk is loss of control: who can do what, using which tools, on
whose behalf, with what evidence and rollback path. Gravitee summarizes this
shift directly: teams are worried less about hallucination alone and more about
misuse, unauthorized access, lack of logging, weak identity, and fragile
authorization [S18].

## Security statistics

| Statistic | Finding | Source |
| --- | --- | --- |
| Adoption | 80.9% of technical teams are past planning and testing or running agents live | [S18] |
| Full approval | Only 14.4% have full IT/security approval for the entire agent fleet | [S18] |
| Incidents | 88% report confirmed or suspected agent security/privacy incidents in the last year | [S18] |
| Healthcare incidents | 92.7% of healthcare organizations report or suspect incidents | [S18] |
| Monitoring | On average, only 47.1% of an organization's agents are actively monitored or secured | [S18] |
| Independent identity | Only 21.9% treat agents as independent identity-bearing entities | [S18] |
| Shared API keys | 45.6% use shared API keys for agent-to-agent authentication | [S18] |
| Hardcoded authorization | 27.2% use custom hardcoded logic for authorization | [S18] |
| A2A visibility | Only 24.4% have full visibility into which agents interact with each other | [S18] |
| Daily audits | Only 7.7% audit agent activity daily | [S18] |
| MIT safety disclosure | 25/30 indexed agents disclose no internal safety results | [S16] |
| MIT third-party testing | 23/30 disclose no third-party testing information | [S16] |

## Major threat categories

### Prompt injection and goal hijacking

Prompt injection is dangerous because agents ingest untrusted content from web
pages, documents, emails, RAG stores, tool responses, and other agents. The
model may treat hostile text as instructions and redirect the agent's goal [S21]
[S23]. OWASP-style agentic guidance distinguishes goal hijacking from a simple
single-turn prompt injection because an attacker can redirect a multi-step
workflow and cause the agent to pursue an unintended objective across planning
steps [S24].

Mitigations:

* Separate instruction, user, tool, and external-data channels.
* Store the original goal in tamper-evident state and check planned steps
  against it.
* Treat model output as untrusted before tool execution.
* Use runtime gates outside the model for high-risk actions [S23] [S24].

### Excessive permissions and confused deputy failures

Agents often run with broad API keys, human user tokens, or shared service
accounts. A system prompt cannot constrain those credentials. If an attacker
influences the model, the model becomes a confused deputy holding real tokens
[S23]. Gravitee's practitioner stories include agents with read-only intent
calling elevated APIs, agents gaining unauthorized write access through
agent-to-agent channels, and agents trying to send sensitive information outside
the organization [S18].

Mitigations:

* Give each agent its own workload identity.
* Avoid shared API keys and generic service accounts.
* Issue short-lived scoped credentials per approved action.
* Enforce least privilege at the gateway or orchestration layer [S18] [S19]
  [S23].

### Tool misuse

Tool misuse occurs when an agent calls a legitimate tool for an unintended
purpose: deleting data, over-invoking costly APIs, leaking information, sending
emails, running shell commands, or chaining tools into an unauthorized workflow
[S24]. Tool misuse can happen even without privilege escalation if the agent was
already authorized to call the tool but lacks policy constraints on parameters,
frequency, target resources, or business intent [S24].

Mitigations:

* Whitelist tools by agent role.
* Validate tool arguments and resource targets.
* Put hard hooks in front of financial, legal, compliance, destructive, and
  production actions.
* Add cost, iteration, and loop limits [S20] [S24].

### MCP and tool supply-chain attacks

MCP creates a standard tool surface, which also creates a standard attack
surface. Research identifies tool poisoning, malicious or mutable descriptors,
installer spoofing, unauthorized access, shadowing, rug pulls, and malicious
MCP servers [S22]. The threat is not only bad input; it is compromised tool
metadata and tool behavior.

Mitigations:

* Sign and verify tool manifests.
* Pin tool versions and descriptor hashes.
* Vet MCP servers before installation.
* Filter toolsets aggressively so agents see only the tools they need.
* Instrument per-tool p50/p95/p99 latency, error rate, output size, and
  security decisions [S20] [S22].

### Memory poisoning and long-horizon attacks

Agent memory introduces persistence. A malicious document, tool response, or
agent message can poison memory and affect later sessions [S21]. Recent
layered-security papers identify cross-session cumulative threats and
slow-burn high-layer risks, including covert agent collusion, long-term memory
poisoning, MCP supply-chain compromise, and alignment failures that look like
insider threats [S21].

Mitigations:

* Track provenance for memory entries.
* Expire, re-verify, and scope memory by user, task, and sensitivity.
* Separate untrusted retrieved content from policy and instructions.
* Add anomaly detection for goal drift, tool patterns, and data flows [S21]
  [S24].

### Insecure inter-agent communication

A2A, ACP, ANP, and DUADP-style networks make agents discoverable and composable.
They also create risks: impersonated agents, forged capability claims, untrusted
delegation chains, insecure handoffs, and incomplete audit trails [S18] [S19]
[S21]. MIT's Index treats interoperability standards and web conduct as part of
the safety disclosure gap [S16].

Mitigations:

* Require signed Agent Cards or equivalent metadata where available.
* Bind delegation to the originating user and agent identity.
* Carry trace IDs across all agent-to-agent calls.
* Define semantic validation for sub-agent outputs before acting on them.
* Use circuit breakers for agent chains [S20].

## NIST/NCCoE identity and authorization direction

NIST/NCCoE's February 5, 2026 concept paper, "Accelerating the Adoption of
Software and Artificial Intelligence Agent Identity and Authorization," scopes a
possible NCCoE project to demonstrate how identity standards and best practices
can apply to software agents and agentic AI [S19].

The paper asks for input on:

* agent use cases;
* unique challenges agents introduce compared with other software;
* current and emerging standards for agent IAM;
* technologies used to support agents;
* identification, authorization, auditing, non-repudiation;
* controls to prevent and mitigate prompt injection [S19].

The core message is that agent value depends on giving agents access to data,
tools, and applications, but those benefits cannot be realized safely without
appropriate identification and authorization controls [S19].

## Governance controls

### Identity

Every production agent should have a distinct identity, owner, purpose, allowed
tools, allowed data, and revocation path. DUADP and ANP both use DIDs as part of
their identity story [S01] [S07]. OSSA uses GAID/DID identity and signed
manifests to connect identity with deployment metadata [S02] [S28].

### Authorization

Authorization should be evaluated at runtime for each sensitive action. OAuth
scopes alone are usually too coarse for agentic systems; a gateway should
evaluate the user, agent, tool, action, resource, parameters, task intent, and
risk before issuing a credential or executing a call [S23].

### Human oversight

Human-in-the-loop is not a weakness; it is the control model for high-stakes
work. OpenAI Agents SDK, LangGraph, CrewAI, and AutoGen all support some form
of handoff, approval, interrupt, or human input [S10] [S11] [S20]. Use approval
gates for payments, production deploys, deletion, external communications,
privilege changes, and regulated decisions [S20] [S23].

### Observability and audit

Agents need continuous, not monthly, review. Logs should include original user
goal, model inputs/outputs, tool choices, tool parameters, approvals, denial
reasons, data classifications, trace IDs, costs, and downstream effects [S18]
[S20]. For multi-agent chains, every delegation should carry a trace ID and an
accountable owner [S20].

### Web conduct

MIT's Index reports no established standards for how agents should behave on
the web, including robots.txt, CAPTCHA handling, self-identification, and
request signing [S16]. This is an open governance gap. Until standards mature,
browser agents should identify themselves, respect site policies, avoid CAPTCHA
bypass, sign requests where possible, and use APIs or agent-specific protocols
instead of pretending to be human users [S16] [S26].

## Control checklist

1. Inventory all agents, MCP servers, tools, and agent-to-agent endpoints.
2. Assign each agent a unique identity and accountable human owner.
3. Replace shared API keys with scoped, short-lived credentials.
4. Put a policy gate before every write, send, delete, deploy, payment, or
   privilege-changing action.
5. Whitelist tools and validate parameters.
6. Require HITL approval for irreversible or high-impact actions.
7. Sign and pin tool/agent metadata where possible.
8. Log every tool call and inter-agent message with a trace ID.
9. Monitor per-agent costs, loops, latency, tool errors, and anomaly patterns.
10. Red-team prompt injection, tool poisoning, memory poisoning, and delegated
    agent chains before production.
