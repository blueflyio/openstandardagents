---
title: Framework Support
description: Detailed framework compatibility guide including migration paths, examples, and integration patterns for OSSA-compatible frameworks
---

# Framework Support

This guide provides detailed information about OSSA compatibility with popular AI agent frameworks, including migration guides, examples, and best practices for each integration.

## Support Matrix

| Framework | Status | OSSA Version | Migration Complexity | Documentation |
|-----------|--------|--------------|---------------------|---------------|
| kAgent | ✅ Native | 1.0.0+ | N/A (Native) | [Docs](#kagent) |
| LangChain | ✅ Supported | 1.0.0+ | Low | [Docs](#langchain) |
| CrewAI | ✅ Supported | 1.0.0+ | Medium | [Docs](#crewai) |
| Anthropic MCP | ✅ Supported | 1.0.0+ | Low | [Docs](#anthropic-mcp) |
| Langflow | ✅ Supported | 1.0.0+ | Low | [Docs](#langflow) |
| Drupal ECA | ✅ Supported | 1.0.0+ | Medium | [Docs](#drupal-eca) |
| OpenAI Assistants | ✅ Supported | 1.0.0+ | Medium | [Docs](#openai-assistants) |
| AutoGPT | 🔄 Planned | TBD | TBD | Coming Soon |
| BabyAGI | 🔄 Planned | TBD | TBD | Coming Soon |

**Legend:**
- ✅ **Native**: Built on OSSA from the ground up
- ✅ **Supported**: Full integration with adapter/bridge
- 🔄 **Planned**: Integration in progress
- ⚠️ **Beta**: Experimental support available
- ❌ **Not Supported**: No current integration plans

---

## kAgent {#kagent}

### Overview

**kAgent** is a native OSSA implementation, designed from the ground up to follow the Open Standard Agents specification. It serves as the reference implementation and demonstrates best practices for OSSA-compliant agent development.

### Key Features

- **Native OSSA Manifests**: No conversion needed - manifests are OSSA JSON/YAML
- **Full Specification Coverage**: Implements 100% of OSSA spec
- **TypeScript First**: Modern TypeScript with full type safety
- **MCP Integration**: Built-in Model Context Protocol support
- **Zero Dependencies**: Minimal runtime footprint

### Installation

```bash
npm install @ossa/kagent
# or
pnpm add @ossa/kagent
# or
yarn add @ossa/kagent
```

### Quick Start

```typescript
import { OSSAAgent, OSSAManifest } from '@ossa/kagent';

// Load manifest
const manifest: OSSAManifest = {
  ossa: '1.0.0',
  name: 'research-assistant',
  version: '1.0.0',
  description: 'AI research assistant',
  type: 'worker',
  capabilities: {
    tools: ['web-search', 'summarize'],
    llm: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
    },
  },
};

// Create agent
const agent = new OSSAAgent(manifest);

// Execute task
const result = await agent.execute({
  task: 'Research the latest developments in quantum computing',
  context: {},
});

console.log(result);
```

### Example Manifest

```json
{
  "ossa": "1.0.0",
  "name": "data-analyst",
  "version": "1.2.0",
  "description": "Data analysis and visualization agent",
  "type": "worker",
  "author": {
    "name": "OSSA Team",
    "email": "team@openstandardagents.org"
  },
  "capabilities": {
    "tools": [
      {
        "name": "query-database",
        "type": "function",
        "description": "Query PostgreSQL database",
        "parameters": {
          "type": "object",
          "properties": {
            "query": { "type": "string" }
          }
        }
      },
      {
        "name": "create-chart",
        "type": "mcp",
        "server": "visualization-mcp"
      }
    ],
    "llm": {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.7
    }
  },
  "runtime": {
    "environment": "node",
    "version": ">=18.0.0"
  }
}
```

### Documentation

- **Repository**: [github.com/blueflyio/kagent](https://github.com/blueflyio/kagent)
- **API Reference**: [docs.openstandardagents.org/kagent/api](https://docs.openstandardagents.org/kagent/api)
- **Examples**: [examples/kagent/](https://github.com/blueflyio/openstandardagents/tree/main/examples/kagent)

---

## LangChain {#langchain}

### Overview

**LangChain** is one of the most popular AI agent frameworks. OSSA provides a bidirectional bridge for converting LangChain agents to/from OSSA manifests.

### Migration Complexity

**Low** - LangChain's chain-based architecture maps cleanly to OSSA's tool and capability model.

### Installation

```bash
npm install @ossa/langchain langchain
# or
pip install ossa-langchain langchain
```

### Converting LangChain to OSSA

```typescript
import { LangChainToOSSA } from '@ossa/langchain';
import { ChatAnthropic } from '@langchain/anthropic';
import { DuckDuckGoSearch } from '@langchain/community/tools/duckduckgo_search';

// Create LangChain agent
const llm = new ChatAnthropic({
  model: 'claude-3-5-sonnet-20241022',
});

const tools = [new DuckDuckGoSearch()];

// Convert to OSSA
const converter = new LangChainToOSSA();
const manifest = await converter.convert({
  llm,
  tools,
  name: 'research-agent',
  description: 'Web research assistant',
});

// Save manifest
await manifest.save('research-agent.json');
```

### Converting OSSA to LangChain

```typescript
import { OSSAToLangChain } from '@ossa/langchain';
import { OSSAManifest } from '@ossa/core';

// Load OSSA manifest
const manifest = await OSSAManifest.load('research-agent.json');

// Convert to LangChain
const converter = new OSSAToLangChain();
const agent = await converter.convert(manifest);

// Use LangChain agent
const result = await agent.invoke({
  input: 'What are the latest AI research papers?',
});

console.log(result);
```

### Python Example

```python
from ossa_langchain import LangChainToOSSA, OSSAToLangChain
from langchain_anthropic import ChatAnthropic
from langchain.agents import initialize_agent, AgentType
from langchain.tools import DuckDuckGoSearchRun

# Create LangChain agent
llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")
tools = [DuckDuckGoSearchRun()]
agent = initialize_agent(tools, llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION)

# Convert to OSSA
converter = LangChainToOSSA()
manifest = converter.convert(agent, name="research-agent")
manifest.save("research-agent.json")

# Later: Convert back to LangChain
manifest = OSSAManifest.load("research-agent.json")
converter = OSSAToLangChain()
agent = converter.convert(manifest)
result = agent.invoke("What are the latest AI research papers?")
```

### Example Manifest

See [examples/langchain/](https://github.com/blueflyio/openstandardagents/tree/main/examples/langchain) for complete examples.

### Documentation

- **Integration Guide**: [docs.openstandardagents.org/langchain](https://docs.openstandardagents.org/langchain)
- **LangChain Docs**: [python.langchain.com](https://python.langchain.com)

---

## CrewAI {#crewai}

### Overview

**CrewAI** specializes in multi-agent coordination. OSSA supports CrewAI crews with agent orchestration and inter-agent communication.

### Migration Complexity

**Medium** - CrewAI's crew concept requires mapping to OSSA's orchestrator type.

### Installation

```bash
pip install ossa-crewai crewai
```

### Converting CrewAI to OSSA

```python
from ossa_crewai import CrewAIToOSSA
from crewai import Agent, Task, Crew

# Define CrewAI agents
researcher = Agent(
    role='Researcher',
    goal='Research the topic thoroughly',
    backstory='Expert researcher with attention to detail',
)

writer = Agent(
    role='Writer',
    goal='Write engaging content',
    backstory='Professional content writer',
)

# Define tasks
research_task = Task(
    description='Research quantum computing',
    agent=researcher,
)

write_task = Task(
    description='Write article based on research',
    agent=writer,
)

# Create crew
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
)

# Convert to OSSA
converter = CrewAIToOSSA()
manifest = converter.convert(crew, name="content-crew")
manifest.save("content-crew.json")
```

### Converting OSSA to CrewAI

```python
from ossa_crewai import OSSAToCrewAI
from ossa.core import OSSAManifest

# Load OSSA manifest
manifest = OSSAManifest.load("content-crew.json")

# Convert to CrewAI
converter = OSSAToCrewAI()
crew = converter.convert(manifest)

# Run crew
result = crew.kickoff()
print(result)
```

### Example Manifest

```json
{
  "ossa": "1.0.0",
  "name": "content-crew",
  "version": "1.0.0",
  "type": "orchestrator",
  "description": "Multi-agent content creation crew",
  "agents": [
    {
      "id": "researcher",
      "role": "Researcher",
      "goal": "Research the topic thoroughly",
      "backstory": "Expert researcher with attention to detail",
      "tools": ["web-search", "arxiv-search"],
      "llm": {
        "provider": "anthropic",
        "model": "claude-3-5-sonnet-20241022"
      }
    },
    {
      "id": "writer",
      "role": "Writer",
      "goal": "Write engaging content",
      "backstory": "Professional content writer",
      "tools": ["grammar-check", "plagiarism-check"],
      "llm": {
        "provider": "anthropic",
        "model": "claude-3-5-sonnet-20241022"
      }
    }
  ],
  "workflow": {
    "steps": [
      {
        "agent": "researcher",
        "task": "Research the topic",
        "output": "research_findings"
      },
      {
        "agent": "writer",
        "task": "Write article based on research",
        "input": "research_findings",
        "output": "final_article"
      }
    ]
  }
}
```

### Documentation

- **Integration Guide**: [docs.openstandardagents.org/crewai](https://docs.openstandardagents.org/crewai)
- **CrewAI Docs**: [docs.crewai.com](https://docs.crewai.com)

---

## Anthropic MCP {#anthropic-mcp}

### Overview

**Anthropic's Model Context Protocol (MCP)** provides standardized interfaces for AI model interactions. OSSA has first-class MCP support for Claude and other Anthropic models.

### Migration Complexity

**Low** - MCP's tool protocol aligns naturally with OSSA's tool capabilities.

### Installation

```bash
npm install @ossa/mcp @anthropic-ai/sdk
```

### Using MCP Servers in OSSA

```typescript
import { OSSAAgent } from '@ossa/kagent';
import { MCPServerRegistry } from '@ossa/mcp';

// Register MCP servers
const registry = new MCPServerRegistry();
await registry.register({
  name: 'filesystem',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
});

// Create OSSA agent with MCP tools
const manifest = {
  ossa: '1.0.0',
  name: 'file-manager',
  version: '1.0.0',
  type: 'worker',
  capabilities: {
    tools: [
      {
        type: 'mcp',
        server: 'filesystem',
        tools: ['read_file', 'write_file', 'list_directory'],
      },
    ],
    llm: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
    },
  },
  mcp: {
    servers: {
      filesystem: {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
      },
    },
  },
};

const agent = new OSSAAgent(manifest);
await agent.execute({ task: 'List all files in the directory' });
```

### Example Manifest

```json
{
  "ossa": "1.0.0",
  "name": "data-processor",
  "version": "1.0.0",
  "type": "worker",
  "capabilities": {
    "tools": [
      {
        "type": "mcp",
        "server": "postgres",
        "tools": ["query", "list_tables"]
      },
      {
        "type": "mcp",
        "server": "redis",
        "tools": ["get", "set", "delete"]
      }
    ],
    "llm": {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022"
    }
  },
  "mcp": {
    "servers": {
      "postgres": {
        "transport": "stdio",
        "command": "mcp-server-postgres",
        "env": {
          "POSTGRES_URL": "${POSTGRES_URL}"
        }
      },
      "redis": {
        "transport": "stdio",
        "command": "mcp-server-redis",
        "env": {
          "REDIS_URL": "${REDIS_URL}"
        }
      }
    }
  }
}
```

### Documentation

- **MCP Specification**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **OSSA MCP Guide**: [docs.openstandardagents.org/mcp](https://docs.openstandardagents.org/mcp)

---

## Langflow {#langflow}

### Overview

**Langflow** is a visual flow-based builder for AI agents. OSSA supports exporting Langflow flows as OSSA manifests.

### Migration Complexity

**Low** - Langflow's visual flows map to OSSA's workflow steps.

### Installation

```bash
pip install ossa-langflow langflow
```

### Exporting Langflow to OSSA

```python
from ossa_langflow import LangflowToOSSA
import json

# Load Langflow flow (exported JSON)
with open('flow.json') as f:
    flow = json.load(f)

# Convert to OSSA
converter = LangflowToOSSA()
manifest = converter.convert(flow, name="visual-agent")
manifest.save("visual-agent.json")
```

### Importing OSSA to Langflow

```python
from ossa_langflow import OSSAToLangflow
from ossa.core import OSSAManifest

# Load OSSA manifest
manifest = OSSAManifest.load("visual-agent.json")

# Convert to Langflow
converter = OSSAToLangflow()
flow = converter.convert(manifest)

# Save Langflow flow
with open('flow.json', 'w') as f:
    json.dump(flow, f, indent=2)
```

### Documentation

- **Langflow Docs**: [docs.langflow.org](https://docs.langflow.org)
- **OSSA Langflow Guide**: [docs.openstandardagents.org/langflow](https://docs.openstandardagents.org/langflow)

---

## Drupal ECA {#drupal-eca}

### Overview

**Drupal ECA (Event-Condition-Action)** is a powerful rule-based automation framework for Drupal. OSSA integrates with ECA to enable AI-powered Drupal workflows.

### Migration Complexity

**Medium** - Mapping ECA's event-driven model to OSSA requires workflow orchestration.

### Installation

```bash
composer require ossa/drupal-eca
drush pm:enable ossa_eca
```

### Creating OSSA-Enabled ECA Rules

```yaml
# eca_config.yml
name: Content Moderation Agent
description: AI-powered content review and moderation
trigger:
  event: node_presave
  entity_type: node
  bundle: article
conditions:
  - plugin: entity_field_value
    field: status
    value: draft
actions:
  - plugin: ossa_agent_execute
    agent_manifest: /path/to/moderator-agent.json
    input:
      title: "[node:title]"
      body: "[node:body:value]"
    output_mapping:
      approved: field_moderation_status
      feedback: field_ai_feedback
```

### OSSA Manifest for Drupal

```json
{
  "ossa": "1.0.0",
  "name": "drupal-content-moderator",
  "version": "1.0.0",
  "type": "worker",
  "description": "AI content moderation for Drupal",
  "capabilities": {
    "tools": [
      {
        "name": "drupal-api",
        "type": "rest",
        "baseUrl": "${DRUPAL_BASE_URL}",
        "auth": {
          "type": "bearer",
          "token": "${DRUPAL_API_TOKEN}"
        }
      },
      {
        "name": "check-guidelines",
        "type": "function",
        "description": "Check content against editorial guidelines"
      }
    ],
    "llm": {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022"
    }
  },
  "runtime": {
    "environment": "php",
    "version": ">=8.1"
  }
}
```

### Documentation

- **Drupal ECA**: [drupal.org/project/eca](https://drupal.org/project/eca)
- **OSSA Drupal Guide**: [docs.openstandardagents.org/drupal](https://docs.openstandardagents.org/drupal)

---

## OpenAI Assistants {#openai-assistants}

### Overview

**OpenAI Assistants API** provides managed AI assistants with built-in tools. OSSA enables local definitions and deployment flexibility.

### Migration Complexity

**Medium** - OpenAI's proprietary format requires translation to OSSA standard.

### Installation

```bash
npm install @ossa/openai openai
# or
pip install ossa-openai openai
```

### Converting OpenAI Assistant to OSSA

```typescript
import { OpenAIToOSSA } from '@ossa/openai';
import OpenAI from 'openai';

const openai = new OpenAI();

// Retrieve OpenAI Assistant
const assistant = await openai.beta.assistants.retrieve('asst_abc123');

// Convert to OSSA
const converter = new OpenAIToOSSA();
const manifest = converter.convert(assistant);

// Save manifest
await manifest.save('assistant.json');
```

### Converting OSSA to OpenAI Assistant

```typescript
import { OSSAToOpenAI } from '@ossa/openai';
import { OSSAManifest } from '@ossa/core';
import OpenAI from 'openai';

const openai = new OpenAI();

// Load OSSA manifest
const manifest = await OSSAManifest.load('assistant.json');

// Convert to OpenAI Assistant
const converter = new OSSAToOpenAI();
const assistantConfig = converter.convert(manifest);

// Create OpenAI Assistant
const assistant = await openai.beta.assistants.create(assistantConfig);
console.log(`Created assistant: ${assistant.id}`);
```

### Example Manifest

```json
{
  "ossa": "1.0.0",
  "name": "code-reviewer",
  "version": "1.0.0",
  "type": "worker",
  "description": "AI code review assistant",
  "capabilities": {
    "tools": [
      {
        "type": "code_interpreter",
        "enabled": true
      },
      {
        "type": "file_search",
        "enabled": true
      }
    ],
    "llm": {
      "provider": "openai",
      "model": "gpt-4-turbo-preview",
      "temperature": 0.7,
      "instructions": "You are an expert code reviewer. Analyze code for best practices, security issues, and performance optimizations."
    }
  },
  "files": {
    "vector_store": "vs_abc123"
  }
}
```

### Documentation

- **OpenAI Assistants**: [platform.openai.com/docs/assistants](https://platform.openai.com/docs/assistants)
- **OSSA OpenAI Guide**: [docs.openstandardagents.org/openai](https://docs.openstandardagents.org/openai)

---

## Framework Comparison

| Feature | kAgent | LangChain | CrewAI | MCP | Langflow | Drupal ECA | OpenAI |
|---------|--------|-----------|--------|-----|----------|------------|--------|
| OSSA Native | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Multi-Agent | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Visual Builder | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| TypeScript | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Python | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Self-Hosted | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Cloud Managed | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |

---

## Migration Strategies

### Gradual Migration

Adopt OSSA incrementally:

1. **Start with new agents**: Build new agents using OSSA
2. **Convert high-value agents**: Migrate critical agents first
3. **Maintain compatibility**: Run OSSA and native formats in parallel
4. **Complete migration**: Fully transition to OSSA

### Framework Coexistence

Run multiple frameworks simultaneously:

```json
{
  "ossa": "1.0.0",
  "name": "hybrid-system",
  "type": "orchestrator",
  "agents": [
    { "id": "langchain-agent", "framework": "langchain" },
    { "id": "crewai-crew", "framework": "crewai" },
    { "id": "native-agent", "framework": "kagent" }
  ]
}
```

### Testing Strategy

Validate migrations:

1. **Schema Validation**: Ensure manifest compliance
2. **Functional Testing**: Verify agent behavior
3. **Performance Testing**: Compare metrics
4. **Integration Testing**: Test framework interop

---

## Support & Resources

### Getting Help

- **Discord**: [discord.gg/ossa](https://discord.gg/ossa) - Real-time community support
- **GitLab Issues**: [GitHub Issues](https://github.com/blueflyio/openstandardagents/issues) - Bug reports and feature requests
- **Documentation**: [docs.openstandardagents.org](https://docs.openstandardagents.org) - Comprehensive guides

### Contributing

Help improve framework integrations:

- **Report compatibility issues**
- **Submit integration PRs**
- **Share migration experiences**
- **Contribute examples**

### Requesting New Integrations

To request support for a new framework:

1. **Open GitLab issue** with `integration-request` label
2. **Provide framework details**: Name, repo, community size
3. **Describe use case**: Why this integration matters
4. **Offer to help**: Contribute to integration development

---

**Next Steps**: Explore [Runtime Deployment](/docs/deployment/overview) to learn about deploying OSSA agents.
