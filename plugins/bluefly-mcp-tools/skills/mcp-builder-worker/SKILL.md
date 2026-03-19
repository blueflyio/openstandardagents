---
name: mcp-build
description: "**MCP Builder Worker**: Creates and packages Model Context Protocol servers and integrations. Includes visual canvas building and component creation. - MANDATORY TRIGGERS: MCP, Model Context Protocol, mcp server, create mcp, build mcp, mcp tool, mcp resource, mcp prompt"
license: "Apache-2.0"
compatibility: "Requires Node.js, TypeScript. Environment: npm/pnpm"
allowed-tools: "Bash(npm:*) Bash(npx:*) Write Edit Read Task mcp__filesystem__*"
metadata:
  ossa_manifest: ./agent.ossa.yaml
  service_account: mcp-builder-worker
  domain: mcp
  tier: worker
  autonomy: fully_autonomous
  ossa_version: v0.3.2
---

# MCP Builder Worker

**OSSA Agent**: `mcp-builder-worker` | **Version**: 1.0.0 | **Namespace**: blueflyio

Creates Model Context Protocol (MCP) servers, tools, resources, and prompts.

## Capabilities

| Capability | Category | Description |
|------------|----------|-------------|
| `server_scaffolding` | action | Scaffold MCP server structure |
| `mcp-server-generation` | action | Generate complete servers |
| `tool_definition` | action | Define MCP tools |
| `resource_definition` | action | Define MCP resources |
| `prompt_definition` | action | Define MCP prompts |
| `schema_generation` | action | Generate JSON schemas |
| `transport_configuration` | action | Configure transports |
| `capability_negotiation` | reasoning | Handle capabilities |
| `server_packaging` | action | Package for distribution |
| `canvas-building` | action | Visual canvas building |
| `component-creation` | action | Create components |

## MCP Server Structure

```
my-mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # Entry point
│   ├── tools/
│   │   ├── index.ts
│   │   └── my-tool.ts
│   ├── resources/
│   │   ├── index.ts
│   │   └── my-resource.ts
│   └── prompts/
│       ├── index.ts
│       └── my-prompt.ts
├── schemas/
│   └── tool-input.json
└── README.md
```

## Tool Definition Template

```typescript
import { Tool } from '@modelcontextprotocol/sdk';

export const myTool: Tool = {
  name: 'my_tool',
  description: 'Description of what this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'First parameter'
      },
      param2: {
        type: 'number',
        description: 'Second parameter'
      }
    },
    required: ['param1']
  },
  async handler(input) {
    // Tool implementation
    return { result: 'success' };
  }
};
```

## Resource Definition Template

```typescript
import { Resource } from '@modelcontextprotocol/sdk';

export const myResource: Resource = {
  uri: 'resource://my-namespace/my-resource',
  name: 'My Resource',
  description: 'Description of the resource',
  mimeType: 'application/json',
  async read() {
    return {
      contents: JSON.stringify({ data: 'example' })
    };
  }
};
```

## Prompt Definition Template

```typescript
import { Prompt } from '@modelcontextprotocol/sdk';

export const myPrompt: Prompt = {
  name: 'my_prompt',
  description: 'A reusable prompt template',
  arguments: [
    {
      name: 'context',
      description: 'Context for the prompt',
      required: true
    }
  ],
  async generate(args) {
    return {
      messages: [
        {
          role: 'user',
          content: `Process this: ${args.context}`
        }
      ]
    };
  }
};
```

## Transport Configuration

```yaml
transports:
  stdio:
    enabled: true

  http:
    enabled: true
    port: 3100
    cors: true

  websocket:
    enabled: true
    port: 3101
```

## Scaffolding Commands

```bash
# Create new MCP server
npx create-mcp-server my-server

# Add tool
npx mcp add tool my-tool

# Add resource
npx mcp add resource my-resource

# Add prompt
npx mcp add prompt my-prompt

# Build and test
npm run build
npm test
```

## Examples

### Create GitLab MCP Server
```
User: Create an MCP server for GitLab operations
Agent: Creating mcp-gitlab-server...

       Tools:
       - list_projects
       - get_merge_requests
       - create_issue
       - get_pipeline_status

       Resources:
       - gitlab://projects
       - gitlab://issues

       ✓ Server created at ./mcp-gitlab-server
       ✓ 4 tools defined
       ✓ 2 resources defined

       Install: npm install
       Run: npx mcp-gitlab-server
```

### Add Tool to Existing Server
```
User: Add a code review tool to my MCP server
Agent: Adding review_code tool...

       Input schema:
       - file_path: string (required)
       - review_type: enum [security, quality, style]

       ✓ Tool added to src/tools/review-code.ts
       ✓ Schema created at schemas/review-code.json
       ✓ Registered in src/tools/index.ts
```

## Service Account

- **Account**: mcp-builder-worker
- **Group**: blueflyio
- **SDK Version**: 1.0.0
- **Transports**: stdio, http, websocket

## References

- [OSSA v0.3.2 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
