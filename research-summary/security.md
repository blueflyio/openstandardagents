# Security and Governance Research

Prepared: May 15, 2026. Tether citation IDs are defined in
`reading-list.md`.

## Core threat model

Agentic systems combine model outputs with software authority. That changes the
risk profile from "the model said something wrong" to "the system took an
authorized action that should not have happened" [T15][T27][T28].

Major risks:

| Risk | Description | Representative sources |
| --- | --- | --- |
| Prompt injection | User, document, web, or inter-agent content changes the agent's behavior | NIST CAISI, Dev.to security guides [T15][T27][T28] |
| Excessive permissions | Agent has broad API/database/tool credentials and can be manipulated into using them | Gravitee, Dev.to [T18][T19][T27][T28] |
| Hallucinated or invalid actions | Agent invents tools, misreads scope, or executes a technically valid but harmful action | MIT Sloan, 47Billion [T17][T25] |
| Weak identity | Agents use shared API keys, personal accounts, or service accounts, breaking accountability | Gravitee, NIST/NCCoE [T14][T19] |
| Lateral movement | One compromised agent can call other agents, tools, or workflows without trust boundaries | Gravitee, Dev.to [T19][T28] |
| Visibility gaps | Logs and traces do not capture identity, input source, reasoning, policy decisions, or tool calls | Gravitee, Dev.to [T19][T27][T28] |
| Cost attacks | Inputs trigger loops, excessive tool use, or token burn | 47Billion, Dev.to [T25][T27] |

## Empirical security data

Gravitee's State of AI Agent Security 2026 report surveyed 919 executives and
practitioners [T18][T19]. It is vendor-sponsored, but its statistics are useful
because they are specific to agent deployment, identity, and runtime governance.

| Statistic | Value |
| --- | ---: |
| Technical teams beyond planning | 80.9% |
| Average agents per organization | 37 |
| Full IT/security approval for entire fleet | 14.4% |
| Executive confidence in existing policy protection | 82.0% |
| Average agents actively monitored or secured | 47.1% |
| Confirmed or suspected incidents in the prior 12 months | 88% |
| Healthcare incident rate | 92.7% |
| Treat agents as independent identities | 21.9% |
| Agent-to-agent auth via shared API keys | 45.6% |
| Agent-to-agent auth via generic tokens | 44.4% |
| Agent-to-agent auth via mTLS | 17.8% |
| Use existing IAM/IdP as authorization server for MCP infrastructure | 23.7% |
| Technical teams using custom hardcoded auth logic | 27.2% |
| Organizations with full visibility into A2A interactions | 24.4% |
| Organizations with no formal catalog of agents/MCP servers | 22.5% |
| Organizations relying on manual spreadsheets for cataloging | 25.4% |

The central finding is an identity crisis: most agents are not treated as
first-class security principals, even though they can act autonomously on
production systems [T19].

## NIST and NCCoE governance direction

NIST's January 2026 CAISI RFI asks how to secure AI agent systems where model
outputs interact with software functionality [T15]. The examples include
indirect prompt injection, insecure models, data poisoning, specification
gaming, and agents taking harmful actions without adversarial input [T15].

NIST/NCCoE's February 2026 concept paper asks for feedback on identity standards
and best practices for software and AI agents [T14]. Its focus areas include:

- identification
- authorization
- auditing
- non-repudiation
- prompt-injection prevention and mitigation
- standards and technologies for AI-agent identity and access management [T14]

The AI Agent Standards Initiative, announced by NIST CAISI on February 17, 2026,
connects standards, open-source protocols, and research on security/identity as
pillars of trusted adoption [T15].

## OSSA and DUADP security posture

OSSA's NIST page maps its contract fields to NIST CAISI and SP 800-53 concerns
[T24]. Its security model emphasizes:

- GAID / W3C DID identity.
- Cedar pre-authorization.
- OpenTelemetry tracing and security events.
- SBOM and OSCAL references.
- Ed25519/ECDSA/JWT/VC-style signatures through `x-signature`.
- Trust tiers and provenance [T24].

DUADP extends this to discovery. Its homepage describes a GAID-to-DID pipeline
where WebFinger resolves a GAID, DID documents supply verification keys,
signatures prove integrity, provenance enriches trust calculation, and Cedar
policies gate discovery, publishing, federation, and execution [T20].

These projects are early-stage, but they are aligned with the NIST direction:
agent identity and authorization should be explicit artifacts, not implicit
side effects of a human user's credentials [T14][T20][T24].

## Protocol-specific security guidance

### MCP

MCP's latest specification warns that the protocol enables arbitrary data access
and code execution paths, so implementers must address consent, data privacy,
tool safety, and LLM sampling control [T06]. Hosts should require explicit user
consent before exposing data or invoking tools, treat tool descriptions as
untrusted unless from trusted servers, and implement robust authorization flows
[T06].

### A2A

A2A is designed to align with enterprise security practices and uses existing
web standards. Its specification emphasizes authentication, authorization,
privacy, tracing, monitoring, and authorization scoping for task access [T08].
Public and extended Agent Cards should be scoped carefully because agent
capability descriptions can reveal sensitive operational detail [T08].

### AG-UI

AG-UI's security boundary is the application front end. Its launch post calls
out the need for CORS, auth tokens, audit logs, orderly cancellation, and
thread/run IDs when streaming arbitrary data between agents and UIs [T09]. Its
event specification includes lifecycle, state, tool-call, and reasoning events
that can be logged and replayed for auditability [T10].

### DUADP and ANP

Both DUADP and ANP emphasize decentralized identity. DUADP ties discovery to
GAID/DID resolution, signatures, provenance, and trust tiers [T20]. ANP's first
layer is identity and secure communication based on W3C DID [T11].

## Production control patterns

The strongest practical guidance across engineering sources is consistent:

1. Unique agent identities. Agents should not share a human account, generic
   service account, or fleet-wide API key [T19][T27].
2. Short-lived scoped credentials. Use time-bound session tokens, granular OAuth
   scopes, and no refresh tokens where possible [T27].
3. Tool gateway. Every tool call should pass through a policy enforcement point
   with identity verification, rate limiting, parameter validation, risk scoring,
   approval, and audit logging [T27].
4. Least privilege by task. A debugging agent should have read-only database
   access; a support agent should not have bulk messaging or account-deletion
   permissions [T28].
5. Human approval for irreversible actions. Deletes, writes to production,
   external bulk communications, refunds, permission changes, and code execution
   should require synchronous or policy-driven approval [T25][T27][T28].
6. Structured traces. Logs must answer what the agent did, why, which input
   triggered it, which credentials it used, and which policy decision allowed or
   denied it [T27][T28].
7. Anomaly detection and kill switches. Monitor token burn, unexpected tools,
   data volume, rate spikes, and unusual credential access; provide emergency
   abort and credential revocation [T27][T28].
8. Staging-first promotion. Agents should demonstrate stable behavior against
   staging data before receiving production credentials [T28].

## Security checklist

Before production deployment:

- [ ] Agent has a unique ID, owner, version, environment, and expiration.
- [ ] Credentials are short-lived and scoped to explicit tools/actions.
- [ ] Tool access is allowlisted and default-deny.
- [ ] High-risk operations require human or policy approval.
- [ ] External input is labeled as untrusted data, not instructions.
- [ ] Inter-agent messages are authenticated and treated as untrusted input.
- [ ] All tool calls pass through a gateway or policy enforcement point.
- [ ] Every action is logged with trace ID, identity, session, tool, input
      source, policy decision, result, cost, model, and latency.
- [ ] Cost limits, iteration limits, rate limits, and circuit breakers are set.
- [ ] Emergency kill switch revokes credentials and aborts active runs.
- [ ] Agent and MCP/tool inventory is maintained automatically, not by
      spreadsheet.
- [ ] Safety evaluation covers trajectories and tool decisions, not only final
      answers.

## Residual gaps

- There is not yet a widely accepted equivalent of a model card for deployed
  agents that discloses autonomy level, tool access, web conduct, safety
  evaluations, and third-party testing [T03][T16].
- Identity standards for agent-to-agent delegation remain unsettled, though NIST
  and NCCoE are actively gathering input [T14][T15].
- Vendor surveys show strong signals but need independent replication [T18].
- Many protocols define hooks for security but cannot enforce end-to-end policy
  alone; enforcement has to live in hosts, gateways, runtimes, and organizational
  governance [T06][T08][T27].
