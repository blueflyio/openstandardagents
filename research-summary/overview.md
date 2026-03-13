# Agentic AI Ecosystem Research (Late 2025 to Early 2026)

Reference date for relative time normalization: **March 10, 2026**.

## Executive synthesis

The agent ecosystem is converging toward a layered stack:

1. **Agent contracts/definitions** (for example OSSA and adjacent schema-first approaches) [SRC-02][SRC-03]  
2. **Inter-agent protocols** (A2A, ACP, ANP) [SRC-10][SRC-12][SRC-17][SRC-15]  
3. **Agent-tool/data protocols** (MCP, ATP) [SRC-07][SRC-08][SRC-19]  
4. **Agent-user interaction protocols** (AG-UI) [SRC-13][SRC-14]  
5. **Execution frameworks** (OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex, GitLab Duo platform) [SRC-20][SRC-22][SRC-36][SRC-37]

Two named assets in your request fit directly into this landscape:

- **DUADP (`duadp.org`)** positions itself as a decentralized discovery layer ("DNS for AI agents"), with federation, DID-backed identity, and OSSA-native resource publishing. [SRC-01][SRC-04]
- **Open Standard Agents (`openstandardagents.org`) / OSSA** positions itself as a contract/specification layer that sits above transport protocols and below applications, with YAML manifests and multi-target export. [SRC-02][SRC-03]

## What DUADP and OpenStandardAgents are

### DUADP

From first-party site and SDK material, DUADP is an **open discovery protocol + SDK** for publishing and discovering agents/skills/tools across federated nodes rather than a single marketplace. It emphasizes:

- `/.well-known/duadp` style discovery endpoints
- federated propagation/gossip
- DID-based trust and signing
- OSSA-native payload compatibility
- bridge concepts across MCP/A2A ecosystems [SRC-01][SRC-04][SRC-05]

### OpenStandardAgents (OSSA)

OSSA is an **agent manifest specification and toolchain**, not a runtime/orchestrator. It defines identity, capabilities, trust boundaries, and governance metadata in schema-validatable manifests, then exports to multiple frameworks/platforms. [SRC-02][SRC-03][SRC-06]

## NPM package reality check

As of March 2026:

- `@bluefly/duadp` is published and active, Apache-2.0 licensed, homepage `duadp.org`, repository on GitLab. [SRC-05]
- `@bluefly/openstandardagents` is published and active, Apache-2.0 licensed, homepage `openstandardagents.org`, repository on GitLab. [SRC-06]

Both package timelines indicate rapid iteration during late 2025 to early 2026. [SRC-05][SRC-06]

## Main ecosystem signals

- **Protocol consolidation is accelerating**: MCP and A2A moved from announcements to broad ecosystem support and formalization efforts. [SRC-07][SRC-09][SRC-10][SRC-11][SRC-12]
- **Security/governance lags deployment**: Gravitee reports high adoption but weaker approval and identity discipline. [SRC-31][SRC-32]
- **Transparency is uneven**: MIT AI Agent Index reports limited safety disclosure despite rapid autonomy growth. [SRC-25]
- **Standards/governance institutions are now active**: NIST NCCoE and CAISI are explicitly targeting identity, authorization, and secure interoperability for software/AI agents. [SRC-29][SRC-30]

## Practical interpretation for builders

1. Treat your architecture as a **protocol stack**, not a single framework choice.
2. Use **explicit contracts + identity + authorization** from day one.
3. Use **progressive autonomy rollout** with HITL gates for high-impact actions.
4. Keep protocol choices decoupled from runtime choices to reduce lock-in.

These recommendations are consistent across university, standards, and industry sources reviewed. [SRC-23][SRC-24][SRC-25][SRC-26][SRC-29][SRC-31][SRC-34]
