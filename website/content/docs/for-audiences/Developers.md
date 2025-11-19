---
title: "Developers"
---

# For Developers

Build OSSA-compliant agents using your preferred framework and deploy anywhere.

## Quick Start

### 1. Install OSSA CLI

```bash
npm install -g @bluefly/openstandardagents
```

### 2. Generate Your First Agent

```bash
ossa generate chat --name "My Agent" --output agent.ossa.yaml
```

### 3. Validate

```bash
ossa validate agent.ossa.yaml
```

### 4. Deploy

Use your preferred deployment method - OSSA doesn't care!

## Development Workflow

### Build with Your Framework

OSSA is framework-agnostic. Build agents with:

- **LangChain** - Python-based agent framework
- **Anthropic SDK** - TypeScript/Python SDK
- **Custom Code** - Your own implementation
- **Any Framework** - OSSA works with all

### Validate with OSSA

Once built, validate against OSSA:

```bash
ossa validate my-agent.ossa.yaml
```

### Deploy Anywhere

Deploy to:
- Kubernetes
- Docker
- Serverless (AWS Lambda, Google Cloud Functions)
- On-premise
- Your infrastructure

## Migration from Existing Frameworks

### LangChain → OSSA

See: [Migration Guide: LangChain](../Examples/Migration-Guides/from-langchain-to-ossa)

### Anthropic SDK → OSSA

Coming soon: Anthropic SDK migration guide

### Custom Framework → OSSA

1. Map your agent structure to OSSA format
2. Define tools/capabilities
3. Configure LLM settings
4. Add observability
5. Validate

## API Reference

### CLI Commands

```bash
# Validate agent
ossa validate <path> [--schema <version>] [--verbose]

# Generate agent
ossa generate <type> [--name <name>] [--output <file>]

# Migrate agent
ossa migrate <source> [--target-version <version>]
```

### Programmatic API

```typescript
import { ValidationService } from '@bluefly/openstandardagents/validation';
import { GenerationService } from '@bluefly/openstandardagents/generation';

// Validate
const validationService = new ValidationService();
const result = await validationService.validate(manifest, '0.2.2');

// Generate
const generationService = new GenerationService();
const manifest = await generationService.generate(template);
```

## Best Practices

### 1. Use Descriptive Names

```yaml
metadata:
  name: customer-support-agent  # Good
  # name: agent1  # Bad
```

### 2. Add Comprehensive Descriptions

```yaml
metadata:
  description: |
    Customer support agent that handles:
    - Product inquiries
    - Order status
    - Returns and refunds
```

### 3. Configure Constraints

```yaml
constraints:
  cost:
    maxTokensPerDay: 100000
    maxCostPerDay: 10.00
  performance:
    maxLatencySeconds: 5.0
```

### 4. Enable Observability

```yaml
observability:
  tracing:
    enabled: true
  metrics:
    enabled: true
  logging:
    level: info
```

## Common Patterns

### Pattern 1: Simple Chat Agent

```yaml
spec:
  role: You are a helpful assistant
  llm:
    provider: openai
    model: gpt-3.5-turbo
  tools: []
```

### Pattern 2: Agent with Tools

```yaml
spec:
  role: You are a research assistant
  llm:
    provider: openai
    model: gpt-4
  tools:
    - type: http
      name: web_search
      endpoint: https://api.search.com/search
```

### Pattern 3: Multi-Agent Orchestration

See: [Integration Patterns](../Examples/Integration-Patterns)

## Testing

### Validate Before Deployment

```bash
ossa validate agent.ossa.yaml --verbose
```

### Test with Examples

```bash
# Validate all examples
npm run validate:examples
```

## Troubleshooting

### Validation Errors

```bash
# Get detailed error messages
ossa validate agent.ossa.yaml --verbose
```

### Common Issues

1. **Missing required fields**: Check schema reference
2. **Invalid tool types**: Use supported types (http, function, mcp, etc.)
3. **LLM provider not supported**: Check provider enum values

## Resources

- [Getting Started](../Getting-Started/Hello-World)
- [API Reference](../Technical/CLI-Reference)
- [Migration Guides](../Examples/Migration-Guides)
- [Examples](../Examples/Getting-Started-Examples)

