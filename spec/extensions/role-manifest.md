# OSSA Role Manifest Extension

**Version:** 0.5.0
**Status:** Draft
**Last Updated:** 2026-03-13

## Overview

This extension introduces `kind: Role` as a new OSSA manifest type. Roles define **behavioral overlays** for IDE and CLI agents (Claude Code, Cursor, Codex CLI, etc.) — configuring instructions, tool access, hooks, MCP server connections, and activation conditions.

### Role vs Agent

| Aspect | `kind: Agent` | `kind: Role` |
|--------|--------------|--------------|
| **Purpose** | Autonomous agentic loop | Operator context overlay |
| **Execution** | Runs independently | Applied to an existing agent session |
| **Lifecycle** | Deployed, scaled, monitored | Activated, composed, switched |
| **Identity** | Has its own agent ID | Inherits the host agent's identity |
| **Example** | A code review bot | "Drupal developer" context for Claude Code |

Roles answer the question: *"What context, rules, and tools should an AI coding assistant have when working in this domain?"*

## Manifest Structure

```yaml
apiVersion: ossa/v0.5
kind: Role
metadata:
  name: <role-name>           # Required: DNS-style identifier
  version: <semver>           # Recommended: e.g. 1.0.0
  description: <string>       # Human-readable summary
  labels:                     # Optional: key-value pairs for filtering
    platform: claude-code
    domain: drupal
  annotations:                # Optional: non-identifying metadata
    org: example-corp
spec:
  role: <string>              # System prompt / persona definition
  instructions:               # Behavioral instructions
    preamble: <markdown>      # Prepended to every conversation
    constraints:              # Hard rules (MUST/MUST NOT)
      - <string>
  tools:                      # Tool access configuration
    allowed: [<string>]       # Allowed tool names
    denied: [<string>]        # Denied tool names (overrides allowed)
    skills: [<string>]        # OSSA skill references
  hooks:                      # Lifecycle hooks
    on_activate: <string>     # Run when role is activated
    on_deactivate: <string>   # Run when role is deactivated
    pre_commit: <string>      # Run before git commits
    post_save: <string>       # Run after file saves
  context:                    # Context injection
    schemas: [<path>]         # JSON/OpenAPI schemas to load
    files:                    # Files to include in context
      - path: <glob>
        description: <string>
    knowledge: [<path>]       # Knowledge base files (markdown, text)
  protocols:                  # Protocol connections
    mcp:                      # Model Context Protocol
      servers:
        - name: <string>
          transport: stdio | sse
          command: <string>   # For stdio transport
          args: [<string>]
          url: <string>       # For SSE transport
  extends:                    # Role composition
    - role: <role-name>       # Inherit from another role
      override: true | false  # Whether to override conflicts (default: false)
  activation:                 # When this role should activate
    file_patterns: [<glob>]   # Activate when matching files are open
    command: <string>         # CLI command to activate (e.g. "/role drupal")
    env:                      # Environment variable conditions
      <key>: <value>
```

## Field Reference

### `spec.role`

A string defining the agent's persona when this role is active. This is the system-level identity statement.

```yaml
spec:
  role: |
    You are a Drupal module developer following Drupal coding standards.
    You write PHP 8.2+ code with strict typing and dependency injection.
```

### `spec.instructions`

Structured behavioral instructions.

- **`preamble`**: Markdown content prepended to every conversation. Use for rules, conventions, and domain knowledge that should always be present.
- **`constraints`**: An array of hard rules. Each constraint is a MUST or MUST NOT statement that the agent should never violate.

### `spec.tools`

Controls which tools the agent can use within this role.

- **`allowed`**: Whitelist of tool names. If specified, only these tools are available.
- **`denied`**: Blacklist of tool names. Takes precedence over `allowed`.
- **`skills`**: References to OSSA `kind: Skill` manifests that should be loaded.

### `spec.hooks`

Lifecycle hooks executed at specific points. Values are command strings or script references.

- **`on_activate`**: Runs when the role is first activated in a session.
- **`on_deactivate`**: Runs when switching away from this role.
- **`pre_commit`**: Runs before git commit operations.
- **`post_save`**: Runs after file save operations.

### `spec.context`

Injects additional context into the agent's working memory.

- **`schemas`**: Paths to JSON Schema or OpenAPI specification files. The agent can reference these for type-correct code generation.
- **`files`**: Specific files or globs to include in the agent's context window.
- **`knowledge`**: Paths to knowledge base documents (markdown, text) that provide domain reference material.

### `spec.protocols.mcp`

MCP server connections available when this role is active.

Each server entry requires:
- **`name`**: Identifier for the MCP server.
- **`transport`**: Either `stdio` (local process) or `sse` (HTTP Server-Sent Events).
- **`command`** + **`args`**: For `stdio` transport, the command to spawn.
- **`url`**: For `sse` transport, the endpoint URL.

### `spec.extends`

Enables role composition by inheriting from other roles.

- **`role`**: Name of the parent role to inherit from.
- **`override`**: If `true`, child fields replace parent fields. If `false` (default), child fields merge with parent fields (arrays are concatenated, objects are deep-merged).

### `spec.activation`

Defines conditions under which this role should automatically activate.

- **`file_patterns`**: Glob patterns matched against open files. If any file matches, the role activates.
- **`command`**: A slash command (e.g., `/role drupal`) that activates the role.
- **`env`**: Environment variable conditions. All specified variables must match for activation.

## Composition Rules

When a role extends another:

1. **`spec.role`**: Child replaces parent (no merge).
2. **`spec.instructions.preamble`**: Child is appended after parent.
3. **`spec.instructions.constraints`**: Arrays are concatenated (all constraints apply).
4. **`spec.tools.allowed`**: Intersection of parent and child (child cannot grant tools the parent denies).
5. **`spec.tools.denied`**: Union of parent and child (denials accumulate).
6. **`spec.tools.skills`**: Arrays are concatenated.
7. **`spec.hooks`**: Child hooks replace parent hooks for the same lifecycle event.
8. **`spec.context`**: All context entries are merged (files, schemas, knowledge concatenated).
9. **`spec.protocols.mcp.servers`**: Arrays are concatenated (all servers available).
10. **`spec.activation`**: Child activation conditions replace parent.

## Relationship to Other OSSA Kinds

| Kind | Relationship to Role |
|------|---------------------|
| `Agent` | Roles are applied to agents. An agent can have multiple roles. |
| `Skill` | Roles reference skills via `spec.tools.skills`. Skills provide capabilities; roles provide context. |
| `Task` | Roles may influence how tasks are executed by setting constraints and tool access. |
| `Workflow` | Roles can be assigned per workflow step to change agent behavior. |

## Platform Mapping

Roles map naturally to platform-specific configuration:

| Role Field | Claude Code | Cursor | Codex CLI |
|-----------|-------------|--------|-----------|
| `spec.role` | CLAUDE.md system prompt | .cursorrules | instructions |
| `spec.instructions.preamble` | CLAUDE.md content | .cursorrules content | --instructions |
| `spec.tools.allowed` | Tool permissions | Tool config | --tools |
| `spec.protocols.mcp` | .mcp.json servers | MCP config | MCP servers |
| `spec.activation.file_patterns` | Glob triggers | File associations | --pattern |

## Examples

See `examples/roles/` for complete role manifests:

- `drupal-developer.role.yaml` — Drupal module development
- `security-auditor.role.yaml` — Security audit and compliance review
- `platform-operator.role.yaml` — Full-stack platform operations with composition
