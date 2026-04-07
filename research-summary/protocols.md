# Protocols and Standards Deep Dive (2026)

This document compares the major agentic protocols and standards in active use and explains where DUADP and OSSA fit.

## 1) Quick definitions

| Standard | Type | Core problem solved |
| --- | --- | --- |
| DUADP | Discovery + federation protocol | How agents/tools are discovered, trusted, and routed across domains |
| OSSA | Contract/manifest specification | How an agent is declared, packaged, validated, and ported |
| MCP | Tool/context protocol | How models/agents call tools and access context safely |
| A2A | Agent-to-agent protocol | How one agent delegates to another with standardized messages |
| AG-UI | Agent-to-UI event protocol | How apps receive structured streaming agent events |
| ANP | Agent network stack concept | How agent identity + messaging can work as internet-like layers |
| Agent Protocol (LangChain) | Framework-agnostic API protocol | How clients and runtimes exchange runs/threads/store semantics |
| ATP | Tool execution protocol | How tool calls and execution can be optimized and sandboxed |

`[T01][T02][T06][T07][T08][T09][T10][T11]`

## 2) DUADP and OSSA: relationship and boundaries

### DUADP responsibilities
- Namespace and discovery (`duadp://...`-style addressing model)
- Registry/federation mechanics
- Trust-tier signaling and verification metadata
- Cross-domain lookup patterns (DNS + web-based manifests)

### OSSA responsibilities
- Agent manifest schema and validation
- Capability declaration (model, tools, transports, policy metadata)
- Platform export/import portability
- Normative conformance expectations

### Combined pattern
In a practical stack:
1. Use **DUADP** to locate and evaluate agent endpoints and trust metadata.
2. Use **OSSA** manifests to interpret what that agent can do and how to run/deploy it.
3. Bind runtime channels through MCP/A2A/AG-UI as needed.

`[T01][T02][T06][T07][T08]`

## 3) Interoperability matrix

| Stack goal | Recommended protocol composition |
| --- | --- |
| Cross-org discovery of trusted agents | DUADP + DID/verification metadata + policy filters |
| Portable agent packaging across platforms | OSSA + schema validation + platform extensions |
| Tool access with low integration friction | MCP (or ATP where code execution model is preferred) |
| Multi-agent task delegation | A2A plus manifest-disclosed capabilities |
| Rich interactive frontend experience | AG-UI event model over HTTP/SSE/WebSocket |
| Hybrid ecosystem with existing app frameworks | Agent Protocol endpoints for runs/threads/store |

`[T01][T02][T06][T07][T08][T10][T11]`

## 4) Protocol snapshots and maturity notes

| Protocol | Public milestone date | Maturity signal (March 10, 2026 view) | Key risk |
| --- | --- | --- | --- |
| MCP | November 25, 2024 | Strong ecosystem momentum; many tooling integrations | Tool over-permission and context leakage |
| A2A | April 9, 2025 (v0.3 updates in July 2025 reporting) | Broad partner coalition; still evolving | Inconsistent auth and trust semantics between implementations |
| AG-UI | 2025-2026 docs stabilization | Valuable for frontend standardization | Event schema drift across SDKs |
| ANP | Early-stage open protocol design cycle | Architecturally ambitious, less operationally proven | Fragmentation if overlapping identity layers diverge |
| ATP | Active alt-protocol positioning | Useful where secure code execution is central | Potential duplication vs MCP in mixed environments |
| DUADP | Early 2026 package/spec activity | Promising for decentralized discovery and governance metadata | Early adoption; trust-model hardening still needed |
| OSSA | Early 2026 spec/package activity | Strong contract-layer value for portability | Needs wider independent validator/tooling ecosystem |

`[T01][T02][T03][T04][T06][T07][T08][T09][T11]`

## 5) Architectural decision guidance

### If your priority is governance and verifiable federation
Start with **DUADP + OSSA**, then bind execution/runtime protocols. This keeps identity, packaging, and policy auditable before high-autonomy rollout. `[T01][T02][T16]`

### If your priority is shipping a single-product assistant quickly
Start with **MCP + AG-UI**, then add A2A only when delegation complexity appears. `[T06][T07][T08]`

### If your priority is secure high-throughput tool execution
Evaluate **MCP vs ATP** by workload profile (latency, execution sandboxing, and governance controls), then standardize one default path per environment. `[T06][T11]`

## 6) ACP status note

Multiple ecosystem narratives discuss ACP and A2A convergence, but authoritative implementation details vary by community source and distribution channel. For production governance, treat ACP lineage as an interoperability concern and anchor policy to your actively supported runtime interfaces (for example: A2A + MCP + OSSA manifest declarations). `[T07][T19]`

## Tether citations used in this file

| ID | Source |
| --- | --- |
| T01 | DUADP — https://duadp.org/ |
| T02 | OSSA — https://openstandardagents.org/ |
| T03 | npm `@bluefly/duadp` — https://www.npmjs.com/package/@bluefly/duadp |
| T04 | npm `@bluefly/openstandardagents` — https://www.npmjs.com/package/@bluefly/openstandardagents |
| T06 | Anthropic MCP announcement — https://www.anthropic.com/news/model-context-protocol/ |
| T07 | Google A2A announcement — https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/ |
| T08 | AG-UI introduction — https://docs.ag-ui.com/introduction |
| T09 | Agent Network Protocol README — https://raw.githubusercontent.com/agent-network-protocol/AgentNetworkProtocol/main/README.md |
| T10 | LangChain Agent Protocol README — https://raw.githubusercontent.com/langchain-ai/agent-protocol/main/README.md |
| T11 | Agent Tool Protocol — https://agenttoolprotocol.com/ |
| T16 | NIST NCCoE concept paper — https://csrc.nist.gov/pubs/other/2026/02/05/accelerating-the-adoption-of-software-and-ai-agent/ipd |
| T19 | Ruh.ai protocol guide (ecosystem perspective) — https://www.ruh.ai/blogs/ai-agent-protocols-2026-complete-guide |
