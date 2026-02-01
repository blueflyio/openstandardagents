# MCP (Model Context Protocol) Extension

**Version**: 0.3.5
**Status**: Stable
**Framework**: [Anthropic MCP](https://modelcontextprotocol.io/)

## Overview

The MCP extension enables native integration with Anthropic's Model Context Protocol, providing standardized context sharing, resource access, and tool invocation across LLM applications.

## Features

- **MCP Server Connections**: Connect to stdio, HTTP, WebSocket, or SSE-based MCP servers
- **Resource Management**: Expose and consume MCP resources (files, databases, APIs)
- **Prompt Templates**: Define reusable prompt templates with arguments
- **Tool Integration**: Expose tools via MCP for LLM invocation
- **Sampling Support**: Enable agents to request LLM completions
- **Capability Discovery**: Dynamic capability negotiation

## Schema Reference

### MCP Server Configuration

```yaml
extensions:
  mcp:
    servers:
      - name: filesystem
        description: "Local filesystem access"
        transport:
          type: stdio
          command: npx
          args:
            - "-y"
            - "@modelcontextprotocol/server-filesystem"
            - "/path/to/allowed/files"
        version: "0.1.0"
        capabilities:
          resources:
            subscribe: true
            listChanged: true
```

### Transport Types

1. **stdio**: Local process communication
   ```yaml
   transport:
     type: stdio
     command: node
     args: ["server.js"]
   ```

2. **HTTP/WebSocket/SSE**: Network-based transport
   ```yaml
   transport:
     type: http
     url: https://mcp-server.example.com/api
     headers:
       Authorization: "Bearer ${MCP_TOKEN}"
     timeout: 30
   ```

### Resource Definition

```yaml
extensions:
  mcp:
    resources:
      - uri: "file:///workspace/README.md"
        name: "Project README"
        description: "Main project documentation"
        mimeType: "text/markdown"
        annotations:
          audience: ["user", "assistant"]
          priority: 0.9
        contents:
          - type: text
            text: "# Project Documentation..."
            mimeType: "text/markdown"
```

### Prompt Templates

```yaml
extensions:
  mcp:
    prompts:
      - name: "review-code"
        description: "Review code changes for quality and security"
        arguments:
          - name: "code"
            description: "Code to review"
            required: true
          - name: "language"
            description: "Programming language"
            required: false
        messages:
          - role: system
            content: "You are a code reviewer focused on quality and security."
          - role: user
            content: "Review this {{language}} code:\n\n{{code}}"
```

### Tool Definition

```yaml
extensions:
  mcp:
    tools:
      - name: "read_file"
        description: "Read contents of a file"
        inputSchema:
          type: object
          required: ["path"]
          properties:
            path:
              type: string
              description: "File path to read"
```

### Sampling Configuration

```yaml
extensions:
  mcp:
    sampling:
      enabled: true
      maxTokens: 4096
      temperature: 0.7
      stopSequences: ["</response>"]
      modelPreferences:
        - "claude-sonnet-4-20250514"
        - "gpt-4o"
    capabilities:
      sampling:
        enabled: true
```

## Use Cases

### 1. Filesystem MCP Server

```yaml
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: file-assistant
  version: 1.0.0
spec:
  extensions:
    mcp:
      servers:
        - name: filesystem
          description: "Access project files"
          transport:
            type: stdio
            command: npx
            args:
              - "-y"
              - "@modelcontextprotocol/server-filesystem"
              - "/workspace"
          capabilities:
            resources:
              subscribe: true
              listChanged: true
```

### 2. Database MCP Server

```yaml
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: database-assistant
  version: 1.0.0
spec:
  extensions:
    mcp:
      servers:
        - name: postgres
          description: "PostgreSQL database access"
          transport:
            type: stdio
            command: npx
            args:
              - "-y"
              - "@modelcontextprotocol/server-postgres"
          env:
            DATABASE_URL: "postgresql://user:pass@localhost:5432/db"
          capabilities:
            tools:
              listChanged: false
```

### 3. Custom MCP Resources

```yaml
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: documentation-agent
  version: 1.0.0
spec:
  extensions:
    mcp:
      resources:
        - uri: "docs://api-reference"
          name: "API Reference"
          description: "Complete API documentation"
          mimeType: "text/markdown"
          contents:
            - type: text
              text: "# API Reference\n\n..."
              mimeType: "text/markdown"
      prompts:
        - name: "explain-api"
          description: "Explain an API endpoint"
          arguments:
            - name: "endpoint"
              description: "API endpoint path"
              required: true
          messages:
            - role: system
              content: "You are an API documentation expert."
            - role: user
              content: "Explain the {{endpoint}} API endpoint"
```

## Best Practices

1. **Server Naming**: Use descriptive names that indicate the server's purpose
2. **Transport Security**: Use HTTPS/WSS for network transports and validate certificates
3. **Resource URIs**: Follow URI scheme conventions (file://, db://, http://)
4. **Error Handling**: Configure appropriate timeouts and retry policies
5. **Capabilities**: Declare capabilities accurately to enable proper protocol negotiation
6. **Environment Variables**: Use env vars for sensitive configuration (API keys, credentials)
7. **Resource Updates**: Enable `subscribe` and `listChanged` for dynamic resources

## Validation

The MCP validator checks:

- Server transport configuration is complete and valid
- Resource URIs are properly formatted
- No duplicate resource URIs or prompt/tool names
- Content types match declared MIME types
- Sampling configuration is consistent with capabilities
- Network URLs are valid and accessible

## Integration

### With ValidationService

```typescript
import { MCPValidator } from './validators/mcp.validator.js';

const mcpValidator = container.get(MCPValidator);
const result = mcpValidator.validate(manifest);
```

### With Agent Runtime

MCP servers are automatically initialized when an agent starts. Resources, prompts, and tools are registered with the MCP protocol handler.

## Related Extensions

- **Kagent**: Kubernetes-native deployment
- **A2A**: Agent-to-agent communication
- **LangChain**: LangChain integration

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP Server Examples](https://github.com/modelcontextprotocol/servers)
- [OSSA v0.3.5 Specification](../../README.md)
