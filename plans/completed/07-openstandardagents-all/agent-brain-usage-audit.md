# Agent-Brain Usage Audit

**Purpose:** Canonical inventory of agent-brain (Qdrant vector/RAG) usage across the platform. Single source for SOD and expansion planning.

## Current Consumers

| Consumer | Use | Endpoint / Config |
|----------|-----|-------------------|
| default-orchestrator | QdrantFederatedAdapter checkpoint, semantic search | @bluefly/agent-brain |
| version-analyzer | Qdrant embeddings | QDRANT_URL / agent-brain:6333 |
| content-planner | Qdrant embeddings | QDRANT_URL |
| content-guardian | Vector storage | server: agent-brain |
| website-executor, deployment-orchestrator | backend | agent-brain |
| ai_agents_orchestra | Vector memory | AGENT_BRAIN_URL |
| ai_agents_ossa_dita | DitaMultiChannelPublisher, semantic search | AGENT_BRAIN_URL |
| Dragonfly | Failure matching (router+brain) | MCP resources |
| openstandardagents | Wizard, knowledge-generation, validation | mcp_server: agent-brain |
| workflow-engine | agent-brain-integration (stub) | brain CLI commands |

## Public Endpoint

- **brain.blueflyagents.com** (port 6333, Qdrant)
- **AGENT_BRAIN_URL** default: https://brain.blueflyagents.com

## Recommended Expansion (per AGENTS.md)

| Target | Use Case |
|--------|----------|
| code_executor | "Similar past runs" - semantic search over execution history |
| Fleet Manager (Drupal_Fleet_Manager) | "Similar sites" - find sites with similar config/issues |
| Marketplace | Search agents, skills, or catalog by semantic similarity |

## SOD

- **agent-brain** owns: Qdrant, vector storage, semantic search, RAG, embeddings.
- Consumers use HTTP API or @bluefly/agent-brain package. No duplicate vector logic elsewhere.

## Audit Date

2026-03-01
