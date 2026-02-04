# NPM Package Exporter

Export OSSA agent manifests as publishable npm packages with TypeScript, Express, and OpenAPI.

## Overview

The NPM Package Exporter generates complete, production-ready npm packages from OSSA manifests. Each exported package includes:

- **TypeScript Agent Class** - Type-safe agent implementation
- **Express Server** - RESTful API with `/chat` endpoint
- **OpenAPI 3.1 Spec** - Complete API documentation
- **Docker Support** - Dockerfile and docker-compose.yaml
- **Tests** - Jest test suite (optional)
- **Full Configuration** - package.json, tsconfig.json, .gitignore, etc.

## Architecture

```
src/services/export/npm/
├── npm-exporter.ts           # Main orchestrator (SOLID: Coordinates generation)
├── typescript-generator.ts   # TypeScript code generation
├── express-generator.ts      # Express server generation
├── openapi-generator.ts      # OpenAPI spec generation
└── package-json-generator.ts # package.json with LLM provider dependencies
```

**Design Principles:**
- **SOLID**: Each generator has single responsibility
- **DRY**: Reusable code templates
- **Type-Safe**: Full TypeScript support
- **Provider-Agnostic**: Supports OpenAI, Anthropic, Google AI, Bedrock, etc.

## Usage

### Basic Export

```typescript
import { NPMExporter } from '@bluefly/openstandardagents/services/export/npm';
import type { OssaAgent } from '@bluefly/openstandardagents';

const manifest: OssaAgent = {
  apiVersion: 'ossa/v0.4.1',
  kind: 'Agent',
  metadata: {
    name: 'my-agent',
    version: '1.0.0',
    description: 'My AI agent',
  },
  spec: {
    role: 'You are a helpful assistant.',
    llm: {
      provider: 'openai',
      model: 'gpt-4',
    },
  },
};

const exporter = new NPMExporter();
const result = await exporter.export(manifest);

if (result.success) {
  console.log(`Generated ${result.files.length} files`);
  // Write files to disk...
}
```

### Advanced Export

```typescript
const result = await exporter.export(manifest, {
  // Package scope
  scope: '@mycompany',

  // Include Docker files (default: true)
  includeDocker: true,

  // Include test files (default: false)
  includeTests: true,

  // Additional npm dependencies
  additionalDeps: {
    'lodash': '^4.17.21',
  },

  // Node version for Docker
  nodeVersion: '20-alpine',

  // TypeScript version
  tsVersion: '^5.3.3',
});
```

## Generated Package Structure

```
my-agent/
├── package.json              # NPM package configuration
├── tsconfig.json             # TypeScript configuration
├── README.md                 # Package documentation
├── .gitignore                # Git ignore rules
├── .npmignore                # NPM ignore rules
├── Dockerfile                # Docker image
├── docker-compose.yaml       # Docker compose configuration
├── openapi.yaml              # OpenAPI 3.1 specification
├── src/
│   ├── index.ts              # Agent class implementation
│   ├── types.ts              # TypeScript type definitions
│   ├── server.ts             # Express server
│   └── tools/                # Tool implementations (if applicable)
│       ├── index.ts
│       └── [tool-name].ts
└── tests/                    # Jest tests (optional)
    └── agent.test.ts
```

## Generated API Endpoints

Each exported package includes an Express server with:

- `POST /chat` - Send message to agent
- `POST /reset` - Reset conversation history
- `GET /history` - Get conversation history
- `GET /metadata` - Get agent metadata
- `GET /openapi` - Get OpenAPI specification
- `GET /health` - Health check

## LLM Provider Support

The exporter automatically includes the correct SDK dependencies based on `spec.llm.provider`:

| Provider | SDK | Default Model |
|----------|-----|---------------|
| `openai` | `openai` | `gpt-4` |
| `anthropic` | `@anthropic-ai/sdk` | `claude-3-5-sonnet-20241022` |
| `google-ai` | `@google/generative-ai` | `gemini-pro` |
| `bedrock` | `@aws-sdk/client-bedrock-runtime` | `anthropic.claude-3-sonnet-20240229-v1:0` |
| `azure` | `@azure/openai` | `gpt-4` |
| `mistral` | `@mistralai/mistralai` | `mistral-large-latest` |

## Using Generated Packages

### Install Dependencies

```bash
cd my-agent
npm install
```

### Build

```bash
npm run build
```

### Run Server

```bash
npm start
```

Server starts on port 3000 (configurable via `PORT` env var).

### Test API

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

### Run with Docker

```bash
docker-compose up
```

### Publish to NPM

```bash
# Login to npm
npm login

# Publish
npm publish
```

## Environment Variables

Generated packages support:

- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)
- `LLM_API_KEY` - API key for LLM provider
- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI)
- `ANTHROPIC_API_KEY` - Anthropic API key (if using Anthropic)
- `GOOGLE_API_KEY` - Google AI API key (if using Google)
- `AWS_REGION` - AWS region (if using Bedrock)
- `LOG_LEVEL` - Logging level (default: info)
- `CORS_ORIGIN` - CORS origin (default: *)

## Testing

Unit tests:
```bash
npm test -- tests/unit/export/npm/npm-exporter.test.ts
```

Integration tests:
```bash
npm test -- tests/integration/npm-export.integration.test.ts
```

Coverage (>80% target):
```bash
npm test -- tests/unit/export/npm/npm-exporter.test.ts --coverage
```

## Examples

See `examples/npm-export-example.ts` for a complete working example.

## Validation

The exporter validates:

- ✅ Required fields (metadata.name, metadata.version, spec)
- ✅ Semver version format
- ✅ NPM package naming rules
- ✅ TypeScript syntax
- ✅ OpenAPI specification
- ✅ Docker configuration

## Error Handling

```typescript
const result = await exporter.export(manifest);

if (!result.success) {
  console.error('Export failed:', result.error);
  // Handle error...
}
```

## Performance

- **Generation Time**: ~5-10ms for basic agents
- **Generation Time**: ~10-20ms for agents with tools
- **File Count**: 10-15 files (without tests), 15-20 files (with tests)

## Contributing

When modifying the exporter:

1. **Update generators** - Modify specific generator classes
2. **Add tests** - Maintain >80% coverage
3. **Validate output** - Test generated packages compile and run
4. **Update docs** - Keep this README current

## Related

- [TypeScript Generator](./typescript-generator.ts)
- [Express Generator](./express-generator.ts)
- [OpenAPI Generator](./openapi-generator.ts)
- [Package.json Generator](./package-json-generator.ts)
- [NPM Adapter](../../../adapters/npm/)

## License

Apache-2.0
