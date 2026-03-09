# Extend CLI and tools from OpenAPI (OpenAPI → generated/typed CLI)

Priority: high
Project: agent-buildkit
Branch: release/v0.1.x

## Context

- **Reference:** Spatie Laravel OpenAPI CLI (https://github.com/spatie/laravel-openapi-cli) registers an OpenAPI spec and generates Artisan commands per endpoint (one command per operation; path/query/body become typed CLI options). We don't use Laravel; we use Drupal (api_normalization → Tool API) and TypeScript (api-schema-registry, buildkit, ossa).
- **Our stack:** Drupal uses api_normalization (OpenAPI → Tool API + gateway). TypeScript uses api-schema-registry (aggregate specs, endpoints-index) and hand-written or generated CLIs (buildkit, ossa). See AGENTS.md "Replace custom with open source" → OpenAPI spec to CLI bullet.

## Goal

Build out and extend our CLI and tools using OpenAPI as single source of truth:

1. **api-schema-registry:** Ensure it can generate or export typed CLI stubs (e.g. one command per operation from endpoints-index or per-service OpenAPI). If generation doesn't exist, add a script or command that reads the aggregated spec (or a single service spec) and outputs Commander/Option definitions or a minimal CLI scaffold.
2. **agent-buildkit:** Add or extend commands that call platform APIs (mesh, workflow-engine, compliance, dragonfly, etc.) using types and paths from api-schema-registry (or from openapi.yaml). Prefer generated options from the spec (path params, query, body) instead of hand-written flags where the spec exists.
3. **Drush (use to the highest extent):** Use **Drush** as the primary Drupal CLI for every API we expose. (a) **Existing baseline:** OssaCommands (ossa:sync-agents, ossa:export-agents), SandboxApiCommands (ai_agents_ossa_sandbox:register), RecipeBuilderCommands (recipe:list, recipe:validate, recipe:generate, recipe:deploy, recipe:clear-cache, recipe:risk, fleet:apply). (b) **Extend:** Add Drush commands for every platform-facing API: workflow-engine trigger (e.g. drush platform:invoke-flow --name=...), mesh discovery (drush platform:mesh-discovery or similar), dragonfly trigger (dragonfly_client already has Tool API — add drush dragonfly:trigger), compliance check, OSSA validate/export, deploy config read/export. Each command should call the same Tool API or http_client_manager operations used by the gateway (DRY). (c) **Optional:** Implement or spec a generator that registers Drush commands from api_normalization imported schemas (one Drush command per OpenAPI operation; Spatie analogue for Drupal). CI, automation, and scripting should use `drush <namespace>:<operation>` instead of ad-hoc HTTP where possible.
4. **Document:** In AGENTS.md or api-schema-registry README, document the pattern: OpenAPI → api-schema-registry (aggregate + endpoints-index) → Drupal api_normalization (Tool API) **and Drush** (one command per operation where it adds value) and TypeScript CLIs (buildkit/ossa). Reference Spatie for Laravel/PHP; our Drupal equivalent is api_normalization + Drush (to highest extent).

## Acceptance

- api-schema-registry has a way to generate CLI-related output (e.g. endpoints list as CLI commands, or TypeScript/JSON for buildkit to consume).
- At least one buildkit command (or one new subcommand) uses spec-driven options (e.g. from endpoints-index or a service OpenAPI) for calling an API.
- **Drush:** At least one new Drush command (or a documented plan) that invokes a platform API (workflow-engine, mesh, dragonfly, compliance, or OSSA) using the same contract as Tool API/http_client_manager. All platform-facing operations that have a REST or Tool API should have a corresponding Drush entry point for CI/automation (use Drush to the highest extent).
- AGENTS.md or relevant README updated with the OpenAPI → CLI/Tools/Drush flow and how to extend further.

## Repos / paths

- agent-buildkit: `worktrees/agent-buildkit` or `$WORKTREE_SOURCE_DIR/agent-buildkit`
- api-schema-registry: **Platform source of truth** — `worktrees/api-schema-registry` (e.g. `$HOME/Sites/blueflyio/worktrees/api-schema-registry` or `$WORKTREE_SOURCE_DIR/api-schema-registry`)
- Drupal/Drush: recipe_onboarding (RecipeBuilderCommands, fleet:apply), ai_agents_ossa (OssaCommands), ai_agents_ossa_sandbox (SandboxApiCommands), recipe_onboarding_fleet_extension (Tool plugins → add Drush), dragonfly_client (Tool API → add Drush), alternative_services (Tool plugins → add Drush where useful)
- AGENTS.md: workspace root and agent-buildkit

## Rules

- No .sh scripts; use TypeScript/BuildKit.
- Separation of duties: api-schema-registry owns OpenAPI aggregate and generation; agent-buildkit owns CLI commands (imports from @bluefly/*).
- Follow existing patterns: buildkit commands use Commander; api-schema-registry has `npm run aggregate`, `npm run endpoints-index`, `npm run generate` (if any).

## How to run spawn for this task

Task file is in `~/.agent-platform/agent-buildkit/todo/openapi-cli-extension.md`. To spawn an agent on it (when an identity is available):

```bash
WORKTREE_SOURCE_DIR=$HOME/Sites/blueflyio/worktrees TODO_DIR=$HOME/.agent-platform/agent-buildkit/todo buildkit agent spawn-orchestrated --task openapi-cli-extension
```

Dry-run (no Cursor/Claude launch): add `--dry-run`. If "No available agent identities", free one via identity coordination or use a different computer type (`--computer M3`).
