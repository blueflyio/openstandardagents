# AGENTS.md and OSSA

OSSA integrates the [agents.md](https://agents.md) standard so agent packages can ship an **AGENTS.md** file that AI coding agents (Cursor, Aider, VS Code, Gemini CLI, etc.) use for project-specific instructions. OSSA owns the implementation; BuildKit consumes it via CLI or API for use across all projects.

## What is agents.md?

[agents.md](https://agents.md) is an open format for guiding coding agents: a single **AGENTS.md** file (standard Markdown, no required fields) that complements README by covering build steps, testing, PR guidelines, security, and code style. It is stewarded by the [Agentic AI Foundation (AAIF)](https://agents.md) under the Linux Foundation. Reference: [github.com/agentsmd/agents.md](https://github.com/agentsmd/agents.md).

## How OSSA uses it

- **Generate**: From an OSSA manifest, OSSA generates AGENTS.md with sections such as Dev environment tips, Testing instructions, PR instructions, Security considerations, Code style guidelines.
- **Wizard**: The agent wizard includes a step (9c) to enable AGENTS.md and choose sections; on save, AGENTS.md is written next to the manifest.
- **CLI**: `ossa agents-md generate <manifest>`, `ossa agents-md validate <agents-md> <manifest>`, `ossa agents-md sync <manifest>`.
- **API**: OpenAPI defines `GET/PUT/DELETE /agents/{name}/agents-md`; the same logic backs the CLI. BuildKit or any HTTP layer can call these to operate on AGENTS.md for any project.
- **Export**: Export with `--include-agents-md` (or `--perfect-agent`) includes AGENTS.md in the package so shipped agents are ready for AI coding tools.

## Wizard step

When creating an agent with `ossa wizard` or `ossa agent wizard`, step **9c (AGENTS.md)** asks whether to generate AGENTS.md and which sections to include. The manifest gets `extensions.agents_md` set; on **Review & Save**, AGENTS.md is written alongside the manifest (e.g. `.agents/{name}/AGENTS.md`).

## CLI commands

| Command | Description |
|--------|-------------|
| `ossa agents-md generate <manifest>` | Generate AGENTS.md from manifest (requires `extensions.agents_md.enabled`) |
| `ossa agents-md validate <agents-md> <manifest>` | Validate AGENTS.md against manifest |
| `ossa agents-md sync <manifest>` | Regenerate AGENTS.md from manifest (optional `--watch`) |
| `ossa agents-md list` | List repositories and AGENTS.md status |
| `ossa agents-md discover [dir]` | **Discovery**: find all AGENTS.md files in workspace (`.agents/*/` and root) for update and maintenance |
| `ossa agents-md maintain [dir]` | **Maintain**: discover then validate and optionally regenerate (`--regenerate`) to update AGENTS.md after creation; `--dry-run` to preview |

## Discovery and maintenance

After AGENTS.md files are created (wizard or generate), use **discovery** to find them and **maintain** to update them:

- **Discover**: Scans the workspace for `.agents/{name}/` (manifest + AGENTS.md) and root `AGENTS.md`. Reports path, agent name, linked manifest, and validation status so you can see what needs updating.
- **Maintain**: Runs discovery then validates each; invalid or missing AGENTS.md are regenerated from the manifest. Use `--regenerate` to refresh all, or `--dry-run` to see what would be updated.

CLI: `ossa agents-md discover [dir]`, `ossa agents-md maintain [dir]` (options: `--regenerate`, `--dry-run`, `-v`).  
API: `GET /agents-md/discover?dir=...`, `POST /agents-md/maintain` with body `{ "regenerate": false, "dryRun": false }`.

## API (for BuildKit and other consumers)

- **GET /agents/{name}/agents-md** — Return AGENTS.md content; optional `?generate=true` to generate if missing.
- **PUT /agents/{name}/agents-md** — Create or update AGENTS.md (raw content or generate from manifest with options).
- **DELETE /agents/{name}/agents-md** — Remove AGENTS.md for that agent.
- **GET /agents-md/discover** — Discover all AGENTS.md in workspace (query `dir`).
- **POST /agents-md/maintain** — Maintain: discover then validate/regenerate (body: `regenerate`, `dryRun`).

Base directory is typically the workspace or project root; agent name resolves to `.agents/{name}/manifest.ossa.yaml`.

## Export with packages

When you export an agent (e.g. to npm or platform-agents) with `--include-agents-md` or `--perfect-agent`, the output includes an AGENTS.md file in the agents.md format. AI coding agents that support AGENTS.md will use it when working in that package.

## See also

- [What is an Agent](what-is-an-agent.md) — Folder structure and wizard overview
- [Agent Folder Structure](../architecture/agent-folder-structure.md) — Full layout and generation pipeline
- [agents.md](https://agents.md) — The standard and examples
