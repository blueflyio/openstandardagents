# OSSA Validator

**@ossa/validator** - CLI tool for validating OSSA agent manifests and workflows

## Installation

```bash
npm install -g @ossa/validator
```

## Usage

### Validate Agent Manifest

```bash
# Validate a single agent manifest
ossa-validate agent .agents/my-agent/agent.yml

# Check conformance level
ossa-validate conformance .agents/my-agent/agent.yml

# Check if agent meets specific conformance level
ossa-validate conformance .agents/my-agent/agent.yml --level silver
```

### Validate Workflow

```bash
# Validate workflow specification
ossa-validate workflow workflows/my-workflow.yml
```

### Output Formats

```bash
# Table format (default)
ossa-validate agent agent.yml

# JSON format
ossa-validate agent agent.yml --format json
```

## Conformance Levels

The validator checks against OSSA conformance levels:

- **Bronze**: Basic agent with manifest, health, and discovery endpoints
- **Silver**: Adds authentication and authorization
- **Gold**: Includes audit logging and performance metrics
- **Advanced**: Full feedback loop and multi-agent coordination

## Exit Codes

- `0`: Validation passed
- `1`: Validation failed or errors occurred

## Examples

### Valid Agent Manifest

```yaml
apiVersion: "@bluefly/ossa/v0.1.9"
kind: Agent
metadata:
  name: my-worker-agent
  version: "1.0.0"
  description: "Example worker agent"
spec:
  type: worker
  capabilities:
    - name: process_data
      type: processor
      description: "Processes incoming data"
  configuration:
    openapi: "/openapi.json"
    baseUrl: "http://localhost:3000"
  discovery:
    endpoint: "/capabilities"
  health:
    endpoint: "/health"
```

### Validation Output

```bash
$ ossa-validate agent .agents/worker/agent.yml

✓ Validation passed
Conformance Level: bronze
Score: 67/100
```

### Failed Validation

```bash
$ ossa-validate agent invalid-agent.yml

✗ Validation failed

Issues found:
✗ /specs/type: must be equal to one of the allowed values
✗ /specs/capabilities: must be array
⚠ /specs/configuration/authentication: recommended for silver+ conformance
```

## Programmatic Usage

```typescript
import { OSSAValidator } from '@ossa/validator';

const validator = new OSSAValidator();

const result = validator.validateAgentManifest(manifest);

if (result.valid) {
  console.log(`Conformance: ${result.conformanceLevel}`);
  console.log(`Score: ${result.score}/100`);
} else {
  result.errors.forEach(error => {
    console.error(`${error.path}: ${error.message}`);
  });
}
```

## License

MIT License