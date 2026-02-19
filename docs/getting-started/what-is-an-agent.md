# What Is an Agent (OSSA)

This page defines an **Agent** in the OSSA spec and shows the standard folder structure and how the agent wizard fits in.

---

## What an agent is

In OSSA, an **Agent** is one of four **kinds** of manifest (`Agent`, `Task`, `Workflow`, `Flow`). An Agent describes an **agentic loop** driven by an LLM: identity, role (or system prompt), optional LLM config, tools, and optional extensions (observability, safety, separation of duties, token efficiency, etc.).

**In one sentence:** An agent is a manifest (`kind: Agent`) with `metadata` (name, version, description) and `spec` (at least `role` or `prompts.system.template`), plus optional LLM, tools, and v0.4 extensions.

### Core qualities (from agent-definition)

- **Identity** – name, version, description (in `metadata`)
- **Autonomy** – operates from role/prompts and tools
- **Capability** – skills exposed as tools/functions
- **Observability** – optional observability config in spec
- **Controllability** – config and interfaces defined in manifest
- **API-first** – interoperates via defined APIs/schemas

---

## Minimal Agent manifest (spec)

Required at the top level:

- **apiVersion** – e.g. `ossa/v0.4`
- **kind** – `Agent`
- **metadata** – object with at least **name** (DNS-style, e.g. `my-agent`)
- **spec** – for Agent, an **AgentSpec** with at least one of:
  - **role** (string): system/role prompt, or
  - **prompts.system.template** (string): system prompt template

Minimal YAML:

```yaml
apiVersion: ossa/v0.4
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
  description: Optional short description
spec:
  role: You are a helpful assistant.
```

Optional under `spec`: `llm`, `tools`, `autonomy`, `observability`, `safety`, `separation` (v0.4 separation of duties), `identity`, `adapters`, `access`, and many more. Optional at top level: `token_efficiency`, `extensions`, etc.

---

## Folder structure (per-agent)

Two common views:

### 1. Standard agent folder (`.agents/{agent-name}/`)

Single source of truth is **manifest.ossa.yaml**. Generated and supporting files live alongside it:

```
.agents/
└── {agent-name}/
    ├── manifest.ossa.yaml      # SINGLE SOURCE OF TRUTH (OSSA manifest)
    ├── openapi.yaml            # Generated from manifest (if applicable)
    ├── prompts/
    │   ├── system.txt
    │   └── ...
    ├── tools/
    │   ├── tools.yaml
    │   └── ...
    ├── config/
    ├── api/
    ├── src/
    ├── tests/
    ├── docs/
    ├── docker/
    ├── k8s/
    ├── package.json (or pyproject.toml)
    ├── AGENTS.md
    └── README.md
```

See **Agent Folder Structure Standard** (`docs/architecture/agent-folder-structure.md`) for the full layout and generation pipeline (manifest → openapi → zod/pydantic → clients).

### 2. Project layout (agent as part of a repo)

When the agent lives inside a larger project (e.g. OSSA repo itself):

```
agent-project/
├── .agents/              # Local agent runtime data (often .gitignored)
├── .agents-workspace/    # Project agent registry + optional transient data (see agents-workspace-registry.md)
├── spec/                 # OSSA schemas (e.g. spec/v0.4/)
├── examples/             # Example manifests
├── src/                  # Source (cli, services, adapters, ...)
├── docs/                 # Project docs (agent-definition, folder structure, ...)
├── tests/
├── package.json
├── AGENTS.md
└── README.md
```

The **manifest** for a given agent can live under `examples/`, `.agents/{name}/`, or a path you choose; the spec only cares about the YAML structure, not the file path.

---

## Agent wizard (what it produces)

The **agent wizard** (`ossa wizard` or `ossa agent wizard`) is an interactive flow that creates or edits an Agent manifest. It walks through:

| Step | Purpose |
|------|--------|
| 1 | Creation method (template / custom / from example) |
| 2 | Agent type & basic info (name, version, description) |
| 3 | Domain & capability |
| 4 | LLM config (provider, model, temperature) |
| 5 | Tools |
| 6 | Autonomy |
| 7 | Observability |
| 8 | Deployment |
| 9 | Advanced options |
| 9a | Token efficiency (v0.4) |
| 9b | Separation of duties (v0.4) |
| 10 | Review and save |

The wizard outputs a **manifest.ossa.yaml** (or a path you choose) that conforms to the OSSA v0.4 schema. You can then place that file into the folder structure above (e.g. `.agents/{agent-name}/manifest.ossa.yaml` or `examples/my-agent.ossa.yaml`).

**Run the wizard:**

```bash
npx @bluefly/openstandardagents wizard
# or
ossa agent wizard
```

---

## Summary

| Concept | Meaning |
|--------|--------|
| **Agent** | OSSA manifest with `kind: Agent` and `spec` (AgentSpec). At minimum: `metadata.name` and `spec.role` (or `spec.prompts.system.template`). |
| **Folder structure** | Per-agent: `.agents/{name}/` with `manifest.ossa.yaml` as single source of truth; optional prompts/, tools/, config/, api/, src/, tests/, docs/, docker/, k8s/. |
| **Wizard** | Interactive steps 1–10 (including 9a token efficiency, 9b separation of duties) that produce a valid Agent manifest. |

For full schema details see `spec/v0.4/agent.schema.json` and the **OSSA Technical Reference**. For the complete folder standard and generation pipeline see **Agent Folder Structure Standard** (`docs/architecture/agent-folder-structure.md`).
