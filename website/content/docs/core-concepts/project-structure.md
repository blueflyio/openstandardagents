---
title: OSSA Project Structure
description: Understanding the .agents and .agents-workspace folders, and how OSSA organizes agent projects
---

# OSSA Project Structure

Understanding how OSSA organizes your agent projects is essential for effective development. This guide explains the core folders and their purposes.

## Directory Structure Overview

```
my-ossa-project/
├── .agents/                    # Agent definitions (version controlled)
│   ├── my-agent/
│   │   ├── manifest.json      # Agent configuration
│   │   ├── prompts/           # Agent prompts
│   │   └── tools/             # Agent-specific tools
│   └── another-agent/
│       └── manifest.json
├── .agents-workspace/          # Agent runtime workspace (NOT version controlled)
│   ├── my-agent/
│   │   ├── context/           # Runtime context
│   │   ├── memory/            # Agent memory/state
│   │   └── logs/              # Execution logs
│   └── another-agent/
│       └── context/
├── examples/                   # Example agents and workflows
└── ossa.yaml                   # Project configuration
```

## `.agents/` - Agent Definitions

The `.agents/` directory contains your **agent definitions**. This folder **should be version controlled** (committed to git).

### Purpose

- **Declarative agent configuration**: Each agent is defined by a `manifest.json` file
- **Source of truth**: The canonical definition of what each agent does
- **Shareable**: Can be exported, migrated, and shared across teams
- **Platform-agnostic**: Works with any OSSA-compliant runtime

### Structure

Each agent gets its own subdirectory within `.agents/`:

```json
.agents/
└── customer-support-agent/
    ├── manifest.json           # Required: Agent metadata and configuration
    ├── prompts/
    │   ├── system.md          # System prompt
    │   ├── context.md         # Context instructions
    │   └── examples.md        # Few-shot examples
    ├── tools/
    │   ├── search.json        # Tool definition
    │   └── create-ticket.json # Tool definition
    └── schema/
        └── openapi.yaml       # OpenAPI schema if using x-ossa extensions
```

### manifest.json

The manifest is the core of each agent. It defines:

- **Agent metadata**: Name, description, version
- **Capabilities**: What the agent can do
- **Tools**: Which tools the agent has access to
- **Configuration**: Runtime settings and parameters
- **Taxonomy**: Agent classification (see below)

Example manifest:

```json
{
  "name": "customer-support-agent",
  "version": "{{OSSA_VERSION}}",
  "description": "Handles customer support inquiries",
  "taxonomy": {
    "role": "worker",
    "domain": "customer-service",
    "capabilities": ["qa", "ticket-creation", "escalation"]
  },
  "tools": [
    {
      "name": "search_knowledge_base",
      "type": "function",
      "source": "./tools/search.json"
    },
    {
      "name": "create_support_ticket",
      "type": "function",
      "source": "./tools/create-ticket.json"
    }
  ],
  "prompts": {
    "system": "./prompts/system.md",
    "context": "./prompts/context.md"
  }
}
```

## `.agents-workspace/` - Agent Runtime Workspace

The `.agents-workspace/` directory is where agents **run and store runtime data**. This folder **should NOT be version controlled** (add to `.gitignore`).

### Purpose

- **Execution environment**: Where agents execute tasks
- **State management**: Agent memory, context, and session data
- **Logs and telemetry**: Runtime logs, metrics, and debugging info
- **Temporary artifacts**: Generated files, cached data, etc.

### Structure

Each agent gets a workspace directory that mirrors its `.agents/` structure:

```
.agents-workspace/
└── customer-support-agent/
    ├── context/
    │   ├── session-abc123.json    # Active session context
    │   └── thread-xyz789.json     # Conversation thread
    ├── memory/
    │   ├── short-term.json        # Recent context window
    │   ├── long-term.db           # Persistent memory (vector store)
    │   └── preferences.json       # Learned user preferences
    ├── logs/
    │   ├── 2025-11-18.log         # Daily logs
    │   └── metrics.json           # Performance metrics
    └── artifacts/
        ├── generated-email.txt    # Generated content
        └── analysis-report.pdf    # Work products
```

### Why Separate from `.agents/`?

1. **Clean version control**: Don't pollute git with runtime data
2. **Security**: Keep sensitive runtime data (API keys, user data) out of version control
3. **Performance**: Large runtime files don't slow down git operations
4. **Reproducibility**: Agent definitions in `.agents/` can be reproduced anywhere, but runtime state is environment-specific

### `.gitignore` Recommendation

Always add `.agents-workspace/` to your `.gitignore`:

```gitignore
# OSSA runtime workspace (never commit this!)
.agents-workspace/

# Keep agent definitions (DO commit this)
# .agents/  # <-- NOT ignored, should be committed
```

## Agent Taxonomy

OSSA uses a **taxonomy system** to classify and organize agents. This helps with:

- **Discovery**: Find agents by role, domain, or capability
- **Routing**: Direct tasks to appropriate agents
- **Orchestration**: Compose multi-agent workflows
- **Governance**: Apply policies based on agent classification

### Taxonomy Structure

```json
{
  "taxonomy": {
    "role": "worker | supervisor | coordinator | specialist",
    "domain": "customer-service | data-analysis | content-creation | ...",
    "capabilities": ["capability-1", "capability-2", "..."],
    "tags": ["optional", "custom", "tags"]
  }
}
```

### Taxonomy Fields

#### `role` (Required)

The agent's primary role in a system:

- **`worker`**: Executes specific tasks (e.g., customer support agent, data fetcher)
- **`supervisor`**: Manages and coordinates workers (e.g., team lead, orchestrator)
- **`coordinator`**: Routes tasks between agents (e.g., dispatcher, load balancer)
- **`specialist`**: Domain expert for complex tasks (e.g., legal advisor, data scientist)

#### `domain` (Required)

The business/functional domain:

- `customer-service`
- `data-analysis`
- `content-creation`
- `software-development`
- `compliance`
- `sales`
- (custom domains allowed)

#### `capabilities` (Optional but Recommended)

Specific capabilities the agent possesses:

```json
{
  "capabilities": [
    "natural-language-understanding",
    "ticket-creation",
    "escalation-routing",
    "sentiment-analysis",
    "multi-language-support"
  ]
}
```

#### `tags` (Optional)

Freeform tags for additional classification:

```json
{
  "tags": ["production", "high-priority", "customer-facing", "v2"]
}
```

### Example Taxonomy Usage

**Worker Agent (Customer Support)**:
```json
{
  "taxonomy": {
    "role": "worker",
    "domain": "customer-service",
    "capabilities": ["qa", "ticket-creation", "escalation"],
    "tags": ["tier-1-support", "email-only"]
  }
}
```

**Supervisor Agent (Support Team Lead)**:
```json
{
  "taxonomy": {
    "role": "supervisor",
    "domain": "customer-service",
    "capabilities": ["task-assignment", "quality-review", "escalation-handling"],
    "tags": ["tier-2-support", "manager"]
  }
}
```

**Specialist Agent (Data Analyst)**:
```json
{
  "taxonomy": {
    "role": "specialist",
    "domain": "data-analysis",
    "capabilities": ["sql-queries", "data-visualization", "statistical-analysis"],
    "tags": ["python", "pandas", "power-bi"]
  }
}
```

### Using Taxonomy for Routing

Taxonomy enables intelligent routing in multi-agent systems:

```typescript
// Find all customer service workers
const supportAgents = await ossa.findAgents({
  taxonomy: {
    role: 'worker',
    domain: 'customer-service'
  }
});

// Find agents with specific capability
const escalationHandlers = await ossa.findAgents({
  taxonomy: {
    capabilities: ['escalation-handling']
  }
});

// Route task to appropriate agent
const agent = await ossa.routeTask(task, {
  requiredCapabilities: ['sql-queries', 'data-visualization']
});
```

## Project Initialization

When you run `osa init`, OSSA creates the proper structure:

```bash
$ osa init my-project
✅ Created .agents/ directory (version controlled)
✅ Created .agents-workspace/ directory (not version controlled)
✅ Created .gitignore with .agents-workspace/
✅ Created ossa.yaml project configuration
```

## Best Practices

### ✅ DO

- **Commit `.agents/`** to version control (git)
- **Ignore `.agents-workspace/`** in `.gitignore`
- **Use taxonomy** to classify all agents
- **Document agent roles** in manifest descriptions
- **Version your manifests** (semver recommended)

### ❌ DON'T

- **Don't commit `.agents-workspace/`** (contains runtime data, secrets, logs)
- **Don't hardcode secrets** in agent manifests (use environment variables)
- **Don't mix runtime state** with agent definitions
- **Don't skip taxonomy** (makes discovery and routing harder)

## Migration from Other Frameworks

When migrating from other frameworks (LangChain, CrewAI, etc.), use `osa migrate`:

```bash
# Migrate LangChain agents to OSSA structure
$ osa migrate --from langchain --input ./langchain-agents --output ./.agents

✅ Created .agents/ with migrated agent definitions
✅ Created .agents-workspace/ for runtime
✅ Updated ossa.yaml with agent references
```

See [Migration Guides](/docs/migration-guides) for framework-specific instructions.

## Summary

| Folder | Purpose | Version Control | Contains |
|--------|---------|-----------------|----------|
| `.agents/` | Agent definitions | ✅ YES | Manifests, prompts, tool definitions |
| `.agents-workspace/` | Agent runtime | ❌ NO | Logs, memory, context, artifacts |

**Key Takeaway**: `.agents/` defines **what** agents do (commit to git). `.agents-workspace/` is **where** they work (never commit).

## Next Steps

- [Create Your First Agent](/docs/getting-started/first-agent)
- [Agent Manifest Reference](/docs/quick-reference#manifest)
- [Taxonomy Best Practices](/docs/for-audiences/architects#taxonomy)
- [Multi-Agent Systems](/docs/examples#multi-agent)
