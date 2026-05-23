# Security and governance research

Source review date: 2026-05-23.

## Current risk picture

Agentic AI security failures are no longer hypothetical. Gravitee's 2026 report surveyed 919 executives and practitioners and found that 81% of teams are past planning, only 14.4% have full security approval for their agent fleet, 88% reported confirmed or suspected security/privacy incidents in the previous year, and only 21.9% treat agents as independent identity-bearing entities [S19][S34].

The same report shows that 45.6% of teams still rely on shared API keys for agent-to-agent authentication and 27.2% use custom hardcoded authorization logic [S34]. This is a structural risk: shared credentials collapse attribution, make targeted revocation difficult, and increase blast radius when one agent is hijacked [S19][S34].

MIT's 2025 AI Agent Index found low safety transparency across deployed agents: 25 of 30 disclosed no internal safety results, 23 of 30 had no third-party testing, and only 4 of 13 frontier-autonomy agents disclosed agentic safety evaluations [S16]. This means buyers and regulators cannot rely on voluntary disclosures as a complete assurance mechanism.

## Threat model

| Threat | Failure mode | Controls |
| --- | --- | --- |
| Prompt injection | External content redirects the agent into unsafe tool use. | Treat model output as untrusted; authorize every tool call; isolate external content [S20][S21]. |
| Excessive permissions | Agent holds broad API keys, admin tokens or over-capable tools. | Least privilege, per-action scopes, short-lived credentials [S18][S20][S21]. |
| Hallucinated actions | Model fabricates API calls, parameters or premises that cause side effects. | Schema validation, action verification, HITL for irreversible actions [S17][S20]. |
| Tool/server supply chain | Malicious MCP server, poisoned tool descriptions, rug-pull updates. | Server provenance, signed tool definitions, sandboxing, gateways [S33]. |
| Identity ambiguity | Multiple agents share credentials or impersonate users. | Per-agent identity, delegated tokens, actor claims, revocation [S18][S34]. |
| Cross-agent contamination | Agent output, memory or state pollutes another agent/session. | Session isolation, scoped memory, audit and lineage [S23][S33]. |
| Web conduct abuse | Agents bypass bot controls or act without disclosing authority. | Agent identification, KYA, delegated authority, web-conduct policy [S16][S30]. |

## NIST/NCCoE identity and authorization work

NIST/NCCoE published the concept paper "Accelerating the Adoption of Software and Artificial Intelligence Agent Identity and Authorization" on 2026-02-05, with comments due 2026-04-02 [S18]. The paper seeks stakeholder input for a potential project demonstrating how existing identity standards and best practices can be applied to software and AI agents [S18].

The concept paper focuses on identification, authentication, authorization, auditing, non-repudiation and prompt-injection controls [S18]. It asks how organizations should identify agents, authenticate claims about them, authorize unpredictable behavior, audit actions and prevent or mitigate prompt injection [S18].

Sources discussing the paper identify relevant standards and patterns: OAuth 2.0/2.1, OpenID Connect, SPIFFE/SPIRE, SCIM, Next Generation Access Control, NIST SP 800-207 Zero Trust, NIST SP 800-63-4 Digital Identity Guidelines and token/assertion protections [S18]. The central question is not whether agents need identity; it is how to bind agent identity, user delegation, action scope and audit evidence in a way existing IAM systems can enforce.

## Gravitee recommendations

Gravitee's security guidance recommends continuous, identity-aware enforcement rather than periodic audits [S34]. Key recommendations include:

- Treat agents as first-class security principals, not extensions of a human user or generic service account [S19][S34].
- Centralize enforcement at the API/MCP/tool boundary so access is decided before execution [S34].
- Avoid token passthrough and shared API keys; use OAuth-based delegation and traceable actor chains [S34].
- Use fine-grained authorization systems such as OpenFGA and AuthZen-style decision points for action/resource checks [S34].
- Maintain continuous visibility into agent actions, not just policy documents or annual reviews [S19][S34].

Gravitee's 4.11 release notes describe RFC 8693 token exchange for traceable delegation: a user delegates a task, the agent exchanges the user token for a scoped delegated token, and the new token includes actor claims identifying the agent [S34]. This is a practical pattern for avoiding user impersonation while preserving an audit chain.

## OWASP and developer security guidance

OWASP's agentic guidance highlights over-privileged skills: a skill granted broader permissions than its stated function can be weaponized by downstream prompt injection to execute destructive actions [S21]. The OWASP framing is important because natural language intent sits above system permissions; a tool that can technically run `DELETE` can be misused even if the prompt says "only summarize" [S21].

Developer security guides converge on several controls:

- Do not trust prompts or model-proposed tool calls as access-control decisions [S20].
- Route every sensitive tool call through a runtime authorization gate [S20].
- Use explicit allowlists, action-specific scopes and parameter validation [S20].
- Use nonces, timestamps, signatures and revocation checks where action intents are signed [S20].
- Require human approval for destructive, financial, legal, medical, external-communication or high-cost actions [S20][S21].

## MCP-specific security

MCP expands the agent attack surface because clients trust server tool descriptions, models consume those descriptions as context, tool outputs may include hostile instructions, and downstream systems may receive actions with broad credentials [S33]. CSA describes three trust boundaries: LLM to MCP client, MCP client to MCP server, and MCP server to downstream systems [S33].

Controls for MCP deployments include:

- Verify MCP server identity and provenance.
- Prevent token passthrough; issue tokens explicitly for the MCP server/resource.
- Isolate sessions and bind session IDs to user-specific context.
- Pin or sign tool definitions to reduce rug-pull and tool poisoning risk.
- Sandbox untrusted server code and tool execution.
- Place a gateway in front of servers for authentication, authorization, DLP, egress policy and audit logging [S33].

Production analysis argues that MCP is missing standardized production primitives for identity propagation, adaptive tool budgeting and structured errors [S42]. Those gaps should be handled in infrastructure until protocol specifications mature [S42].

## Identity and delegation patterns

The strongest common pattern is per-agent identity plus delegated, scoped, short-lived authority. A secure action record should answer:

1. Which human or organization authorized this task?
2. Which agent instance acted?
3. Which tool/resource/action/parameters were requested?
4. Which policy allowed or denied it?
5. What credential was issued and when did it expire?
6. What output, side effect or artifact resulted?
7. How can the grant or agent identity be revoked?

DUADP and ANP use DIDs for agent/node identity and decentralized verification [S01][S11]. OSSA uses manifest-level identity, signatures, Cedar policies, trust tiers and provenance/SBOM pointers [S03][S05]. NIST/NCCoE is evaluating how these and more conventional IAM standards should fit enterprise environments [S18].

## Governance controls

Minimum governance controls for production agent systems:

- Inventory every agent, owner, model, tool, data class, credential and deployment environment [S18][S19].
- Define agent autonomy level, allowed side effects, approval thresholds, budget limits and escalation paths [S16][S17].
- Require signed manifests or equivalent provenance for tools, skills, MCP servers and agent packages [S03][S33].
- Maintain immutable audit logs for tool calls, approvals, delegated tokens, policy decisions and artifacts [S18][S20].
- Test against prompt injection, tool misuse, bad tool output, memory poisoning, cascading hallucination and resource overload before release [S20][S21][S33].
- Monitor eval drift, latency, cost, error rate and security decisions after release [S28][S42].

## What remains unresolved

- Standards for agent behavior on the public web are not established [S16].
- No single dominant identity model exists across DIDs, OAuth/OIDC, SPIFFE, OpenFGA/AuthZen and manifest-based trust metadata [S18].
- Protocols standardize communication but not always runtime governance, policy evaluation or economic limits [S31][S42].
- Published safety disclosures are incomplete for many deployed agents [S16].
- Multi-agent systems create cascading risk: one agent's hallucination, malicious output or stale memory can become another agent's trusted context [S32][S33].
