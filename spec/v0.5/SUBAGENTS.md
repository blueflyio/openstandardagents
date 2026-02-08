# OSSA v0.5: Sub-Agent Specification

> Vendor-neutral primitives for multi-agent orchestration

## Overview

OSSA v0.5 introduces **sub-agent definitions** — a standardized way to describe agent hierarchies, delegation patterns, and orchestration logic that exports to any runtime.

This specification draws from production patterns in:
- Claude Code (subagents)
- LangGraph (state nodes)
- CrewAI (crew members)
- AutoGen (group chat)
- Temporal (workflow activities)

The goal: **Define orchestration once, export everywhere.**

---

## Core Concepts

### 1. Sub-Agents

Sub-agents are specialized workers that handle specific tasks. Each has:
- **Isolated tool access** (what it can do)
- **Permission mode** (how much supervision it needs)
- **Model tier** (capability vs. cost tradeoff)
- **Delegation triggers** (when to invoke it)

```yaml
spec:
  subAgents:
    - name: explorer
      description: "Fast codebase search and analysis"
      # ... configuration
```

### 2. Model Tiers (Not Provider Names)

Instead of hardcoding `gpt-4` or `claude-sonnet`, use abstract tiers:

| Tier | Characteristics | Example Mappings |
|------|-----------------|------------------|
| `fast` | Low latency, lower cost, simpler tasks | Haiku, GPT-4-mini, Gemini Flash |
| `capable` | Balanced capability and cost | Sonnet, GPT-4, Gemini Pro |
| `powerful` | Maximum capability, higher cost | Opus, GPT-4-turbo, Gemini Ultra |

### 3. Permission Modes

Vendor-neutral permission levels:

| Mode | Description | Maps To |
|------|-------------|---------|
| `autonomous` | No approval needed | Claude: bypassPermissions |
| `supervised` | Approval for destructive actions | Claude: default |
| `assisted` | Auto-accept safe edits | Claude: acceptEdits |
| `readonly` | No modifications allowed | Claude: plan |
| `delegator` | Coordination only | Claude: delegate |

### 4. Memory Scopes

Persistent learning across sessions:

| Scope | Persists | Shared | Use Case |
|-------|----------|--------|----------|
| `session` | Current session | No | Temporary context |
| `local` | Across sessions | No | Personal learnings |
| `project` | Across sessions | Via VCS | Team knowledge |
| `user` | Across projects | No | Cross-project patterns |

---

## Schema Reference

### SubAgent Definition

```yaml
subAgents:
  - name: string                    # Required: unique identifier
    description: string             # Required: when to delegate to this agent

    # Model configuration
    model:
      tier: fast | capable | powerful
      inherit: boolean              # Use parent's model (default: true)
      preferredProvider: string     # Hint for exports (optional)

    # Tool access control
    tools:
      allow: [string]               # Allowlist (if set, only these tools)
      deny: [string]                # Denylist (removed from inherited/allowed)
      inherit: boolean              # Inherit parent's tools (default: true)

    # Permission handling
    permissions:
      mode: autonomous | supervised | assisted | readonly | delegator
      inherit: boolean              # Inherit parent's permissions

    # Delegation configuration
    delegation:
      trigger: string               # Natural language description
      proactive: boolean            # Agent decides when to delegate
      explicit: boolean             # Only delegate when explicitly requested

    # Execution mode
    execution:
      mode: foreground | background
      maxTurns: integer             # Maximum agentic turns
      timeout: duration             # e.g., "5m", "1h"

    # Persistent memory
    memory:
      scope: session | local | project | user
      categories: [string]          # What to remember

    # Lifecycle hooks (see Hooks section)
    hooks: HooksDefinition

    # Nested sub-agents (max depth: 2)
    subAgents: [SubAgent]
```

### Delegation Rules

```yaml
delegation:
  strategy: automatic | explicit | rules

  # For strategy: rules
  rules:
    - when: string                  # Condition (natural language or expression)
      delegate: string              # Sub-agent name
      then: string                  # Optional: chain to another sub-agent
      constraints: [string]         # Restrictions for this delegation

  # Parallel execution
  parallel:
    enabled: boolean
    maxConcurrent: integer
    strategy: independent | coordinated
```

### Hooks Definition

```yaml
hooks:
  onStart:
    - command: string
      timeout: duration

  onComplete:
    - command: string

  beforeToolUse:
    - matcher: string               # Tool name pattern (regex)
      command: string
      blocking: boolean             # If true, can prevent tool execution

  afterToolUse:
    - matcher: string
      command: string

  onSubAgentStart:
    - matcher: string               # Sub-agent name pattern
      command: string

  onSubAgentComplete:
    - matcher: string
      command: string
```

### Memory Configuration

```yaml
memory:
  scope: project
  path: .ossa/memory/               # Storage location
  format: markdown | json | sqlite
  maxSize: 10MB

  # Retention policy
  retention:
    maxAge: 30d
    maxEntries: 1000

  # What to remember
  categories:
    - codebase-patterns
    - debugging-insights
    - user-preferences
    - architectural-decisions
```

---

## Complete Example

```yaml
apiVersion: ossa/v0.5
kind: Agent
metadata:
  name: code-assistant
  version: 1.0.0

spec:
  description: "Full-stack development assistant with specialized workers"

  role: |
    You are a senior developer assistant. Delegate specialized tasks
    to your sub-agents for efficiency.

  model:
    tier: capable

  tools:
    - name: read
    - name: write
    - name: edit
    - name: execute
    - name: search

  # Sub-agent definitions
  subAgents:
    - name: explorer
      description: >
        Fast codebase search and analysis. Use proactively when
        understanding code structure, finding files, or researching
        how something works.
      model:
        tier: fast
        inherit: false
      tools:
        allow: [read, search, glob]
        deny: [write, edit, execute]
      permissions:
        mode: readonly
      delegation:
        trigger: "codebase exploration, file search, understanding code"
        proactive: true
      execution:
        mode: background
        maxTurns: 50

    - name: planner
      description: >
        Research and planning agent. Use before complex implementations
        to understand scope and create a plan.
      model:
        tier: capable
      tools:
        allow: [read, search]
      permissions:
        mode: readonly
      delegation:
        trigger: "planning, architecture decisions, understanding requirements"
        proactive: true
      memory:
        scope: project
        categories:
          - architectural-decisions
          - planning-context

    - name: implementer
      description: >
        Code implementation specialist. Use for writing and modifying code
        after planning is complete.
      model:
        tier: capable
      tools:
        inherit: true
      permissions:
        mode: supervised
      delegation:
        trigger: "code implementation, bug fixes, feature development"
        explicit: true
      hooks:
        afterToolUse:
          - matcher: "write|edit"
            command: "./scripts/run-linter.sh"

    - name: tester
      description: >
        Testing specialist. Use after implementation to verify changes.
      model:
        tier: fast
      tools:
        allow: [read, execute, search]
        deny: [write, edit]
      permissions:
        mode: readonly
      delegation:
        trigger: "running tests, verifying changes, checking coverage"
        proactive: true
      execution:
        mode: background

    - name: db-reader
      description: >
        Database query specialist. Read-only access to analyze data.
      model:
        tier: capable
      tools:
        allow: [execute]
      permissions:
        mode: readonly
      delegation:
        trigger: "database queries, data analysis, SQL operations"
      hooks:
        beforeToolUse:
          - matcher: "execute"
            command: "./scripts/validate-readonly-sql.sh"
            blocking: true

  # Delegation rules
  delegation:
    strategy: automatic

    rules:
      - when: "task involves searching or understanding code"
        delegate: explorer

      - when: "complex task requiring planning"
        delegate: planner
        then: implementer

      - when: "code changes complete"
        delegate: tester

    parallel:
      enabled: true
      maxConcurrent: 3
      strategy: independent

  # Parent agent memory
  memory:
    scope: project
    path: .ossa/memory/
    format: markdown
    categories:
      - session-context
      - user-preferences

  # Parent agent hooks
  hooks:
    onStart:
      - command: "./scripts/load-project-context.sh"
    onComplete:
      - command: "./scripts/save-session-summary.sh"
```

---

## Export Mappings

### Claude Code Export

```yaml
# OSSA subAgent
- name: explorer
  model:
    tier: fast
  tools:
    allow: [read, search]
  permissions:
    mode: readonly
```

Exports to `.claude/agents/explorer.md`:

```markdown
---
name: explorer
description: Fast codebase search and analysis
tools: Read, Grep, Glob
disallowedTools: Write, Edit
model: haiku
permissionMode: plan
---

You are a fast explorer agent...
```

### LangGraph Export

```python
# OSSA subAgent → LangGraph StateGraph node
from langgraph.graph import StateGraph

graph = StateGraph(AgentState)

# Explorer node (read-only, fast model)
graph.add_node("explorer", create_explorer_node(
    model="claude-3-haiku",
    tools=[read_tool, search_tool],
))

# Conditional routing based on delegation rules
graph.add_conditional_edges(
    "coordinator",
    route_to_subagent,
    {
        "explore": "explorer",
        "plan": "planner",
        "implement": "implementer",
    }
)
```

### CrewAI Export

```python
# OSSA subAgent → CrewAI Agent
from crewai import Agent, Crew

explorer = Agent(
    role="Explorer",
    goal="Fast codebase search and analysis",
    backstory="You are a specialized search agent...",
    tools=[read_tool, search_tool],
    llm="claude-3-haiku",
    allow_delegation=False,
)

crew = Crew(
    agents=[explorer, planner, implementer],
    tasks=[...],
    process=Process.hierarchical,
)
```

### AutoGen Export

```python
# OSSA subAgent → AutoGen AssistantAgent
from autogen import AssistantAgent, GroupChat

explorer = AssistantAgent(
    name="explorer",
    system_message="Fast codebase search...",
    llm_config={"model": "claude-3-haiku"},
)

group_chat = GroupChat(
    agents=[coordinator, explorer, planner, implementer],
    messages=[],
    max_round=50,
)
```

---

## Standard Tool Names

For interoperability, OSSA defines standard tool categories:

| OSSA Tool | Claude Code | LangChain | Description |
|-----------|-------------|-----------|-------------|
| `read` | Read | FileReadTool | Read file contents |
| `write` | Write | FileWriteTool | Create/overwrite files |
| `edit` | Edit | - | Modify existing files |
| `execute` | Bash | ShellTool | Run commands |
| `search` | Grep | - | Search file contents |
| `glob` | Glob | - | Find files by pattern |
| `web_fetch` | WebFetch | WebBrowserTool | Fetch URL content |
| `web_search` | WebSearch | DuckDuckGoTool | Search the web |

---

## Validation Rules

1. **Unique names**: Sub-agent names must be unique within their parent
2. **No circular delegation**: Delegation chains must be acyclic
3. **Tool inheritance**: Denied tools override allowed tools
4. **Max depth**: Sub-agents can nest up to 2 levels
5. **Memory scope compatibility**: Child memory scope must be >= parent scope

---

## Migration from v0.4

v0.5 is backward compatible. Existing v0.4 manifests work without changes.

To add sub-agents:

```yaml
# v0.4 manifest
apiVersion: ossa/v0.4
kind: Agent
spec:
  # existing spec...

# v0.5 with sub-agents
apiVersion: ossa/v0.5
kind: Agent
spec:
  # existing spec...
  subAgents:
    - name: explorer
      # new sub-agent definitions
```

---

## Design Principles

1. **Vendor-neutral**: No provider-specific names in core spec
2. **Progressive enhancement**: Sub-agents are optional
3. **Export-friendly**: Every field maps to major frameworks
4. **Practical defaults**: Inherit parent config by default
5. **Composable**: Sub-agents can have their own sub-agents (limited depth)
