<!-- a2f4f003-2aee-4829-98a7-e02b21f00b1b -->
# Using Platform Tools in GitLab CI (BuildKit, Protocol, Mesh, Docker, Tracer)

## Current state

| Tool | How it's used in CI today | Where |
|------|----------------------------|--------|
| **BuildKit** | Installed from GitLab npm (`npm install -g @bluefly/agent-buildkit`), then `buildkit deploy oracle $service`, `buildkit agents validate`, `buildkit agents discover` | `oracle-deploy-buildkit`, `platform-service-pipeline` (deploy:oracle when not package-first), `agents-ci` |
| **Mesh** | Optional HTTP sink: `agents:discover` POSTs to `MESH_URL` (discovery publish). Not run as a binary. | `agents-ci/template.yml` |
| **Tracer** | Not run in CI. `otel-instrument` sets `OTEL_*` for GitLab Observability; can override endpoint to `tracer.blueflyagents.com` to send spans to our tracer. | `templates/otel-instrument`, `.gitlab/ci/components/agent-platform` (AGENT_TRACER_URL comment) |
| **Protocol (MCP)** | Not invoked in CI. No job calls MCP for validation or tools. | — |
| **Docker (agent-docker)** | Not run in CI. Repo holds tunnel/k8s config; CI in that repo builds and tests. Other repos do not run agent-docker as a tool. | `worktrees/agent-docker/.gitlab-ci.yml` |

## Single pattern: registry-first CLI in CI

All platform tools that expose a CLI should be consumable in CI the same way BuildKit is:

1. **Publish** the package to GitLab group npm registry (`@bluefly/<package>`).
2. **In CI:** set registry auth (e.g. `GITLAB_REGISTRY_NPM_TOKEN` or `CI_JOB_TOKEN`), then:
   - `npm config set @bluefly:registry "https://gitlab.com/api/v4/groups/blueflyio%2Fagent-platform/-/packages/npm/"`
   - `npm config set "//gitlab.com/.../:_authToken" "$GITLAB_REGISTRY_NPM_TOKEN"`
   - `npm install -g @bluefly/agent-buildkit` (or agent-protocol, etc. if they ship a CLI)
3. **Run** the CLI: `buildkit deploy oracle mesh`, `buildkit agents validate`, etc.

So: **BuildKit is the primary tool used in CI today.** Protocol, mesh, tracer, docker do not ship a single "run in CI" CLI; they are either HTTP services (MCP, mesh, tracer) or deploy/config owners (agent-docker). To "use" them in CI you either:

- **Option A (preferred):** Add **BuildKit commands** that call their APIs (e.g. `buildkit platform doctor` already hits mesh/mcp/gkg; add `buildkit gitlab ci validate` that uses MCP or validates against tracer). CI then only installs `@bluefly/agent-buildkit` and runs buildkit.
- **Option B:** Expose a small CLI in each package (e.g. `@bluefly/agent-protocol` with `mcp validate` or `agent-tracer` with `trace pipeline`) and in CI `npm i -g @bluefly/agent-protocol` then run that CLI.
- **Option C:** CI jobs call HTTP APIs directly (e.g. `curl` to MCP or tracer) with tokens from CI variables; no extra npm install.

## Concrete additions for protocol, mesh, docker, tracer

- **Protocol (MCP):** Use in CI via BuildKit: add a job or buildkit command that calls MCP (e.g. `buildkit gitlab ci validate` that uses MCP tools for lint/checks, or a component that runs `buildkit platform doctor` which already hits MCP). Alternatively, a CI job that `curl`s `https://mcp.blueflyagents.com/health` and optional tool list; token from `MCP_CI_TOKEN` or similar.
- **Mesh:** Already used as discovery sink in `agents:discover`. Optional: add `buildkit mesh health` or use `buildkit platform doctor` in a job so CI validates mesh (and MCP, GKG, router) before deploy.
- **Tracer:** Use in CI by sending pipeline spans to our tracer: in `otel-instrument` (or agent-platform component) set `OTEL_EXPORTER_OTLP_ENDPOINT` to `https://tracer.blueflyagents.com/v1/traces` (or the correct OTLP path) when `AGENT_TRACER_URL` or a CI var is set; no need to run agent-tracer in CI.
- **Docker (agent-docker):** Use in CI as validator: add a gitlab_components job (or buildkit command) that validates tunnel ConfigMap / route list against a schema or against `@bluefly/iac` tunnel-routes.json (agent-docker already references this). No need to run the full agent-docker app in CI.

## Where this lives in gitlab_components

- **Existing:** `templates/oracle-deploy-buildkit/template.yml`, `templates/platform-service-pipeline/template.yml`, `templates/agents-ci/template.yml` — all install and run BuildKit.
- **Extend:** Same pattern for any new "run platform tool in CI" need: add a component that does `npm install -g @bluefly/<pkg>` (with group registry auth) then runs the CLI, or add BuildKit subcommands and keep using only `@bluefly/agent-buildkit` in CI.
- **Variables:** Group or project CI/CD variables: `GITLAB_REGISTRY_NPM_TOKEN` (or CI_JOB_TOKEN for group packages), optional `MESH_URL`, `MCP_CI_TOKEN`, `AGENT_TRACER_URL` for optional integration.

## Summary

- **Today:** BuildKit is the only platform tool actively run in CI (deploy, agents validate/discover). Mesh = optional discovery POST. Tracer = optional OTLP target via otel-instrument. Protocol and agent-docker are not used as in-pipeline tools.
- **To use protocol, mesh, docker, tracer in CI:** Prefer extending BuildKit (new commands that call MCP/tracer/mesh or validate tunnel config) and keep CI installing only `@bluefly/agent-buildkit`. Optionally add small CLIs to other packages and install them the same way (registry + `npm i -g` then run). Use HTTP from CI only where a lightweight check (e.g. health, validate) is enough and no CLI exists.
