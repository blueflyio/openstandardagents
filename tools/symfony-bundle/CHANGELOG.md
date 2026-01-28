# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.5] - 2025-01-18

### Added
- Initial release of OSSA Symfony Bundle
- Support for OSSA v0.3.x agent manifests
- Multiple LLM provider support:
  - Anthropic (Claude Opus, Sonnet, Haiku)
  - OpenAI (GPT-4, GPT-3.5)
  - Google (Gemini)
  - Azure OpenAI
- Agent management services:
  - AgentRegistry for agent discovery and registration
  - AgentExecutor for running agents
  - AgentLoader for manifest loading
- Manifest validation against OSSA v0.3.5 schema
- Safety features:
  - PII detection
  - Secrets detection
  - Cost tracking and limits
  - Token usage limits
- Observability:
  - OpenTelemetry integration
  - Cost tracking
  - Duration metrics
  - Usage statistics
- MCP (Model Context Protocol) support:
  - MCP server management
  - Tool registry
  - stdio, SSE, WebSocket transports
- Console commands:
  - `ossa:agent:list` - List all agents
  - `ossa:agent:execute` - Execute an agent
  - `ossa:agent:validate` - Validate manifests
  - `ossa:mcp:list` - List MCP servers
- Full Symfony dependency injection integration
- Event dispatcher integration
- Comprehensive configuration system
- Drupal 10+ compatibility
- PHPUnit test suite
- PHPStan level 8 static analysis
- PHP-CS-Fixer configuration
- Comprehensive documentation

### Documentation
- Complete README with Symfony and Drupal examples
- Installation instructions
- Configuration examples
- Usage examples
- API documentation
- Testing guide

### Requirements
- PHP >=8.2
- Symfony ^6.4 or ^7.0
- PSR-3 Logger
- Guzzle HTTP Client

[0.3.5]: https://gitlab.com/blueflyio/ossa/openstandardagents/-/releases/v0.3.5
