## 🍳 Drupal Recipe

### Recipe Information

| Field | Value |
|-------|-------|
| **Recipe Name** | <!-- e.g., blog-starter --> |
| **Machine Name** | <!-- e.g., blog_starter --> |
| **Version** | <!-- e.g., 1.0.0 --> |
| **Drupal Core** | <!-- ^10.3 \|\| ^11 --> |
| **Category** | <!-- Starter / Feature / Integration --> |

### Recipe Type

- [ ] 🚀 Starter Recipe (full site setup)
- [ ] ✨ Feature Recipe (add functionality)
- [ ] 🔌 Integration Recipe (third-party integration)
- [ ] 🎨 Theme Recipe (design/theming)
- [ ] 📊 Content Recipe (content types/structure)

## Summary

<!-- Describe what this recipe provides -->

## What's Included

### Modules
```yaml
# From recipe.yml
install:
  - node
  - views
  - pathauto
```

### Configuration
```
config/
├── node.type.article.yml
├── field.storage.node.body.yml
├── views.view.articles.yml
└── ...
```

### Content (if applicable)
```
content/
├── node/
└── media/
```

---

## 🤖 Recipe Agent Suite

- [x] `@bot-mr-reviewer` — General review
- [x] `@bot-drupal-recipe-scaffolder` — Recipe validation
- [x] `@bot-drupal-standards` — Drupal standards
- [ ] `@bot-config-auditor` — Config validation
- [ ] `@bot-drupal-recipe-pub` — Publish to registry

### Recipe Commands

```
/recipe validate              # Validate recipe structure
/recipe lint                  # Lint recipe.yml
/recipe dependencies          # Check dependency tree
/recipe apply --dry-run       # Simulate application
/recipe scaffold <n>       # Generate recipe skeleton
/recipe publish --dry-run     # Test publishing
/recipe publish               # Publish to registry
```

---

## Recipe Structure

```
recipes/my_recipe/
├── recipe.yml              # Recipe definition
├── README.md               # Documentation
├── config/
│   ├── install/            # Required config
│   └── optional/           # Optional config
├── content/                # Default content (optional)
└── tests/
    └── RecipeTest.php      # Recipe tests
```

## recipe.yml

```yaml
name: 'My Recipe'
description: 'Description of what this recipe provides'
type: 'Site'

recipes:
  - core/recipes/standard

install:
  - node
  - views
  - pathauto

config:
  import:
    node:
      - node.type.article
    views:
      - views.view.articles

  actions:
    user.role.content_editor:
      grantPermissions:
        - 'create article content'
        - 'edit own article content'
```

---

## Recipe Checklist

### Structure
- [ ] `recipe.yml` valid YAML
- [ ] `README.md` present
- [ ] Config files properly named
- [ ] No circular dependencies

### Configuration
- [ ] All config has UUIDs removed
- [ ] No site-specific config (UUIDs, IDs)
- [ ] Dependencies declared
- [ ] Config actions use proper syntax

### Compatibility
- [ ] Core version constraint correct
- [ ] Module dependencies available
- [ ] No conflicts with common recipes
- [ ] Tested on fresh install

### Documentation
- [ ] README describes purpose
- [ ] Installation steps documented
- [ ] Configuration options explained
- [ ] Screenshots included (if UI changes)

### Testing
- [ ] Recipe applies successfully
- [ ] No PHP errors/warnings
- [ ] Functionality works as expected
- [ ] Can be applied multiple times (idempotent)

---

## Testing Instructions

```bash
# Fresh Drupal installation
composer create-project drupal/recommended-project test-site
cd test-site

# Apply recipe
php core/scripts/drupal recipe recipes/my_recipe

# Verify
drush status
drush pm:list --status=enabled
```

## Dependencies

| Dependency | Type | Required |
|------------|------|----------|
| `drupal/node` | Module | Yes |
| `drupal/views` | Module | Yes |
| `core/recipes/standard` | Recipe | Yes |

---

## Screenshots

### Before (Fresh Drupal)
<!-- Screenshot -->

### After (Recipe Applied)
<!-- Screenshot -->

---

## Migration from Previous Version

<!-- If updating existing recipe -->

```bash
# Upgrade path
drush cr
php core/scripts/drupal recipe recipes/my_recipe
```

### Breaking Changes
- [ ] None
- [ ] Config structure changed
- [ ] New dependencies required
- [ ] Permissions changed

---

/label ~"drupal" ~"recipe" ~"needs-validation"
/assign_reviewer @bot-mr-reviewer @bot-drupal-recipe-scaffolder @bot-drupal-standards
