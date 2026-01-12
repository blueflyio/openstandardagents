# OSSA TypeScript SDK

TypeScript SDK for Open Standard for Software Agents (OSSA) - The OpenAPI for agents.

## Installation

```bash
npm install @ossa/sdk
# or
yarn add @ossa/sdk
# or
pnpm add @ossa/sdk
```

## Quick Start

```typescript
import { ManifestService, ValidatorService, isAgent } from '@ossa/sdk';

// Load a manifest
const service = new ManifestService();
const manifest = service.load('my-agent.ossa.yaml');

console.log(`Name: ${manifest.metadata.name}`);
console.log(`Kind: ${manifest.kind}`);

// Type guards
if (isAgent(manifest)) {
  console.log(`Role: ${manifest.spec.role}`);
  console.log(`Tools: ${manifest.spec.tools?.length ?? 0}`);
}

// Validate
const validator = new ValidatorService();
const result = validator.validate(manifest);

if (result.valid) {
  console.log('✅ Manifest is valid');
} else {
  console.error('❌ Validation errors:', result.errors);
}
```

## API Reference

### ManifestService

```typescript
const service = new ManifestService();

// Load manifest from file
const manifest = service.load('agent.ossa.yaml');

// Save manifest to file
service.save(manifest, 'output.ossa.yaml');
service.save(manifest, 'output.json', 'json');

// Export to different formats
const yaml = service.export(manifest, 'yaml');
const json = service.export(manifest, 'json');
const ts = service.export(manifest, 'typescript');
```

### ValidatorService

```typescript
const validator = new ValidatorService();

// Validate manifest
const result = validator.validate(manifest);
// { valid: boolean, errors: string[], warnings: string[] }

// Validate against custom schema
const result = await validator.validateJSONSchema(manifest, '/path/to/schema.json');
```

### Type Guards

```typescript
import { isAgent, isTask, isWorkflow } from '@ossa/sdk';

if (isAgent(manifest)) {
  // manifest is AgentManifest
}

if (isTask(manifest)) {
  // manifest is TaskManifest
}

if (isWorkflow(manifest)) {
  // manifest is WorkflowManifest
}
```

### Access Tier Helpers

```typescript
import { getAccessTier, normalizeAccessTier } from '@ossa/sdk';

// Get effective access tier
const tier = getAccessTier(manifest); // 'tier_3_write_elevated'

// Normalize shorthand
normalizeAccessTier('elevated'); // 'tier_3_write_elevated'
normalizeAccessTier('read');     // 'tier_1_read'
```

## Types

All OSSA types are fully typed:

```typescript
import type {
  OSSAManifest,
  AgentManifest,
  TaskManifest,
  WorkflowManifest,
  AgentSpec,
  TaskSpec,
  WorkflowSpec,
  Tool,
  LLMConfig,
  Safety,
  Identity,
  AccessTier,
} from '@ossa/sdk';
```

## CloudEvents Integration

```typescript
import { CloudEventsEmitter } from '@ossa/sdk';

const emitter = new CloudEventsEmitter({
  source: 'my-agent',
  type: 'ossa.agent.action',
});

emitter.emit({ action: 'tool_call', tool: 'search' });
```

## W3C Baggage Tracing

```typescript
import { W3CBaggage } from '@ossa/sdk';

const baggage = new W3CBaggage();
baggage.set('agent-id', 'my-agent');
baggage.set('trace-id', '12345');

const header = baggage.toString();
// "agent-id=my-agent,trace-id=12345"
```

## License

Apache-2.0
