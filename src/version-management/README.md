# OSSA Version Management

Production-grade version management for OSSA projects. Handles substitution of `{{VERSION}}` placeholders with real semantic versions before releases, and restoration of placeholders for development.

## Features

- ✅ **API-First Design** - OpenAPI 3.1 specification
- ✅ **CLI Tool** - `ossa-version` command
- ✅ **REST API** - Express server
- ✅ **Auto-Detection** - Detect version from git, package.json, etc.
- ✅ **Semantic Versioning** - Full semver support
- ✅ **Production-Ready** - Comprehensive tests, validation
- ✅ **TypeScript** - Fully typed

## Installation

```bash
npm install @ossa/version-management
```

## CLI Usage

### Substitute

Replace `{{VERSION}}` placeholders with real version:

```bash
# Basic substitution
ossa-version substitute 0.4.2

# With custom patterns
ossa-version substitute 0.4.2 \
  --paths "spec/**/*.json" "docs/**/*.md" \
  --exclude "node_modules/**"

# Dry run (preview changes)
ossa-version substitute 0.4.2 --dry-run

# Custom placeholder
ossa-version substitute 0.4.2 --placeholder "\$VERSION"
```

### Restore

Restore version placeholders after release:

```bash
# Restore specific version
ossa-version restore 0.4.2

# Restore all versions
ossa-version restore --all
```

### Detect

Auto-detect version from project sources:

```bash
# Detect from current directory
ossa-version detect

# Detect from specific directory
ossa-version detect --directory /path/to/project
```

Priority order:
1. Git tags
2. package.json
3. composer.json
4. VERSION file
5. pyproject.toml
6. Cargo.toml

### Validate

Validate semantic version format:

```bash
ossa-version validate 0.4.2
ossa-version validate v1.2.3-alpha.1
```

### Bump

Bump version according to semver rules:

```bash
# Bump patch: 0.4.2 → 0.4.3
ossa-version bump 0.4.2 patch

# Bump minor: 0.4.2 → 0.5.0
ossa-version bump 0.4.2 minor

# Bump major: 0.4.2 → 1.0.0
ossa-version bump 0.4.2 major

# Bump to prerelease: 0.4.2 → 0.4.3-alpha.0
ossa-version bump 0.4.2 prerelease --prerelease alpha
```

## Programmatic API

```typescript
import { VersionManager } from '@ossa/version-management';

const versionManager = new VersionManager();

// Substitute version
const result = await versionManager.substitute({
  version: '0.4.2',
  paths: ['**/*.md', '**/*.json'],
  exclude: ['node_modules/**'],
  dryRun: false,
});

console.log(`Replaced ${result.replacementsMade} occurrences in ${result.filesProcessed} files`);

// Restore placeholders
await versionManager.restore({
  version: '0.4.2',
});

// Detect version
const detected = await versionManager.detect();
console.log(`Detected version: ${detected.version} from ${detected.source}`);

// Validate version
const validation = versionManager.validate('0.4.2');
if (validation.valid) {
  console.log('Valid semver');
}

// Bump version
const bumped = versionManager.bump('0.4.2', 'patch');
console.log(`Bumped to ${bumped.newVersion}`);
```

## REST API

Start the API server:

```bash
npm start
```

Or programmatically:

```typescript
import app from '@ossa/version-management/api';

app.listen(3000, () => {
  console.log('API listening on port 3000');
});
```

### Endpoints

**POST /api/v1/version/substitute**

```bash
curl -X POST http://localhost:3000/api/v1/version/substitute \
  -H "Content-Type: application/json" \
  -d '{
    "version": "0.4.2",
    "paths": ["**/*.md", "**/*.json"],
    "dry_run": false
  }'
```

**POST /api/v1/version/restore**

```bash
curl -X POST http://localhost:3000/api/v1/version/restore \
  -H "Content-Type: application/json" \
  -d '{"version": "0.4.2"}'
```

**GET /api/v1/version/detect**

```bash
curl http://localhost:3000/api/v1/version/detect
```

**POST /api/v1/version/validate**

```bash
curl -X POST http://localhost:3000/api/v1/version/validate \
  -H "Content-Type: application/json" \
  -d '{"version": "0.4.2"}'
```

**POST /api/v1/version/bump**

```bash
curl -X POST http://localhost:3000/api/v1/version/bump \
  -H "Content-Type: application/json" \
  -d '{
    "version": "0.4.2",
    "bump_type": "patch"
  }'
```

## CI/CD Integration

### GitLab CI

```yaml
# .gitlab-ci.yml
release:
  stage: release
  script:
    # Auto-detect version
    - VERSION=$(ossa-version detect | grep "Detected version" | awk '{print $3}')

    # Substitute placeholders
    - ossa-version substitute $VERSION

    # Build and publish
    - npm run build
    - npm publish

    # Restore placeholders for next development cycle
    - ossa-version restore $VERSION
    - git add -A
    - git commit -m "chore: restore version placeholders [skip ci]"
    - git push
```

### GitHub Actions

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm install -g @ossa/version-management

      - name: Substitute version
        run: ossa-version substitute ${GITHUB_REF#refs/tags/}

      - name: Build
        run: npm run build

      - name: Publish
        run: npm publish

      - name: Restore placeholders
        run: |
          ossa-version restore ${GITHUB_REF#refs/tags/}
          git add -A
          git commit -m "chore: restore version placeholders [skip ci]"
          git push
```

### Pre-commit Hook

```bash
# .husky/pre-release
#!/bin/sh
VERSION=$(ossa-version detect)
ossa-version substitute $VERSION
npm run build
git add -A
```

## Configuration

Default file patterns:

```javascript
{
  paths: ['**/*.md', '**/*.json', '**/*.yaml', '**/*.yml'],
  exclude: [
    'node_modules/**',
    '.git/**',
    'vendor/**',
    'dist/**',
    'build/**',
    '**/package-lock.json',
    '**/yarn.lock',
    '**/pnpm-lock.yaml',
  ],
  placeholder: '{{VERSION}}'
}
```

## Development

```bash
# Install dependencies
npm install

# Generate TypeScript types from OpenAPI spec
npm run generate:types

# Build
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint

# Format
npm run format

# Validate (lint + test + build)
npm run validate
```

## Testing

Comprehensive test suite with 80%+ coverage:

```bash
npm test
```

Tests include:
- Version validation
- Semantic version bumping
- File substitution (with dry run)
- Placeholder restoration
- Version detection from multiple sources
- Custom placeholders
- Exclude patterns

## API Documentation

Full OpenAPI 3.1 specification available at:
`openapi/version-management/openapi.yaml`

Generate documentation:

```bash
npx @redocly/cli build-docs openapi/version-management/openapi.yaml
```

## License

Apache 2.0

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)
