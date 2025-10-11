# MCPB Integration Guide

## Overview

The Model Context Protocol Bridge (MCPB) enables OSSA agents to integrate with MCP-compatible systems like Claude Desktop, Langflow, and other AI assistants. This guide covers how to configure and use bridge protocols in OSSA agents.

## What is MCPB?

MCPB (Model Context Protocol Bridge) is part of OSSA's bridge configuration system that allows agents to communicate using various protocols:

- **MCP (Model Context Protocol)**: Integrate with Claude Desktop and MCP-compatible systems
- **A2A (Agent-to-Agent)**: Enable multi-agent coordination
- **OpenAPI**: Standard REST API integration
- **LangChain**: Python framework integration
- **CrewAI**: Multi-agent framework integration
- **AutoGen**: Conversational AI framework integration

## Bridge Configuration Schema

### Basic Structure

```yaml
bridge:
  mcp:
    enabled: boolean
    server_type: stdio | sse | websocket
    tools: []
    resources: []
    prompts: []
    config: {}
```

### MCP Bridge Configuration

#### Transport Types

**stdio**: Local execution, ideal for Claude Desktop
```yaml
bridge:
  mcp:
    enabled: true
    server_type: stdio
```

**sse**: Server-Sent Events for web integration
```yaml
bridge:
  mcp:
    enabled: true
    server_type: sse
```

**websocket**: Real-time bidirectional communication
```yaml
bridge:
  mcp:
    enabled: true
    server_type: websocket
```

#### MCP Tools

Tools expose agent capabilities as MCP functions:

```yaml
bridge:
  mcp:
    tools:
      - name: analyze_code
        description: "Analyze source code for issues"
        input_schema:
          type: object
          properties:
            code: { type: string }
            language: { type: string }
          required: ["code"]
        output_schema:
          type: object
          properties:
            issues: { type: array }
        capability: code-analysis  # Maps to OSSA capability
```

#### MCP Resources

Resources provide access to agent data:

```yaml
bridge:
  mcp:
    resources:
      - uri: "ossa://agents"
        name: "Agent Registry"
        description: "Access to agent registry"
        mimeType: "application/json"
        readonly: true
```

#### MCP Prompts

Prompts define reusable templates:

```yaml
bridge:
  mcp:
    prompts:
      - name: review_code
        description: "Review code changes"
        template: "Review the following {{language}} code:\n{{code}}"
        arguments:
          - name: language
            type: string
            required: true
          - name: code
            type: string
            required: true
```

#### Advanced Configuration

```yaml
bridge:
  mcp:
    config:
      max_message_size: 1048576  # 1MB
      timeout_ms: 30000          # 30 seconds
      retry_count: 3
```

## TypeScript Integration

### Creating an MCP-Enabled Agent

```typescript
import type { CreateAgentRequest } from '@ossa/types';

const agent: CreateAgentRequest = {
  type: 'worker',
  name: 'Code Analysis Agent',
  capabilities: ['code-analysis'],
  bridge: {
    mcp: {
      enabled: true,
      server_type: 'stdio',
      tools: [
        {
          name: 'analyze_code',
          description: 'Analyze source code',
          capability: 'code-analysis'
        }
      ]
    }
  }
};
```

### Bridge Manager Utility

```typescript
class AgentBridgeManager {
  constructor(private agent: Agent) {}

  isMCPEnabled(): boolean {
    return this.agent.bridge?.mcp?.enabled ?? false;
  }

  getMCPTools(): MCPTool[] {
    return this.agent.bridge?.mcp?.tools ?? [];
  }

  getSupportedBridges(): string[] {
    const bridges: string[] = [];
    if (this.agent.bridge?.mcp?.enabled) bridges.push('mcp');
    if (this.agent.bridge?.openapi?.enabled) bridges.push('openapi');
    // ... etc
    return bridges;
  }
}
```

## Multi-Bridge Agents

OSSA agents can support multiple bridge protocols simultaneously:

```yaml
bridge:
  mcp:
    enabled: true
    server_type: websocket
  openapi:
    enabled: true
    spec_url: "https://api.example.com/openapi.json"
  langchain:
    enabled: true
    chain_type: agent
```

This enables:
- MCP integration for Claude Desktop
- REST API access via OpenAPI
- LangChain framework integration

## Use Cases

### 1. Claude Desktop Integration

Configure agent for Claude Desktop:

```yaml
bridge:
  mcp:
    enabled: true
    server_type: stdio
    tools:
      - name: search_docs
        description: "Search documentation"
```

### 2. Web Application Integration

Use SSE transport for web apps:

```yaml
bridge:
  mcp:
    enabled: true
    server_type: sse
    config:
      max_message_size: 5242880  # 5MB
```

### 3. Production Deployment

Use WebSocket for production:

```yaml
bridge:
  mcp:
    enabled: true
    server_type: websocket
    config:
      timeout_ms: 60000
      retry_count: 5
```

## Other Bridge Protocols

### OpenAPI Bridge

```yaml
bridge:
  openapi:
    enabled: true
    spec_url: "https://api.example.com/openapi.json"
    spec_version: "3.1"
    auto_generate: false
```

### LangChain Bridge

```yaml
bridge:
  langchain:
    enabled: true
    tool_class: "OSSAAgent"
    chain_type: agent
    memory:
      type: conversation
      max_tokens: 4096
```

### CrewAI Bridge

```yaml
bridge:
  crewai:
    enabled: true
    agent_type: researcher
    role: "Senior Research Analyst"
    goal: "Conduct thorough research"
    allow_delegation: true
```

### AutoGen Bridge

```yaml
bridge:
  autogen:
    enabled: true
    agent_type: assistant
    system_message: "You are a helpful AI assistant"
    human_input_mode: TERMINATE
```

## Best Practices

1. **Map MCP tools to OSSA capabilities** for consistency
   ```yaml
   tools:
     - name: analyze_code
       capability: code-analysis  # Must match agent capability
   ```

2. **Use stdio for local/desktop** integration
3. **Use websocket for production** deployments
4. **Set appropriate timeouts** based on operation complexity
5. **Enable multiple bridges** for maximum interoperability
6. **Document all tools** with clear descriptions and schemas
7. **Make resources readonly** when appropriate for safety

## Testing

Run the MCPB integration tests:

```bash
npm test -- tests/agent-schema/mcpb-integration.test.ts
```

## Examples

See comprehensive examples:
- [Bridge Configurations (YAML)](../../examples/bridge-configurations.yaml)
- [TypeScript Implementation](../../examples/typescript/mcpb-agent-example.ts)

## Related Documentation

- [OSSA Specification](../../spec/ossa-1.0.yaml)
- [Agent Types](../reference/agent-specification.md)
- [MCP Server Implementation](../../src/mcp/ossa-mcp-server.ts)

## Migration Guide

### Adding MCPB to Existing Agents

1. Update agent type definition to include bridge:
   ```typescript
   const agent: Agent = {
     // ... existing fields
     bridge: {
       mcp: {
         enabled: true,
         server_type: 'stdio'
       }
     }
   };
   ```

2. Map existing capabilities to MCP tools:
   ```yaml
   capabilities:
     - name: analyze_code

   bridge:
     mcp:
       tools:
         - name: analyze_code
           capability: analyze_code
   ```

3. Test the integration:
   ```bash
   npm test
   ```

## Troubleshooting

### MCP Connection Issues

- **stdio not working**: Ensure agent is executable and has proper permissions
- **websocket timeout**: Increase `timeout_ms` in config
- **Message too large**: Increase `max_message_size`

### Tool Not Found

Ensure tool name matches and capability is listed in agent capabilities.

### Type Errors

Import types from the correct path:
```typescript
import type { BridgeConfig, MCPBridgeConfig } from '@ossa/types';
```

## Support

For issues or questions:
- File an issue: [GitHub Issues](https://github.com/ossa-standard/specification/issues)
- Documentation: [OSSA Docs](https://docs.ossa.io)
- Community: [Discord](https://discord.gg/ossa)
