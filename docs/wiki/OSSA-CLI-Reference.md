# OSSA CLI Reference

Canonical reference for the OSSA CLI (`ossa`). Source of truth: [openstandardagents repo](https://gitlab.com/blueflyio/ossa/openstandardagents) `docs/wiki/OSSA-CLI-Reference.md`. Wiki is updated from the repo via `npm run wiki:publish`.

---

## Overview

The OSSA CLI is the single tool for creating, validating, and exporting OSSA agent manifests. All agents on the platform must be built from OpenStandardAgents (OSSA). One manifest, many deployment targets.

**Install:** `npm install -g @bluefly/openstandardagents`  
**Help:** `ossa --help` or `ossa <command> --help`

---

## Core Workflow (shown in main help)

| Command | Purpose |
|---------|---------|
| `ossa wizard` | Interactive agent creation (full flow) |
| `ossa init [name]` | Create new OSSA manifest (interactive or `-y`) |
| `ossa validate [path]` | Validate against OSSA schema (optional `--platform`) |
| `ossa export [manifest]` | Export to platform (`--platform`, `-o`, `--perfect-agent`, etc.) |
| `ossa lint` | Lint manifests |
| `ossa diff` | Diff manifests |
| `ossa build` | Validate + build for platform |
| `ossa migrate` | Migrate manifest to newer OSSA version |

---

## Agent Management

| Command | Purpose |
|---------|---------|
| `ossa agents create <path>` | Register agent |
| `ossa agents list` | List agents |
| `ossa agents get <id>` | Get agent by id |
| `ossa agents-local` | Local `.agents/` folder operations |
| `ossa agent-card generate \| validate` | A2A agent card (`.well-known/agent.json`) |
| `ossa generate-gaid` | Generate GAID/DID-style identifier |

---

## Development

| Command | Purpose |
|---------|---------|
| `ossa generate agent \| types \| zod \| manifests \| vscode \| openapi \| all \| list \| validate \| sync` | Code generation from manifest |
| `ossa dev` | Dev workflow |
| `ossa serve` | Local server |
| `ossa run` | Run agent |
| `ossa test` | Run tests |

---

## Distribution

| Command | Purpose |
|---------|---------|
| `ossa publish` | Publish to registry |
| `ossa install` | Install agent/package |
| `ossa update` | Update agent/package |
| `ossa search` | Search agents |

---

## Deployment

| Command | Purpose |
|---------|---------|
| `ossa deploy` | Deploy to platform |
| `ossa status` | Deployment status |
| `ossa rollback` | Roll back deployment |
| `ossa stop` | Stop deployment |

---

## Documentation from Manifest

| Command | Purpose |
|---------|---------|
| `ossa agents-md generate \| validate \| sync \| discover \| maintain` | AGENTS.md from OSSA manifest |
| `ossa llms-txt generate \| validate \| sync` | llms.txt (llmstxt.org) from manifest |
| `ossa docs` | Docs commands |

---

## Skills and Templates

| Command | Purpose |
|---------|---------|
| `ossa skills list \| generate \| sync \| validate \| research \| generate-enhanced \| export` | Claude Skills from OSSA |
| `ossa template list \| show \| create \| validate` | Manifest templates |

---

## Tools and Capabilities

| Command | Purpose |
|---------|---------|
| `ossa tool create \| validate \| list` | Tool configurations |
| `ossa capability` | Capability management |
| `ossa manifest` | Manifest operations |

---

## Compliance and Governance

| Command | Purpose |
|---------|---------|
| `ossa conformance` | Conformance checks |
| `ossa compliance` | Compliance checks |
| `ossa governance` | Governance |
| `ossa contract` | Contract checks |

---

## Workspace (two-tier / UADP-style)

| Command | Purpose |
|---------|---------|
| `ossa workspace init` | Initialize `.agents-workspace/` directory structure |
| `ossa workspace list` | List agents in workspace registry |
| `ossa workspace discover` | Auto-discover project agents |
| `ossa workspace policy list` | List allowed and denied tools |
| `ossa workspace policy check <project>` | Validate project agent against workspace policies |
| `ossa workspace sync` | Sync workspace registry with discovered agents |
| `ossa workspace publish --registry-url <url>` | POST discovery to registry API (e.g. mesh `/api/v1/discovery`); use `--discover` if registry missing |

See [Discovery and registry](Discovery-and-Registry.md) for the registry API contract and how OSSA and CI connect. BuildKit is an optional consumer that may discover and deploy OSSA agents; OSSA does not depend on BuildKit.

---

## Export Platforms (`ossa export --list-platforms`)

| Platform | Status | Description |
|----------|--------|-------------|
| kagent | alpha | kagent.dev Kubernetes CRD bundle |
| langchain | production | LangChain Python/TypeScript package |
| langflow | beta | Langflow flow JSON |
| crewai | beta | CrewAI Python package |
| temporal | alpha | Temporal workflow |
| n8n | alpha | n8n workflow JSON |
| gitlab | alpha | GitLab CI/CD YAML |
| gitlab-duo | alpha | GitLab Duo custom agent + MCP |
| docker | alpha | Docker deployment |
| kubernetes | alpha | Kubernetes/Kustomize |
| npm | production | npm package + optional Claude Skill |
| mcp | production | MCP server (Claude Code) |
| drupal | beta | Drupal ai_agents_ossa manifest |
| claude-code, cursor, warp | beta | IDE/terminal agents |
| anthropic | beta | Anthropic Python + FastAPI |
| agent-skills | production | Agent Skills (SKILL.md) |
| openai-agents-sdk | beta | @openai/agents TypeScript with MCP, guardrails, handoffs |

---

## Extensions

- **GitLab** (enable with `OSSA_EXTENSIONS=true`, `OSSA_EXTENSIONS_LIST=gitlab`): GitLab-specific commands (e.g. gitlab-agent register/list/delete, github-sync).
- **ossa extensions** – Show loaded extensions.

---

## Quick Examples

```bash
# Create and validate
ossa wizard -o agent.ossa.yaml
ossa validate agent.ossa.yaml

# Export
ossa export agent.ossa.yaml --platform docker --output ./docker-deploy
ossa export agent.ossa.yaml --platform langchain --output ./langchain-agent
ossa export agent.ossa.yaml --perfect-agent

# Workspace
ossa workspace init
ossa workspace discover
ossa workspace sync
ossa workspace publish --registry-url https://mesh.example.com
ossa workspace publish --registry-url https://mesh.example.com --discover
```

---

## Wiki

Run `npm run wiki:publish` in the openstandardagents repo (requires GITLAB_TOKEN or GITLAB_PUSH_TOKEN). Manifest: `.gitlab/wiki-publish-manifest.json`. No BuildKit required.

