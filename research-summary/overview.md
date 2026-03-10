# Agentic AI Landscape (Late-2025 to Early-2026): Overview

## Executive synthesis

By 2026-03-10, the agent ecosystem looks like the early web: rapid protocol proliferation, fast framework adoption, and lagging governance. University and policy sources converge on one point: autonomous agents are easy to build, hard to supervise, and now require open interoperability standards plus enforceable security identity models. [R11][R13][R15][R50]

Three layers are stabilizing:

1. **Tool/data access protocols** (especially MCP) [R19][R20]  
2. **Agent-to-agent protocols** (A2A, ACP lineage, ANP) [R22][R24][R30][R27]  
3. **Contract/deployment and UX layers** (OSSA/DUADP, AG-UI, framework APIs) [R04][R05][R02][R25]

At the same time, security evidence shows a deployment-governance gap: organizations are moving into production faster than identity, authorization, and monitoring controls can mature. [R44][R45][R50]

## What DUADP and Open Standard Agents are (requested focus)

### DUADP (`duadp.org`)

DUADP presents itself as a **decentralized discovery protocol for AI agents**, positioned as a DNS/WebFinger/gossip-style discovery layer with governance hooks and MCP-compatible tooling. It emphasizes:

- federated discovery via `.well-known` resources,
- search/registry endpoints,
- identity and governance alignment,
- SDK distribution via npm (`@bluefly/duadp`) and PyPI (`duadp`). [R01][R02][R03]

In short, DUADP is trying to standardize **how agents find each other and publish capabilities** across organizational boundaries.

### Open Standard Agents / OSSA (`openstandardagents.org`)

OSSA positions itself as a **vendor-neutral agent manifest specification** (YAML/JSON) that is not itself a runtime protocol. It is framed as a contract layer between protocols (MCP/A2A) and deployment targets. [R04][R05][R06]

Core claim: define agents once in a standard manifest and export to multiple runtimes/platforms. The npm package (`@bluefly/openstandardagents`) delivers this CLI/SDK workflow. [R08]

In short, OSSA is trying to standardize **how agents are described, validated, and deployed**.

## 2026 protocol landscape in one view

| Layer | Leading examples | Primary goal |
|---|---|---|
| Agent-tool/data | MCP | Standardized tool/resource connectivity for models |
| Agent-agent | A2A, ACP, ANP, ATP variants | Task delegation, collaboration, discovery, secure messaging |
| Agent-user interface | AG-UI | Event protocol for front-end/runtime interaction |
| Contract/deployment | OSSA (+ DUADP for discovery) | Interoperable manifests, validation, packaging/export |

Sources: [R19][R24][R25][R05][R02][R30][R33]

## Adoption and maturity signals

- **MCP** shifted from new standard (2024-11-25) to foundation-backed governance by 2025-12-09, with broad ecosystem integration claims. [R19][R21]
- **A2A** moved quickly in enterprise ecosystems with 150+ supporting organizations and active spec/tooling updates. [R22][R23][R24]
- **Framework adoption** is high by repository activity (LangGraph, CrewAI, AutoGen, LlamaIndex, OpenAI Agents SDK). [R56]
- **Security maturity** lags deployment maturity, based on Gravitee survey data and NIST’s current identity/authorization initiative. [R44][R45][R50]

## Principal opportunities (2026)

1. **Interoperability-first architecture** can reduce custom integration burden and lock-in risk. [R19][R22][R29][R42]
2. **Composable protocol stacks** (MCP + A2A + AG-UI + policy layer) are becoming practical for production systems.
3. **Manifest/contract standardization** (OSSA-style) can improve portability, policy review, and CI validation across teams. [R05][R08]

## Principal risks and unresolved gaps

1. **Prompt injection and control-flow abuse** remain unresolved at architecture level for many deployments. [R46][R51][R52][R53]
2. **Identity and least-privilege** controls are not yet standard operational practice for most agent fleets. [R45][R50]
3. **Transparency and web behavior norms** are still under-defined, highlighted by MIT’s index and Harvard protocol-policy discussions. [R13][R11][R17]
4. **Evidence quality variance**: many ecosystem claims come from blog/marketing sources rather than peer-reviewed benchmarks.

## Source-quality and coverage notes

- This package prioritizes primary sources (official protocol specs, university publications, standards bodies, and major repos) and labels weaker evidence when used.
- Some ecosystem metrics (for example, adoption percentages in blog posts) are directional, not audited.
- Where paywalls or sparse official detail existed, alternatives are included in `reading-list.md`. [R18]
