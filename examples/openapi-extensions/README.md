# OSSA OpenAPI Extensions Examples

This directory contains example OpenAPI 3.1 specifications demonstrating OSSA extensions for AI agents.

## Examples

### minimal-agent-api.openapi.yml

**Purpose**: Minimal example showing basic OSSA extensions

**Features Demonstrated**:
- Root-level `x-ossa-metadata` extension
- Root-level `x-ossa` extension with agent identification
- Operation-level `x-ossa-capability` extension
- Operation-level `x-ossa-autonomy` extension
- Operation-level `x-ossa-llm` extension

**Use Case**: Simple greeting agent that demonstrates the basics of OSSA extensions without complexity.

### worker-agent-api.openapi.yml

**Purpose**: Complete worker agent API showing all OSSA extensions

**Features Demonstrated**:
- Full `x-ossa-metadata` with governance and compliance
- Complete `x-ossa` and `x-agent` root extensions
- All operation-level extensions (capability, autonomy, constraints, tools, llm)
- Parameter extensions (`X-OSSA-Agent-ID`, `X-OSSA-Version`)
- Schema extensions (`x-ossa-capability-schema`)
- Real-world example: Kubernetes troubleshooting agent

**Use Case**: Production-ready worker agent that diagnoses Kubernetes pod issues using MCP tools.

### orchestrator-agent-api.openapi.yml

**Purpose**: Multi-agent orchestration example

**Features Demonstrated**:
- Orchestrator agent type
- Multi-agent coordination capabilities
- Complex workflow execution with task delegation
- Higher-level constraints for orchestrator operations
- Multiple MCP tool integrations (agent-router, agent-mesh, workflow-engine)

**Use Case**: Orchestrator that coordinates multiple worker agents to execute complex workflows.

## Running Examples

### Validate Examples

```bash
# Validate a specific example
ossa validate --openapi examples/openapi-extensions/minimal-agent-api.openapi.yml

# Validate all examples
find examples/openapi-extensions -name "*.openapi.yml" -exec ossa validate --openapi {} \;
```

### Using with OpenAPI Tools

All examples are valid OpenAPI 3.1 specs and work with standard OpenAPI tools:

```bash
# Generate documentation with Redoc
npx @redocly/cli build-docs examples/openapi-extensions/worker-agent-api.openapi.yml

# Generate client with openapi-generator
npx @openapitools/openapi-generator-cli generate \
  -i examples/openapi-extensions/worker-agent-api.openapi.yml \
  -g typescript-axios \
  -o ./generated-client
```

### Viewing Examples

Use any OpenAPI viewer:
- [Swagger Editor](https://editor.swagger.io/) - Paste YAML content
- [Swagger UI](https://swagger.io/tools/swagger-ui/) - Host locally
- [Stoplight Studio](https://stoplight.io/studio) - Desktop app

## Documentation

For complete documentation on OSSA OpenAPI extensions, see:
- [OpenAPI Extensions Documentation](../../docs/openapi-extensions.md)
- [OSSA Specification](../../spec/v0.2.2/OSSA-SPECIFICATION-v0.2.2.md)
- [GitHub Repository](https://github.com/blueflyio/openstandardagents)

