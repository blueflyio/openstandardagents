# 04 - Dragonfly Master Plan

## Context
Dragonfly is the Drupal test orchestrator and SaaS platform for the BlueFly Agent ecosystem. It provides an open-core architecture where the core acts as an orchestration engine (`dragonfly_client` in Drupal) seamlessly evaluating and managing AI agents, and testing AI interactions against Drupal environments.

## Architecture
- **Dragonfly Node (SaaS/Core)**: An Express/Node.js application running on port 3020 (`dragonfly.blueflyagents.com`). It serves API endpoints like `/tests/trigger` for projects, test types, addons, and backend integration.
- **`dragonfly_client` (Drupal Module)**: Exists strictly within the context of `TESTING_DEMOS/DEMO_SITE_drupal_testing`. It integrates Tool plugins, ECA events, and `http_client_manager` to connect the Drupal environment to the Dragonfly Core.

## GitOps Workflow
1. **Development**: Work happens in the `worktrees/dragonfly` node codebase or the `TESTING_DEMOS/.../dragonfly_client` Drupal codebase.
2. **Push**: Commits are pushed to GitLab (`release/v0.1.x`).
3. **Deployment (Drupal)**: The old module is removed and the updated version is cloned/pulled directly from GitLab to ensure the demo site strictly reflects the committed remote state.
4. **Deployment (Oracle)**: `buildkit deploy oracle dragonfly` orchestrates the `bluefly-dragonfly:latest` image running centrally on the Oracle cluster using the main Docker Compose stack.

## n8n & SaaS Multi-Tenancy
The Dragonfly SaaS model bootstraps tenants through n8n workflows:
- Tenant persistence, triggers, and parameterized configurations.
- Playwright integration for automated UI testing across various LLM outputs inside Drupal boundaries.

## Next Steps
- Implement tenant persistence via the n8n Workflow bootstrap.
- Standardize `.env` references to strictly use `/opt/agent-platform/services/dragonfly`.
- Update `setup-projects.json` to properly map the GitLab path `blueflyio/agent-platform/services/dragonfly`.
- Ensure all Runbooks reflect the strict GitOps sync rule for the Dragonfly client module.


## Implementation Status (Updated 2026-03-08)
- **Dragonfly Node (SaaS/Core)**: [x] Repo exists (`WORKING_DEMOs/dragonfly`) with API and frontend apps scaffolded.
- **dragonfly_client (Drupal Module)**: [Pending] `TESTING_DEMOS/DEMO_SITE_drupal_testing` needs to be initialized or path updated for the client module.
- **GitOps Workflow**: [In Progress] Branch and deploy logic via Buildkit `oracle.command.ts`.
- **n8n Tenant Bootstrap**: [Pending] Needs implementation definition.
- **Next Steps**: Standardize `.env` references and verify Runbooks.
