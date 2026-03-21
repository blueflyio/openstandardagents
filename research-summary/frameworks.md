# Open-Source Frameworks and Platforms

## What to compare in 2026

Across frameworks, the biggest practical differentiators are:

- orchestration model (graph/task/conversation/code-first),
- observability and guardrails,
- native multi-agent delegation support,
- integration standards (MCP/A2A),
- operational cost profile under long-running workflows. [T44][T47][T66]

## Framework snapshot (as of March 21, 2026)

| Project | Primary model | Notable primitives/capabilities | Maturity signal |
| --- | --- | --- | --- |
| OpenAI Agents SDK (Py/TS) | Lightweight primitives + runner | agents, tools, handoffs, guardrails, tracing, sessions, HITL, realtime | 20,171 GitHub stars (`openai/openai-agents-python`) [T44][T45][T55] |
| LangGraph | Graph-based orchestration runtime | durable state, HITL interruptions, memory, streaming, complex graph control | 27,044 stars [T47][T55] |
| CrewAI | role/task/flow orchestration | agent crews, flows, guardrails, enterprise connectors/deployment docs | 46,723 stars [T48][T55] |
| AutoGen | conversational + event-driven multi-agent framework | AgentChat, Core, Studio UI, extensions (incl. MCP workbench) | 55,955 stars [T49][T55] |
| LlamaIndex | data-centric agent framework + workflows | RAG-centric pipelines, event-driven workflows, parsing/extraction ecosystem | 47,831 stars [T50][T51][T55] |
| Parlant | controlled customer-facing agent behavior layer | guideline engine, explainability, journey modeling, predictable behaviors | 17,844 stars [T54][T55] |

## OpenAI Agents SDK

OpenAI’s SDK is explicitly marketed as lightweight and provider-agnostic, with a small primitive set (agents, handoffs/delegation, guardrails, tracing) and broader runtime features (tools, sessions, HITL, realtime). [T44][T45][T46]

Practical implication: strong for teams wanting a minimal conceptual model with clear extension points.

## LangGraph

LangGraph emphasizes low-level orchestration control with graph semantics, state persistence, and human-in-the-loop interruptibility, which is useful for reliability-focused agent pipelines. [T47]

Practical implication: strong fit when deterministic control and stateful execution are first-order requirements.

## CrewAI

CrewAI documentation foregrounds production-oriented crews/flows and enterprise integrations. [T48]  
In practitioner reporting, CrewAI-style structured task orchestration is often easier to stabilize than unconstrained conversational multi-agent loops. [T66]

## AutoGen

AutoGen provides both no-code/low-code studio and deeper event-driven core patterns, making it attractive for exploratory multi-agent systems and research-to-prod transitions. [T49]

## LlamaIndex

LlamaIndex is strongest where retrieval/document complexity is central: parsing, extraction, indexing, and agentic workflows over heterogeneous data formats. [T50][T51]

## GitLab Duo Agent Platform (productized platform)

GitLab Duo Agent Platform GA messaging emphasizes lifecycle-wide agentic workflows, prebuilt specialist agents (planner/security analyst), custom/external agent catalog patterns, and MCP-based external toolchain integration in enterprise contexts. [T52][T53]

This is an important marker that “agent frameworks” and “software delivery platforms” are converging.

## Cost and reliability considerations from engineering reports

47Billion’s production narrative emphasizes:

- autonomy-level selection (most value in level-2/level-3 workflows),
- heavy guardrail requirements,
- strong cost variance by framework style and orchestration complexity,
- iterative refinement as the dominant cost center after initial build. [T66]

Ruh.ai’s protocol guide similarly frames interoperability and integration strategy as major cost/risk factors in enterprise adoption. [T67]

## Notable repositories for protocol and framework context

From `gh repo view` snapshot on March 21, 2026:

- `a2aproject/A2A` 22,703 stars
- `modelcontextprotocol/modelcontextprotocol` 7,568 stars
- `langchain-ai/agent-protocol` 531 stars
- `agent-network-protocol/AgentNetworkProtocol` 1,242 stars
- `mondaycom/agent-tool-protocol` 90 stars
- `i-am-bee/acp` 968 stars (archived). [T55]

These numbers suggest strong momentum behind A2A/MCP and active long-tail experimentation around alternative interoperability approaches.
