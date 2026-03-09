---
name: recipe-publish
description: "**Recipe Publisher**: Publishes Drupal recipes to package registries (Packagist, drupal.org). Includes validation, packaging, versioning, and changelog generation. - MANDATORY TRIGGERS: publish recipe, packagist, drupal.org, release recipe, publish module, package recipe"
license: "Apache-2.0"
compatibility: "Requires PHP 8.3+, Composer. Environment: PACKAGIST_TOKEN, DRUPAL_ORG_TOKEN"
allowed-tools: "Bash(composer:*) Bash(git:*) Write Edit Read Task mcp__gitlab__*"
metadata:
  ossa_manifest: ./agent.ossa.yaml
  service_account: recipe-publisher
  domain: drupal
  tier: worker
  autonomy: fully_autonomous
  ossa_version: v0.3.2
---

# Recipe Publisher

**OSSA Agent**: `recipe-publisher` | **Version**: 1.0.0 | **Namespace**: blueflyio

Publishes Drupal recipes and modules to package registries.

## Capabilities

| Capability | Category | Description |
|------------|----------|-------------|
| `recipe_validation` | reasoning | Validate recipe structure |
| `schema-validation` | reasoning | Validate recipe.yml schema |
| `dependency-check` | reasoning | Check dependencies |
| `recipe_packaging` | action | Package for distribution |
| `archive-creation` | action | Create archives |
| `registry_publishing` | action | Publish to registry |
| `drupal-org-publish` | action | Publish to drupal.org |
| `packagist-publish` | action | Publish to Packagist |
| `version_management` | action | Manage versions |
| `changelog_generation` | action | Generate changelogs |
| `recipe-testing` | action | Test recipe application |

## Recipe Structure

```
my_recipe/
├── recipe.yml            # Recipe definition
├── composer.json         # Composer metadata
├── config/
│   └── install/          # Config to import
├── content/              # Default content
└── README.md
```

## recipe.yml Format

```yaml
name: My Recipe
description: 'Configures site with essential modules'
type: Site

install:
  - admin_toolbar
  - pathauto
  - metatag
  - paragraphs

config:
  import:
    admin_toolbar: '*'
    pathauto:
      - pathauto.pattern.*

content:
  import:
    node:
      - default-homepage.yml
```

## Publishing Workflow

### 1. Validate Recipe
```bash
# Check structure
composer validate --strict

# Drupal-check
drupal-check recipes/my_recipe

# Test application
drush recipe recipes/my_recipe --dry-run
```

### 2. Version Bump
```bash
# Update composer.json version
composer config version 1.1.0

# Generate changelog
git log --oneline v1.0.0..HEAD > CHANGELOG.md
```

### 3. Create Tag
```bash
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0
```

### 4. Publish to Packagist
```bash
# Via webhook (recommended)
# Configure in GitLab: Settings → Webhooks
# URL: https://packagist.org/api/update-package?username=USER

# Via API
curl -X POST \
  "https://packagist.org/api/update-package" \
  -d "username=USER&apiToken=TOKEN"
```

### 5. Publish to drupal.org
```bash
# Push to drupal.org remote
git remote add drupal git@git.drupalcode.org:project/my_recipe.git
git push drupal main:11.x
git push drupal v1.1.0:11.x-1.1.0
```

## composer.json Template

```json
{
  "name": "drupal/my_recipe",
  "description": "My Drupal Recipe",
  "type": "drupal-recipe",
  "license": "GPL-2.0-or-later",
  "require": {
    "drupal/core": "^11",
    "drupal/admin_toolbar": "^3.4",
    "drupal/paragraphs": "^1.15"
  },
  "minimum-stability": "stable"
}
```

## Validation Checks

```yaml
pre_publish_checks:
  - composer_valid: true
  - phpcs_pass: true
  - phpstan_pass: true
  - recipe_schema_valid: true
  - dependencies_available: true
  - no_security_issues: true
  - tests_pass: true
  - changelog_updated: true
```

## Examples

### Publish to Packagist
```
User: Publish my_recipe to Packagist
Agent: Validating recipe...
       ✓ composer.json valid
       ✓ recipe.yml schema valid
       ✓ Dependencies available
       ✓ No security issues

       Creating tag v1.1.0...
       Triggering Packagist webhook...

       ✓ Published: packagist.org/packages/drupal/my_recipe
```

### Validate Only
```
User: Is my recipe ready to publish?
Agent: Validating my_recipe...

       ✓ Structure: OK
       ✓ Dependencies: OK
       ✗ Tests: 2 failures
       ✗ PHPCS: 5 violations

       NOT READY - fix issues first
```

### Full Release
```
User: Release my_recipe v2.0.0 to all registries
Agent: Starting full release...

       1. Validation... ✓
       2. Changelog... ✓
       3. Git tag v2.0.0... ✓
       4. Packagist... ✓
       5. drupal.org... ✓

       Released to:
       - packagist.org/packages/drupal/my_recipe
       - drupal.org/project/my_recipe/releases/11.x-2.0.0
```

## Service Account

- **Account**: recipe-publisher
- **Group**: blueflyio
- **Drupal Version**: 11
- **PHP Version**: 8.3

## References

- [OSSA v0.3.2 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [Drupal Recipes](https://www.drupal.org/docs/extending-drupal/drupal-recipes)
- [Packagist Publishing](https://packagist.org/about#how-to-update-packages)
