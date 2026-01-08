# Change Log

All notable changes to the "OSSA Language Support" extension will be documented in this file.

## [0.1.0] - 2025-01-XX

### Added
- Initial release of OSSA language support for VS Code
- Schema validation for OSSA v0.3.0, v0.2.9, v0.2.8, v0.2.7, v0.2.6
- 13+ code snippets for Agents, Tasks, Workflows, and tools
- IntelliSense and autocomplete for OSSA manifests
- Automatic file detection for `.ossa.yaml`, `.ossa.json`, and common manifest locations
- Real-time validation with error highlighting
- Commands for creating new Agent, Task, and Workflow manifests
- Configuration options for validation and snippets
- Status bar indicator for OSSA files
- Diagnostic warnings for common mistakes (naming conventions, version format)
- Support for YAML and JSON OSSA manifests

### Features
- **Schema Validation**: Validates against official OSSA JSON schemas
- **Code Snippets**: Quick templates for common patterns
- **File Detection**: Automatically recognizes OSSA files
- **Multi-version Support**: Works with multiple OSSA specification versions
- **Smart Diagnostics**: Catches schema violations and best practice issues

### Snippets
- `ossa-agent` - Minimal Agent
- `ossa-agent-tools` - Agent with tools
- `ossa-agent-safety` - Agent with safety controls
- `ossa-task` - Task manifest
- `ossa-workflow` - Workflow manifest
- `ossa-tool-mcp` - MCP tool definition
- `ossa-tool-http` - HTTP tool definition
- `ossa-tool-function` - Function tool definition
- `ossa-messaging` - Agent messaging config
- `ossa-constraints` - Cost/performance constraints
- `ossa-observability` - Observability config
- `ossa-autonomy` - Autonomy settings
- `ossa-agent-complete` - Complete agent template

### Commands
- `OSSA: Validate Manifest` - Validate current OSSA file
- `OSSA: New Agent Manifest` - Create new Agent
- `OSSA: New Task Manifest` - Create new Task
- `OSSA: New Workflow Manifest` - Create new Workflow

### Configuration
- `ossa.validation.enabled` - Enable/disable validation
- `ossa.validation.schemaVersion` - Schema version to use
- `ossa.snippets.enabled` - Enable/disable snippets
- `ossa.diagnostics.enabled` - Enable/disable diagnostics
