# Security and Governance Research

As of 2026-05-21.

## Current state: adoption is outrunning control

Gravitee's State of AI Agent Security 2026 report surveyed 900+ executives and technical practitioners and found a severe control gap [S25]. Key figures:

| Metric | Finding |
|---|---:|
| Technical teams past planning | 80.9% [S25] |
| Teams with full security approval for all agents | 14.4% [S25] |
| Confirmed or suspected incidents in the last year | 88% [S25] |
| Healthcare incident rate | 92.7% [S25] |
| Agents actively monitored or secured on average | 47.1% [S25] |
| Teams treating agents as independent identities | 21.9% [S25] |
| Teams using shared API keys for agent-to-agent auth | 45.6% [S25] |
| Technical teams using custom hardcoded authorization | 27.2% [S25] |

The key governance failure is identity. If agents share credentials or act as generic service accounts, authorization and audit trails collapse, especially when agents can create or task other agents [S25].

## NIST and NCCoE direction

NIST launched the AI Agent Standards Initiative in 2026 to foster industry-led standards and community-led protocols for trusted, interoperable, secure agents [S28]. Its strategic pillars are standards facilitation, community-led protocols, and research into agent authentication and identity infrastructure [S28]. The initiative links to the NCCoE concept project on software and AI agent identity and authorization, which seeks feedback on agent deployment use cases, unique challenges, emerging IAM standards, identification, authorization, auditing, non-repudiation, and prompt-injection controls [S28][S29].

The NIST direction validates the need for OSSA/DUADP-style identity, signed manifests, trust tiers, and policy-driven authorization. However, standards are still emerging rather than settled [S28][S29].

## Threat model

OWASP's 2025 LLM Top 10 identifies prompt injection and excessive agency as central agent risks [S26][S27]. Prompt injection can be direct or indirect, including hidden instructions in websites, files, images, or RAG content [S26]. Its impacts include sensitive information disclosure, system prompt leakage, content manipulation, unauthorized function access, arbitrary command execution, and manipulation of critical decisions [S26].

Excessive agency occurs when an LLM system can call tools or other systems but lacks appropriate safeguards. OWASP names three root causes: excessive functionality, excessive permissions, and excessive autonomy [S27]. Triggers include hallucination, direct/indirect prompt injection, compromised tools, and compromised peer agents in multi-agent systems [S27].

## Protocol-specific risks

The 2026 arXiv protocol security paper argues that protocol-level security remains understudied and identifies risks across protocol creation, operation, and update phases [S36]. Important risk categories include:

- Weak or missing binding between identity, authorization, and the agent/tool actually invoked [S36].
- Missing mandatory validation or attestation for executable components, especially in MCP-style multi-server composition [S36].
- Credential lifecycle gaps, overbroad scopes, token lifetime problems, and incomplete consent enforcement [S36].
- Cross-protocol composition risk, where secure components can become unsafe when composed through shared infrastructure [S36].
- Incomplete audit trails for dynamic task delegation and opaque agent collaboration [S36].

The 2025 arXiv interoperability survey similarly finds that protocols are nascent and should be adopted with a phased roadmap rather than assumed universally mature [S35].

## Controls and recommendations

| Control | Why it matters | Supporting sources |
|---|---|---|
| Agent-specific identity | Enables accountability and revocation | [S04][S14][S25][S28] |
| Signed manifests/cards | Prevents spoofed capabilities and supply-chain tampering | [S01][S04][S11][S36] |
| Least privilege tools | Reduces blast radius of prompt injection | [S26][S27][S40] |
| Runtime authorization gate | Enforces policy outside the model | [S25][S27][S40] |
| Short-lived scoped credentials | Avoids shared key sprawl | [S25][S27][S40] |
| Human approval for high-impact actions | Catches irreversible or risky actions | [S23][S26][S27][S31] |
| Structured output validation | Prevents raw LLM outputs from driving systems | [S23][S26] |
| Tool call limits and budgets | Prevents loops and cost attacks | [S23][S27] |
| Trace every run and tool call | Enables debugging and audit | [S18][S19][S22][S23][S25] |
| Revocation and incident endpoints | Handles compromised identities | [S04][S25] |
| Sandboxed execution | Contains untrusted code/tool workflows | [S17][S21][S36] |
| Progressive rollout | Builds trust with measured risk | [S22][S23][S24] |

## Governance model

A practical governance model should treat agents as first-class principals:

1. Register each agent with a stable identifier, owner, purpose, allowed environments, and trust tier [S01][S04][S25].
2. Bind every capability to explicit policies, scopes, approval rules, and evidence requirements [S01][S27].
3. Require signed artifacts for manifests, Agent Cards, MCP servers, and tool registries [S01][S04][S11][S36].
4. Use runtime mediation: no tool call should execute solely because the LLM asked for it [S27][S40].
5. Maintain a complete audit trail: user, agent, tool, action, resource, credential, policy, decision, output, and human approval [S22][S25][S27].
6. Continuously evaluate behavior with red-team tests for direct/indirect prompt injection, data exfiltration, unauthorized writes, and runaway loops [S26][S36].

OSSA and DUADP align well with this model: OSSA provides the contract and policy metadata; DUADP supplies decentralized discovery, DID verification, trust-tier gating, federation, governance, and revocation surfaces [S01][S04][S05].
