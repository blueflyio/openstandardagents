# Security and Governance Research

Current date used for relative-date normalization: May 16, 2026.

## Core threat model

Agentic AI security is an identity, authorization, and runtime-control problem.
The LLM can decide actions, call tools, delegate tasks, and interact with other
agents. Traditional API security often authenticates the caller but does not
verify whether the specific action, target, parameters, context, and delegated
authority are legitimate [BLOG-05].

Recurring risks across sources:

- Prompt injection and goal hijacking [SEC-04] [BLOG-05].
- Excessive permissions and shared credentials [SEC-01] [BLOG-05].
- Hallucinated actions, fabricated tool calls, and invalid parameters [BLOG-05].
- Tool misuse and unexpected code execution [SEC-04].
- Memory/context poisoning and data exfiltration [ACAD-22] [SEC-04].
- Insecure inter-agent communication and opaque delegation chains [SEC-01].
- Cascading failures when autonomous agents create or instruct other agents
  [SEC-01].
- Weak auditability, no kill switch, no decommissioning, and no attribution
  [SEC-01] [BLOG-05].

## Key statistics

Most statistics below come from vendor or industry surveys. They should be used
directionally and cited with methodology caveats.

### Adoption and production scale

- 80.9% of technical teams are past planning and actively testing or running
  agents in live environments [SEC-01].
- 80.3% are specifically deploying AI agents, not just LLMs [SEC-01].
- The average organization in Gravitee's survey manages 37 agents [SEC-01].
- Gartner predicts 40% of enterprise applications will include task-specific AI
  agents by the end of 2026, up from less than 5% in 2025 [BLOG-04].
- Microsoft reported that more than 80% of Fortune 500 companies use active AI
  agents built with low-code/no-code tools, based on first-party telemetry for
  agents in use during the last 28 days of November 2025 [SEC-09].

### Incidents and failures

- 88% of organizations in the Gravitee survey reported confirmed or suspected
  AI-agent security or privacy incidents in the last year [SEC-01].
- The healthcare incident/suspected incident rate in that report was 92.7%
  [SEC-01].
- CSA/Token reported 65% of organizations experienced at least one AI-agent
  incident in the past 12 months, with impacts including data exposure,
  operational disruption, and financial loss [SEC-05].
- CSA/Zenity reported 47% experienced an AI-agent security incident in the past
  year and that detection/response often took hours or days [SEC-06].
- Arkose reported that 97% of enterprise leaders expected a material AI
  agent-driven security/fraud incident within 12 months [SEC-07].

### Visibility, identity, and authorization

- Only 14.4% of organizations in Gravitee's survey have full IT/security
  approval for their entire agent fleet [SEC-01].
- On average, only 47.1% of agents are actively monitored or secured [SEC-01].
- Only 7.7% audit agent activity daily; 37.5% rely on monthly reviews [SEC-01].
- Only 21.9% treat agents as independent identity-bearing entities [SEC-01].
- Agent-to-agent authentication relies heavily on API keys (45.6%) and generic
  tokens (44.4%); mTLS is used by only 17.8% [SEC-01].
- Only 23.7% use an existing IAM/IdP as authorization server for agentic or MCP
  infrastructure [SEC-01].
- 25.5% of deployed agents can create and instruct other agents [SEC-01].
- Only 24.4% have full visibility into which agents interact with other agents
  [SEC-01].
- For agent/tool upstream authentication, OAuth is 51.5%, more than a quarter
  use hardcoded credentials, and 7.1% use no authentication [SEC-01].

## NIST/NCCoE and government guidance

The NIST/NCCoE concept paper "Accelerating the Adoption of Software and
Artificial Intelligence Agent Identity and Authorization" was published on
February 5, 2026, with comments due April 2, 2026 [SEC-02]. It focuses on how
identity standards and best practices can be applied to software and AI agents,
especially agentic AI applications [SEC-02].

NIST asks for feedback on:

- Current and planned AI agent use cases.
- New and unique challenges compared with other software.
- Current and emerging identity/access standards.
- Technologies for identification, authorization, auditing, non-repudiation,
  prompt-injection prevention, and mitigation [SEC-02].

CISA's May 1, 2026 guidance, released with ASD's ACSC and other partners,
recommends careful adoption of agentic AI services, alignment with existing
cybersecurity frameworks, and safe design, deployment, and operation [SEC-03].
The practical implication is to start with low-risk, non-sensitive use cases,
avoid broad/unrestricted access, and add oversight before increasing autonomy.

## OWASP Agentic Top 10

OWASP released the Top 10 for Agentic Applications in December 2025 after input
from more than 100 security researchers, practitioners, user organizations, and
cybersecurity/GenAI providers [SEC-04]. It highlights threats such as agent
behavior hijacking, tool misuse and exploitation, identity and privilege abuse,
and autonomous behavior that can cascade across tools and systems [SEC-04].

OWASP's value is a shared language for engineering and security teams. It
connects controls to agent behavior rather than treating agents as ordinary web
apps or ordinary LLM chatbots [SEC-04].

## Controls that recur across sources

1. Agent inventory: maintain a registry of every agent, owner, purpose, model,
   framework, tools, data sources, credentials, autonomy level, and retirement
   date [SEC-01] [SEC-05].
2. First-class agent identity: issue unique non-human identities; avoid shared
   service accounts and shared API keys [SEC-01] [SEC-02].
3. Least privilege: scope credentials to tools, resources, environments, data
   classes, and action types [SEC-01] [BLOG-05].
4. Runtime action authorization: authorize each tool call with action, target,
   amount, parameters, user delegation, policy, and approval state [BLOG-05].
5. Tool broker: put a policy-enforcing gateway between agents and systems; do
   not place broad credentials inside agent prompts or runtimes [SEC-01].
6. Human-in-the-loop gates: require approval for destructive, financial,
   privileged, customer-facing, production, or regulated-data actions [BLOG-01]
   [SEC-03].
7. Prompt-injection defenses: separate trusted and untrusted content, validate
   tool parameters, use allowlists, and verify outputs before external effects
   [BLOG-05] [SEC-04].
8. Continuous monitoring: log prompts, plans, tool calls, policy decisions,
   inter-agent messages, data access, outputs, approvals, and costs [SEC-01].
9. Cost and resource ceilings: set iteration, token, time, and spend limits in
   code/orchestration, not just in prompts [BLOG-01] [BLOG-05].
10. Kill switches and revocation: instantly freeze a compromised agent, revoke
    credentials, block tool execution, and preserve forensic context [BLOG-05].
11. Egress controls: scan outputs, webhooks, emails, tickets, and agent-to-agent
    messages for secrets, PII, policy violations, and data class boundaries
    [SEC-05].
12. Lifecycle governance: onboard, review, recertify, and decommission agents
    with the same seriousness as privileged service accounts [SEC-01] [SEC-05].

## Where OSSA and DUADP fit

OSSA addresses the "define and govern the agent" layer. Its manifests can carry
identity, allowed actions, tools, autonomy mode, observability, compliance
frameworks, cost controls, human-in-the-loop policies, signatures, SBOM pointers,
and Cedar authorization metadata [BF-01] [BF-05] [NPM-01].

DUADP addresses the "find and verify the agent" layer. It can expose agents,
skills, and tools through well-known endpoints, WebFinger, DNS TXT records,
federation, GAID/DID identity, signatures, trust tiers, revocation state, and
governance endpoints [BF-03] [BF-04] [NPM-02].

Together, OSSA and DUADP are best understood as control-plane infrastructure:
OSSA defines the contract; DUADP publishes and discovers the contract with
evidence. They do not remove the need for runtime enforcement, but they provide
structured inputs for enforcement.

## Residual risks

- Protocol compliance does not guarantee safe behavior. MCP, A2A, AG-UI, and
  DUADP can carry unsafe data or actions unless hosts and runtimes enforce
  policy.
- Public adoption metrics for OSSA and DUADP are early. Security-critical users
  should validate implementations, run conformance tests, and threat model
  federation before relying on public trust tiers [NPM-01] [NPM-02].
- Vendor surveys may overrepresent organizations already interested in agent
  security. Use exact statistics with methodology notes [SEC-01] [SEC-05]
  [SEC-06] [SEC-07].
