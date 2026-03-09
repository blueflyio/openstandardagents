# Drupal AgentDash: Custom Modules Sync (Runbook)

Canonical runbook for syncing custom modules in **Drupal_AgentDash** (and the same pattern for Drupal_AgentMarketplace). Covers the sync command, NO_GIT backup-and-clone procedure, and fixes applied (mergeOptions, dragonfly_client unstaged changes).

## When to use this

- You need to bring all custom modules in `WORKING_DEMOs/Drupal_AgentDash/web/modules/custom/` to the latest `release/v0.1.x` from GitLab.
- You are fixing modules that had no `.git` (NO_GIT) and must replace them with clones from `__BARE_REPOS`.
- A module fails to sync because of unstaged changes or invalid git config.

## Prerequisites

- **Token:** `GITLAB_TOKEN` or `GITLAB_TOKEN_PAT` in platform `.env.local` (Mac `/Volumes/AgentPlatform/.env.local`, NAS `/volume1/AgentPlatform/.env.local`). Scopes: `api`, `read_repository`, `write_repository`.
- **Path:** Workspace root is `$HOME/Sites/blueflyio`. AgentDash custom modules: `WORKING_DEMOs/Drupal_AgentDash/web/modules/custom/`.
- **Policy:** No stash, no `git reset --hard`, no force push. Pull uses merge (not rebase) unless the sync command overrides; we fix config so merge works.

## Sync command (canonical)

From workspace root, load token then run:

```bash
set -a && source /Volumes/AgentPlatform/.env.local && set +a
buildkit repos sync --path $HOME/Sites/blueflyio/WORKING_DEMOs/Drupal_AgentDash/web/modules/custom --branch release/v0.1.x
```

- **What it does:** For each directory under the path that contains a `.git`, it runs `git fetch` then `git pull origin release/v0.1.x` (merge or rebase per repo config). Repos without `.git` are skipped.
- **Timeout:** Allow up to ~2 minutes; 26 repos can take 60–90 seconds.
- **Note:** `buildkit drupal modules` targets TESTING_DEMOs custom path, not WORKING_DEMOs. For AgentDash (or AgentMarketplace) custom dirs, use `buildkit repos sync --path <full path to web/modules/custom> --branch release/v0.1.x`.

## NO_GIT modules: backup then clone from bare repo

If a module has no `.git` (it was copied or in-repo only), do not sync it in place. Replace it with a clone from the canonical bare repo so it becomes a real repo and can be synced.

**Steps (done once per NO_GIT module):**

1. **Backup** the existing directory (e.g. to `_backup_nogit_YYYYMMDD/<module>/`).
2. **Remove** the module directory from `web/modules/custom/`.
3. **Clone** from the bare repo into `web/modules/custom/<module>`:
   - Bare repo path: `$HOME/Sites/blueflyio/__BARE_REPOS/agent-platform/drupal/<module>.git` (agent-platform modules) or `__BARE_REPOS/dragonfly/dragonfly_client.git` (dragonfly_client).
   - Branch: `release/v0.1.x`.
   - Example: `git clone -b release/v0.1.x file://$HOME/Sites/blueflyio/__BARE_REPOS/agent-platform/drupal/cedar_policy.git web/modules/custom/cedar_policy`
4. **Set pull to merge** in the new clone: `git config pull.rebase false`.
5. **Do not set** `branch.<name>.mergeOptions` to anything that passes invalid options to `git merge` (e.g. `--replace-all`). If a repo had merge failures with "unknown option 'replace-all'", unset: `git config --unset branch.release/v0.1.x.mergeOptions`.
6. Re-run the sync command above so the new clone is included.

**Applied 2026-03-03 (AgentDash):** ai_agents_ossa, cedar_policy, recipe_onboarding were backed up to `_backup_nogit_20260303/`, then replaced with clones from `__BARE_REPOS/agent-platform/drupal/<module>.git`. agent_registry_consumer was left as NO_GIT (skipped). Backup and diff notes are in `_backup_nogit_20260303/README.txt`.

## Fix: merge "unknown option 'replace-all'"

If sync fails for a repo with:

```
error: unknown option 'replace-all'
```

the repo had `branch.release/v0.1.x.mergeOptions` set to a value that was passed to `git merge` and is invalid. Fix:

```bash
cd $HOME/Sites/blueflyio/WORKING_DEMOs/Drupal_AgentDash/web/modules/custom/<module>
git config --unset branch.release/v0.1.x.mergeOptions
git config pull.rebase false
```

Then re-run the sync. **Applied 2026-03-03** in ai_agents_ossa, cedar_policy, recipe_onboarding.

## Fix: dragonfly_client "cannot pull with rebase: You have unstaged changes"

If sync fails for dragonfly_client with:

```
error: cannot pull with rebase: You have unstaged changes.
error: Please commit or stash them.
```

**Do not stash.** Preserve work by committing, then sync again.

1. Go into the module: `cd .../web/modules/custom/dragonfly_client`
2. Set pull to merge: `git config pull.rebase false`
3. Stage and commit the changes: `git add -A && git commit -m "docs: update AGENTS.md, README, info.yml; form tweaks (DragonflySettingsForm)"` (or a message that matches the edits)
4. Re-run the sync command. Sync will pull (merge or rebase per sync implementation); the working tree is clean so pull succeeds.

**Applied 2026-03-03:** Local changes in dragonfly_client (AGENTS.md, README.txt, dragonfly_client.info.yml, DragonflySettingsForm.php) were committed, then sync was re-run. dragonfly_client synced successfully (sync may rebase; result was up to date with origin).

## Known quirk: ai_agents_kagent "branch already exists"

Sync may report for ai_agents_kagent:

```
fatal: a branch named 'release/v0.1.x' already exists
```

This happens when the sync logic runs `git checkout -b release/v0.1.x origin/release/v0.1.x` and the branch already exists locally. **Workaround:** In that repo run manually:

```bash
cd .../web/modules/custom/ai_agents_kagent
git checkout release/v0.1.x
git pull origin release/v0.1.x
```

Then re-run the full sync; other repos will still be processed, and ai_agents_kagent is already up to date.

## AgentMarketplace (same pattern)

The same backup-then-clone and sync procedure applies to **Drupal_AgentMarketplace** custom modules. Path: `WORKING_DEMOs/Drupal_AgentMarketplace/web/modules/custom/`. As of 2026-03-03, five modules there were NO_GIT (agent_marketplace, agent_registry_consumer, ai_agents_marketplace, ai_provider_routing_eca, mcp_registry). When fixing that project, use the same steps: backup to a dated _backup_nogit_* folder, clone from the appropriate __BARE_REPOS path, set pull.rebase false, then run:

```bash
buildkit repos sync --path $HOME/Sites/blueflyio/WORKING_DEMOs/Drupal_AgentMarketplace/web/modules/custom --branch release/v0.1.x
```

## Summary of commands (for automation / reference)

| Step | Command |
|------|--------|
| Sync AgentDash custom | `buildkit repos sync --path $HOME/Sites/blueflyio/WORKING_DEMOs/Drupal_AgentDash/web/modules/custom --branch release/v0.1.x` |
| Fix mergeOptions | In repo: `git config --unset branch.release/v0.1.x.mergeOptions` and `git config pull.rebase false` |
| Fix unstaged (dragonfly_client) | In repo: commit changes, then re-run sync |
| Sync AgentMarketplace custom | `buildkit repos sync --path $HOME/Sites/blueflyio/WORKING_DEMOs/Drupal_AgentMarketplace/web/modules/custom --branch release/v0.1.x` |

Token must be loaded before any buildkit git or API use (`set -a && source /Volumes/AgentPlatform/.env.local && set +a`).
