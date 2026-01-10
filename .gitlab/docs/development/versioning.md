# Version Management

**Single source of truth**: `.version.json`

## Never Manually Update Versions

All version references are automatically synced from `.version.json`.

## Workflow

### Bump Version
```bash
# Bump patch (0.2.5 → 0.2.6)
npm run version:bump patch

# Bump minor (0.2.5 → 0.3.0)
npm run version:bump minor

# Bump major (0.2.5 → 1.0.0)
npm run version:bump major

# Create RC (0.2.5 → 0.2.6-RC)
npm run version:bump rc

# Release RC (0.2.6-RC → 0.2.6)
npm run version:bump release
```

### What Gets Updated Automatically

- `package.json` version
- `website/package.json` version
- README.md badges
- `website/content/docs/00-HOME.md` badges
- All `0.3.3` placeholders in docs

### Use Placeholders in Docs

Instead of hardcoding versions:
```markdown
❌ version: 0.2.6
✅ version: 0.3.3

❌ spec/v0.2.6/ossa-0.2.6.schema.json
✅ spec/v0.3.3/{{SCHEMA_FILE}}
```

Available placeholders:
- `0.3.3` - Current version (0.2.6)
- `0.3.3` - Latest stable (0.2.4)
- `spec/v0.3.3` - Spec directory path
- `{{SCHEMA_FILE}}` - Schema filename

### Build Process

Versions are automatically synced before every build:
```bash
npm run build  # Runs version:sync → docs:process → build
```

## Manual Sync

If needed:
```bash
npm run version:sync      # Sync version to all files
npm run docs:process      # Process doc templates
```

## CI/CD Integration

Add to `.gitlab-ci.yml`:
```yaml
before_script:
  - npm run version:sync
  - npm run docs:process
```
