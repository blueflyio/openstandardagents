# Agentic AI, Protocols, Standards, and Security (Research Overview)

**As-of date:** 2026-03-17  
**Scope:** late-2025 to early-2026 developments, with explicit deep dives on `duadp.org`, `openstandardagents.org`, and related npm packages.

## Executive summary

The 2026 agent ecosystem resembles an early-internet phase: multiple open protocols are racing toward adoption, while identity, governance, and interoperability controls are still maturing. [S09][S11][S24][S34]

Three macro findings:
1. **Protocol layering is solidifying** (tool protocol, inter-agent protocol, UI protocol, plus contract/discovery overlays). [S09][S11][S14][S17]
2. **Production adoption is outpacing security readiness** (strong deployment momentum with weak identity and authorization maturity). [S37][S38]
3. **Contract and discovery layers are becoming strategic** (OSSA/DUADP-style models aim to close practical gaps left by transport protocols alone). [S01][S05][S06]

## What DUADP and Open Standard Agents are (plain-language)

- **DUADP** is an open discovery protocol for agents/tools across organizations, with federation and trust-aware identity concepts. It is packaged as `@bluefly/duadp` for TypeScript users. [S01][S02][S03][S04]
- **Open Standard Agents (OSSA)** is a vendor-neutral manifest/specification layer (a contract format) for defining and validating agent capabilities and governance, packaged as `@bluefly/openstandardagents`. [S05][S06][S08]

In short: **OSSA defines portable agent contracts; DUADP discovers/federates them in-network.** [S01][S05][S06]

## Ecosystem architecture pattern emerging in 2026

| Layer | Typical standards/tools in 2026 | Main question answered |
|---|---|---|
| Contract/Manifest | OSSA, Agent Protocol API contracts | "What is this agent and what can it do?" |
| Discovery/Federation | DUADP, ANP discovery concepts | "How do I find/trust the right agent or capability?" |
| Agent-to-tool | MCP, ATP variants | "How does an agent safely use external tools/data?" |
| Agent-to-agent | A2A, ACP | "How do agents delegate and collaborate?" |
| Agent-to-UI | AG-UI | "How does runtime state stream to user interfaces?" |
| Governance/Security | NIST identity/auth workstreams, policy engines | "Who is authorized, auditable, and accountable?" |

Sources: [S01][S05][S09][S11][S14][S16][S17][S18][S20][S34][S36]

## Academic and policy direction

Cornell, Harvard, and MIT sources converge on a shared point: raw model capability is not enough. Operational trust depends on protocol transparency, governance controls, and runtime oversight. [S21][S22][S24][S25][S26]

MIT’s index and Sloan guidance especially emphasize that current deployments still face unresolved reliability and security constraints, despite rapid commercialization. [S24][S25][S26][S27]

## Security reality in production

Industry data and practitioner reports consistently show:
- high adoption momentum,
- low security approval maturity,
- and frequent incident exposure linked to weak identity/authorization practices. [S37][S38][S39]

NIST’s 2026 initiative confirms this has become a standards-level problem requiring agent-specific identity and access architecture. [S34][S35][S36]

## Opportunities (2026)

1. **Interoperability moat**: organizations that adopt open protocol layers early can reduce integration debt and avoid lock-in. [S09][S11][S51]
2. **Security differentiation**: identity-first, policy-enforced agent platforms can become compliance and trust advantages. [S34][S38]
3. **Composable ecosystems**: manifest + discovery + protocol layering enables reusable agent catalogs across teams and vendors. [S05][S06][S47]

## Key risks and constraints

- Standards fragmentation and overlapping claims between protocol projects.
- Immature cross-protocol identity semantics in multi-vendor stacks.
- Safety transparency gaps (especially around real-world autonomous actions).
- Uneven evidence quality in some fast-moving ecosystem claims.

## Source-availability limitations

- Some Harvard Business Review and enterprise reports expose only partial content without subscription/login; in those cases, this research relied on accessible abstracts, companion sources, or official docs to cross-check claims. [S29]
- Certain ecosystem metrics (for example, "active deployments" across proprietary platforms) are not independently auditable and are treated as publisher-reported values.

Sources: [S24][S25][S34][S38][S52]

## Recommended 2026 implementation stance

1. Adopt a **layered standards architecture** (do not force one protocol to solve all layers).
2. Treat every agent as an **independent security principal** with scoped authorization.
3. Require **auditability by design** (trace runs, handoffs, and tool actions).
4. Use **staged rollout and bounded autonomy** for high-risk workflows.
5. Keep a living protocol strategy, because this ecosystem is changing quarterly.

Sources: [S11][S14][S34][S38][S41][S46][S51]

## Document map

- `academia.md` — university and research findings.
- `protocols.md` — protocol-by-protocol technical comparison.
- `frameworks.md` — OSS projects, platform capabilities, and maturity signals.
- `security.md` — threat model, governance, identity, and controls.
- `blogs.md` — production engineering perspectives and practical recommendations.
- `reading-list.md` — source registry with citation keys.
