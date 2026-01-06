# Capability Development Guide

Learn how to develop and expose agent capabilities for discovery and composition.

## What are Capabilities?

Capabilities are discrete functions that agents can perform, such as:

- `text-generation` - Generate human-like text
- `text-extraction` - Extract text from documents
- `entity-recognition` - Identify entities in text
- `translation` - Translate between languages
- `sentiment-analysis` - Analyze sentiment

## Defining Capabilities

### In Agent Manifest

Declare capabilities in your agent manifest:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: document-processor
  capabilities:
    - name: text-extraction
      description: Extract text from PDF and DOCX files
      input_schema:
        type: object
        properties:
          document_url: { type: string }
          format: { type: string, enum: [pdf, docx] }
      output_schema:
        type: object
        properties:
          text: { type: string }
          confidence: { type: number }

    - name: entity-recognition
      description: Extract named entities from text
      input_schema:
        type: object
        properties:
          text: { type: string }
      output_schema:
        type: object
        properties:
          entities: { type: array }
```

### Capability Schema

Each capability should define:

1. **Name** - Unique identifier
2. **Description** - What the capability does
3. **Input Schema** - Expected input format (JSON Schema)
4. **Output Schema** - Expected output format (JSON Schema)

```typescript
interface Capability {
  name: string;
  description: string;
  input_schema: JSONSchema;
  output_schema: JSONSchema;
  metadata?: {
    category?: string;
    complexity?: "simple" | "medium" | "complex";
    latency_ms?: number;
  };
}
```

## Implementing Capabilities

### MCP Tools

Use Model Context Protocol for standardized tools:

```yaml
spec:
  tools:
    - type: mcp
      server: filesystem
      capabilities:
        - read_file
        - write_file
```

### Custom Functions

Define custom function capabilities:

```yaml
spec:
  tools:
    - type: function
      name: extract_entities
      capabilities:
        - name: entity-recognition
          description: Extract named entities
          input_schema:
            type: object
            properties:
              text: { type: string }
          runtime:
            language: typescript
            entry: ./functions/extract-entities.ts
```

## Registering Capabilities

Capabilities are automatically indexed when you register an agent:

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/agents \
  -H "X-API-Key: $OSSA_API_KEY" \
  -d @agent-with-capabilities.json
```

## Discovering Capabilities

Users can discover agents by capability:

```bash
curl "https://api.llm.bluefly.io/ossa/v1/discovery/search?capability=text-extraction" \
  -H "X-API-Key: $OSSA_API_KEY"
```

List all available capabilities:

```bash
curl https://api.llm.bluefly.io/ossa/v1/discovery/capabilities \
  -H "X-API-Key: $OSSA_API_KEY"
```

## Capability Composition

Combine capabilities in workflows:

```yaml
apiVersion: ossa/v0.3.0
kind: Workflow
metadata:
  name: document-analysis-pipeline
spec:
  steps:
    - agent: document-processor
      capability: text-extraction
      inputs:
        document_url: ${workflow.inputs.document_url}

    - agent: sentiment-analyzer
      capability: sentiment-analysis
      inputs:
        text: ${steps[0].outputs.text}
```

## Best Practices

1. **Use standard names** - Follow common capability naming conventions
2. **Define schemas** - Always provide input/output schemas
3. **Document behavior** - Clear descriptions of what capability does
4. **Version capabilities** - Track capability changes with agent versions
5. **Test thoroughly** - Ensure capability works as documented

## Standard Capability Categories

### Content Creation
- `text-generation`
- `code-generation`
- `image-generation`

### Analysis
- `sentiment-analysis`
- `entity-recognition`
- `classification`

### Transformation
- `translation`
- `summarization`
- `format-conversion`

### Extraction
- `text-extraction`
- `data-extraction`
- `metadata-extraction`

## See Also

- [Agent Registry API](../openapi/agents.md)
- [Discovery API](../openapi/discovery.md)
- [Getting Started Guide](getting-started.md)
