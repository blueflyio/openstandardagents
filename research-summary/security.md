# Security and governance (agentic AI, 2025-2026)

## 1) Current risk posture: adoption > control

Gravitee's 2026 enterprise survey framing highlights a governance gap:

- 81% beyond planning,
- only 14.4% with full security approval coverage,
- 88% reporting confirmed/suspected incidents,
- low share of teams treating agents as first-class identities,
- widespread shared-key and hardcoded auth patterns. [R35][R36]

Whether individual percentages vary by vendor sample, the directional signal is consistent with broader industry evidence: rapid deployment without identity-centric controls.

## 2) Primary technical threat classes

### Prompt injection and indirect prompt injection

DEV security analyses and research literature converge on a core issue: agentic systems process attacker-controlled content through the same reasoning channel used for trusted instructions. [R40][R45]

Common blast-radius multipliers:

- broad tool permissions,
- weak output/action policy enforcement,
- multi-agent relays that propagate compromised instructions. [R40][R45]

### Excessive permissions / "permission creep"

Operational drift in granted capabilities (write access, outbound messaging, execution rights) creates reliability and security failure amplification. [R41]

### Web conduct and identity ambiguity

MIT AI Agent Index paper documents uneven technical identification practices, anti-bot/robots.txt tensions, and web interaction norms that are still unsettled for browser-style agents. [R11]

## 3) Identity and authorization frameworks

### NIST/NCCoE concept direction

NIST NCCoE's 2026 concept paper explicitly requests patterns for:

- agent identification and authorization,
- auditability and non-repudiation,
- prompt-injection mitigations,
- standards alignment (for example OAuth/OIDC families where applicable). [R37]

NIST's CAISI initiative broadens this to interoperable, secure AI agent standardization at ecosystem level. [R38]

### Why identity-first matters

When agents share credentials or run under generic service accounts, attribution and policy boundaries collapse. This is exactly the operational anti-pattern enterprise surveys are surfacing. [R36][R37]

## 4) Empirical and research signal

### Transparency and evaluation

MIT's Index indicates large disclosure gaps around safety evaluation and third-party testing across deployed agents. [R10][R11]

### Research-backed defenses (emerging)

Recent papers point toward layered controls rather than single mitigations:

- control/data-flow separation approaches (e.g., CaMeL), [R44]
- policy/intent verification layers around tool execution, [R46]
- explicit anti-injection architecture for autonomous agents. [R45]

## 5) Governance recommendations distilled

1. **Issue unique identities per agent runtime** (not shared API keys). [R36][R37]  
2. **Use scoped, least-privilege authorization** at tool/action granularity. [R40][R41]  
3. **Instrument full execution traces** (inputs, retrieval artifacts, tool calls, approvals, outputs). [R27][R28][R36]  
4. **Enforce human approval gates** for high-impact actions (money movement, external messaging, write operations). [R12][R41]  
5. **Operationalize protocol governance** (version pinning, schema validation, trust boundaries for external agents/tools). [R04][R17][R37]  
6. **Continuously re-audit permissions and behavior** as agents evolve. [R41]

## 6) Broader Internet governance context

Policy sources point to rising automated traffic and the need to preserve human-centric Internet trust signals:

- Imperva/Thales reports nearly half of traffic bot-originated (2023 measurement), [R39]
- Harvard policy writing warns of agentic-web scaling pressure and calls for better bot-human distinction and infrastructure policy responses. [R14]
