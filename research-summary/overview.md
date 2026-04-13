# Agentic AI Ecosystem Research (Updated: April 13, 2026)

## Executive overview

The 2025–2026 agent ecosystem is converging toward a layered stack:

1. **Agent definition/contract layer** (for example OSSA manifests),
2. **Discovery layer** (for example DUADP, agent registries),
3. **Inter-agent communication layer** (A2A, ACP, ANP),
4. **Tool/data connectivity layer** (MCP),
5. **Agent-user interaction layer** (AG-UI),
6. **Governance/security layer** (identity, authorization, runtime controls). [S02][S03][S04][S14][S16][S20][S32][S34]

This structure resembles early internet protocol development: many standards are active simultaneously, governance is still forming, and interoperability is advancing faster than uniform security controls. [S10][S12][S14][S16][S18][S32]

## What DUADP and Open Standard Agents are

### DUADP (duadp.org)

DUADP (Decentralized Universal AI Discovery Protocol) positions itself as a discovery layer for AI capabilities ("DNS for AI agents"), with `.well-known` discovery manifests, federated search/gossip, identity/trust metadata, and MCP/REST access surfaces. It is distributed via `@bluefly/duadp` (Apache-2.0), currently on version `0.1.4` with public npm distribution. [S01][S04][S05][S06]

### OSSA / Open Standard Agents (openstandardagents.org)

Open Standard Agents (OSSA) defines a portable contract manifest for agents (identity, capabilities, trust, compliance metadata) intended to export to multiple runtimes/platforms. It is distributed via `@bluefly/openstandardagents` (Apache-2.0), currently on version `0.5.1` with public npm distribution. [S02][S03][S07][S08]

### Relationship between the two

The two projects describe a compositional model:
- **OSSA**: what an agent is (contract/manifest),
- **DUADP**: where to discover agents/capabilities. [S02][S03][S04]

## Key ecosystem shifts (late-2025 to early-2026)

- **MCP institutionalized**: Anthropic introduced MCP as an open standard (November 25, 2024) and moved governance to the Linux Foundation’s Agentic AI Foundation (December 9, 2025), with broad ecosystem adoption claims. [S14][S15]
- **A2A scaled to production**: A2A moved from launch to broad backing (150+ organizations reported) and cloud-platform integrations, with Linux Foundation stewardship. [S16][S17][S18][S19]
- **Agent protocol specialization increased**: MCP (tools), A2A (agent-to-agent), AG-UI (agent-to-user), and ACP/ATP variants indicate separation of concerns rather than one universal protocol. [S14][S19][S20][S23][S24]
- **Security/governance lag is measurable**: high adoption and incident rates co-exist with weak identity granularity and incomplete authorization/audit controls. [S12][S32][S33][S34]

## Research-level and operational tensions

### Interoperability vs. control

Open protocols improve portability and reduce point-to-point integration burden, but enterprises still face fragmented identity, policy, and observability implementation. [S14][S16][S22][S32][S34][S40]

### Capability growth vs. safety disclosure

The MIT AI Agent Index reports accelerating deployment and autonomy, but limited public safety transparency and unsettled standards for web behavior. [S12]

### Productivity promise vs. operational risk

MIT Sloan notes persistent hallucination and prompt-injection constraints while expecting rapid transaction-level expansion by agents over the next five years. [S13]

## Practical opportunities

- Standardize **tool access** with MCP where possible. [S14][S15]
- Standardize **agent discovery and metadata** (DUADP/Agent Cards/registries), especially for multi-agent programs. [S01][S04][S16][S19]
- Separate **agent runtime policy** from prompt logic; enforce identity and authorization at infrastructure boundaries. [S32][S33][S34]
- Use focused frameworks (LangGraph, CrewAI, OpenAI Agents SDK, LlamaIndex, etc.) based on workload profile (orchestration-heavy vs. RAG-heavy vs. coding-centric). [S26][S27][S28][S30][S38]

## Material constraints and caveats

- Some blog and market-analysis sources are directional rather than peer-reviewed; they are included as industry signal, not sole evidence.
- Several claims in vendor content could not be independently benchmark-verified within this pass.
- A clearly authoritative "Parlay" framework source was not reliably identified in primary channels during this run.

## Citation keys

Full citation metadata and URLs are in `reading-list.md`.
