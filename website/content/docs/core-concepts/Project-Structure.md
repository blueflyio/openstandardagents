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
│   │   ├── agent.ossa.yaml    # Required: OSSA manifest
│   │   ├── README.md          # Recommended: Agent documentation
│   │   └── data/              # Optional: Agent-specific data files
│   └── another-agent/
│       ├── agent.ossa.yaml
│       └── README.md
├── .agents-workspace/          # Agent runtime workspace (NOT version controlled)
│   ├── my-agent/
│   │   ├── context/           # Runtime context
│   │   ├── memory/            # Agent memory/state
│   │   └── logs/              # Execution logs
│   └── another-agent/
│       └── context/
├── modules/                    # Example: Drupal modules, npm packages, etc.
│   └── custom-module/
│       └── .agents/           # Module-specific agents
│           └── module-agent/
│               ├── agent.ossa.yaml
│               └── README.md
└── examples/                   # Example agents and workflows
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

```
.agents/
└── customer-support-agent/
    ├── agent.ossa.yaml        # Required: OSSA manifest (or agent.yml)
    ├── README.md              # Recommended: Agent documentation
    └── data/                  # Optional: Agent-specific data files
        ├── schemas/           # JSON schemas
        ├── examples/          # Example data
        └── config.json        # Configuration templates
```

**Required:**
- `agent.ossa.yaml` or `agent.yml` - OSSA manifest file

**Recommended:**
- `README.md` - What the agent does, how to use it

**Optional:**
- `data/` - JSON schemas, example data, configuration files
- `tests/` - Agent-specific tests
- `examples/` - Usage examples

### agent.ossa.yaml

The manifest is the core of each agent. It defines:

- **Agent metadata**: Name, description, version
- **Capabilities**: What the agent can do (tools)
- **LLM configuration**: Which model powers the agent
- **State management**: How the agent manages memory/context
- **Transport metadata**: How the agent communicates
- **Taxonomy**: Agent classification for discovery

Example manifest:

```yaml
apiVersion: ossa/v0.2.4
kind: Agent

metadata:
  name: customer-support-agent
  version: 1.0.0
  description: Handles customer support inquiries

spec:
  role: |
    You are a customer support agent that helps users with their inquiries.
    Be friendly, helpful, and escalate complex issues when needed.
  
  llm:
    provider: openai
    model: gpt-4-turbo
  
  tools:
    - type: function
      name: search_knowledge_base
      description: Search the knowledge base for answers
    - type: function
      name: create_support_ticket
      description: Create a new support ticket
  
  state:
    mode: session
    storage:
      type: kv
      retention: 7d
```

See [Agent Manifest Reference](/docs/schema-reference/ossa-manifest) for complete schema.

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

## Workspace Discovery

OSSA supports **workspace-level agent discovery** similar to how Drupal discovers modules or npm discovers packages.

### Discovery Pattern

Tools scan for `.agents/` folders to discover agents:

1. **Project-level**: `project-root/.agents/`
2. **Module-level**: `modules/*/.agents/`, `packages/*/.agents/`, etc.
3. **Workspace-level**: Scan entire workspace for all `.agents/` folders

### Example: Drupal-Like Ecosystem

```
drupal-site/
├── .agents/                    # Site-level agents
│   └── site-orchestrator/
│       └── agent.ossa.yaml
├── .agents-workspace/          # Workspace registry (auto-generated)
│   └── registry.json
└── modules/
    └── custom/
        ├── commerce-module/
        │   └── .agents/       # Module-specific agents
        │       └── order-processor/
        │           ├── agent.ossa.yaml
        │           └── README.md
        └── content-module/
            └── .agents/
                └── content-generator/
                    ├── agent.ossa.yaml
                    └── README.md
```

The workspace orchestrator can discover all agents across modules and coordinate multi-agent workflows.

### How Discovery Works

1. Tools scan for `.agents/` folders (recursively or at specific levels)
2. Look for `agent.ossa.yaml` or `agent.yml` files
3. Validate manifests against OSSA schema
4. Build registry/index of discovered agents
5. Use taxonomy (domain, capabilities) for filtering and routing

See [Workspace Discovery](/docs/core-concepts/Workspace-Discovery) for detailed documentation.

## Summary

| Folder | Purpose | Version Control | Contains |
|--------|---------|-----------------|----------|
| `.agents/` | Agent definitions | ✅ YES | Manifests (agent.ossa.yaml), README.md, data/ |
| `.agents-workspace/` | Agent runtime | ❌ NO | Logs, memory, context, artifacts, registry.json |

**Key Takeaway**: `.agents/` defines **what** agents do (commit to git). `.agents-workspace/` is **where** they work (never commit).

## Next Steps

- [Create Your First Agent](/docs/getting-started/first-agent)
- [Agent Manifest Reference](/docs/quick-reference#manifest)
- [Taxonomy Best Practices](/docs/for-audiences/architects#taxonomy)
- [Multi-Agent Systems](/docs/examples#multi-agent)
