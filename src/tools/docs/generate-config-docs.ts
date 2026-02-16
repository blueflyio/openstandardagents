#!/usr/bin/env tsx
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUTPUT_FILE = join(
  process.cwd(),
  'website/content/docs/configuration/index.md'
);

const doc = `# Configuration Reference

Configure OSSA CLI and runtime behavior.

## Configuration File

Create \`.ossarc.json\` or \`.ossarc.yaml\` in your project root:

\`\`\`json
{
  "registry": "https://registry.ossa.dev",
  "defaultVersion": "0.2.5-RC",
  "validation": {
    "strict": true,
    "allowUnknownFields": false
  },
  "runtime": {
    "timeout": 30000,
    "retries": 3
  }
}
\`\`\`

## Configuration Options

### registry
- **Type**: \`string\`
- **Default**: \`"https://registry.ossa.dev"\`
- **Description**: Agent registry URL

### defaultVersion
- **Type**: \`string\`
- **Default**: \`"latest"\`
- **Description**: Default OSSA schema version

### validation.strict
- **Type**: \`boolean\`
- **Default**: \`false\`
- **Description**: Enable strict validation mode

### validation.allowUnknownFields
- **Type**: \`boolean\`
- **Default**: \`true\`
- **Description**: Allow unknown fields in manifests

### runtime.timeout
- **Type**: \`number\`
- **Default**: \`30000\`
- **Description**: Execution timeout in milliseconds

### runtime.retries
- **Type**: \`number\`
- **Default**: \`3\`
- **Description**: Number of retry attempts

## Environment Variables

Override configuration with environment variables:

- \`OSSA_REGISTRY\` - Registry URL
- \`OSSA_VERSION\` - Default version
- \`OSSA_API_KEY\` - API authentication key
- \`OSSA_DEBUG\` - Enable debug logging

## Examples

### Development Configuration

\`\`\`json
{
  "registry": "http://localhost:3000",
  "validation": {
    "strict": false
  }
}
\`\`\`

### Production Configuration

\`\`\`json
{
  "registry": "https://registry.ossa.dev",
  "validation": {
    "strict": true,
    "allowUnknownFields": false
  },
  "runtime": {
    "timeout": 60000,
    "retries": 5
  }
}
\`\`\`

## Related

- [CLI Reference](../cli-reference/)
- [Environment Setup](../getting-started/installation)
`;

mkdirSync(join(process.cwd(), 'website/content/docs/configuration'), {
  recursive: true,
});
writeFileSync(OUTPUT_FILE, doc);

console.log(`✅ Generated configuration reference`);
