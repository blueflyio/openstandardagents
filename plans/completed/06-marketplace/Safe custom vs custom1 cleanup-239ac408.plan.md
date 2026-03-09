<!-- 239ac408-8860-4636-ae91-6e6ecdae2a7d -->
# Safe cleanup: custom vs custom1 (no destructive commands)

## Current state (what you have)

| Location | Contents | .git in module dirs |
|----------|----------|----------------------|
| **custom/** | 77 items: 26 module dirs + **agent_registry_consumer** + junk (e.g. .agents, .buildkit, bin, config, docs, fixtures, infrastructure, modules, openapi, src, templates, test, tests, plus many loose files: agent.yml, ai_agents_orchestra.*, composer.json, README.md, etc.) | Only **ai_provider_langchain** |
| **custom1/** | 27 items: same 26 module dirs + **agent_registry_consumer_disabled** (no junk) | Only **ai_provider_langchain** |

So:

- **custom** = wrong. Another repo’s root was merged into it, so it has non‑module dirs and loose files that don’t belong under `web/modules/custom`.
- **custom1** = right structure. Only module-like directories; no junk.

Both trees have lost `.git` for 26 of 27 modules (only `ai_provider_langchain` still has a `.git`). Recovering the rest means re-cloning from GitLab per AGENTS.md `__BARE_REPOS` mapping; this plan does not do that, it only fixes the custom vs custom1 layout.

---

## What to do (renames only, no `rm -rf`)

All steps are renames/moves. Nothing is deleted by the plan.

1. **Rename current `custom` to a dated backup**  
   - Path:  
     `TESTING_DEMOS/DEMO_SITE_drupal_testing/web/modules/custom`  
   - Rename to:  
     `custom_polluted_backup_20250303`  
   - So the polluted tree is kept and no longer used by Drupal.

2. **Rename `custom1` to `custom`**  
   - Path:  
     `TESTING_DEMOS/DEMO_SITE_drupal_testing/web/modules/custom1`  
   - Rename to:  
     `custom`  
   - Drupal will then see a single `web/modules/custom` with only the 27 module dirs.

3. **Optional: enable agent_registry_consumer**  
   - Right now the clean tree has `agent_registry_consumer_disabled`.  
   - If you want the module enabled, rename that directory to `agent_registry_consumer` (so Drupal sees it as a normal module).  
   - If you prefer it disabled, leave the name as is.

4. **Remove the backup when you choose**  
   - After you’re satisfied with the new `custom`, you can delete `custom_polluted_backup_20250303` yourself (e.g. Finder or `rm -rf` when you’re ready).  
   - The plan does not run any delete; the backup stays until you remove it.

---

## Result

- **web/modules/custom** = 27 module directories only (clean).  
- **web/modules/custom_polluted_backup_20250303** = previous polluted tree, kept as backup.  
- **custom1** no longer exists (it becomes `custom`).  
- No `rm -rf` or other destructive commands in the plan.

---

## After this: recovering Git for the other 26 modules

Both trees already lost `.git` for every module except `ai_provider_langchain`. Fixing custom vs custom1 does not restore that. To get proper repos back you’ll need to re-clone from GitLab (e.g. from `__BARE_REPOS` or the GitLab paths in AGENTS.md) into each module dir, or use `buildkit drupal modules` once the layout is correct. That can be a separate, follow‑up step after this cleanup.
