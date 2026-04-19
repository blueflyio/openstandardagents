# Security, Identity, and Governance in Agentic AI (late-2025 to early-2026)

## 1) Security reality: adoption outpaced control

The strongest quantitative signal in this run came from Gravitee’s 2026 report and companion post:

- 81% of teams are beyond planning.
- Only 14.4% report full security/IT approval across their AI agent fleet.
- 88% reported confirmed or suspected incidents in the prior year.
- Only about 22% treat agents as independent identities.
- 45.6% still rely on shared API keys for agent-to-agent authentication.

These numbers, while vendor-published and therefore not equivalent to peer-reviewed prevalence studies, align with the structural concern raised by NIST NCCoE: organizations are deploying increasingly autonomous software/AI agents before identity and authorization controls are mature enough for that autonomy level. [S25][S26][S16]

## 2) Threat model consensus across sources

Across standards bodies, security guides, and technical writing, the same attack classes recur:

- **Prompt injection (direct and indirect)**, especially via tool-returned data.
- **Excessive permissions / over-privileged agents**.
- **Hallucinated or mis-scoped actions** in high-authority contexts.
- **Weak provenance and attribution** (who called what, under whose authority).

OpenAI’s 2026 guidance reframes prompt injection as partly a social-engineering and system-architecture problem, not just a string-filtering problem. Defenses therefore require execution boundaries, sink controls, and user confirmation patterns, not only prompt sanitization. [S27]

## 3) Prompt injection: why tool surfaces matter

A practical point that policy and engineering teams both miss: user-input filtering alone is insufficient in agentic systems.

Agent stacks read from:
- APIs
- documents
- web pages
- emails/chats
- internal databases

Any of these channels can carry adversarial instruction-like content. If that content is placed into active context without validation and privilege checks, it can steer tool calls or exfiltration behavior. This aligns with OWASP LLM risk framing and current platform guidance. [S27][S28]

## 4) Identity and authorization as first-class control planes

NIST NCCoE’s concept paper directly asks industry for practices around:
- identification,
- authentication,
- authorization,
- auditing,
- non-repudiation,
- prompt-injection mitigation controls.

This is important because it frames agent security as IAM + governance infrastructure, not merely model safety policy. In other words, an “AI safety” team cannot solve this alone; platform IAM, API governance, and runtime policy teams are central. [S16]

## 5) Governance trends in protocol and platform layers

### 5.1 Open governance shift

MCP’s move into Linux Foundation AAIF indicates that critical agent infrastructure is moving toward neutral governance, reducing single-vendor control risk and improving interoperability confidence for enterprises. [S07][S08]

### 5.2 Runtime constraints in platform designs

Commercial and OSS platforms now commonly include:
- policy gates,
- approval checkpoints,
- traceability,
- configurable access control,
- model/provider routing and governance controls.

GitLab Duo Agent Platform’s GA materials emphasize exactly this blend: agentic capability with namespace access control, visibility, and managed integration boundaries. [S36][S37][S38]

## 6) Web governance and agent traffic pressure

The “agentic web” policy discussion (Harvard-linked commentary and legal analysis) suggests two converging governance concerns:

1. AI/bot traffic scale can stress existing web economics and access models.
2. Platforms and developers are contesting whether authority should be platform-gatekept or protocol-mediated.

Quantitative bot-share claims (e.g., “about half of traffic”) should be cited carefully by source and context, because definitions differ significantly across reports and years. [S29][S30]

## 7) Practical security control stack (2026 baseline)

### Identity and auth
- Unique machine identity per agent.
- No shared long-lived credentials.
- Signed agent metadata (where supported).
- Scoped delegation and revocation.

### Authorization
- Least privilege at tool/action granularity.
- Policy-as-code checks (pre-execution where possible).
- Agent-to-agent and agent-to-tool permissions separated.

### Runtime safety
- Input and output boundary controls.
- Tool-result sanitization and provenance tracking.
- Human approval for irreversible/high-risk actions.
- Rate limiting, spend limiting, blast-radius constraints.

### Observability and assurance
- Trace-level audit logs for agent decisions and tool invocations.
- Coverage metrics (what % of agents are actually monitored).
- Red-team and third-party evaluation reporting.

### Governance process
- Central inventory/catalog of active agents and MCP/A2A connections.
- Security sign-off and lifecycle controls (build -> deploy -> retire).
- Incident response playbooks specific to autonomous actions.

## 8) Key security conclusion

The primary security challenge in early 2026 is not lack of awareness. It is execution debt:

- identity models are immature,
- controls are unevenly deployed,
- and autonomy is scaling faster than governance infrastructure.

Teams that treat agent security as “just prompt safety” are already behind. Teams that treat it as distributed IAM + policy enforcement + observability are closer to durable production posture. [S16][S25][S26][S27]

