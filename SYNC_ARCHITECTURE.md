# OSSA Spec & Examples Sync Architecture

## Overview

The openstandardagents.org website automatically syncs the latest OSSA schema specifications and examples from the published `@bluefly/openstandardagents` npm package. This ensures the website always displays the most current specification without manual copying.

## Architecture Decision: npm Package Dependency (Option C)

### Why npm Package Dependency?

We chose **Option C** (npm package dependency) over alternatives for several reasons:

| Option | Pros | Cons | Selected |
|--------|------|------|----------|
| **A) Git Submodule** | Version pinning, source access | Complex setup, manual updates, git overhead | ❌ |
| **B) CI Job Copy** | Simple | Requires network access, no local dev sync | ❌ |
| **C) npm Dependency** | Simple, versioned, works locally, cached by npm | Requires package publish | ✅ |
| **D) API/Webhook** | Real-time | Complex infrastructure, runtime dependency | ❌ |

**Advantages of npm dependency approach:**
- ✅ Works identically in local development and CI/CD
- ✅ Version-locked via package.json (predictable builds)
- ✅ Cached by npm/pnpm (fast, no repeated downloads)
- ✅ Simple `pnpm install` setup (no special config)
- ✅ Can pin to specific versions or use semver ranges
- ✅ Integrates with existing Node.js/pnpm workflow

## Directory Structure

```
openstandardagents.org/
├── scripts/
│   └── sync-spec.ts              # Sync orchestration script
├── website/
│   ├── package.json              # Depends on @bluefly/openstandardagents
│   ├── public/
│   │   ├── schema/               # Synced from package spec/
│   │   │   ├── v0.2.6/
│   │   │   │   └── ossa-0.2.6.schema.json
│   │   │   ├── latest.json       # Symlink to current version
│   │   │   └── index.json        # Metadata about all versions
│   │   └── examples/             # Synced from package examples/
│   │       ├── agent-manifests/
│   │       ├── bridges/
│   │       ├── drupal/
│   │       ├── kagent/
│   │       └── index.json        # Metadata about examples
│   └── src/
└── node_modules/
    └── @bluefly/openstandardagents/  # Source of truth
        ├── spec/
        └── examples/
```

## Sync Script (`scripts/sync-spec.ts`)

### Features

- **Smart Discovery**: Automatically finds `@bluefly/openstandardagents` in node_modules
- **Selective Sync**: Can sync schema only, examples only, or both
- **Dry Run Mode**: Preview changes without writing files
- **Metadata Generation**: Creates index.json files for schema and examples
- **Error Handling**: Detailed logging and error reporting
- **TypeScript**: Type-safe, maintainable code

### Usage

```bash
# Sync everything (default)
pnpm sync:spec

# Sync schema files only
pnpm sync:schema

# Sync examples only
pnpm sync:examples

# Preview changes without writing
pnpm sync:spec --dry-run --verbose
```

## Package Scripts

### Root Package (`/package.json`)

```json
{
  "scripts": {
    "sync:spec": "pnpm --filter website sync:spec",
    "sync:schema": "pnpm --filter website sync:schema",
    "sync:examples": "pnpm --filter website sync:examples"
  }
}
```

### Website Package (`/website/package.json`)

```json
{
  "scripts": {
    "build": "pnpm sync:spec && next build",
    "sync:spec": "tsx ../scripts/sync-spec.ts",
    "sync:schema": "tsx ../scripts/sync-spec.ts --schema",
    "sync:examples": "tsx ../scripts/sync-spec.ts --examples"
  },
  "dependencies": {
    "@bluefly/openstandardagents": "^0.2.7"
  }
}
```

## CI/CD Integration (GitLab CI)

### Build Stage

```yaml
build:website:
  extends: .node-setup
  stage: build
  script:
    - pnpm sync:spec          # Sync before build
    - pnpm website:build
  artifacts:
    paths:
      - website/.next
      - website/public/schema   # Include synced schema
      - website/public/examples # Include synced examples
```

### Deploy Stage (GitLab Pages)

```yaml
pages:
  extends: .node-setup
  stage: deploy
  script:
    - pnpm sync:spec          # Sync before deploy
    - cd website
    - pnpm build
    - pnpm export
    - mv out ../public
  artifacts:
    paths:
      - public                # Static site with synced content
```

## Workflow

### Local Development

```bash
# 1. Clone repository
git clone https://gitlab.com/blueflyio/openstandardagents.org.git
cd openstandardagents.org

# 2. Install dependencies (includes @bluefly/openstandardagents)
pnpm install

# 3. Sync spec and examples
pnpm sync:spec

# 4. Start dev server
pnpm website:dev

# Website now has latest schema at:
# - http://localhost:3000/schema/latest.json
# - http://localhost:3000/examples/
```

### CI/CD Pipeline

```
1. git push → GitLab CI triggered
2. pnpm install → Downloads @bluefly/openstandardagents
3. pnpm sync:spec → Copies spec + examples to public/
4. pnpm build → Builds Next.js with synced content
5. Deploy → Static site with latest OSSA spec
```

### Updating to New OSSA Version

```bash
# Option 1: Update to latest
cd website
pnpm update @bluefly/openstandardagents

# Option 2: Update to specific version
pnpm add -D @bluefly/openstandardagents@0.2.8

# Sync the new version
pnpm sync:spec

# Commit the version change
git add package.json pnpm-lock.yaml
git commit -m "chore: update OSSA to v0.2.8"
git push
```

## Generated Metadata Files

### Schema Index (`public/schema/index.json`)

```json
{
  "latest": "0.2.6",
  "versions": [
    {
      "version": "0.2.6",
      "path": "schema/v0.2.6",
      "schemas": ["ossa-0.2.6.schema.json"],
      "date": "2024-11-30T12:00:00.000Z"
    }
  ],
  "generated": "2024-11-30T12:00:00.000Z"
}
```

### Examples Index (`public/examples/index.json`)

```json
{
  "categories": [
    {
      "name": "agent-manifests",
      "description": "Complete agent manifest examples",
      "path": "examples/agent-manifests",
      "files": [
        {
          "name": "basic-agent.json",
          "path": "examples/agent-manifests/basic-agent.json",
          "size": 1234
        }
      ]
    }
  ],
  "total": 42,
  "generated": "2024-11-30T12:00:00.000Z"
}
```

## Website Integration

### Accessing Schemas in Code

```typescript
// Fetch latest schema
const schema = await fetch('/schema/latest.json').then(r => r.json());

// Fetch specific version
const schemaV026 = await fetch('/schema/v0.2.6/ossa-0.2.6.schema.json').then(r => r.json());

// List all versions
const versions = await fetch('/schema/index.json').then(r => r.json());
```

### Accessing Examples in Code

```typescript
// List all example categories
const examples = await fetch('/examples/index.json').then(r => r.json());

// Fetch specific example
const basicAgent = await fetch('/examples/agent-manifests/basic-agent.json').then(r => r.json());
```

## Benefits

1. **Automatic Updates**: Update package.json version → sync → deploy
2. **Version Consistency**: Package version === displayed spec version
3. **Local/CI Parity**: Same sync works everywhere
4. **No Manual Copying**: Zero manual file copying
5. **Git History**: Package version changes tracked in git
6. **Rollback Support**: Pin to older versions if needed
7. **Caching**: npm/pnpm caches packages (fast builds)

## Monitoring & Maintenance

### Check Current OSSA Version

```bash
# In website workspace
pnpm list @bluefly/openstandardagents

# Output:
# @bluefly/openstandardagents 0.2.7
```

### Verify Sync

```bash
# Dry run to see what would sync
pnpm sync:spec --dry-run --verbose

# Check synced files
ls -la website/public/schema/
ls -la website/public/examples/
```

### Troubleshooting

```bash
# Package not found?
pnpm install

# Sync failed?
pnpm sync:spec --verbose

# Clear and re-sync
rm -rf website/public/schema website/public/examples
pnpm sync:spec
```

## Future Enhancements

- [ ] Add GitHub Actions support (mirror GitLab CI)
- [ ] Automated PR when new OSSA version published
- [ ] Schema diff visualization (compare versions)
- [ ] Example validation against schema
- [ ] CDN cache invalidation on deploy
- [ ] RSS feed for spec updates

## Related Documentation

- [OSSA Specification](https://openstandardagents.org)
- [@bluefly/openstandardagents npm package](https://www.npmjs.com/package/@bluefly/openstandardagents)
- [GitLab Repository](https://gitlab.com/blueflyio/openstandardagents.org)

---

**Last Updated**: 2024-11-30
**Spec Version**: 0.2.6
**Sync Script Version**: 1.0.0
