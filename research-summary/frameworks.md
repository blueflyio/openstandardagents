# Frameworks and Open-Source Projects (2026)

Date: 2026-04-08

This document summarizes major agent frameworks/platforms and key repositories, including star counts and package snapshots taken on 2026-04-08.

## 1) Core framework landscape

### OpenAI Agents SDK

- Positioning: lightweight multi-agent framework with core primitives (agents, handoffs/tools, guardrails, tracing), plus sessions and realtime support [R32].
- Repo snapshot (`openai/openai-agents-python`): ~20.6k stars, MIT [R38].
- npm (JS sibling): `@openai/agents` v0.8.3 (snapshot; via npm query in this run).

### LangGraph

- Positioning: graph/state-machine execution model for resilient agent workflows (ecosystem references in LangChain docs and repo metadata) [R38].
- Repo snapshot (`langchain-ai/langgraph`): ~28.7k stars, MIT [R38].
- npm package snapshot: `@langchain/langgraph` v1.2.8 (via npm query in this run).

### CrewAI

- Positioning: agent/crew/flow abstractions with production and enterprise docs [R33].
- Repo snapshot (`crewAIInc/crewAI`): ~48.3k stars, MIT [R38].
- Note: npm package named `crewai` appears to be a separate JS implementation; repository provenance should be validated before enterprise adoption.

### Microsoft AutoGen

- Positioning: framework for conversational and event-driven multi-agent apps (AgentChat/Core/Studio) [R34].
- Repo snapshot (`microsoft/autogen`): ~56.8k stars [R38].

### LlamaIndex

- Positioning: document-centric and RAG/agent workflow stack with parsing/workflow emphasis [R35].
- Repo snapshot (`run-llama/llama_index`): ~48.4k stars, MIT [R38].

### Parlant

- Positioning: conversational control/context-engineering layer for customer-facing agents; emphasizes policy-like guideline modeling [R36].
- Repo snapshot (`emcie-co/parlant`): ~17.9k stars, Apache-2.0 [R38].

## 2) Standards/protocol-adjacent repositories

### A2A

- Repo snapshot (`a2aproject/A2A`): ~23.1k stars, Apache-2.0 [R38].
- Function: agent-to-agent protocol definition and implementation ecosystem.

### MCP spec

- Repo snapshot (`modelcontextprotocol/modelcontextprotocol`): ~7.7k stars [R38].
- Function: tool/context interoperability.

### AG-UI

- Repo snapshot (`ag-ui-protocol/ag-ui`): ~12.9k stars, MIT [R38].
- Function: event protocol for agent-to-frontend interactions.

### ANP

- Repo snapshot (`agent-network-protocol/AgentNetworkProtocol`): ~1.26k stars [R38].
- Function: decentralized agent networking vision with layered architecture.

### LangChain Agent Protocol

- Repo snapshot (`langchain-ai/agent-protocol`): ~550 stars [R38].
- Function: run/thread/store API standardization and interoperability.

## 3) GitLab Duo Agent Platform (industry platform, not OSS framework)

GitLab’s GA announcement positions Duo Agent Platform as end-to-end lifecycle agentic tooling:

- context-aware agentic chat,
- prebuilt foundational agents (planner, security analyst),
- custom agents/flows,
- external agent integrations (including Claude Code and Codex CLI references),
- model and governance controls for enterprise deployment [R37].

Practical read: this is a vertically integrated enterprise control plane, not a neutral standard.

## 4) Notable repository maturity indicators

### High-signal indicators

- Active commit/update activity in main repos.
- Clear licenses and governance.
- Documented operational concerns (observability, rollback, HITL, policy hooks).
- Compatibility story with MCP/A2A and security controls.

### Caution indicators

- “Framework” repos with high stars but weak governance docs.
- Sparse issue triage or unclear release discipline.
- Unclear relationship between package names and canonical upstream repos.

## 5) Cost and operational considerations from engineering practice

Production retrospectives (e.g., 47Billion) highlight common costs:

- token amplification in unconstrained multi-agent loops,
- difficult debugging without tracing and explicit state boundaries,
- need for progressive rollout and cost budgets from day one [R44].

Operational implication:

- use lowest sufficient autonomy level first,
- enforce hard action limits and budget guards,
- adopt structured tracing and evaluation before scaling usage.

## 6) Short framework selection guidance

### Use OpenAI Agents SDK when

- You want minimal primitives, strong tracing, and explicit handoff/guardrail concepts [R32].

### Use LangGraph when

- You need graph/stateful control and durable workflow orchestration [R38].

### Use CrewAI when

- You prefer role/task/flow abstractions with production docs and ecosystem integrations [R33].

### Use AutoGen when

- You need conversational multi-agent research-to-production flexibility (with higher architectural complexity) [R34].

### Use LlamaIndex when

- Document parsing/retrieval and knowledge-intensive pipelines dominate use cases [R35].

### Use Parlant when

- Primary challenge is behavioral consistency and controllability in customer conversations [R36].
