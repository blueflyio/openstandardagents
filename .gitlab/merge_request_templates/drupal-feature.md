## 🎯 Drupal Feature/Fix

### Module/Theme Information

| Field | Value |
|-------|-------|
| **Module/Theme** | <!-- e.g., mymodule --> |
| **Type** | <!-- Module / Theme / Profile / Recipe --> |
| **Drupal Version** | <!-- 10.x / 11.x --> |
| **PHP Version** | <!-- 8.2 / 8.3 --> |

### Change Type

- [ ] 🆕 New module/theme
- [ ] ✨ New feature
- [ ] 🐛 Bug fix
- [ ] 🔒 Security fix
- [ ] ♻️ Refactoring
- [ ] 📚 Documentation
- [ ] 🧪 Test coverage
- [ ] ⬆️ Dependency update

## Summary

<!-- Describe the changes -->

## Technical Details

### Files Changed

```
web/modules/custom/mymodule/
├── mymodule.info.yml
├── mymodule.module
├── src/
│   └── ...
└── tests/
    └── ...
```

### Database Changes
- [ ] No database changes
- [ ] New entity type
- [ ] Schema update (update hook)
- [ ] Configuration changes
- [ ] Migration required

### Configuration Changes
- [ ] No config changes
- [ ] New config entities
- [ ] Config schema updates
- [ ] Settings form changes

---

## 🤖 Drupal Agent Suite

<!-- Agents automatically invoked for Drupal changes -->

### Code Quality
- [x] `@bot-mr-reviewer` — General code review
- [x] `@bot-drupal-standards` — Drupal coding standards (PHPCS/PHPStan)
- [ ] `@bot-config-auditor` — Configuration audit

### Scaffolding & Generation
- [ ] `@bot-module-scaffolder` — Generate module boilerplate
- [ ] `@bot-drupal-recipe-scaffolder` — Generate recipe
- [ ] `@bot-component-builder` — Generate CI component

### Testing
- [ ] `@bot-theme-tester` — Visual regression (theme changes)
- [ ] `@bot-content-auditor` — Content model validation

### Agent Commands

```
/drupal check                    # Run all Drupal checks
/drupal phpcs                    # Coding standards only
/drupal phpstan                  # Static analysis only
/drupal deprecations             # Deprecation check
/scaffold module <name>          # Generate module
/scaffold entity <name>          # Generate entity type
/scaffold form <name>            # Generate form
/scaffold controller <name>      # Generate controller
/scaffold service <name>         # Generate service
/recipe scaffold <name>          # Generate recipe
/recipe validate                 # Validate recipe
/audit config                    # Check config sync status
/audit content                   # Content model check
/test theme                      # Visual regression
```

---

## Drupal Standards Checklist

### Code Quality
- [ ] Follows Drupal coding standards (PHPCS)
- [ ] Passes PHPStan level 5+
- [ ] No deprecated API usage
- [ ] Proper dependency injection
- [ ] Services properly defined

### Security
- [ ] User input sanitized
- [ ] Access checks implemented
- [ ] CSRF protection (forms)
- [ ] No SQL injection vectors
- [ ] Proper permission checks

### Configuration
- [ ] Config schema defined
- [ ] Config exportable
- [ ] No environment-specific config
- [ ] Proper config dependencies

### Testing
- [ ] Unit tests for services
- [ ] Kernel tests for entities
- [ ] Functional tests for UI
- [ ] Test coverage > 80%

### Documentation
- [ ] README.md present
- [ ] Hook documentation
- [ ] API documentation
- [ ] CHANGELOG updated

---

## Drush Commands (if applicable)

```bash
# List new commands
drush mymodule:command --help
```

## Permissions (if applicable)

| Permission | Description |
|------------|-------------|
| `administer mymodule` | Full admin access |
| `view mymodule content` | View content |

---

## Screenshots / Demo

<!-- For UI changes, include before/after screenshots -->

### Before
<!-- Screenshot -->

### After
<!-- Screenshot -->

---

## Migration Notes

<!-- If upgrading from previous version -->

```bash
# Required update steps
drush updb
drush cr
drush cim
```

---

## Rollback Plan

```bash
# If rollback needed
git revert <commit>
drush updb
drush cr
```

---

/label ~"drupal" ~"needs-review" ~"needs-standards-check"
/assign_reviewer @bot-mr-reviewer @bot-drupal-standards
