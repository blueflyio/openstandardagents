# Discovery and registry

How agent discovery works: local workspace, publishing to a shared registry API, and who owns what. Wiki is updated from the repo via `npm run wiki:publish`.

## Roles

| Role | Owner | What it does |
|------|--------|----------------|
| **Define agents** | OSSA (openstandardagents) | Manifests, wizard, validate, export to many platforms. You build agents here. |
| **Scan and publish** | OSSA CLI, buildkit, or CI | Scan `.agents/` (and similar), write local discovery, optionally POST to a registry API. |
| **Registry API** | Any service (e.g. mesh) | Stores and serves discovery: POST to add a source, GET to list all. No separate "registry product"; the API is the registry. |

So: you define agents in OSSA; discovery is local (workspace) or published to a registry; any service that implements the contract can be the registry.

## Local discovery (workspace only)

- Run **`ossa workspace discover`** to scan the repo for `.agents/` and OSSA manifests. Results are written to `.agents-workspace/registry/index.yaml`.
- Run **`ossa workspace list`** to see agents in this repo. No network; everything is local.

## Publishing to a registry API

To make this project's agents visible to others (or to a central index), publish the same discovery payload to a registry API.

### OSSA

1. Run **`ossa workspace discover`** (or use **`--discover`** on publish).
2. Run **`ossa workspace publish --registry-url <base-url>`**  
   Example: `ossa workspace publish --registry-url https://mesh.example.com`  
   This POSTs to `<base-url>/api/v1/discovery` with `{ source_id, workspace, projects }`.

### Buildkit (platform CLI)

- **`buildkit agents discover --registry-url <url>`** – Scans for `.agents/` and agent-registry files, writes local discovery, and POSTs to `<url>/api/v1/discovery`. Uses `MESH_URL` or `AGENT_REGISTRY_URL` if `--registry-url` is omitted.
- **`buildkit agents list --registry-url <url>`** – GETs `<url>/api/v1/discovery` and prints (or `--json`) aggregated projects/agents. No repo required.

### CI (GitLab)

- Include the **agents-ci** template (e.g. from gitlab_components). It runs discover and, when **`MESH_URL`** or **`AGENT_REGISTRY_URL`** is set in CI/CD variables, passes `--registry-url` so each pipeline run updates the registry.
- No extra job; the same discover job publishes when the URL is configured.

## Registry API contract

Any service that implements this contract can act as the registry (e.g. a mesh discovery service).

| Method | Path | Request | Response |
|--------|------|---------|----------|
| **POST** | `/api/v1/discovery` | Body: `{ source_id, workspace: { name, scanned_at }, projects: [ { name?, path?, project_path?, project_name?, agents } ] }` | 202 (or 200) and `{ ok, source_id, projects }`; store by `source_id` (e.g. with TTL). |
| **GET** | `/api/v1/discovery` | None | `{ sources[], projects[], by_source }` – aggregated from all stored sources; dedupe by path/name. |

- **Publishers:** OSSA (`workspace publish`), buildkit (`agents discover --registry-url`), or CI with `MESH_URL` set.
- **Consumers:** Any client that GETs the same URL (e.g. `buildkit agents list`, dashboards, other services).

## Connecting the pieces

- **One manifest flow:** Define agents in OSSA; run `ossa workspace discover` then `ossa workspace publish --registry-url <mesh>` so the same manifest-based flow feeds the registry. Buildkit can do the same from a repo (discover + publish) or list from anywhere.
- **Single registry:** The registry is the API (POST/GET). No separate "registry product"; mesh (or any compatible service) owns the store and query; OSSA and buildkit feed it and read from it.

## See also

- [OSSA CLI Reference](OSSA-CLI-Reference.md) – `workspace discover`, `workspace publish`, and full command list.
- [Agents workspace and registry](../getting-started/agents-workspace-registry.md) – `.agents-workspace/` layout, MCP sources, A2A.
- [Discovery API](../openapi/discovery.md) – Decentralized registry (POST/GET) and search/recommend endpoints.
