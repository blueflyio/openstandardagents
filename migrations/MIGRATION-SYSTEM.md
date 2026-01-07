# OSSA Automated Migration System

## Overview

This migration system follows npm best practices and automatically updates OSSA manifests when you upgrade the package version. It's designed to be **smart**, **automated**, and **follow industry standards**.

## Key Features

✅ **Automatic**: Runs on `npm install` / `npm update` via `postinstall` hook
✅ **Smart Detection**: Automatically detects which files need migration
✅ **Incremental**: Applies migrations step-by-step (v0.3.3 → v0.3.3 → v0.3.4)
✅ **Safe**: Dry-run mode to preview changes
✅ **Tracked**: Records migration state in `.migration-state.json`
✅ **Skip Option**: Can be disabled via `SKIP_MIGRATIONS=true`

## How It Works

### 1. On `npm install` / `npm update`

```bash
npm install
# → postinstall hook runs
# → migrations/index.ts executes
# → Detects current package version (from package.json)
# → Scans for OSSA manifest files
# → Applies applicable migrations
# → Updates .migration-state.json
```

### 2. Migration Detection

The system:
1. Reads `package.json` to get current version
2. Scans for manifest files (`*.ossa.yaml`, `agent.yml`, etc.)
3. Reads `apiVersion` from each manifest
4. Compares manifest version with package version
5. Finds applicable migrations from registry
6. Applies migrations incrementally

### 3. Migration Registry

Migrations are registered in `migrations/index.ts`:

```typescript
const MIGRATIONS: Migration[] = [
  {
    from: '0.3.3',
    to: '0.3.3',
    script: 'migrations/scripts/migrate-v0.3.3-to-v0.3.3.ts',
    description: 'Add Skills Compatibility Extension'
  }
];
```

## Usage

### Automatic (Recommended)

Just install/update the package:

```bash
npm install
# Migrations run automatically
```

### Manual Commands

```bash
# Check what needs migration
npm run migrate:check

# Preview changes (dry run)
npm run migrate:dry

# Run migrations manually
npm run migrate
```

### Skip Migrations

```bash
SKIP_MIGRATIONS=true npm install
```

## File Structure

```
migrations/
├── README.md                          # User documentation
├── MIGRATION-SYSTEM.md                # This file (system overview)
├── index.ts                           # Migration runner
├── guides/                            # Human-readable guides
│   └── MIGRATION-v0.3.3-to-v0.3.3.md
└── scripts/                           # Automated scripts
    └── migrate-v0.3.3-to-v0.3.3.ts
```

## Adding a New Migration

When releasing a new version (e.g., v0.3.4):

### Step 1: Create Migration Guide

```bash
cp migrations/guides/MIGRATION-v0.3.3-to-v0.3.3.md \
   migrations/guides/MIGRATION-v0.3.3-to-v0.3.4.md
```

Edit the guide with new version details.

### Step 2: Create Migration Script

```bash
cp migrations/scripts/migrate-v0.3.3-to-v0.3.3.ts \
   migrations/scripts/migrate-v0.3.3-to-v0.3.4.ts
```

Update the script to:
- Change target version to `0.3.4`
- Apply necessary changes
- Update migration annotations

### Step 3: Register Migration

Edit `migrations/index.ts`:

```typescript
const MIGRATIONS: Migration[] = [
  // ... existing migrations
  {
    from: '0.3.3',
    to: '0.3.4',
    script: 'migrations/scripts/migrate-v0.3.3-to-v0.3.4.ts',
    description: 'Description of changes in v0.3.4'
  }
];
```

### Step 4: Test

```bash
# Dry run
npm run migrate:dry

# Test on sample file
tsx migrations/scripts/migrate-v0.3.3-to-v0.3.4.ts examples/my-agent.ossa.yaml --dry-run

# Full test
npm run migrate:check
npm run migrate
```

## Migration Script Best Practices

1. **Idempotent**: Running twice should be safe
2. **Preserve Data**: Never lose user configuration
3. **Add Annotations**: Record migration metadata
4. **Backward Compatible**: When possible, maintain compatibility
5. **Clear Errors**: Provide helpful error messages

Example:

```typescript
// Check if already migrated
if (manifest.apiVersion === 'ossa/v0.3.4') {
  console.log(`✅ Already migrated`);
  return;
}

// Update version
manifest.apiVersion = 'ossa/v0.3.4';

// Add migration annotation
manifest.metadata.annotations['ossa.io/migration'] = 'v0.3.3-to-v0.3.4';
manifest.metadata.annotations['ossa.io/migrated-date'] = new Date().toISOString().split('T')[0];

// Apply changes...
```

## State Tracking

Migration state is stored in `.migration-state.json`:

```json
{
  "lastMigratedVersion": "0.3.3",
  "migrations": [
    {
      "version": "0.3.3",
      "date": "2025-12-31T00:00:00.000Z",
      "files": [
        "examples/agents/my-agent.ossa.yaml"
      ]
    }
  ]
}
```

This allows:
- Tracking which files were migrated
- Preventing duplicate migrations
- Audit trail for CI/CD

## CI/CD Integration

### GitLab CI

Add to `.gitlab-ci.yml`:

```yaml
migrate:manifests:
  stage: validate
  script:
    - npm run migrate:check
    - npm run migrate:dry
  allow_failure: true
```

### GitHub Actions

```yaml
- name: Check migrations
  run: npm run migrate:check

- name: Dry run migrations
  run: npm run migrate:dry
```

## Troubleshooting

### Migrations not running

1. Check `package.json` has `postinstall` script
2. Verify `tsx` is available (in devDependencies or globally)
3. Check `.migration-state.json` exists and is valid

### Migration fails

1. Run with `--dry-run` first
2. Check migration script syntax
3. Verify manifest file format
4. Check error messages in console

### Too many files found

The system scans:
- `**/*.ossa.yaml`
- `**/*.ossa.yml`
- `**/agent.yml`
- `.gitlab/agents/**/*.yaml`
- `examples/**/*.yaml`

Excludes: `node_modules/`, `dist/`, `.git/`

To exclude more paths, edit `migrations/index.ts` → `findManifestFiles()`

## Comparison with npm Best Practices

This system follows npm conventions:

| Feature | npm Standard | OSSA Implementation |
|---------|-------------|---------------------|
| Postinstall hook | ✅ | ✅ `postinstall` script |
| Version detection | ✅ | ✅ From `package.json` |
| Incremental updates | ✅ | ✅ Step-by-step migrations |
| State tracking | ✅ | ✅ `.migration-state.json` |
| Dry run | ✅ | ✅ `migrate:dry` |
| Skip option | ✅ | ✅ `SKIP_MIGRATIONS` |

## References

- [npm Scripts Documentation](https://docs.npmjs.com/cli/v9/using-npm/scripts)
- [Semantic Versioning](https://semver.org/)
- [OSSA Version Management](../.gitlab/docs/development/VERSIONING.md)
