# Agent Workspace Integration Plan

## Goal Description
The objective is to establish a unified Agent Discovery (UADP) architecture across all projects in the workspace. This aligns with the `SEPARATION-OF-DUTIES.md` standard for decentralized agent discovery, where:
- The centralized `/Users/flux423/Sites/blueflyio/.agents-workspace` directory acts as the root aggregator and output destination for `buildkit agents discover`.
- Every participating project uses a local `.agents` folder to house its OSSA manifests (`.ossa.yaml` / `.yaml`) and local `agent-registry.yml`.

## Proposed Changes

### Central Workspace Configuration
#### [MODIFY] [.agents-workspace configuration](file:///Users/flux423/Sites/blueflyio/.agents-workspace)
- Ensure the root workspace `.agents-workspace` directory is properly structured for `agent-buildkit`.
- Document the process of using `buildkit agents discover` which will scan local project directories and aggregate outputs into `.agents-workspace/discovery/output`.

### Project Directories Setup
For each of the standard projects, we will initialize an `.agents` folder to ensure they are discoverable by the UADP mesh logic.

#### [NEW] [openstandardagents/.agents](file:///Users/flux423/Sites/blueflyio/worktrees/openstandardagents/.agents)
- Create the `.agents/` directory.
- (Optional) Add a placeholder manifest or `agent-registry.yml` for CLI/Spec domain.

#### [NEW] [openstandard-ui/.agents](file:///Users/flux423/Sites/blueflyio/worktrees/openstandard-ui/.agents)
- Create the `.agents/` directory.
- (Optional) Add a placeholder manifest representing UI/Creator agents.

#### [NEW] [openstandardagents.org/.agents](file:///Users/flux423/Sites/blueflyio/worktrees/openstandardagents.org/.agents)
- Create the `.agents/` directory.
- Add site/docs related agent manifests here.

#### [NEW] [openstandard-generated-agents/.agents](file:///Users/flux423/Sites/blueflyio/worktrees/openstandard-generated-agents/.agents)
- Create the `.agents/` directory.
- Use this strictly for artifact storage or generation capabilities as per SOD.

## Verification Plan

### Automated Tests
1. Run `buildkit agents validate` within one of the project directories to ensure the `.agents` folder is parsed correctly without errors.
2. Run `buildkit agents discover` from the root workspace and confirm that the `.agents-workspace/discovery` output updates with any placeholder agents created.

### Manual Verification
1. Inspect `/Users/flux423/Sites/blueflyio/.agents-workspace/discovery/output` to manually verify that the JSON/YAML mappings reflect the newly created project agent manifests.
2. If `AGENT_MESH_URL` is set, dry-run a `POST` to the mesh discovery API and verify 200 OK.

## Phase 5 Remediation Plan
Based on the honest gap analysis, the following structural corrections are proposed to align with strict `blueflyagents.com` architecture standards:

### Domain Standardization
#### [MODIFY] [UADP Configurations / CI](file:///Users/flux423/Sites/blueflyio/worktrees/gitlab_components/release-v0.1.x/templates/agent-discovery/template.yml)
- Enforce the usage of `mesh.blueflyagents.com` natively for discovery pushes without fallback to incorrect top-level domains.
- Ensure all OSSA `apiVersion` strings strictly use `ossa.blueflyagents.com/v1alpha1` across all newly created manifests.

### Valid Manifest Generation
#### [MODIFY] [.agents generation logic across workspace]
- Purge any remaining manually generated dummy manifests (e.g., `openstandard-ui/.agents/ui-creator/agent.yml`).
- Use the actual `@bluefly/openstandardagents` CLI logic (`npx @bluefly/openstandardagents init`) to instantiate syntactically valid JSON-schema agents, not arbitrary hand-rolled YAML blocks.

### Safe Abstraction in UI
#### [MODIFY] [openstandard-ui React preset logic](file:///Users/flux423/Sites/blueflyio/WORKING_DEMOs/openstandard-ui/release-v0.4.x/components/wizard/steps/Step1Template.tsx)
- Refactor the front-end template selector.
- Dynamically parse the list from `router.blueflyagents.com` / `ossa-ui.blueflyagents.com` APIs cleanly via generic components rather than brute-forcing them to mimic our internal static preset types using hardcoded Tailwind utility classes.
