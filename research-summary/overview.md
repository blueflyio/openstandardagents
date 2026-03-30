# Agentic AI Ecosystem Research (Snapshot: March 30, 2026)

This report package summarizes the current agentic AI ecosystem across research, protocols, frameworks, and security, with a specific deep dive into:

- `https://duadp.org/`
- `https://openstandardagents.org/`
- related npm packages and open-source repos

## Executive synthesis

The ecosystem is converging into **a layered architecture**:

1. **Tool/data connectivity** (for one agent): MCP. [R08][R09]  
2. **Agent-to-agent coordination** (many agents): A2A, ACP, ANP, ATP. [R10][R12][R17][R14][R18]  
3. **Agent-to-UI interaction**: AG-UI. [R13]  
4. **Contract/manifest/governance layer**: OSSA. [R05][R06]  
5. **Discovery layer**: DUADP. [R01][R02][R03]

The strongest cross-source pattern is that adoption speed is now ahead of governance and security readiness. MIT, MIT Sloan, NIST, Gravitee, and security research all point to this gap from different angles. [R21][R22][R24][R36][R38][R33][R45][R46]

## What DUADP is (and is not)

**DUADP** positions itself as a decentralized discovery protocol ("DNS for AI agents"), with:

- `.well-known` node manifest discovery
- DNS/WebFinger identity resolution
- federated gossip between registries
- DID-oriented trust metadata
- registry/search/publish APIs
- MCP tool exposure for discovery operations [R01][R02]

Practical interpretation: DUADP is trying to solve the "how does any agent find any other trusted agent/capability across org boundaries?" problem. It does **not** replace MCP (tool calling) or A2A (agent conversation); it sits adjacent as a discovery/federation layer. [R01][R02]

npm signal for `@bluefly/duadp` (March 9, 2026 release, Apache-2.0) shows early-stage adoption (low weekly download count, low dependent count), which is normal for very new infra protocols. [R04]

## What OpenStandardAgents (OSSA) is (and is not)

**OSSA** positions itself as an "agent contract layer": one manifest that can be validated/exported across many runtimes and platforms. [R05][R06]

Practical interpretation: OSSA is attempting for agents what OpenAPI did for REST APIs:

- explicit identity/capability declarations
- policy and governance metadata
- platform export/transpilation
- conformance validation [R05][R06]

This is distinct from transport protocols:

- MCP answers "how agent talks to tools"
- A2A/ACP answer "how agents talk to each other"
- OSSA answers "what this agent is allowed/expected to be and do." [R05][R06]

npm signal for `@bluefly/openstandardagents` (v0.5.1 as of March 28, 2026) indicates active feature velocity but still early ecosystem scale. [R07]

## Core ecosystem reality in 2025-2026

### 1) Interoperability is improving, but still fragmented

Major protocols now have formal docs, SDKs, and governance trajectories:

- MCP (open standard and broad client/server support) [R08][R09]
- A2A (Google launch, Linux Foundation path, growing partner count) [R10][R11][R12]
- AG-UI (event-driven frontend/backend interaction pattern) [R13]
- ACP and ATP (alternative or complementary agent messaging/tooling approaches) [R17][R18][R19][R20]

### 2) Transparency and safety disclosure lag capability disclosure

MIT's 2025 AI Agent Index reports a large transparency gap: developers disclose much more about capabilities than safety evaluations and third-party testing. [R21][R22][R23]

### 3) Security incidents are already common

Gravitee's 2026 data and practitioner accounts indicate high incident prevalence and weak identity practices in production deployments. [R33][R34][R35]

### 4) Standards and identity are moving to the center

NIST CAISI + NCCoE focus on identity, authorization, and interoperable standards for software/AI agents; this aligns with the strongest open problems identified across blogs, research, and enterprise deployments. [R36][R37][R38]

## Strategic implications

For teams building now, the evidence suggests:

- adopt **open protocols by layer**, not one monolithic framework
- make **identity + authorization first-class** from day zero
- treat prompt injection and over-privilege as **expected** events, not edge cases
- prioritize observability and kill-switch patterns before scaling autonomy [R24][R33][R38][R45][R46]

## Notable limitations

- Some high-value business analysis (for example HBR articles) is partially paywalled, so this package prioritizes primary technical/public sources where possible.
- Several protocol ecosystems are still moving quickly; claims in vendor docs can outpace independent validation.

---

## Citation keys used in this file

[R01], [R02], [R03], [R04], [R05], [R06], [R07], [R08], [R09], [R10], [R11], [R12], [R13], [R17], [R18], [R19], [R20], [R21], [R22], [R23], [R24], [R33], [R34], [R35], [R36], [R37], [R38], [R45], [R46]
