# Protocols and Standards (2025-2026)

Prepared on March 14, 2026.

## Protocol stack framing

No single protocol covers the full agent lifecycle. The ecosystem is converging on a layered stack:

- **Contract/manifest layer**: OSSA
- **Discovery and trust layer**: DUADP, ANP
- **Model-to-tool context layer**: MCP
- **Agent-to-agent communication layer**: A2A, ACP
- **Agent-to-UI interaction layer**: AG-UI
- **Framework API interoperability layer**: LangChain Agent Protocol
- **Code-execution tooling variant**: ATP [T01][T02][T07][T09][T11][T13][T15][T16][T17]

## Quick comparison table

| Standard / Protocol | Primary purpose | Scope | Typical transport / message model | Adoption signal (as observed) |
|---|---|---|---|---|
| **MCP** | Connect LLM apps to tools/data with reusable adapters | App/tool integration | JSON-RPC-style protocol; local/remote servers; SDKs | Backed by Anthropic; broad ecosystem integrations; OpenAI connector support in API docs [T07][T08] |
| **A2A** | Inter-agent task discovery and coordination | Agent-to-agent | HTTP + JSON artifacts (Agent Card), task/messaging patterns, streaming options | Google-led open spec; public partner ecosystem claims in launch materials [T09][T10] |
| **AG-UI** | Standard event contract between agents and frontends | Agent-to-UI | HTTP request + SSE event stream (plus framework SDKs) | Active GitHub org + multi-framework adapter ecosystem [T11][T12] |
| **ANP** | Open network protocol for agent internet | Cross-org agent networking | DID-based identity/encryption + meta-protocol negotiation + app protocol layer | Dedicated foundation/docs + OSS SDK implementations [T13][T14] |
| **LangChain Agent Protocol** | Framework-agnostic APIs for running/managing agents | Runtime API interoperability | REST/OpenAPI endpoints (runs, threads, store) | Maintained public spec and releases in langchain-ai repo [T15] |
| **ACP** | Lightweight interoperable messaging across agents | Agent-to-agent | HTTP-native REST patterns + sync/async/streaming options | IBM-led open effort, active OSS repo and Linux Foundation alignment claims [T16] |
| **ATP** | Secure code-first tool execution for agents | Tool execution/runtime | Agent-generated JS/TS executed in sandbox VMs | Monday.com open-source protocol and docs [T17] |
| **DUADP** | Decentralized discovery/federation for agent resources | Discovery and registry | `/.well-known/duadp.json`, DNS/WebFinger, REST endpoints, federation | Public site + npm package + protocol README/spec links [T01][T03][T05] |
| **OSSA** | Portable contract/spec for defining agents once and exporting | Contract/deployment | YAML/JSON manifest + CLI export adapters | Public docs/site + npm package and active changelog [T02][T04][T06] |

## Focus: DUADP and Open Standard Agents

## DUADP (duadp.org + `@bluefly/duadp`)

Based on the DUADP site and package README, DUADP positions itself as a decentralized discovery protocol for agents/skills/tools across organizational boundaries. It uses `/.well-known` discovery manifests, federation, and DID/signature primitives; it also exposes a TypeScript SDK and CLI entrypoint. [T01][T03][T05]

Practical interpretation:

- If MCP solves “how an agent uses a tool,” DUADP is aiming at “how agents find tools/agents across domains.”
- If A2A solves “how agents talk,” DUADP attempts to solve “how they are discoverable and verifiable first.”

## OSSA (openstandardagents.org + `@bluefly/openstandardagents`)

OSSA presents itself as a manifest specification and export toolchain (define agent once, target multiple runtimes/platforms). Package metadata and README indicate explicit positioning between protocol standards (MCP/A2A) and implementation frameworks (LangChain/CrewAI/OpenAI Agents SDK). [T02][T04][T06]

Practical interpretation:

- OSSA is best understood as a **contract/deployment abstraction** for heterogeneous agent stacks.
- Teams using multiple frameworks could use OSSA to reduce duplicated configuration and standardize governance metadata in one artifact.

## Design and adoption trends

1. **Specialized protocol roles are increasing**, not collapsing into one universal spec.
2. **Identity + discovery are becoming first-class** (DUADP/ANP/NIST focus). [T01][T13][T22]
3. **Interoperability claims are now a buying criterion** in enterprise content (blogs, platform announcements, docs). [T27][T35][T36]
4. **Specification governance is still fluid** (many standards still pre-1.0 or rapidly changing release cadence). [T15][T16][T17]

## Implementation cautions

- Treat protocol maturity as uneven; verify conformance testing and operational telemetry before production rollout.
- Confirm security semantics at boundaries (auth, authorization, provenance), not only wire format compatibility. [T22][T23][T24]
