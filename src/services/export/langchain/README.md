# LangChain Exporter Service

Production-quality LangChain export system for OSSA manifests.

## Quick Start

```typescript
import { LangChainExporter } from './langchain-exporter.js';

const exporter = new LangChainExporter();

const result = await exporter.export(manifest, {
  includeApi: true,
  includeOpenApi: true,
  includeDocker: true,
  memoryBackend: 'redis',
});

for (const file of result.files) {
  console.log(`${file.path}: ${file.content.length} bytes`);
}
```

## Components

### LangChainExporter
Main orchestration service. Coordinates all generators and validates output.

**Generates:**
- agent.py (LangChain agent)
- tools.py (@tool functions)
- memory.py (memory backend)
- server.py (FastAPI)
- openapi.yaml (OpenAPI 3.1)
- Dockerfile
- docker-compose.yaml
- requirements.txt
- .env.example
- README.md
- test_agent.py (optional)

### ToolsGenerator
Converts OSSA tools to LangChain @tool decorated functions.

**Supports:**
- Function tools (Python functions)
- MCP tools (Model Context Protocol)
- API tools (HTTP clients)

### MemoryGenerator
Generates memory backend configurations.

**Backends:**
- buffer (in-memory)
- summary (token-aware)
- redis (persistent)
- postgres (queryable)

### ApiGenerator
Generates FastAPI REST server.

**Endpoints:**
- POST /chat
- POST /chat/stream
- GET /health
- GET /sessions
- DELETE /sessions/{id}

### OpenApiGenerator
Generates OpenAPI 3.1 specification.

**Features:**
- Complete API documentation
- Request/response schemas
- Security schemes
- OSSA metadata extension

## Testing

```bash
npm run test:unit -- langchain-exporter.test.ts
```

**Coverage:** >80%

## Examples

See: `/examples/export/langchain-export-example.ts`

## Documentation

Full documentation: `/docs/export/langchain-exporter.md`

## Architecture

**SOLID:** Each generator has single responsibility
**DRY:** Shared types, reusable templates
**API-First:** OpenAPI spec drives implementation

## Files

```
langchain/
├── langchain-exporter.ts    # Main orchestrator
├── tools-generator.ts       # @tool functions
├── memory-generator.ts      # Memory configs
├── api-generator.ts         # FastAPI server
├── openapi-generator.ts     # OpenAPI spec
└── index.ts                 # Public exports
```

## Output Structure

```
output/
├── agent.py                 # LangChain agent
├── tools.py                 # Tool functions
├── memory.py                # Memory backend
├── server.py                # FastAPI server
├── openapi.yaml             # API specification
├── requirements.txt         # Dependencies
├── Dockerfile               # Docker image
├── docker-compose.yaml      # Multi-service
├── .env.example             # Environment vars
├── README.md                # Documentation
└── test_agent.py            # Tests (optional)
```

## License

Apache 2.0
