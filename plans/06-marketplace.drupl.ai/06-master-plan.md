# 06 - Marketplace Master Plan

## Context
The Marketplace (`marketplace.drupl.ai` / `agents.blueflyagents.com`) is the central registry and distribution hub for BlueFly plugins, skills, and agents. It is powered by a Drupal 11 CMS backend that provides search, discovery, CRUD capabilities, and analytics for the plugin ecosystem.

## Plugin Consolidation Strategy
The existing 60+ individual skills, 5 agents, and 9 commands will be consolidated into 10 cohesive, domain-bounded plugins to minimize sprawl:
- `bluefly-agent-platform`: Core architecture and ops (buildkit, observability, separation-of-duties).
- `bluefly-drupal`: Drupal-specific workflows (module scaffolding, recipes).
- `bluefly-ossa`: Protocol components (validation, research).
- `bluefly-security`: Security scanners, TDD, code review.
- `bluefly-cicd`: Git and release management.
- `bluefly-mcp-tools`: MCP builders.
- `bluefly-k8s-ops`: Infrastructure management.
- `bluefly-creative`: Design and artifacts.
- `bluefly-docs`: Documentation utilities.
- `bluefly-productivity`: General workflow enhancements.

## Plugin Architecture & Cross-IDE Compatibility
Plugins follow the Claude Code packaging model:
- `.claude-plugin/plugin.json`: The manifest defining the plugin.
- `skills/`: Individual `SKILL.md` files.
- `commands/` & `hooks/`: Tool integration hooks.
- `.mcp.json`: MCP server configuration.

**Cross-IDE Support**:
- **Claude Code**: Uses `plugin.json` and marketplace.
- **Cursor**: Uses MCP config and `.cursorrules` mapping.
- **Windsurf**: Uses MCP config and cascade instructions.
- **VS Code**: Uses custom extensions and MCP.

## Protocol & Protocol Bridge Integrations
- **MCP Servers**: Each core `@bluefly/agent-*` package (e.g., `agent-brain`, `agent-router`) will be wrapped as an MCP server.
- **A2A (Agent-to-Agent) Protocol Bridge**: Exposes OSSA agents as Google A2A-compatible endpoints for ecosystem interoperability.

## CI/CD Pipeline
An automated GitLab CI pipeline will manage the full lifecycle:
1. **Validate**: Linting and schema checks.
2. **Test**: Unit testing against mock IDEs.
3. **Package**: Bundle and generate checksums.
4. **Publish**: Update `marketplace.json` on the Drupal backend.
5. **Verify**: Smoke testing via Claude Code CLI.

## Drupal Backend (CMS 2.0)
The Drupal backend serves the API for IDEs and web consumers:
- `/api/v1/agents`: List plugins.
- `/api/v1/discovery`: IDE auto-discovery.
- `/api/v1/search`: Faceted full-text search.
- `/api/v1/plugins`: CRUD, metrics, and installation tracking.


## Implementation Status (Updated 2026-03-08)
- **Drupal Backend (CMS 2.0)**: [x] Environment scaffolded at `WORKING_DEMOs/Drupal_AgentMarketplace`.
- **Plugin Consolidation**: [In Progress] Strategy defined for the 10 domain-bounded plugins; migration from 60+ skills ongoing.
- **Plugin Architecture**: [In Progress] Claude Code packaging model `.claude-plugin/plugin.json` structure being adopted.
- **Protocol Bridge Integrations**: [In Progress] Core packages being wrapped as MCP servers.
- **CI/CD Pipeline**: [Pending] Full automation of plugin lifecycle.
