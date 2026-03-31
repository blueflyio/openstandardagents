# Agentic AI Ecosystem Overview (as of March 31, 2026)

This overview synthesizes findings across academic sources, protocol specs, framework documentation, security research, and industry engineering blogs. Citation keys map to `reading-list.md`.

## Executive summary

Autonomous AI systems are moving from isolated demos to interconnected systems of:

1. **Tool connectivity protocols** (for example MCP),
2. **Agent-to-agent protocols** (for example A2A),
3. **Application/UI interaction protocols** (for example AG-UI, ACP),
4. **Contract/manifest layers** (for example OSSA),
5. **Discovery/identity layers** (for example DUADP, ANP-style DID-centric models).

The ecosystem resembles the early internet protocol era: many overlapping standards are developing in parallel, with incomplete security and governance convergence [S22][S23][S24][S25][S29][S51].

## What the two requested sites are

## `duadp.org`

DUADP (Decentralized Universal AI Discovery Protocol) is positioned as a federated discovery layer for agents, tools, and skills, with DID-oriented identity and trust-tier language [S01][S03].  
In practical terms, it is currently:

- A protocol + SDK package (`@bluefly/duadp`) [S03],
- A node/server model with well-known discovery endpoints and federation claims [S01][S03],
- A Bluefly-led ecosystem project with early-stage npm usage signals [S03].

## `openstandardagents.org`

OSSA is positioned as a **portable agent contract/manifest standard** (YAML) with export adapters to multiple runtimes [S02][S04].  
In practical terms, it is currently:

- A CLI + schema + export toolchain (`@bluefly/openstandardagents`) [S04],
- A "define once, export to many targets" workflow [S02][S04],
- A complementary layer to MCP and A2A, not a replacement protocol [S02][S04].

## Key synthesis themes

1. **Layering is becoming explicit**: MCP (agent-to-tools), A2A (agent-to-agent), AG-UI (agent-to-UI), plus discovery/identity and contract layers [S06][S09][S11][S02][S03].
2. **Interoperability pressure is high**: organizations are trying to avoid MxN custom integrations [S02][S08][S16][S49].
3. **Security maturity lags deployment**: incident rates and identity/authorization gaps remain substantial in enterprise surveys [S45][S46][S47][S48].
4. **Governance is moving from abstract ethics to operational controls**: identity, delegation boundaries, tool authorization, and auditability are now central [S48][S52][S54].
5. **Market is fragmented but converging around open interfaces**: Linux Foundation stewardship of A2A and broad MCP SDK uptake indicate partial consolidation [S07][S09][S10].

## Challenges

- **Protocol overlap/confusion** (for example multiple "ACP" variants) [S17][S18].
- **Inconsistent trust claims** across vendor/blog materials versus independently verifiable metrics [S49][S50].
- **Limited transparency on safety evaluations** from many deployed agent vendors [S24][S25].
- **Weak first-class machine identity adoption** in real deployments [S45][S46][S48].

## Opportunities

- Standardized policy enforcement at tool-call boundaries, not only at model text-output boundaries [S47][S53].
- Shared conformance suites and governance profiles for cross-protocol deployments [S06][S09][S13].
- Better agent registries/discovery + provenance for supply-chain trust and compliance workflows [S01][S03][S48].

## Source quality and confidence

- **High confidence**: official specs, official vendor announcements, university/research outputs [S05][S06][S08][S09][S21][S24][S25][S26][S48].
- **Medium confidence**: product documentation and self-reported package/repo metrics [S03][S04][S07][S20][S34][S42].
- **Lower confidence for quantitative claims**: marketing/blog estimates unless independently corroborated [S49][S50][S53][S55].
