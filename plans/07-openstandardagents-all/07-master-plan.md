# 07 - OpenStandardAgents (Platform Architecture) Master Plan

## Context
The `openstandardagents-all` project serves as the overarching platform architecture and repository for the Open Standard for Software Agents (OSSA). It connects the Node.js/TypeScript execution environments with the Drupal CMS orchestrator and standardizes agent definitions globally.

## The "Next Drupal Change" Initiative
The primary strategy is to position this stack as the reference implementation that unifies Drupal's officially supported ecosystem:
- `ai` & `ai_agents`: The unified AI abstraction and agent runtime framework.
- `tool`: The pluggable Tool API, serving as the MCP foundation.
- `orchestration`: Exposing Drupal to n8n, Activepieces, and Zapier.
- `api_normalization`: OpenAPI imports and automated Tool API generation.
- `canvas` & `SDC`: Visual frontend components and the AI assistant builder.

## Unified Agent Registry & Security
The platform acts as a strict, cryptographic-first registry:
- **Manifest Validation**: Drupal's `CatalogController` enforces Ed25519 signature verification (`sodium_crypto_sign_verify_detached`) on OSSA manifests to ensure supply chain integrity before writing to `private://agents`.
- **Lifecycle Management**: The `openstandardagents.org` builder and discovery UI dynamically filters `revoked` agents and visibly flags `deprecated` agents using the `metadata.lifecycle` property.
- **CLI Enforcement**: The OSSA CLI (`validate` and `lint` commands) strictly fails on revoked agents with `ExitCode.GENERAL_ERROR`.

## CI/CD Stability & Infrastructure
- **V8 Memory Optimization**: Refactored `agent-buildkit` to use `node --max-old-space-size=8192` for all Next.js, SWC, and TypeScript compilations, permanently resolving V8 memory exhaustion aborts (`134`).
- **Lefthook Determinism**: Replaced raw `npx tsc` with `npm run typecheck` in git hooks to ensure execution within npm's `$PATH` resolution sandbox.
- **Tunnel Validations**: `agent-docker` CI pipelines strictly validate Cloudflare Tunnel `ConfigMap` definitions before Oracle deployments.

## Contrib-First Development Rules
A strict rule is enforced across all custom modules to maintain architectural purity:
- **No Raw HTTP for AI**: Modules like `ai_agents_crewai` or vector database integrations must never use raw Guzzle to hit external APIs.
- **Abstraction Mandate**: All LLM and Vector DB calls must route through the `drupal/ai` provider abstractions, `mcp_client`, `flowdrop`, or `ECA`. External integrations (like CrewAI) must use official SDKs wrapped as Drupal services.

## Next Steps
- Finalize the OSSA UI and builder for live demonstrations at DrupalCon (`ossa-ui.blueflyagents.com`).
- Continue remediation of any remaining custom code that violates the "Contrib-First" rules.
- Maintain and enhance the NIST CAISI mappings as the platform evolves.


## Implementation Status (Updated 2026-03-08)
- **Platform Architecture Base**: [x] Substantial codebase at `WORKING_DEMOs/openstandardagents` with integrated specs, catalogs, and SDKs.
- **CI/CD Stability**: [x] V8 Memory limits and Lefthook determinism issues resolved in buildkit operations.
- **Strict Cryptographic Registry**: [x] `ossa sign` CLI with `@noble/ed25519`, DUADP `signature-verifier.ts` enforces Ed25519 on publish.
- **Cedar Zero-Trust Authorization**: [x] `ossa policy validate` with `@cedar-policy/cedar-wasm`, DUADP `cedar-evaluator.ts` evaluates at runtime.
- **Federated Discovery**: [x] `_duadp.<domain>` and `_agent.<uuid>.<domain>` DNS TXT verification in DUADP SDK.
- **CLI Integration**: [x] `ossa publish --remote` and `ossa search --remote --federated` use `DuadpClient`.
- **Builder Separation**: [x] `openstandardagents.org` redirects to `build.openstandardagents.org/builder`. Builder components migrated to `ossa-studio`.
- **Contrib-First Rules Compliance**: [In Progress] Active auditing and refactoring of raw HTTP calls to use `drupal/ai` abstractions.
