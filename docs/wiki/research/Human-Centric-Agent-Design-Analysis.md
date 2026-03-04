# Human-Centric Agent Design Analysis

> **Wiki Path:** `openstandardagents.wiki/research/human-centric-agent-design-analysis.md`
> **Date:** March 3, 2026
> **Author:** Thomas Scola / Bluefly.io
> **Status:** Research — feeds into OSSA v0.5.0 spec and NIST responses

---

## 1. The Problem Statement

The agent ecosystem treats cognition as an afterthought. MCP defines how agents access tools. A2A defines how agents talk. OSSA defines the contract. But nobody defines how agents *think* — and nobody makes that thinking auditable, portable, or human-reviewable.

This creates three cascading failures in production agent systems:

**Opacity.** When an agent makes a bad decision, operators get a flat log of tool calls. They can see *what* happened but not *why*. The reasoning that led to the action is invisible — it lived and died inside a single LLM inference call.

**Fragility.** Sequential thinking today is a dumb MCP tool: a string, a number, a boolean. No schema for thought structure. No persistence. No way to replay a reasoning chain after a failure. No way to fork an agent's thinking at a decision point and explore what would have happened with a different approach.

**Compliance Gap.** FedRAMP, NIST SP 800-53, and the new CAISI initiative all require audit trails for automated decision-making. Current agent telemetry tracks tool invocations and token counts — it does not track the reasoning process that led to those invocations. For government deployments, this is a blocking gap.

## 2. What Exists Today

### 2.1 MCP Sequential Thinking Server

The official `@modelcontextprotocol/server-sequential-thinking` provides a single tool with four inputs: `thought` (string), `thoughtNumber` (integer), `totalThoughts` (integer), `nextThoughtNeeded` (boolean). Optional fields for revision and branching exist but carry no schema enforcement, no persistence, and no analysis capability.

This is a notepad, not a cognitive architecture.

### 2.2 Multi-Agent Sequential Thinking (FradSer)

FradSer's `mcp-server-mas-sequential-thinking` runs 6 specialized thinking agents in parallel (factual, intuitive, critical, creative, systemic, practical) and synthesizes their outputs. This is closer to what's needed but consumes 5–10x tokens per call and has no spec-level integration — it's a runtime hack, not a portable standard.

### 2.3 Observability Tools

Arize/Phoenix, Langfuse, Portkey, and LangSmith trace tool calls and LLM invocations. They provide latency, token counts, and error rates. None of them model the *reasoning structure* — they treat thought steps as opaque strings, not as graph nodes with relationships.

### 2.4 Academic Landscape

Four relevant threads from 2025–2026 research:

**Cognitive Trajectories** (TechRxiv data survey): Defines trajectories as loops of (observation, action, reflection, memory update → new state). Identifies that "reasoning paths must remain both structured and interpretable" but offers no spec for how to encode this portably.

**Responsible Reasoning** (TechRxiv 2025): Proposes evaluation methodology for agentic reasoning with embedded safety — Curate, Unify, Probe, Benchmark, Analyze. Maps reasoning models (CoT, ToT, ReAct, Reflexion) but focuses on evaluation, not on making reasoning a manifest-level primitive.

**Context Graphs** (Foundation Capital, Dec 2025): Frames the gap as "missing decision traces" and calls it a trillion-dollar opportunity. Argues that reasoning connecting data to action has never been treated as data. Closest to what OSSA needs to build.

**Human-Centric Agent Architecture** (Springer, PRO-VE 2025): Proposes hybrid human-AI collaboration where agent reasoning is transparent and reviewable by human operators. Aligns directly with OSSA's human-in-the-loop governance model.

## 3. OSSA's Position

OSSA is uniquely positioned because it already owns the contract layer. Adding `spec.cognition` to the manifest means reasoning becomes as portable as identity, capabilities, and compliance. No other standard attempts this.

### 3.1 What `spec.cognition` Enables

**For Operators:** Reasoning becomes visible. When an agent makes a decision, the thought graph shows the path — which alternatives were considered, where confidence dropped, where revisions occurred. This transforms debugging from "look at the logs" to "walk the decision tree."

**For Compliance:** Every thought step is a node with a timestamp, confidence score, and governance trigger evaluation. Auditors traverse the graph, not a flat log. This directly satisfies NIST SP 800-53 AU-3 (Content of Audit Records) and AU-6 (Audit Review, Analysis, and Reporting) at a depth no current agent framework provides.

**For Data Science:** Thought chains become first-class data. Embed entire reasoning trajectories as vectors. Cluster agents by how they think. Detect reasoning drift. Compare reasoning across agents on the same problem. Build models that predict which reasoning patterns lead to better outcomes.

**For Agent Builders:** The wizard in `openstandard-ui` gets a "Reasoning Pattern" step. Choose sequential, tree-of-thought, ReAct, or plan-and-execute. See a preview of the expected thought graph shape. The pattern travels with the manifest — export to Docker, K8s, CrewAI, and the reasoning contract comes along.

### 3.2 The Six Capabilities

| # | Capability | What's New | Where It Lives |
|---|---|---|---|
| 1 | Thought Graphs | Reasoning steps as directed graph nodes, not flat logs | `agent-brain` (Neo4j + Qdrant) |
| 2 | Cognitive Fingerprinting | Measurable reasoning signature per agent (depth, revision freq, branch utilization) | `agent-tracer` |
| 3 | Cross-Agent Reasoning Diff | Semantic comparison of how different agents approached the same input | `agentic-flows` |
| 4 | Reasoning Pattern Templates | Portable specs for cognitive architecture, exported with the manifest | `openstandardagents` (templates/) |
| 5 | Thought-Chain Embeddings | Vector space of reasoning trajectories for clustering and anomaly detection | `agent-brain` (Qdrant) |
| 6 | Compliance Reasoning Audit | Traversable decision trees with confidence scores and governance triggers | `compliance-engine` |

### 3.3 Schema Design (Draft)

```yaml
spec:
  cognition:
    pattern: sequential          # sequential | tree_of_thought | react | plan_and_execute
    constraints:
      max_depth: 10              # max thought steps before forced convergence
      branching: true            # allow alternative reasoning paths
      revision: true             # allow backtracking
      confidence_threshold: 0.7  # minimum confidence to proceed without human review
    trace:
      format: otel_spans         # otel_spans | ossa_native | both
      storage: graph             # vector | graph | both
      retention: 90d
    governance:
      human_review_triggers:
        - confidence_below: 0.5
        - contradiction_detected: true
        - branch_depth_exceeds: 5
      audit_required: true
```

Thought node schema:

```yaml
ThoughtNode:
  id: uuid
  agent_gaid: did:ossa:<uuid>
  session_id: uuid
  thought_number: integer
  content: string
  confidence: float            # 0.0–1.0
  parent: uuid | null          # previous thought
  branches: uuid[]             # alternative paths explored
  revision_of: uuid | null     # if this revises a prior thought
  tools_invoked: string[]      # tools called during this thought step
  timestamp: ISO8601
  duration_ms: integer
  token_count: integer
  governance_triggers: string[] # which triggers fired, if any
```

## 4. NIST Alignment

This work directly supports both NIST submissions:

**CAISI RFI (deadline March 9, 2026):** Section 5 (Observability, Audit, and Incident Response) can reference `spec.cognition` as the mechanism that makes agent reasoning auditable at the spec level, not just at runtime.

**ITL Concept Paper (deadline April 2, 2026):** Section 2 (Authorization Model) can reference governance triggers in the cognition schema — agents that drop below confidence thresholds automatically escalate to human review, creating a spec-enforced human-in-the-loop contract.

### NIST SP 800-53 Control Mapping

| Control | Description | OSSA Implementation |
|---|---|---|
| AU-3 | Content of Audit Records | ThoughtNode captures agent GAID, timestamp, content, tools invoked, governance triggers |
| AU-6 | Audit Review and Analysis | Thought graph traversal enables structured review of reasoning chains |
| AU-12 | Audit Record Generation | Every cognition step auto-generates a ThoughtNode persisted to graph store |
| CA-7 | Continuous Monitoring | Cognitive fingerprinting detects reasoning drift; anomaly detection flags deviations |
| IA-2 | Identification and Authentication | Agent GAID (DID) attached to every ThoughtNode |
| SI-4 | System Monitoring | Reasoning analytics dashboard provides real-time cognitive observability |

## 5. Competitive Landscape

| Approach | Who | Reasoning as Spec? | Portable? | Auditable? | Data Science Layer? |
|---|---|---|---|---|---|
| MCP Sequential Thinking | Anthropic | No — runtime tool only | No | No | No |
| MAS Sequential Thinking | FradSer | No — runtime multi-agent | No | No | No |
| LangGraph reasoning traces | LangChain | No — framework-specific | No | Partial (LangSmith) | No |
| Agent Spec (Oracle) | Oracle | No — workflow-focused | Partial | No | No |
| OAGS (Sekuire) | Sekuire | No — governance-focused | Partial | Partial | No |
| **OSSA spec.cognition** | **Bluefly.io** | **Yes — manifest-level** | **Yes** | **Yes** | **Yes** |

Nobody else makes reasoning a first-class, spec-level, portable, auditable primitive with a data science layer on top. This is the gap OSSA fills.

## 6. Implementation Sequence

Phase 5 executes after v0.4.6 ships. Schema first, everything else flows from there.

1. **5a. Schema** (`openstandardagents`): Draft `spec.cognition` in v0.5.0 RFC. Zod validation. CLI flag `--reasoning sequential`.
2. **5b. Thought Graph** (`agent-brain`): Neo4j + Qdrant dual-store. ThoughtNode CRUD. Embedding pipeline. Cognitive fingerprinting.
3. **5c. Observability** (`agent-tracer`): OTel span mapping. Reasoning analytics. Cross-agent diff. Anomaly detection.
4. **5d. MCP Bridge** (`agent-protocol`): Bidirectional adapter between MCP sequential thinking and OSSA thought graphs.
5. **5e. Wizard** (`openstandard-ui`): Reasoning Pattern step. Template library. Thought graph preview.
6. **5f. Compliance** (`compliance-engine`): Traversable decision tree renderer. FedRAMP/NIST audit export.

## 7. Open Questions

1. **Thought graph retention vs. privacy:** 90-day default retention, but some compliance regimes require longer. Should OSSA define retention tiers?
2. **Cross-organization reasoning sharing:** When Agent A (org 1) delegates to Agent B (org 2), should B's thought graph be visible to A's auditors? What about the reverse?
3. **Reasoning pattern IP:** If an organization develops a proprietary reasoning pattern template, how does OSSA handle licensing metadata for pattern sharing?
4. **Token cost of cognitive traces:** Capturing every thought step increases token consumption. Should OSSA define sampling strategies (e.g., full trace for tier_3+ agents, sampled for tier_1)?
5. **Real-time vs. post-hoc analysis:** Should cognitive fingerprinting run in real-time (expensive) or as a batch process over stored thought graphs (cheaper but delayed)?

## 8. References

- Hou et al., "MCP: Landscape, Security Threats, and Future Research Directions" (arXiv:2503.23278)
- Foundation Capital, "Context Graphs: AI's Trillion-Dollar Opportunity" (Dec 2025)
- TechRxiv, "Data in Agentic AI: A Comprehensive Survey" (2025)
- TechRxiv, "Responsible Agentic Reasoning and AI Agents: A Critical Survey" (2025)
- Sousa et al., "A Human-Centric Agent Architecture for Hybrid Industrial Collaboration" (Springer PRO-VE 2025)
- Harvard Data Science Review, "The Agent-Centric Enterprise" (Issue 8.1, Winter 2026)
- NIST CAISI, "Request for Information on AI Agent Security Standards" (Feb 2026)
- NIST ITL, "Concept Paper on AI Agent Identity and Authorization" (2026)
- OSSA v0.4 Specification, https://openstandardagents.org/specification/

---

*This document is research input for the OSSA Technical Steering Committee and feeds directly into the v0.5.0 RFC process.*
