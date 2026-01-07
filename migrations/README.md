# OSSA Migrations

Automated migration system for OSSA manifests following npm best practices.

## Overview

This directory contains migration guides and scripts that automatically update OSSA manifests when you upgrade the package version. Migrations run automatically on `npm install` or `npm update` via the `postinstall` hook.

## Structure

```
migrations/
├── README.md                    # This file
├── index.ts                      # Migration runner (auto-detects and applies migrations)
├── guides/                       # Human-readable migration guides
│   └── MIGRATION-v0.3.2-to-v0.3.3.md
└── scripts/                      # Automated migration scripts
    └── migrate-v0.3.2-to-v0.3.3.ts
```

## Usage

### Automatic Migration (Recommended)

Migrations run automatically when you install or update the package:

```bash
npm install
# or
npm update
```

The `postinstall` hook automatically:
1. Detects your current package version
2. Finds all OSSA manifest files
3. Checks which files need migration
4. Applies migrations incrementally
5. Tracks migration state in `.migration-state.json`

### Manual Migration

```bash
# Check migration status
npm run migrate:check

# Dry run (see what would change)
npm run migrate:dry

# Run migrations manually
npm run migrate
```

### Migration State

Migration state is tracked in `.migration-state.json`:

```json
{
  "lastMigratedVersion": "0.3.3",
  "migrations": [
    {
      "version": "0.3.3",
      "date": "2025-12-31T00:00:00.000Z",
      "files": ["examples/agents/my-agent.ossa.yaml"]
    }
  ]
}
```

## Adding New Migrations

When releasing a new version:

1. **Create migration guide** in `guides/`:
   ```bash
   cp migrations/guides/MIGRATION-v0.3.2-to-v0.3.3.md \
      migrations/guides/MIGRATION-v0.3.3-to-v0.3.4.md
   ```

2. **Create migration script** in `scripts/`:
   ```bash
   cp migrations/scripts/migrate-v0.3.2-to-v0.3.3.ts \
      migrations/scripts/migrate-v0.3.3-to-v0.3.4.ts
   ```

3. **Register migration** in `migrations/index.ts`:
   ```typescript
   const MIGRATIONS: Migration[] = [
     // ... existing migrations
     {
       from: '0.3.3',
       to: '0.3.4',
       script: 'migrations/scripts/migrate-v0.3.3-to-v0.3.4.ts',
       description: 'Description of changes'
     }
   ];
   ```

4. **Test migration**:
   ```bash
   npm run migrate:dry
   npm run migrate
   ```

## Migration Script Template

```typescript
#!/usr/bin/env tsx
/**
 * Migration Script: vX.Y.Z → vA.B.C
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'yaml';
import type { OssaAgent } from '../../src/types/index.js';

function migrateManifest(filePath: string, options: { dryRun?: boolean } = {}): void {
  const content = readFileSync(filePath, 'utf-8');
  const manifest = parse(content) as OssaAgent;

  // Check if already migrated
  if (manifest.apiVersion === 'ossa/vA.B.C') {
    console.log(`✅ ${filePath} is already migrated`);
    return;
  }

  // Update apiVersion
  manifest.apiVersion = 'ossa/vA.B.C';

  // Apply changes...

  if (!options.dryRun) {
    writeFileSync(filePath, stringify(manifest, { indent: 2 }), 'utf-8');
  }
}

const filePath = process.argv[2];
migrateManifest(filePath, { dryRun: process.argv.includes('--dry-run') });
```

## Best Practices

1. **Backward Compatibility**: Always maintain backward compatibility when possible
2. **Incremental**: Migrations should be incremental (v0.3.2 → v0.3.3 → v0.3.4)
3. **Idempotent**: Running a migration twice should be safe
4. **Preserve Data**: Never lose user data during migration
5. **Add Annotations**: Add migration metadata to manifests:
   ```yaml
   metadata:
     annotations:
       ossa.io/migration: v0.3.2-to-v0.3.3
       ossa.io/migrated-date: 2025-12-31
   ```

## Files Scanned

The migration runner automatically finds manifests in:
- `**/*.ossa.yaml`
- `**/*.ossa.yml`
- `**/agent.yml`
- `**/agent.yaml`
- `.gitlab/agents/**/*.yaml`
- `examples/**/*.yaml`
- `examples/**/*.yml`

Excludes: `node_modules/`, `dist/`, `.git/`

## Troubleshooting

### Migration not running

Check that `postinstall` script exists in `package.json`:
```json
{
  "scripts": {
    "postinstall": "tsx migrations/index.ts migrate"
  }
}
```

### Migration fails

1. Check migration script syntax
2. Run with `--dry-run` first
3. Check `.migration-state.json` for state
4. Verify manifest file format

### Skip automatic migration

Set environment variable:
```bash
SKIP_MIGRATIONS=true npm install
```

## References

- [npm postinstall hooks](https://docs.npmjs.com/cli/v9/using-npm/scripts#life-cycle-scripts)
- [Semantic Versioning](https://semver.org/)
- [OSSA Version Management](../.gitlab/docs/development/VERSIONING.md)
