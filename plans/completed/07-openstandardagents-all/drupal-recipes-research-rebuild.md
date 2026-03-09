# Task: Drupal recipes research and rebuild

## Objective
Research Drupal recipes and contrib modules around them, identify gaps vs best practice and platform needs, then rebuild structure, content, and config for:

- TESTING_DEMOS/DEMO_SITE_drupal_testing/recipes/custom/recipe_secure_drupal
- TESTING_DEMOS/DEMO_SITE_drupal_testing/recipes/custom/recipe_agentdash
- TESTING_DEMOS/DEMO_SITE_drupal_testing/recipes/custom/recipe_agent_marketplace

## Research (do first)
1. **Drupal recipe standard**: Project root `recipes/` only; do not use `web/recipes/`. Recipe Generator (recipe_generator) outputs to (webroot)/recipes/custom; we use project root recipes/custom.
2. **Contrib patterns**: drupal_cms_* recipes use type: Site or "Drupal CMS", recipes: [core/recipes/..., drupal_cms_*], install: [modules/themes], config: { strict: false, import: { module: '*' }, actions: { ... } }. Some use input: for installer prompts.
3. **Gaps identified**:
   - recipe_secure_drupal: Main recipe has config: {} and content: []; subrecipes hold config. Some install modules (paranoia, user_restrictions, flood_control, real_aes, username_enumeration_prevention, antibot, autologout, shield) may need drupal.org verification. Ensure config.import or config.actions align with config/install files present.
   - recipe_agent_platform_core: Empty stub (install: [], config: {}, content: []). Optionally add minimal install (eck, key) so recipe_agentdash/recipe_agent_marketplace have a real bootstrap.
   - recipe_agentdash: Very long install list; core_version_requirement ^11.0 narrows compat; config.import references many configs—ensure they exist. Some config/install files reference llm_platform_manager, llm.qdrant—verify module names.
   - recipe_agent_marketplace: Thin config.actions only; add ai_agents_marketplace.settings and discovery/mesh URL placeholders; content/taxonomy_terms.yml is reference data (not recipe content format).

## Rebuild (do second)
1. **recipe_secure_drupal**: Keep recipe.yml structure; add comment that config is delegated to subrecipes; ensure subrecipe paths are subrecipes/NAME. If config/install files exist in recipe root, add config.import for them.
2. **recipe_agent_platform_core**: Add minimal install (eck, key) and config: {} so it is a real bootstrap; or leave as stub and add description that consuming recipes bring their own deps.
3. **recipe_agentdash**: Set core_version_requirement to ^10.5 || ^11.0 for wider compat unless CMS 2.0-only; keep config.import and config.actions; ensure config/install files referenced in config.import exist or remove broken refs.
4. **recipe_agent_marketplace**: Add config.import for ai_agents_marketplace.settings if config/install exists; add config.actions for mesh_url/discovery_url empty placeholders; keep content: [] unless we have valid recipe content items.

## Deliverables
- Updated recipe.yml in each of the three recipe dirs.
- Optional: config/install or config/actions added where missing.
- Do not create new .md docs in repo; findings can go to GitLab Wiki (technical-docs or agent-buildkit) page "Drupal-Recipes-Research-and-Gaps".

## References
- AGENTS.md "Custom recipes (apply order and dependency graph)" (project root recipes/custom only).
- Recipe Generator: https://www.drupal.org/project/recipe_generator (drush gen recipe -> project root recipes/custom).
- Contrib examples: recipes/contrib/drupal_cms_starter/recipe.yml, drupal_cms_ai/recipe.yml.
