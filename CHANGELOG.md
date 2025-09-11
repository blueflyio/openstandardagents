# Changelog

All notable changes to OSSA (Open Standards Scalable Agents) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.9] - 2024-09-12

### Overview
First public release of OSSA as both a specification standard and reference implementation for AI agent orchestration.

### Added
- **Specification Standard**: Complete OpenAPI 3.1 compliant specification for AI agents
  - 4 OpenAPI specifications (orchestration, specification, ACDL, voice-agent)
  - 2 JSON schemas (agent-manifest, workflow)
  - 6 TypeScript type definitions
- **Reference Implementation**: Working implementation with 24 core files
  - CLI tools for registry, orchestration, and compliance
  - MCP (Model Context Protocol) server with SSE transport
  - Core runtime with orchestration and registry capabilities
- **Agent Types Support**: 10 agent types including voice, mcp, task, data, analytics
- **Compliance Engine**: Multi-level conformance (bronze, silver, gold)
- **Docker/Kubernetes**: Full containerization and orchestration support
- **Documentation**: Comprehensive guides, API references, and architecture documentation

### Changed
- Package name updated to `@bluefly/open-standards-scalable-agents`
- Restructured as specification + reference implementation (not pure specification)
- Updated roadmap to reflect actual project state (271 files total)

### Fixed
- Validator DNS-1123 pattern for proper agent name validation
- Missing agent types (voice) and capability domains (audio, speech, interaction)
- TypeScript configuration for isolated modules
- Build dependencies (zod, @modelcontextprotocol/sdk)

### Known Issues
- Some TypeScript strict mode errors remain (non-blocking)
- Jest configuration needs update for ESM modules
- MCP server has minor type definition issues
- Build shows warnings but produces working dist/ folder

### Migration Notes
- Future v0.2.0 will separate implementation code to agent-buildkit
- Current v0.1.9 includes both specification and implementation
- No breaking changes from previous internal versions

## [0.1.8] - 2024-09-10 (Internal)

### Added
- Initial OSSA foundation and core architecture
- Basic agent specification and registry
- CLI tools prototype

## Notes
This release establishes OSSA as the authoritative specification standard for AI agent orchestration with a working reference implementation. The project provides a complete framework for building, registering, and orchestrating AI agents across different platforms and frameworks.