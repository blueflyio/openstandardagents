# Open-Source Frameworks and Project Landscape (as of 2026-03-24)

This document summarizes key agentic frameworks and repositories, including their design primitives, maturity signals, and practical fit in production.

## Core open-source frameworks

## OpenAI Agents SDK (Python + JS)

OpenAI’s Agents SDK presents a compact multi-agent abstraction emphasizing agent objects, handoffs, tools, guardrails, sessions, HITL, and tracing. It advertises provider-agnostic support and large-ecosystem model compatibility. [S50][S66][S60]

Recent ecosystem signals (GitHub + npm) indicate strong momentum:
- Python repo: ~20k stars (2026-03-24 snapshot), active updates.
- JS repo: ~2.5k stars with fast package cadence.
- npm package `@openai/agents`: high weekly download velocity for an early-stage package. [S51][S66][S60]

Practical takeaway: strong defaults for tracing and guardrails make it attractive for teams that need a relatively opinionated, modern stack with quick path-to-production.

## LangGraph

LangGraph positions itself as low-level orchestration for durable, stateful, long-running agent workflows with checkpoints and human-in-the-loop interruptions. [S46]

Maturity signals are strong:
- ~27k stars, large contributor/user ecosystem.
- Explicit production posture and integrations with LangSmith tooling. [S52][S46]

Practical takeaway: strong option for teams needing explicit graph/state semantics and reliability controls over long workflows.

## CrewAI

CrewAI emphasizes “crews” (autonomous role-based collaboration) plus “flows” (event-driven production control) and claims framework independence from LangChain. [S48]

Ecosystem signals:
- ~47k stars and large community footprint.
- Active release stream and production/enterprise messaging. [S47][S48]

Practical takeaway: useful for organizations that want structured multi-agent collaboration with comparatively high-level abstractions.

## AutoGen (Microsoft)

AutoGen remains influential in multi-agent programming patterns, but current maintainer guidance points many new users to Microsoft Agent Framework, while AutoGen continues maintenance and critical fixes. [S44]

Ecosystem signals:
- ~56k stars, deep mindshare.
- Active but with strategic overlap/transition considerations. [S49][S44]

Practical takeaway: still relevant and powerful, but platform roadmap decisions should account for Microsoft’s broader agent framework direction.

## LlamaIndex

LlamaIndex positions itself as a data-centric and document-agent stack (retrieval, parsing, extraction, indexing, and agent workflows). [S53]

Ecosystem signals:
- ~48k stars.
- Strong retrieval/document-centric feature depth and broad integration ecosystem. [S54][S53]

Practical takeaway: especially suitable for document-heavy and knowledge-centric agent systems.

## Additional notable projects

## GitLab Duo Agent Platform

GitLab’s GA release highlights lifecycle-wide agentic chat, foundational agents (Planner, Security Analyst), AI Catalog for custom agents/flows, external agents (Claude Code, Codex), and MCP client integration in IDE flows. [S35]

Practical takeaway: enterprise DevSecOps-native platformization of agents is accelerating beyond standalone coding copilots.

## Framework-agnostic specs/protocol projects

- LangChain Agent Protocol repo remains relatively small by stars but important as a spec-layer artifact for runs/threads/store interfaces.
- MCP org repos (`servers`, SDK, spec) have very large adoption signals compared to most competing protocol repos. [S24][S26][S11]

## Targeted comparison: framework fit

| Framework / Platform | Best fit | Strengths | Watch-outs |
|---|---|---|---|
| OpenAI Agents SDK | General multi-agent apps with strong telemetry | Guardrails, tracing, handoffs, HITL | Rapidly evolving APIs |
| LangGraph | Stateful long-running orchestration | Durable execution + graph semantics | More architectural overhead |
| CrewAI | Team-style multi-agent workflows | Crew/flow split, strong productivity | Abstraction may hide low-level control |
| AutoGen | Research/advanced multi-agent patterns | Mature conceptual ecosystem | Strategic shift toward Microsoft Agent Framework |
| LlamaIndex | RAG/document-intensive agents | Data connectors + indexing + doc agents | Not always ideal for pure orchestration use-cases |
| GitLab Duo Agent Platform | SDLC-native enterprise usage | Integrated DevSecOps context + foundational agents | Best value when already in GitLab ecosystem |

## DUADP / OSSA npm packages in context

## `@bluefly/duadp`

This package provides a DUADP SDK that focuses on decentralized/federated discovery primitives, DID identity integration, manifest validation, and registry-like operations. [S04]

Interpretation:
- It is best seen as **infrastructure protocol tooling** (discovery + trust signals), not a full workflow/orchestration runtime.
- Current ecosystem scale is far smaller than MCP core packages or major frameworks; evaluate based on architectural fit, not popularity parity. [S04][S09]

## `@bluefly/openstandardagents`

This package provides a contract/manifest and export-oriented CLI/SDK model, aiming to map one canonical manifest to many runtime targets. [S07]

Interpretation:
- It is best treated as **spec/packaging and portability tooling**, complementary to execution frameworks.
- Assertions around compliance and broad target support should be validated in your own CI against your selected target adapters. [S07]

## Cost and operations reality from engineering reports

Industry engineering writeups emphasize that multi-agent production cost and reliability are dominated by orchestration complexity, retries, observability needs, and context overhead, not only base LLM call pricing. [S40][S38]

Actionable operational guidance:
- Start with narrow scope and explicit constraints.
- Add HITL for high-impact actions.
- Instrument tracing and budget controls before scaling autonomy. [S34][S38][S50]
