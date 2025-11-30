# OSSA Website Integration Guide

Quick guide to set up and use the OSSA spec sync mechanism.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Sync OSSA spec and examples
pnpm sync:spec

# 3. Start development server
pnpm website:dev

# 4. Access synced content
open http://localhost:3000/schema/latest.json
open http://localhost:3000/examples/
```

## What Gets Synced?

### From `@bluefly/openstandardagents` package:

```
spec/ → website/public/schema/
├── v0.1.9/
├── v0.2.2/
├── v0.2.3/
├── v0.2.4/
├── v0.2.5/
└── v0.2.6/

examples/ → website/public/examples/
├── agent-manifests/
├── bridges/
├── drupal/
├── kagent/
├── openai/
└── [38 other categories]
```

## Using Synced Content in Your Website

### Next.js Example (App Router)

```typescript
// app/schema/page.tsx
export default async function SchemaPage() {
  // Fetch from public directory
  const schema = await fetch(
    `${process.env.NEXT_PUBLIC_URL}/schema/latest.json`
  ).then(r => r.json());

  return (
    <div>
      <h1>OSSA Schema v{schema.version}</h1>
      <pre>{JSON.stringify(schema, null, 2)}</pre>
    </div>
  );
}
```

### React Component Example

```typescript
// components/SchemaViewer.tsx
import { useState, useEffect } from 'react';

export function SchemaViewer() {
  const [schema, setSchema] = useState(null);
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    // Load schema index
    fetch('/schema/index.json')
      .then(r => r.json())
      .then(data => {
        setVersions(data.versions);
        // Load latest schema
        return fetch('/schema/latest.json');
      })
      .then(r => r.json())
      .then(setSchema);
  }, []);

  return (
    <div>
      <h2>Available Versions</h2>
      <ul>
        {versions.map(v => (
          <li key={v.version}>
            <a href={`/schema/${v.path}`}>v{v.version}</a>
          </li>
        ))}
      </ul>

      <h2>Latest Schema</h2>
      <pre>{JSON.stringify(schema, null, 2)}</pre>
    </div>
  );
}
```

### Examples Browser

```typescript
// components/ExamplesBrowser.tsx
import { useState, useEffect } from 'react';

export function ExamplesBrowser() {
  const [examples, setExamples] = useState({ categories: [] });

  useEffect(() => {
    fetch('/examples/index.json')
      .then(r => r.json())
      .then(setExamples);
  }, []);

  return (
    <div>
      <h2>OSSA Examples ({examples.total} files)</h2>
      {examples.categories.map(category => (
        <div key={category.name}>
          <h3>{category.name}</h3>
          <p>{category.description}</p>
          <ul>
            {category.files.map(file => (
              <li key={file.name}>
                <a href={`/${file.path}`}>{file.name}</a>
                <span> ({(file.size / 1024).toFixed(1)} KB)</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

## Updating OSSA Version

### Option 1: Update to Latest

```bash
cd website
pnpm update @bluefly/openstandardagents
pnpm sync:spec
git add package.json pnpm-lock.yaml
git commit -m "chore: update OSSA to latest"
git push
```

### Option 2: Update to Specific Version

```bash
cd website
pnpm add @bluefly/openstandardagents@0.2.8
pnpm sync:spec
git add package.json pnpm-lock.yaml
git commit -m "chore: update OSSA to v0.2.8"
git push
```

### Option 3: Automatic Updates (Renovate/Dependabot)

Add to `.gitlab-ci.yml` or `.github/workflows/`:

```yaml
# .gitlab/renovate.json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchPackagePatterns": ["@bluefly/openstandardagents"],
      "automerge": true,
      "postUpdateOptions": ["pnpmDedupe"],
      "schedule": ["every monday"]
    }
  ]
}
```

## CI/CD Integration

The sync runs automatically in CI:

```yaml
# .gitlab-ci.yml (already configured)
build:website:
  script:
    - pnpm sync:spec          # ← Syncs before build
    - pnpm website:build
```

## Local Development Workflow

```bash
# Daily development
pnpm website:dev              # Sync runs in build script

# Force re-sync (after updating package)
pnpm sync:spec

# Preview sync (no changes)
pnpm sync:spec --dry-run --verbose

# Schema only
pnpm sync:schema

# Examples only
pnpm sync:examples
```

## Troubleshooting

### Package Not Found

```bash
# Ensure package is installed
pnpm install
pnpm list @bluefly/openstandardagents
```

### Sync Fails

```bash
# Run with verbose output
pnpm sync:spec --verbose

# Check package location
ls -la node_modules/@bluefly/openstandardagents/

# Clean and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm sync:spec
```

### Outdated Content

```bash
# Clear synced files
rm -rf website/public/schema website/public/examples

# Re-sync
pnpm sync:spec
```

## API Endpoints

After sync, these paths are available:

### Schema Endpoints

- `/schema/latest.json` - Latest schema version
- `/schema/index.json` - List of all versions
- `/schema/v0.2.6/ossa-0.2.6.schema.json` - Specific version

### Examples Endpoints

- `/examples/index.json` - Examples catalog
- `/examples/agent-manifests/basic-agent.json` - Specific example
- `/examples/[category]/[file]` - Any example file

## Best Practices

1. **Always sync before build**: Included in `build` script
2. **Don't commit synced files**: Already in `.gitignore`
3. **Pin package versions**: Use exact versions in production
4. **Test locally first**: Run `pnpm sync:spec --dry-run`
5. **Monitor package updates**: Use Renovate/Dependabot

## Environment Variables

```bash
# .env.local (optional)
NEXT_PUBLIC_OSSA_VERSION=0.2.6
NEXT_PUBLIC_SCHEMA_URL=/schema/latest.json
```

## Performance

- **Sync time**: ~500ms (depends on package size)
- **Build time**: No impact (runs before build)
- **Deploy time**: +30s (one-time sync)
- **Runtime**: Zero overhead (static files)

## Monitoring

```bash
# Check synced files
ls -lh website/public/schema/
ls -lh website/public/examples/

# Check package version
pnpm list @bluefly/openstandardagents

# Verify sync integrity
diff -r node_modules/@bluefly/openstandardagents/spec website/public/schema
```

## Next Steps

1. ✅ Sync mechanism implemented
2. ⬜ Add schema viewer component
3. ⬜ Add examples browser component
4. ⬜ Add API documentation generator
5. ⬜ Add schema diff viewer
6. ⬜ Add automatic update PR workflow

## Related Files

- [`scripts/sync-spec.ts`](scripts/sync-spec.ts) - Sync script
- [`SYNC_ARCHITECTURE.md`](SYNC_ARCHITECTURE.md) - Full architecture
- [`.gitlab-ci.yml`](.gitlab-ci.yml) - CI configuration
- [`website/package.json`](website/package.json) - Package config

## Support

- **Issues**: https://gitlab.com/blueflyio/openstandardagents.org/-/issues
- **OSSA Spec**: https://openstandardagents.org
- **Package**: https://www.npmjs.com/package/@bluefly/openstandardagents

---

**Last Updated**: 2024-11-30
