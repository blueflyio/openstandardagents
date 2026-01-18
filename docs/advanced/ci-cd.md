# OSSA Auto-Migration CI Component

**Status:** Active
**Version:** 1.0.0
**Component:** `.gitlab/ci/ossa-auto-migrate.yml`
**Owner:** OSSA Platform Team

## Overview

The OSSA Auto-Migration component provides automated GitLab CI jobs for upgrading OSSA agent manifests to the latest specification version. It includes both manual migration triggers and automatic validation of agent versions.

## Features

- **Manual Batch Migration**: Upgrade all agent manifests with a single CI job
- **Automatic Validation**: Detect outdated agents on file changes
- **Dry-Run Mode**: Preview changes before applying
- **Version Detection**: Automatically uses current version from `.version.json`
- **Flexible Search**: Configure custom agent directories
- **Artifact Generation**: JSON reports for migration results

## Components

### 1. Manual Migration Job: `ossa:migrate-batch`

**Purpose**: Batch upgrade all agent manifests to target version
**Trigger**: Manual via GitLab UI
**Stage**: `validate`

#### Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TARGET_VERSION` | (empty) | Target OSSA version. Empty = use `.version.json` current |
| `AGENT_DIR` | `./agents` | Directory to search for agent manifests |
| `DRY_RUN` | `true` | Preview mode without modifying files |

#### Artifacts

- `migration-report.json` - Detailed migration results (30 days)
- `migration-report.env` - Environment variables for downstream jobs

### 2. Automatic Validation Job: `ossa:validate-versions`

**Purpose**: Validate agent manifests are at current version
**Trigger**: Automatic on agent file changes
**Stage**: `validate`

#### Execution Rules

Runs automatically when:
- MR pipeline with changes to `.ossa.*` files or `.version.json`
- Release branch push with changes to `.ossa.*` files or `.version.json`

#### Artifacts

- `validation.log` - Validation output (7 days)

## Usage Guide

### Quick Start: Dry-Run Migration

1. Navigate to **CI/CD > Pipelines**
2. Click **Run Pipeline**
3. Find and click the **ossa:migrate-batch** job
4. Review the output to see what would change
5. No files are modified in dry-run mode

### Live Migration: Apply Changes

1. Navigate to **CI/CD > Pipelines**
2. Click **Run Pipeline**
3. Set variable: `DRY_RUN=false`
4. Click the **ossa:migrate-batch** job
5. Review the job output for results
6. Files are updated in the pipeline workspace
7. Create an MR with the changes if needed

### Custom Target Version

To migrate to a specific version:

1. Click **Run Pipeline**
2. Add variables:
   - `TARGET_VERSION=0.3.5`
   - `DRY_RUN=false`
3. Run **ossa:migrate-batch** job

### Custom Search Path

To search in specific directories:

1. Click **Run Pipeline**
2. Add variable: `AGENT_DIR=./my-agents ./custom-path`
3. Run **ossa:migrate-batch** job

### Multiple Search Paths

The default search paths are:
- `./agents`
- `./.gitlab`
- `./.ossa`
- `./examples`
- `./spec`

To override:

```yaml
variables:
  AGENT_DIR: "./agents ./custom ./another"
```

## Integration with Dev CLI

This CI component uses the `ossa-dev` CLI under the hood:

```bash
# Same command that CI runs
npx tsx src/dev-cli/src/index.ts migrate agents \
  --version "0.3.5" \
  --dry-run \
  --paths "./agents"
```

### Local Testing

Test migrations locally before running in CI:

```bash
# Dry-run
npm run build
npx tsx src/dev-cli/src/index.ts migrate agents --dry-run

# Live migration
npx tsx src/dev-cli/src/index.ts migrate agents --paths ./agents
```

## How It Works

### Version Detection

1. Reads `.version.json` from project root
2. Uses `current` field as target version
3. Falls back to specified `TARGET_VERSION` if provided

### Migration Process

1. **Find Manifests**: Searches for `.ossa.yaml`, `.ossa.yml`, `.ossa.json` files
2. **Parse**: Reads and parses each manifest
3. **Detect Version**: Extracts `apiVersion` from manifest
4. **Compare**: Checks if upgrade is needed
5. **Upgrade**: Updates `apiVersion` to target (minor version only)
6. **Validate**: Ensures manifest is still valid
7. **Write**: Saves updated manifest (unless dry-run)

### Version Format

OSSA uses **minor version** in manifests:
- Manifest: `apiVersion: ossa/v0.3` (not `v0.3.5`)
- Schema: `spec/v0.3/ossa-0.3.5.schema.json`

This allows patch updates without manifest changes.

## Output Examples

### Dry-Run Output

```
OSSA Auto-Migration
===================
Current version from .version.json: 0.3.5
Using current version from .version.json: 0.3.5

Running migration...
DRY RUN MODE - No files will be modified

Target Version: 0.3.5
Total Files: 12
✅ Upgraded: 3
⏭️  Skipped: 9
❌ Failed: 0

Detailed Results:
  ✅ ./agents/my-agent.ossa.yaml: 0.3.5 → 0.3.5
  ✅ ./examples/example-1.ossa.yaml: 0.3.2 → 0.3.5
  ✅ ./.ossa/test-agent.ossa.yaml: 0.3.4 → 0.3.5

✅ Dry run complete. Run without --dry-run to apply changes.
```

### Live Migration Output

```
OSSA Auto-Migration
===================
Current version from .version.json: 0.3.5
Using current version from .version.json: 0.3.5

Running migration...
LIVE MODE - Files will be updated

Target Version: 0.3.5
Total Files: 12
✅ Upgraded: 3
⏭️  Skipped: 9
❌ Failed: 0

Detailed Results:
  ✅ ./agents/my-agent.ossa.yaml: 0.3.5 → 0.3.5
  ✅ ./examples/example-1.ossa.yaml: 0.3.2 → 0.3.5
  ✅ ./.ossa/test-agent.ossa.yaml: 0.3.4 → 0.3.5

✅ Migration complete! 3 agent(s) upgraded to v0.3.5
```

### Validation Failure Output

```
Validating OSSA agent versions...
Current version: 0.3.5

Checking for agents needing migration...

Target Version: 0.3.5
Total Files: 5
✅ Upgraded: 2
⏭️  Skipped: 3

⚠️  Some agents need migration to version 0.3.5
Run the 'ossa:migrate-batch' job manually to upgrade agents.
```

## Troubleshooting

### Job Not Appearing

**Problem**: `ossa:migrate-batch` or `ossa:validate-versions` jobs don't appear

**Solution**:
1. Verify `.gitlab/ci/ossa-auto-migrate.yml` exists
2. Check `.gitlab-ci.yml` includes the component:
   ```yaml
   include:
     - local: .gitlab/ci/ossa-auto-migrate.yml
   ```
3. Run `glab ci lint` to validate CI config

### .version.json Not Found

**Problem**: Job fails with ".version.json not found"

**Solution**:
1. Ensure `.version.json` exists in project root
2. Verify format:
   ```json
   {
     "current": "0.3.5",
     "latest_stable": "0.3.4",
     "spec_version": "0.3.5",
     "spec_path": "spec/v0.3",
     "schema_file": "ossa-0.3.5.schema.json"
   }
   ```

### Migration Fails

**Problem**: Migration fails with validation errors

**Solution**:
1. Check artifact `migration-report.json` for details
2. Validate manifests locally:
   ```bash
   npm run validate:examples
   ```
3. Fix validation errors in source manifests
4. Re-run migration

### No Agents Found

**Problem**: Job reports "Total Files: 0"

**Solution**:
1. Verify `AGENT_DIR` variable points to correct path
2. Check agents have correct file extensions (`.ossa.yaml`, `.ossa.yml`, `.ossa.json`)
3. Ensure agents have `apiVersion: ossa/v*` and `kind: Agent`

## Best Practices

### 1. Always Dry-Run First

Run with `DRY_RUN=true` before applying changes to preview impacts.

### 2. Validate After Migration

After live migration, run validation:
```bash
npm run validate:all
```

### 3. Use Version Branches

For major upgrades, create a feature branch:
```bash
git checkout -b upgrade-ossa-v0.4
# Run migration
git add .
git commit -m "chore: upgrade OSSA agents to v0.4"
git push origin upgrade-ossa-v0.4
```

### 4. Review Changes

Always review changes before committing:
```bash
git diff
```

### 5. Test Agents

After migration, test agent functionality:
```bash
npm run test:e2e
```

## Architecture

### File Structure

```
.gitlab/
└── ci/
    └── ossa-auto-migrate.yml     # CI component
src/
├── dev-cli/
│   └── src/
│       ├── commands/
│       │   └── migrate.command.ts  # CLI command
│       └── services/
│           └── agent-migration.service.ts  # Migration logic
└── services/
    └── migration.service.ts       # Core migration service
```

### Dependencies

- `node:22-alpine` - Base Docker image
- `npm` - Package manager
- `tsx` - TypeScript executor
- `ossa-dev` CLI - Migration commands
- `.version.json` - Version configuration

### Data Flow

```
.version.json
     ↓
GitLab CI Job Variables
     ↓
ossa-dev CLI
     ↓
AgentMigrationService
     ↓
MigrationService (core)
     ↓
Updated Manifests + Report
```

## API Reference

### AgentMigrationService

**Method**: `migrateAgents(request: MigrateAgentsRequest): Promise<MigrateAgentsResponse>`

**Request Schema**:
```typescript
interface MigrateAgentsRequest {
  targetVersion?: string;
  paths?: string[];
  dryRun: boolean;
  force: boolean;
}
```

**Response Schema**:
```typescript
interface MigrateAgentsResponse {
  success: boolean;
  targetVersion: string;
  totalFiles: number;
  upgraded: number;
  skipped: number;
  failed: number;
  results: AgentUpgradeResult[];
  dryRun: boolean;
}

interface AgentUpgradeResult {
  path: string;
  success: boolean;
  oldVersion: string;
  newVersion: string;
  error?: string;
}
```

## Related Documentation

- [OSSA Specification](../OSSA-TECHNICAL-REFERENCE.md)
- [Version Management](../operations/version-management.md)
- [Agent Manifest Guide](../guides/agent-manifests.md)
- [GitLab CI Overview](../ci/multi-project-release.md)

## Support

- **Issues**: [GitLab Issues](https://gitlab.com/blueflyio/openstandardagents/-/issues)
- **Wiki**: [GitLab Wiki](https://gitlab.com/blueflyio/openstandardagents/-/wikis/home)
- **Contact**: OSSA Platform Team

## Changelog

### v1.0.0 (2026-01-18)

- Initial release
- Manual batch migration job
- Automatic version validation
- Dry-run mode
- Version detection from `.version.json`
- Artifact generation
