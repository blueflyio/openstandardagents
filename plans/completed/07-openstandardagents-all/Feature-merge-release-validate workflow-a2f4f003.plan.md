<!-- a2f4f003-2aee-4829-98a7-e02b21f00b1b -->
# Feature branches: merge into release locally, validate, then push

## Current state

- **AGENTS.md** already says: feature branches are merged into release branches and pushed; use `buildkit drupal sync-all` for Drupal + applications (merge to release, push). It does not say "validate locally before push" or "merge on GitLab first" vs "merge locally first."
- **BuildKit commands:**
  - `buildkit git merge-release` — merge current (or `--source-branch`) into release, then push. No validation step.
  - `buildkit flow push` — pull (merge) on current branch, then push (does not merge into release).
  - `buildkit drupal sync-all` — for each discovered repo: checkout release, pull, merge current into release, push. Optional `--applications-root` for NAS/applications (includes openstandardagents.org, NODE-AgentMarketplace, etc.). No validation step.
  - `buildkit repos sync --path <dir>` — fetch and pull (merge) only; no merge-to-release or push.

So the **gap** is: (1) the workflow is not explicitly "merge locally, validate, then push," and (2) there is no built-in validation before pushing release.

---

## 1. Encode the workflow in one place

Add a short, actionable subsection to **AGENTS.md** (under "Merge all branches into release and push" or "Correct deploy flow") that states:

- We **merge all feature branches into release branches locally** (no "merge on GitLab first" for this flow).
- Before pushing release: **run local validation** (build and test) in that repo; only push if it passes.
- Before starting work: **sync/pull** (e.g. `buildkit repos sync --path $HOME/Sites/blueflyio/WORKING_DEMOs` or `buildkit flow push` from a feature branch).
- After merging to release and validating: **push** with `buildkit git merge-release` (or `buildkit drupal sync-all` when doing Drupal + applications in one go).

Optionally add a single runbook file under **todo/** (e.g. `WORKFLOW-MERGE-RELEASE-VALIDATE.md`) that lists the exact sequence and commands for the five WORKING_DEMOs (openstandard-generated-agents, openstandard-ui, openstandardagents, openstandardagents.org, studio-ui) so agents and humans have one place to look. Keep it to one short file; no doc sprawl.

---

## 2. Optional: validate step before push in BuildKit

**Option A (recommended, minimal):** Do not add new CLI. Document that before running `buildkit git merge-release` the user must run project-specific validation in that repo (e.g. `npm run build && npm test` or `pnpm build && pnpm test`). AGENTS.md and the todo runbook state this clearly.

**Option B:** Extend `buildkit git merge-release` with a `--validate` flag. Before pushing release, run a configurable command in the repo (default: `npm run build && npm test` when `package.json` has `scripts.build` and `scripts.test`; otherwise skip or use a simple `npm run build`). If the command exits non-zero, abort and do not push. Implementation in `worktrees/agent-buildkit/src/cli/commands/git/merge-release.command.ts`: after merge, before `git push`, run the validate command (e.g. `execSync('npm run build && npm test', { cwd, stdio: 'inherit' })` or read from `package.json` scripts); on failure, exit 1 and do not push.

Choose A or B based on whether you want a single command that enforces "validate then push" or are fine with "run validate manually then merge-release."

---

## 3. Sync before/after and the five WORKING_DEMOs

- **Before work:** From workspace root, run sync for the tree that contains the five projects. For WORKING_DEMOs:  
  `buildkit repos sync --path $HOME/Sites/blueflyio/WORKING_DEMOs`  
  (and optionally `buildkit drupal sync-all --applications-root /Volumes/AgentPlatform/applications` when NAS is mounted if those five include openstandardagents.org under applications).
- **After work (feature merged into release, validation passed):** Per repo: `buildkit git merge-release --path <repo>` or, for Drupal + applications in one shot, `buildkit drupal sync-all` (with `--applications-root` if applicable). Document in the new AGENTS.md subsection and in the todo runbook that the five OSSA/studio repos use the same flow: merge into release locally, validate (build + test), then push via merge-release.

---

## 4. Map todo to concrete build tasks for the five repos

Use `~/.agent-platform/agent-buildkit/todo/` to drive work that **builds in** the five WORKING_DEMOs (openstandard-generated-agents, openstandard-ui, openstandardagents, openstandardagents.org, studio-ui), without adding new long-form docs:

- **openstandard-ui:** Discovery URL already env-based (MESH_URL / AGENT_REGISTRY_URL). From todo: FIX-OSSA-UI-BROKEN is a deploy runbook; no code change. Ensure any remaining endpoint URLs (e.g. OSSA UI API base for .org or marketplace) are env-driven so customer installs can override.
- **openstandardagents.org:** Same as above: ensure all external URLs (OSSA UI API, mesh, etc.) come from env or config, not hardcoded blueflyagents.com.
- **openstandard-generated-agents:** Pipeline already triggered by openstandard-ui; ensure pipeline uses env for registry/export URLs if applicable. Todo registry-container/registry-agent tasks that touch this repo: already completed per INPROGRESS; next step is "push changes" per REGISTRY-REFERENCE.
- **openstandardagents:** CLI/validate/export; ensure no hardcoded platform URLs in CLI or SDK. Todo registry-agent: completed; push and align with kagent/OSSA if needed.
- **studio-ui:** Component library; ensure no hardcoded endpoints in components. SOD/consolidation may apply; no new doc files—only code/config changes.

Concrete tasks to pull from todo into execution (no new docs):

1. **Audit and fix remaining hardcoded URLs** in the five repos (env or config only); track in a short checklist in todo (e.g. one file `todo/URL-AUDIT-OSSA-UI-API.md` with repo + status) or in existing RUNBOOK/NEXT.
2. **Push any unpushed work** from the registry parallel run (REGISTRY-REFERENCE, NEXT.md: "push changes; deploy api-schema-registry to Oracle if needed").
3. **Define validate commands** for each of the five (e.g. `pnpm build && pnpm test` or `npm run build && npm run test`) and document them in the single runbook so "local validation" is unambiguous before merge-release.

---

## 5. Summary

| Step | Action |
|------|--------|
| Encode workflow | Add subsection in AGENTS.md: merge feature into release locally, run local validation (build + test), then push; sync/pull before work. Optionally one short runbook in todo for the five WORKING_DEMOs. |
| Validate before push | Either document only (run build/test manually then merge-release) or add `--validate` to `buildkit git merge-release`. |
| Sync before/after | Document: before work use `buildkit repos sync --path WORKING_DEMOs` (and drupal sync-all with applications-root when relevant); after merge+validate use `buildkit git merge-release` or drupal sync-all. |
| Todo-driven build | Audit five repos for hardcoded URLs; push registry-related changes; define and document validate commands per repo. |

No new long-form docs beyond one AGENTS.md subsection and one optional short runbook in todo. All changes support "merge feature into release locally, validate, then push" and sync/push discipline for the five OSSA/studio-ui projects.
