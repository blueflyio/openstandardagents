# Security and governance for agentic AI

Generated: 2026-05-29.

## Executive security view

Agentic AI risk is not just LLM output risk. Agents combine language input,
planning, memory, tools, delegated authority, multi-step execution, and sometimes
sub-agent creation. The security boundary must therefore move below prompts into
identity, authorization, tool mediation, runtime monitoring, auditability, and
incident response [S12][S49][S52][S57].

## Major threat categories

| Threat | Description | Representative controls |
| --- | --- | --- |
| Prompt/goal injection | Direct or indirect instructions redirect the agent's goals, tools, or data flow | Treat language as untrusted; isolate untrusted data; tool mediation; HITL for consequential actions [S13][S57] |
| Excessive agency | Agent has too much functionality, permission, or autonomy | Least privilege; minimize tools/scopes; rate limits; approval gates [S53] |
| Tool misuse | Legitimate tools are used in unsafe ways | Typed schemas, allowlists, policy engines, sandboxing, structured errors [S52][S56] |
| Identity and privilege abuse | Agents inherit shared API keys or human permissions | Unique agent identity, JIT access, revocation, audit logs [S12][S49] |
| Memory/RAG poisoning | External data contaminates planning, memory, or retrieval | Data provenance, retrieval filters, memory review, isolation [S17][S52] |
| Insecure inter-agent communication | Spoofed or malicious agents misdirect a cluster | A2A/ANP/DUADP identity checks, signed messages, trust tiers [S21][S25][S01] |
| Cascading failures | Small tool/model errors propagate through automated workflows | Circuit breakers, idempotency, budgets, trace IDs, structured recovery [S52][S56] |
| Web/commerce ambiguity | Agents browse and transact through human-facing web interfaces | KYA, cryptographic request signing, delegation parameters, web-conduct policy [S09][S11][S54][S55] |

## Empirical security statistics

Gravitee's 2026 survey of 919 executives and practitioners is the clearest
quantitative warning in the reviewed material [S49][S50]:

- 81 percent of teams are past the planning phase for AI agents [S50].
- Only 14.4 percent have full IT/security approval for their entire agent fleet
  [S49][S50].
- On average, only 47.1 percent of an organization's agents are actively
  monitored or secured [S50].
- 88 percent reported confirmed or suspected AI agent security or privacy
  incidents in the previous year; healthcare reached 92.7 percent [S49][S50].
- Only 21.9 percent treat AI agents as independent identity-bearing entities
  [S49][S50].
- 45.6 percent rely on shared API keys for agent-to-agent authentication, and
  27.2 percent of technical teams use custom hardcoded authorization logic
  [S50].

MIT's AI Agent Index adds transparency statistics rather than incident
statistics. Of 30 prominent agents, 25 disclosed no internal safety results, 23
had no third-party testing information, and most web-conduct practices were
undocumented [S09].

## NIST and identity/authorization standards

NIST NCCoE published "Accelerating the Adoption of Software and Artificial
Intelligence Agent Identity and Authorization" on 2026-02-05, with comments due
2026-04-02 [S12]. The concept paper scopes a project to demonstrate how identity
standards and best practices can apply to software agents, especially agentic AI
applications [S12].

NIST's question areas include use cases, challenges, existing/emerging
standards, technologies, identification, authorization, auditing,
non-repudiation, and controls to prevent or mitigate prompt injection [S12].
Related summaries identify OAuth 2.0/2.1, OpenID Connect, SPIFFE/SPIRE, SCIM,
NGAC, MCP, NIST SP 800-207 Zero Trust Architecture, SP 800-63-4 Digital Identity
Guidelines, and token/assertion protection guidance as relevant building blocks
[S12].

The unresolved hard problem is multi-hop delegation. Existing OAuth patterns can
handle a user delegating to one agent, but agent A spawning agent B that invokes
agent C creates attribution, scope, revocation, and audit problems [S12].

## OWASP and agentic risk taxonomies

OWASP LLM06:2025 defines Excessive Agency as damaging actions performed because
an LLM-based system has excessive functionality, permissions, or autonomy. It
can be triggered by hallucination, prompt injection, malicious extensions, or
compromised peer agents [S53]. Prevention strategies include minimizing tools,
minimizing tool functionality, minimizing permissions, constraining autonomy,
and requiring user confirmation for high-impact actions [S53].

OWASP's Top 10 for Agentic Applications extends this into a dedicated agentic
taxonomy: Agent Goal Hijack, Tool Misuse and Exploitation, Agent Identity and
Privilege Abuse, Agentic Supply Chain Vulnerabilities, Unexpected Code
Execution, Memory and Context Poisoning, Insecure Inter-Agent Communication,
Cascading Failures, Human-Agent Trust Exploitation, and Rogue Agents [S52].

## Academic and engineering security patterns

Academic design-pattern work recommends that once an agent has ingested
untrusted input, it should not be able to trigger consequential actions without
additional constraints. The core idea is isolation between untrusted data and
control flow, plus sandboxes and human confirmation for sensitive actions [S13].

OpenAI's prompt-injection guidance makes a similar practical point: perfect
input detection is not enough. Systems should constrain the impact of
manipulation, detect exfiltration paths such as unsafe URLs, and ask what
controls a human agent would require in the same situation [S57].

Production MCP research identifies missing primitives in real deployments:
identity propagation, adaptive timeout/tool budgeting, and structured error
semantics [S56]. The recommended production checklist includes idempotency keys,
structured errors with retryable flags and suggested actions, circuit breakers,
health/readiness endpoints, per-tool latency/success metrics, JWT validation,
tool-level ACLs, and audit logs on every tool invocation [S56].

## Web, bot traffic, and agent identity

Imperva's 2026 Bad Bot Report says automated traffic accounted for more than 53
percent of all web traffic in 2025, while human traffic fell to 47 percent
[S54]. HUMAN Security reports that agentic AI traffic grew 7,851 percent in
2025 and that AI systems moved from reading the web to transacting on it [S55].

Harvard JOLT's KYA framing responds to this pressure: platforms need to know
which agent is acting, on whose behalf, under what delegated authority, and with
what auditability [S11]. MIT's AI Agent Index shows why this is urgent: web
conduct practices are often missing, and cryptographic request signing remains
rare [S09].

## Governance controls to implement

1. Unique agent identity. Each agent should have a lifecycle-managed principal,
   not a shared API key or inherited human token [S12][S49].
2. Capability declaration. A manifest should enumerate allowed tools, actions,
   data classes, budgets, and approval thresholds [S02][S03][S53].
3. Pre-execution authorization. Tool calls should pass through a policy gateway
   before execution, with default-deny semantics [S51][S53].
4. Human-in-the-loop for high-impact actions. Financial transactions, record
   deletion, permission changes, external communications, production
   infrastructure modifications, and sensitive data actions should pause for
   approval [S10][S58].
5. Runtime monitoring. Trace tool calls, retrieved documents, prompt assembly,
   memory writes, policy decisions, outputs, errors, and identity context [S49][S56].
6. Revocation and incident response. Agents need immediate suspension,
   credential rotation, replayable traces, and post-incident root-cause review
   [S12][S49].
7. Supply-chain controls. Validate MCP servers, tools, manifests, schemas,
   package provenance, and runtime dependencies before exposing them to agents
   [S52][S56].

## Security implications for OSSA and DUADP

OSSA is valuable because it can turn security requirements into a structured
agent contract: DID/GAID, signed manifest, Cedar policy, cost controls,
human-in-the-loop points, SBOM/provenance, and compliance metadata [S02][S03].
DUADP is valuable because discovery without trust creates a new attack surface;
DUADP's GAID/DID resolution, signature verification, revocation, federation
witnesses, and trust tiers are the kinds of mechanisms NIST, Harvard, MIT, and
Gravitee imply are needed [S01][S11][S12][S49].

The key design requirement is that these controls must be enforced by runtimes
and gateways, not merely documented. A signed manifest is useful only if the
agent runtime, MCP gateway, A2A endpoint, or DUADP registry actually checks it
before allowing discovery, delegation, or execution [S12][S13][S56].
