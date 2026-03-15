# Agentic AI Ecosystem Research (2026) — Overview

Date prepared: 2026-03-15  
Scope: late-2025 through early-2026

## Executive synthesis

The agent ecosystem is converging into a layered stack, but the stack is still immature and unevenly governed:

1. **Agent definition and packaging** (what an agent is): OSSA / Open Standard Agents (`@bluefly/openstandardagents`) provides a schema-first manifest and export toolchain, similar to OpenAPI for services.[R02][R04][R57]  
2. **Tool and context connectivity** (what an agent can use): MCP standardizes model-to-tool/data connections.[R07][R08]  
3. **Agent-to-agent communication** (how agents collaborate): A2A, ACP, and ANP each define peer communication patterns with different complexity and trust models.[R09][R10][R15][R13]  
4. **Agent-to-UI communication** (how users observe/control): AG-UI standardizes event streams between runtime and front end.[R12]  
5. **Discovery and federation** (how agents are found): DUADP (`@bluefly/duadp`) defines decentralized discovery, publishing, and federation endpoints.[R01][R03][R05]  
6. **Identity, authorization, and governance** (whether actions should be allowed): NIST/NCCoE and industry reports show this layer is now the primary bottleneck.[R37][R34]

The central pattern: **adoption is accelerating faster than institutional controls**. Security posture, identity maturity, and transparency lag behind deployment velocity.[R34][R40][R42]

## What DUADP and OpenStandardAgents are (requested deep understanding)

## DUADP (`https://duadp.org/`, npm `@bluefly/duadp`)

DUADP is a discovery-and-federation protocol for agent ecosystems. In practical terms, it is trying to be a DNS-like discovery plane for agents, skills, and tools across organizational boundaries.[R01][R05]

Key characteristics:
- **Discovery manifest** at `/.well-known/duadp.json`
- **Registry APIs** for skills/agents/tools
- **Federation APIs** for peer registration and distributed search
- **Identity/trust hooks** via DID and signatures
- **Interop positioning** with MCP and A2A ecosystems.[R05]

The TypeScript SDK (`@bluefly/duadp`) exposes client, server router, validation, crypto, DID, and conformance modules; npm metadata confirms Apache-2.0 licensing and active public distribution.[R03][R05][R56]

## Open Standard Agents / OSSA (`https://openstandardagents.org/`, npm `@bluefly/openstandardagents`)

OSSA is a **manifest and interoperability standard** plus tooling. It is not positioned as a replacement for MCP or A2A; instead it defines agent contracts and exports them to multiple runtime frameworks/platforms.[R02][R04][R57]

Key characteristics:
- Declarative YAML/JSON agent manifest (schema-governed)
- CLI for validation, migration, and generation
- Exporters to multiple deployment targets (e.g., LangChain, CrewAI, MCP-oriented outputs, OpenAI Agents SDK-oriented outputs, infrastructure packaging)
- Explicit positioning as a bridge layer between protocol definitions and production deployment.[R57]

npm data shows `@bluefly/openstandardagents` is actively published, Apache-2.0 licensed, and tied to the OpenStandardAgents/GitLab codebase.[R04][R56]

## Relationship between DUADP and OSSA

- **OSSA** answers: “How do I define/package an agent contract portably?”  
- **DUADP** answers: “How do nodes discover/share those contracts and capabilities across a federated network?”  

Together, they represent a **definition + discovery** pattern, comparable to “OpenAPI + service registry” for agentic systems.[R05][R57]

## Ecosystem state in early 2026

- **Interoperability momentum is real:** MCP and A2A are now widely referenced in enterprise architecture discussions; A2A partner listings grew significantly after launch.[R07][R09][R11]  
- **Protocol pluralism is increasing:** AG-UI, ACP, ANP, and ATP are solving adjacent communication layers, but overlap and fragmentation remain high.[R12][R15][R13][R17]  
- **Security is the limiting factor:** Gravitee and MIT findings indicate governance and transparency are materially behind deployment.[R34][R40]  
- **Bot/agent traffic pressure is rising:** web infrastructure is already under bot-dominant traffic conditions, making identity and bot-verification standards more urgent.[R50][R51]

## Cross-cutting challenges

1. **No universally accepted trust/identity baseline for agents** (shared keys remain common).[R34][R37]  
2. **Prompt-injection and unsafe tool invocation remain unresolved at architecture level**, not just model level.[R36][R52]  
3. **Transparency debt:** product capability disclosure exceeds safety/evaluation disclosure.[R40][R41]  
4. **Standard overlap:** teams must compose MCP + A2A + UI + discovery + policy themselves.[R10][R12][R15]

## Near-term opportunities (12-24 months)

- Treat agent identity as first-class (per-agent credentials, not shared API keys).[R34][R37]  
- Adopt open protocol layers early to reduce bespoke integration tax (MCP/A2A/AG-UI plus discovery strategy).[R31][R32]  
- Build runtime guardrails and observability before scaling autonomy.[R34][R42]  
- Use contract-first definitions (e.g., OSSA) to preserve portability across frameworks and vendors.[R02][R04]

## Known limitations in this research package

- Some enterprise and HBR analyses are partially paywalled; where full text was limited, this package uses accessible abstracts, official summaries, or adjacent authoritative sources and notes this explicitly.[R48][R49]  
- Rapid protocol evolution means implementation details may change quickly; check linked specs/releases before production rollout.[R08][R10][R14]
