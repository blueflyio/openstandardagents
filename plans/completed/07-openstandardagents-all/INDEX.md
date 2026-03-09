# Buildkit Todo — Build Priority

**Location:** `~/.agent-platform/agent-buildkit/todo` (canonical). All plans in `todo/plans/` only; align: buildkit todo plans-sync.
**Use:** `export TODO_DIR=~/.agent-platform/agent-buildkit/todo` (or leave unset; buildkit defaults to this) then run buildkit spawn/flow commands.

---

## Do Next (execute in order)

0. **plans/00-ORIGINAL-PLAN-build-order.plan.md** — Master build order (runbook + consolidated + recipe bridge). Use this to drive execution.
1. **RUNBOOK.md** — Token check, push, MR merge order, sync WORKING_DEMOs, wiki cleanup.
2. **plans/drupal-recipes-gaps-and-bridge.plan.md** — Recipe apply order, contrib table, remaining bridge steps; spawn task: `drupal-recipes-research-rebuild.md`.
3. **Drupal_AgentDash (NAS)** — RUNBOOK.md section "Drupal_AgentDash at NAS (plan and build)": path `/Volumes/AgentPlatform/applications/Drupal_AgentDash`; sync from GitLab, composer install, optional DDEV.
4. **02-gitlab-ci-mr-runners** — CI, deploy NAS runners, unblock MRs (spawn task: `02-gitlab-ci-mr-runners.md`).
5. **03-infrastructure-nas-oracle** — Oracle disk, runner deploy, tunnel verify (spawn task: `03-infrastructure-nas-oracle.md`).

---

## Spawn (use this todo as source)

```bash
export TODO_DIR=~/.agent-platform/agent-buildkit/todo
export WORKTREE_SOURCE_DIR=$HOME/Sites/blueflyio/worktrees
buildkit agent spawn-orchestrated --task drupal-recipes-research-rebuild
```

Task file: `todo/drupal-recipes-research-rebuild.md` (or any `*.md` in root). Plan: `todo/plans/drupal-recipes-gaps-and-bridge.plan.md`.

---

## Structure

| Path | Purpose |
|------|---------|
| RUNBOOK.md | Full runbook: token, push, MR merge order, sync, Drupal_AgentDash at NAS, Phase 8. |
| INDEX.md | This file: do-next order and structure. |
| NEXT.md | Short "do next" pointer; full detail in RUNBOOK.md. |
| plans/ | Only 00-ORIGINAL-PLAN-build-order.plan.md and drupal-recipes-gaps-and-bridge.plan.md. Align: buildkit todo plans-sync. |
| *.md (root) | Spawn task definitions for buildkit agent spawn-orchestrated (e.g. drupal-recipes-research-rebuild, 01-runbook-next-commands, 02-gitlab-ci-mr-runners). |
| RECOVERY-*.md | Recovery docs after rm -rf or data loss. RECOVERY-UADP-OSSA-AND-PUSH-MERGE-2026-03.md, recovery-worktree-rmrf-sod-drupal-openstandard-ui.md, RECOVERY-2026-03-workflow-engine-npm-thread.md, LOSS-WORKTREE-RM-RF-RECOVERY-2026-03.md, RECOVERY-2026-03-advocate-e2e-rsv2-thread.md. |
| LOSS-WORKTREE-RM-RF-RECOVERY-2026-03.md | **Recovery:** Agent ran rm -rf on worktree folder. What is still there (WORKING_DEMOs/openstandardagents, bare repo, todo), openstandardagents 0.4.6 prep from thread, how to recreate worktree. |
| recovery-worktree-rmrf-sod-drupal-openstandard-ui.md | **Recovery:** Work lost after rm -rf on worktrees. Re-apply SOD/Drupal doc, openstandard-ui studio-ui path, studio-ui react-switch dep, worktree recreate steps. |
| SPAWN-CAPACITY-AND-RECOVERY.md | **Spawn capacity:** How many agents you can spawn (8 default, 13 epic-mega, 5+4+5+9 other manifests; Phase 8 = 4 teams in 4 terminals). Recovery one-liners to point spawns at recovery work. |
| RECOVERY-2026-03-advocate-e2e-rsv2-thread.md | **Recovery:** From summarized thread (rsv2-cln). Advocate Registration Stage 6 (Option A) DONE; Step 2 E2E setup (Stripe mock, Supabase, migrations, setup.sh, .env.local); spawn-team refs; api_normalization/Dragonfly notes. Docs belong in todo, not .cursor. |
| REGISTRY-REFERENCE.md | **Registries:** Agent (platform-agents), npm (@bluefly GitLab), API schema (api.blueflyagents.com), Composer, Container. Auth fix for npm 401: source .env.local for GITLAB_REGISTRY_NPM_TOKEN. **Parallel spawn:** Section "Run parallel registry agents (5 tracks)" – five spawn-team commands in five terminals (registry-agent, registry-npm, registry-api-schema, registry-composer, registry-container). |
