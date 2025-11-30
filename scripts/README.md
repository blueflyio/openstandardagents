# Scripts Directory

Automation scripts for openstandardagents.org project.

## Available Scripts

### `sync-spec.ts`

Syncs OSSA schema and examples from `@bluefly/openstandardagents` npm package to website public directory.

**Usage:**

```bash
# From project root
pnpm sync:spec              # Sync everything
pnpm sync:schema            # Schema only
pnpm sync:examples          # Examples only

# From website directory
cd website
pnpm sync:spec --dry-run    # Preview changes
pnpm sync:spec --verbose    # Detailed output
```

**What it does:**

1. Locates `@bluefly/openstandardagents` in node_modules
2. Copies `spec/` → `website/public/schema/`
3. Copies `examples/` → `website/public/examples/`
4. Generates `index.json` metadata files
5. Creates `latest.json` symlink to current version

**Output:**

```
website/public/
├── schema/
│   ├── v0.2.6/
│   │   └── ossa-0.2.6.schema.json
│   ├── latest.json
│   └── index.json
└── examples/
    ├── agent-manifests/
    ├── bridges/
    └── index.json
```

**CLI Options:**

- `--schema` - Sync schema files only
- `--examples` - Sync examples only
- `--dry-run` - Preview without writing files
- `--verbose, -v` - Detailed logging
- `--help, -h` - Show help

**Exit Codes:**

- `0` - Success
- `1` - Error occurred

## Adding New Scripts

1. Create TypeScript file in `scripts/`
2. Add shebang: `#!/usr/bin/env tsx`
3. Make executable: `chmod +x scripts/your-script.ts`
4. Add to package.json scripts
5. Document in this README

## Requirements

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- tsx (installed as devDependency)

## Related Documentation

- [SYNC_ARCHITECTURE.md](../SYNC_ARCHITECTURE.md) - Full sync architecture
- [Website README](../website/README.md) - Website documentation
