<!--
OSSA API Documentation
Purpose: Reference documentation for OSSA CLI and libraries
Audience: Developers using OSSA programmatically
Educational Focus: Complete API surface with examples
-->

# API Documentation

## CLI Commands

### `ossa validate`
Validate agent definitions against OSSA schema.

```bash
ossa validate <file> [options]
```

**Options:**
- `--strict` - Enable strict validation
- `--format <json|text>` - Output format
- `--schemas` - Validate custom schemas

**Examples:**
```bash
ossa validate agent.json
ossa validate agent.json --strict
ossa validate agents/*.json --format json
```

### `ossa generate`
Generate code from agent definitions.

```bash
ossa generate <type> <file> [options]
```

**Types:**
- `types` - TypeScript type definitions
- `docs` - Documentation
- `client` - API client

**Options:**
- `--output <dir>` - Output directory
- `--language <ts|py>` - Target language

**Examples:**
```bash
ossa generate types agent.json --output ./types
ossa generate docs agent.json --output ./docs
```

### `ossa migrate`
Migrate agent definitions between versions.

```bash
ossa migrate <file> --to <version> [options]
```

**Options:**
- `--to <version>` - Target version
- `--dry-run` - Preview changes
- `--recursive` - Process directories

**Examples:**
```bash
ossa migrate agent.json --to 0.2.6
ossa migrate agents/ --to 0.2.6 --recursive
```

### `ossa create`
Create agent from template.

```bash
ossa create <role> --name <name>
```

**Roles:**
- `worker` - Worker agent
- `orchestrator` - Orchestrator agent
- `critic` - Critic agent
- `analyzer` - Analyzer agent

**Examples:**
```bash
ossa create worker --name my-agent
ossa create orchestrator --name workflow-manager
```

## TypeScript API

### ValidationService

```typescript
import { ValidationService } from '@bluefly/openstandardagents/validation';

const validator = new ValidationService();
const result = await validator.validate(agentDefinition);

if (!result.valid) {
  console.error(result.errors);
}
```

### GenerationService

```typescript
import { GenerationService } from '@bluefly/openstandardagents/generation';

const generator = new GenerationService();
const types = await generator.generateTypes(agentDefinition);
```

### MigrationService

```typescript
import { MigrationService } from '@bluefly/openstandardagents/migration';

const migrator = new MigrationService();
const migrated = await migrator.migrate(agentDefinition, '0.2.6');
```

## REST API (Coming Soon)

OSSA validation and generation as a service.

---

**Next**: [Architecture](architecture.md) for system design
