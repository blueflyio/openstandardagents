# Drupal Recipes: Canonical Layout (Bluefly Demos)

## Research summary

- **Drupal core:** Recipe commands accept a **path** argument (directory containing `recipe.yml`). Core does not mandate project root vs `web/`; the path is whatever you pass to `drush recipe <path>`.
- **Community / project convention:** Drupal CMS and core-recipe-unpack use **project root** for recipes (e.g. `recipes/` at repo root), not `web/recipes/`.
- **Bluefly canonical:** All demos use **project root `recipes/`** only. No `web/recipes/` in any demo.

## Canonical layout (single standard)

All three demos use this structure:

```
<project_root>/
  recipes/
    custom/           # Our site recipes (recipe_agentdash, recipe_agent_marketplace, etc.)
      <recipe_name>/
        recipe.yml
        ...
    contrib/          # Composer-installed drupal-recipe packages (unpacked here)
      <package_name>/
        recipe.yml
        ...
```

- **recipes/custom/** — In-repo or otherwise "ours" (AgentDash, Marketplace, Secure Drupal, etc.).
- **recipes/contrib/** — Packages installed via Composer with type `drupal-recipe`, unpacked into this path.

Composer `installer-paths` must include:

- `recipes/custom/{$name}/` for custom recipe packages (if any are composer packages).
- `recipes/contrib/{$name}/` for `type:drupal-recipe` packages.

Apply recipes from project root, e.g.:

```bash
drush recipe recipes/custom/recipe_agentdash
drush recipe recipes/custom/recipe_agent_marketplace
```

## Per-demo audit (before alignment)

| Demo | recipes/ layout | Composer paths | Notes |
|------|-----------------|----------------|-------|
| Drupal_AgentDash | custom/ + contrib/ | custom + contrib | Canonical. Docs sometimes said recipes/recipe_agentdash; fixed to recipes/custom/recipe_agentdash. |
| Drupal_AgentMarketplace | recipe_agent_marketplace at top level + contrib/ | contrib only | Custom recipe sat next to contrib; moved to recipes/custom/recipe_agent_marketplace. |
| Drupal_Fleet_Manager | Flat (all under recipes/) | ./recipes/{$name} | No custom/ or contrib/; migrated to recipes/contrib/ for unpacked, recipes/custom/ for any custom. |

## Migration applied

1. **Drupal_AgentMarketplace:** `recipes/recipe_agent_marketplace` moved to `recipes/custom/recipe_agent_marketplace`. Composer and docs updated to use `recipes/custom/` and the new path.
2. **Drupal_Fleet_Manager:** Existing recipe dirs moved under `recipes/contrib/`; composer installer path set to `recipes/contrib/{$name}`; `recipes/custom/` added for future use.
3. **Drupal_AgentDash:** All references normalized to `recipes/custom/recipe_agentdash` (and `recipes/custom/recipe_secure_drupal` where applicable).

## References

- Drupal recipe commands: path argument is the directory containing `recipe.yml`.
- AGENTS.md (each demo): points to this layout; no `web/recipes/` references.
- Runbook: agent-buildkit wiki **Drupal-Recipes-Layout** (this page).
