---
title: "Anthropic MCP to OSSA"
---

# Migration Guide: Extending Anthropic MCP with OSSA

**Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Production-Ready

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Why Extend MCP with OSSA?](#why-extend-mcp-with-ossa)
3. [Key Concepts](#key-concepts)
4. [Migration Strategy](#migration-strategy)
5. [Example 1: Simple MCP Server → OSSA Agent](#example-1-simple-mcp-server--ossa-agent)
6. [Example 2: MCP Tools → OSSA Capabilities](#example-2-mcp-tools--ossa-capabilities)
7. [Example 3: MCP Resources → OSSA Data Sources](#example-3-mcp-resources--ossa-data-sources)
8. [Integration Patterns](#integration-patterns)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide helps you **extend** your existing Anthropic Model Context Protocol (MCP) servers with the Open Standards for Scalable Agents (OSSA) specification. OSSA is not a replacement for MCP—it's a **superset** that adds:

- **Multi-protocol support** (HTTP, gRPC, WebSocket, A2A)
- **Production features** (monitoring, metrics, policies, compliance)
- **OpenAPI integration** for REST API exposure
- **Agent orchestration** capabilities
- **Kubernetes deployment** support
- **Enterprise governance** (encryption, audit, RBAC)

**Key Insight:** OSSA agents can **natively speak MCP** while also supporting other protocols. You get MCP compatibility + production-ready infrastructure.

---

## Why Extend MCP with OSSA?

### MCP Alone (Good for Claude Desktop)

| Feature | MCP Native | Notes |
|---------|-----------|-------|
| Claude Desktop Integration | ✅ | Perfect for local use |
| Stdio Transport | ✅ | Simple, local execution |
| Tools | ✅ | Function calls |
| Resources | ✅ | Data access |
| Prompts | ✅ | Template support |
| **HTTP/REST API** | ❌ | Limited to MCP protocol |
| **Kubernetes Deployment** | ❌ | No native support |
| **Monitoring/Metrics** | ❌ | Manual implementation |
| **Multi-LLM Support** | ❌ | Claude-specific |
| **Agent Orchestration** | ❌ | Single-agent only |
| **Compliance/Audit** | ❌ | No built-in support |

### MCP + OSSA (Production-Ready)

| Feature | MCP + OSSA | Notes |
|---------|-----------|-------|
| Claude Desktop Integration | ✅ | **Full backward compatibility** |
| Stdio Transport | ✅ | MCP native support |
| Tools | ✅ | Via MCP bridge |
| Resources | ✅ | Via MCP bridge |
| Prompts | ✅ | Via MCP bridge |
| **HTTP/REST API** | ✅ | OpenAPI-first design |
| **Kubernetes Deployment** | ✅ | Native YAML manifests |
| **Monitoring/Metrics** | ✅ | Prometheus, Grafana, traces |
| **Multi-LLM Support** | ✅ | OpenAI, Anthropic, etc. |
| **Agent Orchestration** | ✅ | Multi-agent coordination |
| **Compliance/Audit** | ✅ | ISO42001, SOC2, GDPR |

---

## Key Concepts

### MCP → OSSA Mapping

| MCP Concept | OSSA Equivalent | Relationship |
|-------------|----------------|--------------|
| **MCP Server** | **OSSA Agent** | Agent wraps MCP server functionality |
| **MCP Tool** | **OSSA Capability** | 1:1 mapping via bridge config |
| **MCP Resource** | **OSSA Data Source** | Exposed via integration endpoints |
| **Stdio Transport** | **MCP Bridge (stdio)** | Native MCP protocol support |
| **Tool Parameters** | **Capability Input Schema** | JSON Schema compatible |
| **Tool Response** | **Capability Output Schema** | Typed responses |
| N/A | **OpenAPI Bridge** | REST API exposure |
| N/A | **Monitoring** | Traces, metrics, logs |
| N/A | **Policies** | Compliance, encryption, audit |

### How OSSA Extends MCP

```
┌────────────────────────────────────────────────────────────┐
│                      OSSA Agent                             │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │              │  │              │  │              │    │
│  │  MCP Bridge  │  │ OpenAPI REST │  │   A2A P2P   │    │
│  │   (stdio)    │  │   (HTTP)     │  │  Protocol   │    │
│  │              │  │              │  │              │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                  │                  │            │
│         └──────────────────┼──────────────────┘            │
│                            │                               │
│                  ┌─────────▼─────────┐                    │
│                  │                    │                    │
│                  │   Core Runtime     │                    │
│                  │  (Capabilities)    │                    │
│                  │                    │                    │
│                  └─────────┬──────────┘                    │
│                            │                               │
│         ┌──────────────────┼──────────────────┐           │
│         │                  │                  │           │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐   │
│  │              │  │              │  │              │   │
│  │  Monitoring  │  │   Policies   │  │   Metrics    │   │
│  │   (Traces)   │  │   (Audit)    │  │ (Prometheus) │   │
│  │              │  │              │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Migration Strategy

### Phase 1: Assessment

1. **Inventory existing MCP servers**
   ```bash
   # List MCP servers in Claude Desktop config
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Document MCP tools and resources**
   ```bash
   # For each server, document:
   # - Tool names and signatures
   # - Resource URIs and schemas
   # - Transport type (stdio/sse)
   # - Dependencies
   ```

3. **Identify production requirements**
   ```yaml
   # Questions to answer:
   - Need HTTP API access? → OpenAPI bridge
   - Need Kubernetes deployment? → OSSA runtime config
   - Need monitoring/metrics? → OSSA monitoring
   - Need multi-agent coordination? → OSSA orchestration
   - Need compliance tracking? → OSSA policies
   ```

### Phase 2: Create OSSA Agent

```bash
# Interactive agent creation (recommended)
buildkit agents create --interactive

# Or non-interactive with MCP enabled
buildkit agents create my-agent \
  --type worker \
  --description "My MCP server as OSSA agent" \
  --mcp \
  --mcp-transport stdio \
  --openapi
```

### Phase 3: Migrate Logic

1. **Copy MCP server code** to agent's `src/` directory
2. **Map MCP tools** to OSSA capabilities in `agent.yml`
3. **Configure MCP bridge** for stdio transport
4. **Add OpenAPI spec** for HTTP access (optional)
5. **Enable monitoring** (traces, metrics, logs)

### Phase 4: Test Both Modes

```bash
# Test HTTP mode
cd .agents/my-agent
npm install && npm run build
npm start
curl http://localhost:3000/health

# Test MCP mode (stdio)
MCP_MODE=stdio npm start
# (Connect from Claude Desktop)
```

### Phase 5: Update Claude Desktop Config

```bash
# Generate updated config
buildkit mcpb claude-config

# Or manually add to claude_desktop_config.json
{
  "mcpServers": {
    "my-agent": {
      "command": "node",
      "args": ["/path/to/.agents/my-agent/dist/index.js"],
      "env": {
        "MCP_MODE": "stdio"
      }
    }
  }
}
```

---

## Example 1: Simple MCP Server → OSSA Agent

### Before: Pure MCP Server

```typescript
// simple-mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types';

const server = new Server(
  {
    name: 'simple-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'greet',
        description: 'Greet a user',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name to greet' }
          },
          required: ['name']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'greet') {
    const { name } = request.params.arguments as { name: string };
    return {
      content: [
        {
          type: 'text',
          text: `Hello, ${name}!`
        }
      ]
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

const transport = new StdioServerTransport();
server.connect(transport);
console.log('MCP server running on stdio');
```

**Usage:**
```json
// claude_desktop_config.json
{
  "mcpServers": {
    "simple-server": {
      "command": "node",
      "args": ["simple-mcp-server.js"]
    }
  }
}
```

**Limitations:**
- ❌ No HTTP API
- ❌ No monitoring
- ❌ No metrics
- ❌ No health checks
- ❌ Manual deployment
- ❌ No orchestration

---

### After: OSSA Agent with MCP Bridge

**1. Create OSSA Agent:**
```bash
buildkit agents create simple-agent \
  --type worker \
  --description "Simple greeting agent with MCP support" \
  --mcp \
  --openapi
```

**2. Agent Manifest (`agent.yml`):**
```yaml
ossaVersion: "0.2.6"
agent:
  id: simple-agent
  name: simple-agent
  version: 1.0.0
  description: Simple greeting agent with MCP support
  role: workflow
  tags:
    - greeting
    - worker
    - mcp

  runtime:
    type: local
    command: [node, dist/index.js]
    resources:
      cpu: 500m
      memory: 512Mi

  capabilities:
    - name: greet
      description: Greet a user by name
      input_schema:
        type: object
        properties:
          name:
            type: string
            description: Name to greet
        required: [name]
      output_schema:
        type: object
        properties:
          message:
            type: string

  integration:
    protocol: http
    endpoints:
      base_url: http://localhost:3000
      health: /health
      metrics: /metrics

  monitoring:
    traces: true
    metrics: true
    logs: true

  policies:
    encryption: true
    audit: true

  bridge:
    # MCP Bridge for Claude Desktop
    mcp:
      enabled: true
      server_type: stdio
      tools:
        - name: greet
          description: Greet a user by name
          capability: greet
      config:
        max_message_size: 1048576
        timeout_ms: 30000
        retry_count: 3

    # OpenAPI Bridge for REST API
    openapi:
      enabled: true
      spec_url: ./openapi.yaml
      spec_version: "3.1"
```

**3. Agent Implementation (`src/index.ts`):**
```typescript
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ========================================
// HTTP Mode (OpenAPI REST API)
// ========================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    agent: 'simple-agent',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/metrics', (req, res) => {
  // Prometheus metrics
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP simple_agent_requests_total Total requests
# TYPE simple_agent_requests_total counter
simple_agent_requests_total 42
  `.trim());
});

// Capability: greet
app.post('/capabilities/greet', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = {
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
    };

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// MCP Mode (stdio transport)
// ========================================

if (process.env.MCP_MODE === 'stdio') {
  const server = new Server(
    {
      name: 'simple-agent',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'greet',
          description: 'Greet a user by name',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name to greet'
              },
            },
            required: ['name'],
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;

    if (toolName === 'greet') {
      const { name } = request.params.arguments as { name: string };
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: `Hello, ${name}!`,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${toolName}`);
  });

  const transport = new StdioServerTransport();
  server.connect(transport);
  console.log('MCP server running on stdio');
} else {
  // HTTP mode
  app.listen(PORT, () => {
    console.log(`Agent listening on port ${PORT} (HTTP mode)`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`Metrics: http://localhost:${PORT}/metrics`);
  });
}
```

**4. OpenAPI Spec (`openapi.yaml`):**
```yaml
openapi: 3.1.0
info:
  title: simple-agent API
  version: 1.0.0
  description: Simple greeting agent with MCP support

servers:
  - url: http://localhost:3000
    description: Local development

paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: Agent is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                  agent:
                    type: string
                  version:
                    type: string
                  timestamp:
                    type: string

  /capabilities/greet:
    post:
      summary: Greet a user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  description: Name to greet
              required: [name]
      responses:
        '200':
          description: Greeting response
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                  timestamp:
                    type: string
```

**Benefits:**
- ✅ **Claude Desktop works** (MCP stdio mode)
- ✅ **HTTP API available** (curl, Postman, web apps)
- ✅ **Health checks** (`/health`)
- ✅ **Metrics** (`/metrics` for Prometheus)
- ✅ **OpenAPI spec** (auto-generated docs)
- ✅ **Monitoring ready** (traces, logs)
- ✅ **Kubernetes ready** (via OSSA runtime config)

**Usage:**

```bash
# HTTP mode
npm start
curl -X POST http://localhost:3000/capabilities/greet \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}'
# → {"message": "Hello, World!", "timestamp": "..."}

# MCP mode (Claude Desktop)
MCP_MODE=stdio npm start
# → Works in Claude Desktop as before
```

---

## Example 2: MCP Tools → OSSA Capabilities

### Before: MCP Server with Multiple Tools

```typescript
// filesystem-mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types';
import fs from 'fs/promises';

const server = new Server(
  { name: 'filesystem-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'read_file',
        description: 'Read a file from disk',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path' }
          },
          required: ['path']
        }
      },
      {
        name: 'write_file',
        description: 'Write content to a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path' },
            content: { type: 'string', description: 'File content' }
          },
          required: ['path', 'content']
        }
      },
      {
        name: 'list_directory',
        description: 'List files in a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path' }
          },
          required: ['path']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'read_file': {
      const content = await fs.readFile(args.path as string, 'utf-8');
      return {
        content: [{ type: 'text', text: content }]
      };
    }

    case 'write_file': {
      await fs.writeFile(args.path as string, args.content as string);
      return {
        content: [{ type: 'text', text: 'File written successfully' }]
      };
    }

    case 'list_directory': {
      const files = await fs.readdir(args.path as string);
      return {
        content: [{ type: 'text', text: JSON.stringify(files) }]
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
server.connect(transport);
```

---

### After: OSSA Agent with Mapped Capabilities

**Agent Manifest (`agent.yml`):**
```yaml
ossaVersion: "0.2.6"
agent:
  id: filesystem-agent
  name: filesystem-agent
  version: 1.0.0
  description: Filesystem operations agent
  role: workflow
  tags: [filesystem, io, worker]

  runtime:
    type: local
    command: [node, dist/index.js]
    resources:
      cpu: 500m
      memory: 512Mi

  capabilities:
    # Capability 1: Read File
    - name: read-file
      description: Read a file from disk
      input_schema:
        type: object
        properties:
          path:
            type: string
            description: File path to read
        required: [path]
      output_schema:
        type: object
        properties:
          content:
            type: string
          size:
            type: number

    # Capability 2: Write File
    - name: write-file
      description: Write content to a file
      input_schema:
        type: object
        properties:
          path:
            type: string
            description: File path to write
          content:
            type: string
            description: Content to write
        required: [path, content]
      output_schema:
        type: object
        properties:
          success:
            type: boolean
          bytes_written:
            type: number

    # Capability 3: List Directory
    - name: list-directory
      description: List files in a directory
      input_schema:
        type: object
        properties:
          path:
            type: string
            description: Directory path
        required: [path]
      output_schema:
        type: object
        properties:
          files:
            type: array
            items:
              type: string

  integration:
    protocol: http
    endpoints:
      base_url: http://localhost:3000
      health: /health
      metrics: /metrics

  monitoring:
    traces: true
    metrics: true
    logs: true

  policies:
    encryption: true
    audit: true
    # Filesystem access requires audit logging
    compliance: [SOC2, GDPR]

  bridge:
    mcp:
      enabled: true
      server_type: stdio
      tools:
        # Map OSSA capabilities to MCP tools
        - name: read_file
          description: Read a file from disk
          capability: read-file

        - name: write_file
          description: Write content to a file
          capability: write-file

        - name: list_directory
          description: List files in a directory
          capability: list-directory

      config:
        max_message_size: 10485760  # 10MB for large files
        timeout_ms: 60000  # 60s for large operations
        retry_count: 3

    openapi:
      enabled: true
      spec_url: ./openapi.yaml
      spec_version: "3.1"
```

**Implementation (`src/index.ts`):**
```typescript
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types';
import fs from 'fs/promises';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ========================================
// Shared Business Logic
// ========================================

class FilesystemService {
  async readFile(path: string) {
    const content = await fs.readFile(path, 'utf-8');
    const stats = await fs.stat(path);
    return {
      content,
      size: stats.size,
      modified: stats.mtime.toISOString(),
    };
  }

  async writeFile(path: string, content: string) {
    await fs.writeFile(path, content);
    const stats = await fs.stat(path);
    return {
      success: true,
      bytes_written: stats.size,
      path,
    };
  }

  async listDirectory(path: string) {
    const entries = await fs.readdir(path, { withFileTypes: true });
    return {
      files: entries.map(e => ({
        name: e.name,
        type: e.isDirectory() ? 'directory' : 'file',
      })),
      count: entries.length,
    };
  }
}

const service = new FilesystemService();

// ========================================
// HTTP Mode (OpenAPI REST API)
// ========================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    agent: 'filesystem-agent',
    version: '1.0.0',
  });
});

app.post('/capabilities/read-file', async (req, res) => {
  try {
    const { path } = req.body;
    const result = await service.readFile(path);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/capabilities/write-file', async (req, res) => {
  try {
    const { path, content } = req.body;
    const result = await service.writeFile(path, content);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/capabilities/list-directory', async (req, res) => {
  try {
    const { path } = req.body;
    const result = await service.listDirectory(path);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// MCP Mode (stdio transport)
// ========================================

if (process.env.MCP_MODE === 'stdio') {
  const server = new Server(
    { name: 'filesystem-agent', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'read_file',
          description: 'Read a file from disk',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path' },
            },
            required: ['path'],
          },
        },
        {
          name: 'write_file',
          description: 'Write content to a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path' },
              content: { type: 'string', description: 'Content' },
            },
            required: ['path', 'content'],
          },
        },
        {
          name: 'list_directory',
          description: 'List files in a directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Directory path' },
            },
            required: ['path'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result;

      switch (name) {
        case 'read_file':
          result = await service.readFile(args.path as string);
          break;

        case 'write_file':
          result = await service.writeFile(
            args.path as string,
            args.content as string
          );
          break;

        case 'list_directory':
          result = await service.listDirectory(args.path as string);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: error.message }),
          },
        ],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  server.connect(transport);
  console.log('MCP server running on stdio');
} else {
  app.listen(PORT, () => {
    console.log(`Filesystem agent listening on port ${PORT}`);
  });
}
```

**Key Benefits:**
- ✅ **Single codebase** serves both MCP and HTTP
- ✅ **Shared business logic** (FilesystemService)
- ✅ **OpenAPI docs** auto-generated from schema
- ✅ **Audit logging** enabled for compliance
- ✅ **Metrics tracking** for filesystem operations
- ✅ **Error handling** consistent across protocols

---

## Example 3: MCP Resources → OSSA Data Sources

### Before: MCP Server with Resources

```typescript
// database-mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types';

const server = new Server(
  { name: 'database-server', version: '1.0.0' },
  { capabilities: { resources: {} } }
);

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'db://users',
        name: 'Users Table',
        description: 'All users in the database',
        mimeType: 'application/json'
      },
      {
        uri: 'db://posts',
        name: 'Posts Table',
        description: 'All blog posts',
        mimeType: 'application/json'
      }
    ]
  };
});

// Read a specific resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === 'db://users') {
    const users = await fetchUsers(); // Mock DB query
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(users)
        }
      ]
    };
  }

  if (uri === 'db://posts') {
    const posts = await fetchPosts(); // Mock DB query
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(posts)
        }
      ]
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

const transport = new StdioServerTransport();
server.connect(transport);
```

---

### After: OSSA Agent with Data Source Integration

**Agent Manifest (`agent.yml`):**
```yaml
ossaVersion: "0.2.6"
agent:
  id: database-agent
  name: database-agent
  version: 1.0.0
  description: Database access agent with MCP resources
  role: workflow
  tags: [database, data-source, worker]

  runtime:
    type: local
    command: [node, dist/index.js]
    environment:
      DATABASE_URL: postgresql://localhost:5432/mydb
    resources:
      cpu: 1000m
      memory: 1Gi

  capabilities:
    - name: query-users
      description: Query users table
      input_schema:
        type: object
        properties:
          filter:
            type: object
          limit:
            type: number
            default: 100
      output_schema:
        type: object
        properties:
          users:
            type: array
            items:
              type: object

    - name: query-posts
      description: Query posts table
      input_schema:
        type: object
        properties:
          author_id:
            type: string
          limit:
            type: number
            default: 50
      output_schema:
        type: object
        properties:
          posts:
            type: array
            items:
              type: object

  integration:
    protocol: http
    endpoints:
      base_url: http://localhost:3000
      health: /health
      metrics: /metrics
      # Data source endpoints
      data_sources:
        - uri: /data/users
          description: Users table resource
        - uri: /data/posts
          description: Posts table resource

  monitoring:
    traces: true
    metrics: true
    logs: true
    alerts:
      - name: slow_query
        condition: query_duration_ms > 1000
        severity: warning

  policies:
    encryption: true
    audit: true
    compliance: [SOC2, GDPR, HIPAA]
    # Database access requires strict compliance
    data_retention_days: 90
    rate_limits:
      - endpoint: /data/*
        max_requests_per_minute: 100

  bridge:
    mcp:
      enabled: true
      server_type: stdio
      # Map resources to OSSA capabilities
      resources:
        - uri: db://users
          name: Users Table
          description: All users in the database
          capability: query-users

        - uri: db://posts
          name: Posts Table
          description: All blog posts
          capability: query-posts

      config:
        max_message_size: 10485760  # 10MB for large datasets
        timeout_ms: 30000
        retry_count: 3

    openapi:
      enabled: true
      spec_url: ./openapi.yaml
      spec_version: "3.1"
```

**Implementation (`src/index.ts`):**
```typescript
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ========================================
// Database Service (Shared Logic)
// ========================================

class DatabaseService {
  async queryUsers(filter?: any, limit: number = 100) {
    // Mock implementation - replace with real DB query
    const users = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ];
    return {
      users: users.slice(0, limit),
      count: users.length,
      timestamp: new Date().toISOString(),
    };
  }

  async queryPosts(authorId?: string, limit: number = 50) {
    // Mock implementation - replace with real DB query
    const posts = [
      { id: 1, title: 'Hello World', author_id: '1' },
      { id: 2, title: 'OSSA Guide', author_id: '1' },
    ];
    return {
      posts: posts.slice(0, limit),
      count: posts.length,
      timestamp: new Date().toISOString(),
    };
  }
}

const db = new DatabaseService();

// ========================================
// HTTP Mode (OpenAPI REST API)
// ========================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    agent: 'database-agent',
    version: '1.0.0',
    database: 'connected',
  });
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP db_queries_total Total database queries
# TYPE db_queries_total counter
db_queries_total{table="users"} 1234
db_queries_total{table="posts"} 567
  `.trim());
});

// Data source endpoints (RESTful resources)
app.get('/data/users', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const result = await db.queryUsers({}, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/data/posts', async (req, res) => {
  try {
    const authorId = req.query.author_id as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await db.queryPosts(authorId, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Capability endpoints
app.post('/capabilities/query-users', async (req, res) => {
  try {
    const { filter, limit } = req.body;
    const result = await db.queryUsers(filter, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/capabilities/query-posts', async (req, res) => {
  try {
    const { author_id, limit } = req.body;
    const result = await db.queryPosts(author_id, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// MCP Mode (stdio transport)
// ========================================

if (process.env.MCP_MODE === 'stdio') {
  const server = new Server(
    { name: 'database-agent', version: '1.0.0' },
    { capabilities: { resources: {} } }
  );

  // List resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'db://users',
          name: 'Users Table',
          description: 'All users in the database',
          mimeType: 'application/json',
        },
        {
          uri: 'db://posts',
          name: 'Posts Table',
          description: 'All blog posts',
          mimeType: 'application/json',
        },
      ],
    };
  });

  // Read resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    try {
      let data;

      if (uri === 'db://users') {
        data = await db.queryUsers();
      } else if (uri === 'db://posts') {
        data = await db.queryPosts();
      } else {
        throw new Error(`Unknown resource: ${uri}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`Failed to read resource ${uri}: ${error.message}`);
    }
  });

  const transport = new StdioServerTransport();
  server.connect(transport);
  console.log('MCP server running on stdio');
} else {
  app.listen(PORT, () => {
    console.log(`Database agent listening on port ${PORT}`);
  });
}
```

**Key Benefits:**
- ✅ **MCP resources** mapped to REST endpoints
- ✅ **Data source discovery** via OpenAPI
- ✅ **Query metrics** tracked (Prometheus)
- ✅ **Rate limiting** for data access
- ✅ **Compliance tracking** (GDPR, HIPAA)
- ✅ **Audit logs** for all queries

---

## Integration Patterns

### Pattern 1: Hybrid Access (MCP + HTTP)

**Use Case:** Tool accessible from both Claude Desktop and web applications.

```yaml
# agent.yml
bridge:
  mcp:
    enabled: true
    server_type: stdio
  openapi:
    enabled: true
    spec_url: ./openapi.yaml
```

**Benefits:**
- Claude Desktop users get native MCP experience
- Web apps can use REST API
- Single agent, dual protocols

---

### Pattern 2: Agent Orchestration

**Use Case:** OSSA orchestrator coordinates multiple MCP agents.

```yaml
# orchestrator-agent.yml
ossaVersion: "0.2.6"
agent:
  id: orchestrator
  role: orchestration

  capabilities:
    - name: coordinate-workflow
      description: Orchestrate multiple agents
      input_schema:
        type: object
        properties:
          agents:
            type: array
            items:
              type: string

  bridge:
    # Orchestrator doesn't need MCP
    # It coordinates other agents via OSSA A2A protocol
    a2a:
      enabled: true
      discovery:
        mode: registry
        registry_url: http://localhost:8080
```

**Workflow:**
1. Orchestrator receives task via HTTP
2. Discovers available agents (some MCP-enabled)
3. Coordinates execution via A2A protocol
4. Aggregates results

---

### Pattern 3: MCP Server Gateway

**Use Case:** Single OSSA agent exposes multiple MCP servers.

```yaml
# gateway-agent.yml
ossaVersion: "0.2.6"
agent:
  id: mcp-gateway
  role: workflow

  capabilities:
    - name: route-to-mcp
      description: Route requests to appropriate MCP server
      input_schema:
        type: object
        properties:
          server:
            type: string
            enum: [filesystem, database, git]
          operation:
            type: string

  bridge:
    mcp:
      enabled: true
      server_type: stdio
      # Multiple MCP backends
      upstreams:
        - name: filesystem
          command: [node, mcp-filesystem.js]
        - name: database
          command: [node, mcp-database.js]
        - name: git
          command: [node, mcp-git.js]
```

---

## Best Practices

### 1. **Keep MCP Code Portable**

```typescript
// ✅ GOOD: Shared service layer
class FilesystemService {
  async readFile(path: string) {
    // Business logic here
  }
}

// Use in both HTTP and MCP modes
const service = new FilesystemService();
```

### 2. **Use Environment Variables for Mode Selection**

```typescript
// ✅ GOOD: Single entry point, mode-aware
if (process.env.MCP_MODE === 'stdio') {
  startMcpServer();
} else {
  startHttpServer();
}
```

### 3. **Map Tool Names Consistently**

```yaml
# agent.yml
capabilities:
  - name: read-file  # Kebab-case in OSSA

bridge:
  mcp:
    tools:
      - name: read_file  # Snake_case in MCP
        capability: read-file  # Maps to OSSA
```

### 4. **Enable Monitoring**

```yaml
monitoring:
  traces: true  # OpenTelemetry traces
  metrics: true  # Prometheus metrics
  logs: true  # Structured logging
```

### 5. **Document Both Protocols**

```yaml
metadata:
  documentation_url: https://docs.example.com/agent
  # Include both MCP and OpenAPI docs
```

### 6. **Use JSON Schema for Validation**

```yaml
capabilities:
  - name: greet
    input_schema:
      type: object
      properties:
        name:
          type: string
          minLength: 1
      required: [name]
```

### 7. **Test Both Modes**

```bash
# Test HTTP mode
npm start
curl http://localhost:3000/health

# Test MCP mode
MCP_MODE=stdio npm start
# Connect from Claude Desktop
```

---

## Troubleshooting

### Issue: MCP tools not showing in Claude Desktop

**Solution:**
1. Verify `bridge.mcp.enabled: true` in `agent.yml`
2. Check `server_type: stdio`
3. Ensure `MCP_MODE=stdio` environment variable
4. Restart Claude Desktop
5. Check logs: `~/Library/Logs/Claude/`

```bash
# Debug
MCP_MODE=stdio node dist/index.js
# Should output: "MCP server running on stdio"
```

---

### Issue: HTTP endpoints return 404

**Solution:**
1. Verify agent is running in HTTP mode (not stdio)
2. Check `integration.endpoints.base_url` in `agent.yml`
3. Ensure Express routes match capability names

```bash
# Start in HTTP mode
npm start  # (no MCP_MODE env var)

# Test
curl http://localhost:3000/health
```

---

### Issue: Tools work in HTTP but not MCP

**Solution:**
1. Check tool name mapping (snake_case in MCP)
2. Verify `CallToolRequestSchema` handler
3. Ensure JSON response format:

```typescript
return {
  content: [
    {
      type: 'text',
      text: JSON.stringify(result)  // Must be stringified
    }
  ]
};
```

---

### Issue: Large payloads fail in MCP mode

**Solution:**
Increase `max_message_size` in bridge config:

```yaml
bridge:
  mcp:
    config:
      max_message_size: 10485760  # 10MB (default: 1MB)
```

---

### Issue: Metrics not showing in Prometheus

**Solution:**
1. Ensure `/metrics` endpoint exists
2. Use `text/plain` content type
3. Follow Prometheus format:

```typescript
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP my_metric_total Total count
# TYPE my_metric_total counter
my_metric_total 123
  `.trim());
});
```

---

## Summary

| Aspect | MCP Alone | MCP + OSSA |
|--------|-----------|-----------|
| **Claude Desktop** | ✅ Native | ✅ Native (via bridge) |
| **HTTP API** | ❌ Manual | ✅ Auto-generated |
| **Monitoring** | ❌ Manual | ✅ Built-in |
| **Orchestration** | ❌ N/A | ✅ Multi-agent |
| **Compliance** | ❌ Manual | ✅ Policy-driven |
| **Kubernetes** | ❌ Manual | ✅ Native support |
| **OpenAPI Docs** | ❌ N/A | ✅ Auto-generated |
| **Metrics** | ❌ Manual | ✅ Prometheus-ready |

**Next Steps:**

1. **Assess** your existing MCP servers
2. **Create** OSSA agents with MCP bridges
3. **Migrate** business logic to shared services
4. **Test** both MCP (stdio) and HTTP modes
5. **Deploy** with monitoring enabled
6. **Monitor** metrics and traces
7. **Scale** with Kubernetes (optional)

---

**Resources:**

- **OSSA Specification:** [Schema Reference](../schema-reference/index)
- **MCP Protocol:** https://modelcontextprotocol.io
- **BuildKit Commands:** `buildkit agents --help`
- **Agent BuildKit:** https://gitlab.com/blueflyio/agent-platform/agent-buildkit

---

**Version:** 1.0
**Maintained By:** Agent BuildKit Team
**License:** MIT
