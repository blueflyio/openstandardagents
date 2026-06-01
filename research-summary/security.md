# Security, Identity, and Governance

Prepared on June 1, 2026.

## State of adoption and control

The strongest quantitative signal comes from Gravitee's State of AI Agent
Security 2026 report. Its survey of more than 900 executives and practitioners
found that adoption is far ahead of governance [S57][S58].

| Metric | Reported value | Security meaning |
| --- | ---: | --- |
| Teams beyond planning | 81% | Agents are already in test or production [S57][S58]. |
| Full security approval | 14.4% | Most fleets are only partially reviewed [S57][S58]. |
| Confirmed or suspected incidents | 88% | Incidents are normal, not edge cases [S57][S58]. |
| Active monitoring/security coverage | 47.1% average | More than half of agents lack active oversight [S58]. |
| Agents treated as independent identities | About 22% | Most teams still use shared API keys or weak identity models [S58]. |
| Healthcare incident rate | 92.7% | Sensitive-data sectors face higher exposure [S57][S58]. |

These numbers explain why identity and authorization have become the central
security themes for 2026. If agents act at machine speed, connect to APIs, read
documents, write code, send messages, or trigger business transactions, they
must be managed as non-human principals with scoped authority, not as generic
scripts sharing broad service-account tokens [S57][S59].

## NIST/NCCoE concept paper

On February 5, 2026, NIST/NCCoE released a concept paper titled
"Accelerating the Adoption of Software and Artificial Intelligence Agent
Identity and Authorization" [S59][S60]. The paper seeks stakeholder input for
a potential project demonstrating how identity standards and best practices can
apply to software and AI agents [S59].

The core NIST/NCCoE claim is that benefits from AI agents cannot be realized
without understanding how identification, authentication, and authorization
apply to agents [S60]. The paper asks for input on:

- Current and planned AI-agent use cases [S59].
- Unique challenges AI agents bring compared with traditional software [S59].
- Existing or emerging identity and access standards [S59].
- Auditing, non-repudiation, and prompt-injection controls [S59].

The paper specifically mentions standards and mechanisms such as OAuth 2.0 and
extensions, policy-based access control, OpenID Connect, SCIM, SPIFFE/SPIRE,
NGAC, zero trust architecture, and digital identity guidelines as possible
reference points [S59][S60].

## OWASP LLM Top 10 and agentic risk

OWASP's 2025 Top 10 for LLM Applications keeps prompt injection as a critical
risk and expands "Excessive Agency" for agentic architectures [S61].
Excessive Agency is the vulnerability that allows damaging actions when an LLM
agent has too much functionality, too many permissions, or too much autonomy
[S61].

OWASP's prevention strategy maps directly to agent platform design:

1. Minimize tools and extensions the agent can call [S61].
2. Minimize functionality inside each tool [S61].
3. Avoid open-ended tools when narrower structured interfaces suffice [S61].
4. Minimize permissions granted to each tool and agent identity [S61].
5. Execute actions in the user's context where accountability requires it [S61].
6. Require user approval for high-impact actions [S61].
7. Keep authorization and mediation outside the LLM itself [S61].

## Threat model

### Prompt injection

Prompt injection remains the most visible trigger for agent compromise. Direct
injection manipulates the user prompt; indirect injection hides malicious
instructions in documents, websites, emails, repositories, or retrieved
content that the agent reads [S61][S62][S63]. The risk becomes severe when the
same context window that reads untrusted text can also call tools with side
effects.

### Excessive permissions

Agents often inherit broad tool scopes from demos, SDK defaults, or shared
service accounts. A successful injection then has a large blast radius:
database writes, file deletion, external messaging, CI/CD changes, credential
access, or production API calls [S61][S62][S63].

### Hallucinated actions

Agent failures are not only attacker-driven. Agents can misread intent,
hallucinate facts, infer the wrong business rule, or choose a destructive
action to satisfy an ambiguous goal [S13][S14][S61]. This is why
authorization must validate action semantics and not merely authenticate the
agent.

### Delegation and chain-of-authority loss

In multi-agent systems, one agent may delegate to another, which then calls a
tool. Without structured delegation records, the final tool call may lose the
chain of authority showing who authorized the action, under which scope, and
for what purpose [S15][S59][S65].

### Context and memory poisoning

Security surveys identify data poisoning, memory poisoning, long-context
hijacking, and protocol-layer vulnerabilities as emerging risks in LLM-agent
ecosystems [S16][S17]. Agent memory makes this worse because malicious state
can survive a single session.

## Identity and authorization patterns

The emerging best practice is to treat each agent as a distinct non-human
identity with:

- A stable identifier, such as a GAID or DID [S01][S02][S05].
- Cryptographic proof of origin and manifest integrity [S01][S04][S05].
- Scoped credentials or delegated authority bound to a task [S59][S60].
- Policy-evaluated tool and data permissions [S59][S61].
- Revocation and incident-response endpoints [S01][S05].
- Audit records for every decision, approval, tool call, and side effect
  [S15][S57][S59].

DUADP implements part of this through GAID lookup, WebFinger resolution, DID
documents, signatures, trust tiers, federation witnesses, revocation state, and
policy checks [S01][S05]. OSSA implements the contract side through agent DID,
signed manifests, SBOM/provenance pointers, Cedar policies, compliance
metadata, and human oversight declarations [S02][S04].

## Governance architecture

Harvard JOLT's agentic web model is a useful governance blueprint: identity
layer, delegation/standing layer, and runtime control layer [S15].

| Layer | Purpose | Technical controls |
| --- | --- | --- |
| Identity | Know which agent is acting | DID, VC, GAID, registry, signed manifest [S01][S15]. |
| Delegation | Know who authorized it and under what scope | Intent mandates, OAuth/OIDC delegation, policy contracts [S15][S59]. |
| Runtime control | Enforce limits during execution | Tool mediation, approval gates, logging, rate limits, revocation [S57][S61]. |

NIST/NCCoE's work and OWASP's mitigation guidance both reinforce that
governance must be operational, not just documentary [S59][S61].

## Agentic web and bot traffic

The broader web environment is already becoming machine-heavy. CNBC reported
on a Human Security study finding automated traffic grew nearly eight times
faster than human activity in 2025 and that agentic activity from AI agents
such as OpenClaw grew almost 8,000% in 2025 over the prior year [S64]. Harvard
JOLT's analysis argues that legitimate agents need credentialed identity,
principal-agent linkage, delegation parameters, and auditability so that
machine traffic can be accountable rather than merely detected as "bot" traffic
[S15].

The practical implication for standards is that robots.txt-style voluntary
declarations are insufficient for agentic systems. Agents need cryptographic
identity, scoped authority, and enforceable interaction contracts.

## Controls checklist

Minimum viable production controls:

- Inventory every agent, model, prompt, tool, MCP server, vector store, memory
  store, credential, and deployment target [S57][S59].
- Assign each agent a unique identity; avoid shared API keys [S57][S59].
- Scope credentials to task, tenant, user, and time where possible [S59][S61].
- Enforce per-action authorization outside the model [S61][S62].
- Use read-only and narrow tool variants by default [S61][S63].
- Require human approval for irreversible, external, financial, safety, or
  production-changing actions [S13][S61].
- Validate tool arguments and outputs with schemas [S61][S63].
- Treat retrieved content, webpages, documents, emails, and prior memory as
  untrusted input [S16][S17][S61].
- Instrument logs for prompts, retrieved sources, tool calls, policy decisions,
  approvals, denials, outputs, and spend [S57][S61].
- Add loop detection, rate limits, budget caps, and circuit breakers [S55].
- Test prompt injection, data exfiltration, memory poisoning, and delegation
  edge cases before release [S16][S61][S63].

## How OSSA/DUADP map to security needs

| Security requirement | OSSA contribution | DUADP contribution |
| --- | --- | --- |
| Identity | GAID/DID in manifest [S02][S04] | DID-verified node/resource identity [S01][S05] |
| Least privilege | Cedar policies and tool declarations [S02][S04] | Trust-tier gating and policy-aware routing [S01] |
| Provenance | Signed manifests, SBOM, OSCAL pointers [S02][S04] | Signed resource registry and verification [S01][S05] |
| Discovery | Exportable agent-card/metadata [S04] | DNS/WebFinger/federated discovery [S01][S05] |
| Revocation | Contract can declare governance hooks [S04] | Revocation endpoints and federation propagation [S01] |
| Audit | Observability and compliance metadata [S04] | Audit, attestation, and evidence APIs [S01] |

The combined pattern directly responds to the security gap identified by
Gravitee, MIT, NIST, and OWASP: agents need independent identity,
pre-authorization, runtime mediation, audit evidence, and verifiable boundaries
before they act [S11][S57][S59][S61].
