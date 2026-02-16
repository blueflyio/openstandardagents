# GitLab Duo External Agents

GitLab Duo External Agents run in GitLab CI/CD pipelines and use GitLab AI Gateway for model access. This provides secure, enterprise-grade AI capabilities while maintaining full control over agent execution.

## Overview

The `ExternalAgentGenerator` converts OSSA agent manifests into GitLab Duo external agent YAML configurations. These configurations define:

- **Docker Image**: Runtime environment for the agent
- **Commands**: Agent execution instructions
- **Variables**: Required environment variables
- **AI Gateway Integration**: Automatic token injection for model access
- **LLM Configuration**: Model provider, model name, and parameters
- **Runtime Configuration**: Webhook endpoints, ports, and paths

## Features

### 1. Multi-Runtime Support

The generator automatically detects and configures the appropriate runtime:

- **Node.js**: `node:22-slim` (for MCP tools, npm packages)
- **Python**: `python:3.12-slim` (for pip, poetry tools)
- **Go**: `golang:1.22-alpine` (for Go-based agents)
- **Ruby**: `ruby:3.3-slim` (for gem, bundler tools)
- **Custom**: User-specified Docker images

### 2. AI Gateway Integration

Agents with LLM configuration automatically get:

- `injectGatewayToken: true` - AI Gateway token injection
- LLM configuration mapping (provider, model, temperature, max_tokens)
- Secure model access through GitLab infrastructure

### 3. Variable Extraction

The generator automatically extracts required variables from:

- **Workflow Steps**: `${VARIABLE}` references in params, inputs, conditions
- **GitLab Extensions**: Custom variables defined in `extensions.gitlab.variables`
- **Tool Auth**: Credential variables from tool authentication configs
- **Standard Variables**: Always includes `GITLAB_TOKEN`, `GITLAB_HOST`, AI Flow variables

### 4. Command Generation

Commands are generated based on runtime type:

**Node.js:**
```yaml
commands:
  - npm ci
  - npm run build
  - node dist/index.js
```

**Python:**
```yaml
commands:
  - pip install --no-cache-dir -r requirements.txt
  - python main.py
```

**Go:**
```yaml
commands:
  - go build -o agent .
  - ./agent
```

**Ruby:**
```yaml
commands:
  - bundle install
  - bundle exec ruby main.rb
```

## Usage

### Basic Example

```typescript
import { ExternalAgentGenerator } from '@ossa/core';
import type { OssaAgent } from '@ossa/core';

const generator = new ExternalAgentGenerator();

const manifest: OssaAgent = {
  apiVersion: 'ossa/v0.4.4',
  kind: 'Agent',
  metadata: {
    name: 'code-reviewer',
    version: '1.0.0',
    description: 'AI-powered code review agent',
  },
  spec: {
    role: 'You are an expert code reviewer',
    llm: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      maxTokens: 8192,
    },
    runtime: {
      type: 'webhook',
      port: 9090,
      path: '/webhook/code-reviewer',
    },
    tools: [
      { name: 'getMRChanges' },
      { name: 'postMRComment' },
    ],
  },
};

const result = generator.generate(manifest);

if (result.success) {
  console.log('Configuration:', result.config);
  console.log('YAML:', result.yaml);

  // Save to file
  writeFileSync('code-reviewer.yaml', result.yaml);
}
```

### Generated YAML

```yaml
# GitLab Duo External Agent Configuration
# Agent: code-reviewer
# Generated from OSSA manifest v1.0.0

# External agents run in GitLab CI/CD pipelines and use AI Gateway
# for model access. This YAML defines the agent execution environment.

name: code-reviewer
description: AI-powered code review agent

# Docker image for agent execution
image: node:22-slim

# Commands to execute agent
commands:
  - npm ci
  - npm run build
  - node dist/index.js

# Environment variables required by agent
variables:
  - AI_FLOW_CONTEXT
  - AI_FLOW_EVENT
  - AI_FLOW_INPUT
  - GITLAB_HOST
  - GITLAB_TOKEN

# Inject AI Gateway token for model access
injectGatewayToken: true

# LLM configuration for AI Gateway
llm:
  provider: anthropic
  model: claude-sonnet-4-20250514
  temperature: 0.3
  max_tokens: 8192

# Webhook runtime configuration
runtime:
  type: webhook
  port: 9090
  path: /webhook/code-reviewer

# Usage:
# 1. Register agent: glab duo agent register external-agent.yaml
# 2. Test agent: glab duo agent test code-reviewer
# 3. Deploy agent: Agent runs in GitLab CI/CD when triggered

# Documentation:
# https://docs.gitlab.com/ee/user/gitlab_duo/external_agents.html
```

## Advanced Examples

### Python Agent with Custom Variables

```typescript
const pythonAgent: OssaAgent = {
  apiVersion: 'ossa/v0.4.4',
  kind: 'Agent',
  metadata: {
    name: 'data-analyzer',
    version: '1.0.0',
  },
  spec: {
    role: 'You are a data analysis expert',
    llm: {
      provider: 'openai',
      model: 'gpt-4o',
    },
    runtime: {
      type: 'python',
    },
    tools: [],
  },
  extensions: {
    gitlab: {
      variables: ['DATABASE_URL', 'API_KEY'],
    },
  },
};

const result = generator.generate(pythonAgent);
// Generates python:3.12-slim with pip install commands
// Includes DATABASE_URL and API_KEY in variables list
```

### Go Agent with Custom Commands

```typescript
const goAgent: OssaAgent = {
  apiVersion: 'ossa/v0.4.4',
  kind: 'Agent',
  metadata: {
    name: 'security-scanner',
    version: '1.0.0',
  },
  spec: {
    role: 'You are a security expert',
    llm: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    },
    runtime: {
      type: 'go',
      command: [
        'go mod download',
        'go build -o scanner .',
        './scanner --mode=full',
      ],
    },
    tools: [],
  },
};

const result = generator.generate(goAgent);
// Uses custom commands instead of defaults
```

### Agent with Workflow Variable Extraction

```typescript
const workflowAgent: OssaAgent = {
  apiVersion: 'ossa/v0.4.4',
  kind: 'Agent',
  metadata: {
    name: 'mr-automation',
    version: '1.0.0',
  },
  spec: {
    role: 'You automate MR workflows',
    llm: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    },
    workflow: {
      steps: [
        {
          id: 'step1',
          action: 'tool-invoke',
          tool: 'getMR',
          params: {
            projectId: '${PROJECT_ID}',
            mrIid: '${MR_IID}',
          },
        },
        {
          id: 'step2',
          action: 'llm-invoke',
          input: 'Analyze MR ${MR_IID} from ${SOURCE_BRANCH}',
        },
      ],
    },
    tools: [],
  },
};

const result = generator.generate(workflowAgent);
// Automatically extracts PROJECT_ID, MR_IID, SOURCE_BRANCH from workflow
```

## Registration and Deployment

### 1. Register External Agent

```bash
# Register agent with GitLab Duo
glab duo agent register code-reviewer.yaml

# Verify registration
glab duo agent list
```

### 2. Test Agent

```bash
# Test agent with sample input
glab duo agent test code-reviewer

# Test with custom input
glab duo agent test code-reviewer --input '{"mr_iid": 123, "project_id": 456}'
```

### 3. Deploy Agent

External agents run automatically in GitLab CI/CD when triggered by:

- **Webhooks**: MR events, issue events, pipeline events
- **Schedules**: Cron-based triggers
- **Manual**: API or UI invocation

## Environment Variables

### Standard Variables (Always Included)

- `GITLAB_TOKEN` - GitLab API access token
- `GITLAB_HOST` - GitLab instance URL
- `AI_FLOW_CONTEXT` - Flow execution context
- `AI_FLOW_INPUT` - Flow input data
- `AI_FLOW_EVENT` - Triggering event data

### Extracted from Manifest

- **Workflow Variables**: `${VAR}` references in workflow steps
- **Extension Variables**: `extensions.gitlab.variables[]`
- **Auth Variables**: Tool authentication credentials

## API Reference

### ExternalAgentGenerator

```typescript
class ExternalAgentGenerator {
  /**
   * Generate external agent configuration from OSSA manifest
   */
  generate(manifest: OssaAgent): ExternalAgentGenerationResult;

  /**
   * Generate external agent YAML string
   */
  generateYAML(
    config: ExternalAgentConfig,
    manifest: OssaAgent
  ): string;
}
```

### ExternalAgentGenerationResult

```typescript
interface ExternalAgentGenerationResult {
  success: boolean;
  yaml?: string;
  config?: ExternalAgentConfig;
  error?: string;
}
```

### ExternalAgentConfig

```typescript
interface ExternalAgentConfig {
  image: string;                // Docker image
  commands: string[];           // Execution commands
  variables: string[];          // Required environment variables
  injectGatewayToken?: boolean; // AI Gateway token injection
}
```

## Best Practices

### 1. Runtime Selection

- **Explicit is Better**: Specify `runtime.image` for custom environments
- **Type Hints**: Use `runtime.type` to guide automatic selection
- **Tool Indicators**: MCP tools → Node.js, pip tools → Python

### 2. Variable Management

- **Extract from Workflow**: Use `${VAR}` syntax in workflow steps
- **Document Requirements**: List custom variables in `extensions.gitlab.variables`
- **Secure Credentials**: Store sensitive values in GitLab CI/CD variables

### 3. Command Customization

- **Override Defaults**: Provide `runtime.command` for custom build/run steps
- **Multi-Stage**: Use multiple commands for build → test → run pipelines
- **Error Handling**: Include error checking in command sequences

### 4. AI Gateway Integration

- **Always Enable**: Use `injectGatewayToken: true` for agents with LLM
- **Model Selection**: Choose appropriate model for task complexity
- **Token Limits**: Set `maxTokens` based on expected output size

## Troubleshooting

### Issue: Wrong Docker Image Selected

**Solution**: Explicitly set `runtime.image`:

```typescript
spec: {
  runtime: {
    image: 'custom-image:tag',
  },
}
```

### Issue: Missing Variables

**Solution**: Add to extensions or workflow:

```typescript
extensions: {
  gitlab: {
    variables: ['CUSTOM_VAR'],
  },
}
```

### Issue: Commands Don't Work

**Solution**: Override with custom commands:

```typescript
spec: {
  runtime: {
    command: ['custom-build', 'custom-run'],
  },
}
```

## Examples

See `examples/gitlab-duo/external-agent-example.ts` for complete examples:

- Node.js webhook agent with AI Gateway
- Python data analysis agent
- Go security scanner
- Agent with custom variables and auth

## Related Documentation

- [GitLab Duo External Agents](https://docs.gitlab.com/ee/user/gitlab_duo/external_agents.html)
- [GitLab AI Gateway](https://docs.gitlab.com/ee/administration/ai_gateway.html)
- [OSSA Specification](../../docs/specification.md)
- [GitLab Duo Flow Generator](./FLOW_GENERATOR.md)

## Support

For issues or questions:

- GitHub Issues: https://github.com/blueflyio/ossa/issues
- GitLab Issues: https://gitlab.com/blueflyio/ossa/-/issues
- Documentation: https://ossa.blueflyio.com
