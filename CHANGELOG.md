# Changelog

All notable changes to the OpenAPI AI Agents Standard (OAAS) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-01-27

### Added
- Initial public release of OpenAPI AI Agents Standard (OAAS)
- Universal Agent Discovery Protocol (UADP) for hierarchical agent discovery
- Runtime Translation Engine supporting multiple AI frameworks without code modification
- Support for MCP, LangChain, CrewAI, OpenAI, and Anthropic protocols
- Enterprise compliance automation for ISO 42001:2023, NIST AI RMF, EU AI Act
- Progressive certification levels (Bronze, Silver, Gold)
- Workspace Orchestrator for multi-agent coordination
- Validation API Server for compliance checking
- Comprehensive agent schemas and templates
- Production-ready examples and documentation

### Framework Support
- Model Context Protocol (MCP) - Full integration
- LangChain - Native tool support
- CrewAI - Agent role mapping
- OpenAI - Assistant API compatibility
- Anthropic - Tool use integration
- AutoGen - Conversational agent support

### Performance
- Sub-100ms agent discovery for 1000+ agents
- 35-45% token cost reduction through optimization
- Memory-efficient state management
- Concurrent request handling

### Security
- Zero-trust architecture
- Encrypted inter-agent communication
- Comprehensive audit trails
- Role-based access control (RBAC)

### Documentation
- Complete technical specification
- Integration guides for all supported frameworks
- Migration guide from existing systems
- Best practices and troubleshooting guides

### Known Issues
- Multi-region federation is under development
- Advanced security features (mTLS) planned for next release
- Some compliance automation features are in preview

## [Unreleased]

### Added
- Comprehensive branching conventions and semantic release workflow
- Automated CI pipeline with branch name validation
- Semantic tagging based on branch prefixes (feature-, fix-, hotfix-, perf-)
- Auto-merge from feature branches to development with conventional commits
- Proper release automation on main branch using semantic-release

### Changed
- CI pipeline now follows semantic release patterns with Keep a Changelog format
- Branch naming enforced with regex validation: `prefix/scope-kebab-case[-issue123]`
- Conventional commit messages required for all merges
- Updated to Keep a Changelog v1.1.0 format

## [0.1.9] - 2025-09-14

### Added
- OSSA v0.1.9 standalone specification package
- Complete OpenAPI specification for agent systems
- TypeScript type definitions for all OSSA interfaces
- Independent CI/CD pipeline separate from parent project
- NPM package publication workflow

### Fixed
- CI pipeline now properly handles package-lock.json sync issues
- Test framework conflicts resolved (jest vs vitest)
- Build process stabilized with proper error handling

### Changed
- Transformed OSSA into pure specification standard
- Removed implementation code (moved to agent-buildkit)
- Simplified package structure for specification distribution

### Planned
- Multi-region federation support
- Advanced security with mTLS
- Complete compliance automation
- Enhanced performance optimization
- Additional framework integrations (Google Vertex AI)
- Improved caching strategies
- Extended monitoring capabilities