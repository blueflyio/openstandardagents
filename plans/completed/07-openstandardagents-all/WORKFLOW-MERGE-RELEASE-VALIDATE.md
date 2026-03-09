# Feature branches: merge into release locally, validate, then push

Exact sequence and commands for the five OSSA/studio-ui projects. See AGENTS.md "Feature-to-release workflow".

## Before starting work (sync/pull)

From workspace root (`$HOME/Sites/blueflyio`):

```bash
buildkit repos sync --path $HOME/Sites/blueflyio/WORKING_DEMOs
```

When NAS is mounted and you use applications (e.g. openstandardagents.org under applications):

```bash
buildkit drupal sync-all --applications-root /Volumes/AgentPlatform/applications --dry-run
# then without --dry-run when you intend to merge and push
```

Or from a feature branch in one repo: `buildkit flow push` (pull merge then push that branch).

## Per-repo flow (merge locally, validate, then push)

1. Work on a feature branch or in release. Commit all changes.
2. Merge feature into release **locally**:  
   `git fetch origin && git checkout release/v0.1.x` (or `release/v0.4.x` for OSSA)  
   `git pull --no-rebase origin release/v0.1.x`  
   `git merge <feature-branch> -m "Merge <feature-branch> into release"`
3. Run **local validation** in that repo (see validate commands below). Only continue if exit 0.
4. Push release: `buildkit git merge-release` (from repo root) or `buildkit git merge-release --path <repo>`.

For Drupal + applications in one go: `buildkit drupal sync-all` (optionally `--applications-root /Volumes/AgentPlatform/applications`). That merges current branch into release and pushes for all discovered repos; run validation in each repo **before** running sync-all if you care about gate.

## Validate commands (run in repo root before push)

| Repo | Path | Validate command |
|------|------|------------------|
| openstandard-generated-agents | WORKING_DEMOs/openstandard-generated-agents | (pipeline only or `npm run build` if present) |
| openstandard-ui | WORKING_DEMOs/openstandard-ui or worktrees/openstandard-ui | `pnpm run build && pnpm run test` (or `npm run build && npm run test`) |
| openstandardagents | WORKING_DEMOs/openstandardagents | `npm run build && npm test` |
| openstandardagents.org | WORKING_DEMOs/openstandardagents.org | `pnpm run build && pnpm run test` |
| studio-ui | WORKING_DEMOs/studio-ui or worktrees/studio-ui | `npm run build && npm test` |

If a repo has no `test` script, run `npm run build` or `pnpm run build` only.

## After merge + push

- To promote release to main: `buildkit gitlab mr release-to-main --project <group>/<project>` when CI and policy allow.
- Sync again after push if other machines or NAS need latest: `buildkit repos sync --path $HOME/Sites/blueflyio/WORKING_DEMOs`.
