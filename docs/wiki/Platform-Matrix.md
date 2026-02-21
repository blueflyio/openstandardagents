# Platform matrix

Single source of truth for creating and using AI agents across GitLab, Drupal, kagent, OpenAI, Claude, CrewAI, LangFlow, LangChain, and others. We use **official SDKs and packages only**; OSSA is the **contract/spec layer** between MCP and A2A and does not replace platform runtimes.

## How to use

- **CLI:** `ossa platforms` — list all platforms with what they need, folder structure, SDK, export/import.
- **One platform:** `ossa platforms -p langchain` (or `drupal`, `kagent`, `langflow`, etc.).
- **JSON (automation):** `ossa platforms --json` — full matrix and default folder structure.
- **Export list:** `ossa export --list-platforms` — same source of truth as `ossa platforms`.

## Contract layer (Drupal, LangFlow, others)

- **Drupal:** We do not reinvent [ai_agents](https://git.drupalcode.org/project/ai_agents). OSSA provides config and the agent standard spec; export produces YAML config for the ai_agents module to consume.
- **LangFlow:** We use the official [langflow](https://github.com/langflow-ai/langflow) package and flow JSON; agents are [LCAgentComponent](https://github.com/langflow-ai/langflow/blob/main/src/lfx/src/lfx/base/agents/agent.py) (LangChain-based). We do not build a custom agent runtime.
- **General:** Prefer official SDK/npm/Python/GitHub package for each platform; OSSA enhances them with a single manifest and export/import.

## Default folder structure (OSSA)

```
.agents/{name}/manifest.ossa.yaml
.agents/{name}/openapi.yaml
.agents/{name}/prompts/
.agents/{name}/tools/
.agents/{name}/config/
.agents/{name}/api/
.agents/{name}/src/
.agents/{name}/tests/
.agents/{name}/AGENTS.md
```

Run `ossa platforms --folder-structure` for this list.

## Import (framework to OSSA)

Supported sources: **langflow**, **langchain**, **crewai**, **autogen** (plus cursor, openai, anthropic).

```bash
ossa import flow.json --from langflow -o agent.ossa.yaml
ossa import agent_config.json --from langchain -o agent.ossa.yaml
```

## Questions we might be missing

When onboarding a new agent to a platform, consider:

1. Authentication: How does the agent authenticate to APIs and user context?
2. Rate limits and quotas: What are the platform limits (requests/min, tokens)?
3. Cost model: Per token, per request, or subscription?
4. Compliance and data residency: Where does data run (region, SOC2, HIPAA)?
5. Human-in-the-loop: Where are approval gates and who can approve?
6. Observability: What traces, metrics, and logs are available?
7. Versioning and rollback: How do you promote or roll back agent versions?
8. Multi-tenancy: Single-tenant vs shared infrastructure?
9. Tool execution: Sandbox, permissions, and timeout limits?
10. Handoffs: Can this agent delegate to other agents (A2A)?

Run `ossa platforms --questions` for this list.

## Machine-readable matrix

To get the full platform matrix as JSON (for docs or tooling):

```bash
ossa platforms --json
```

This returns all platforms with `id`, `name`, `description`, `status`, `whatTheyNeed`, `folderStructure`, `sdkNpm`, `exportHow`, `importHow`, `specUsage`, plus `defaultFolderStructure` and `questions`.
