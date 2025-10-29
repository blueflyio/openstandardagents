# Changelog

All notable changes to OSSA (Open Standard for Scalable Agents) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive cleanup and standardization plan
- Production architecture documentation
- TypeScript migration roadmap
- Testing strategy (TDD approach)
- Security scanning requirements

### Planned

- TypeScript CLI migration
- Service layer architecture (SOLID principles)
- Dependency injection (Inversify)
- Comprehensive test suite (≥90% coverage)
- Production-ready CI/CD pipeline
- NPM package publication

---

## [1.0.0] - TBD

### Added

- **BREAKING**: New `ossaVersion` field replacing `apiVersion`
- **BREAKING**: Required `agent` top-level object
- New `runtime` section for deployment configuration
- New `capabilities` array for agent features
- New `protocols` section for communication protocols
- New `compliance` section for regulatory requirements
- kAgent extension schema v1
- TypeScript support with generated types
- Comprehensive test suite
- Migration tool from v0.1.9 to v1.0
- CLI commands: `validate`, `generate`, `migrate`, `init`, `inspect`, `audit`, `schema`
- Full documentation suite
- Production-ready CI/CD pipeline
- Security scanning (SAST, SCA, secrets)

### Changed

- **BREAKING**: Renamed `spec.role` to `agent.role`
- **BREAKING**: `extensions` now under root instead of `spec`
- **BREAKING**: Tool configuration simplified
- **BREAKING**: Removed `kind: Agent` (now implicit)
- **BREAKING**: Removed `metadata` section (fields moved to `agent`)
- Improved JSON Schema validation rules
- Enhanced documentation structure
- Migrated CLI from JavaScript to TypeScript
- Implemented service layer architecture (SOLID)
- Added dependency injection

### Deprecated

- v0.1.9 specification (supported until v2.0.0)
- Old `apiVersion: ossa/v0.1.9` format

### Fixed

- Schema validation for nested objects
- Extension validation for platform-specific configs
- CLI error handling
- TypeScript strict mode compliance

### Security

- Added security scanning in CI/CD
- Added secrets detection
- Dependency vulnerability scanning

### Migration Guide

See [docs/migration-v0.1.9-to-v1.0.md](docs/migration-v0.1.9-to-v1.0.md)

---

## [0.3.0] - 2025-XX-XX

### Added

- Additional CLI commands (audit, inspect, schema)
- Ecosystem health scanning
- kAgent deployment automation
- On-demand agent configuration

### Changed

- Updated package structure
- Enhanced CLI functionality

---

## [0.1.9] - 2024-XX-XX

### Added

- Extensions mechanism for platform-specific configuration
- Taxonomy classification (domain, subdomain, capability)
- Observability configuration (tracing, metrics, logging)
- kAgent integration examples (5 production agents)
- Autonomy levels and approval workflows
- Cost and performance constraints
- A2A (Agent-to-Agent) communication protocol

### Changed

- Updated JSON Schema with new fields
- Enhanced agent manifest structure
- Improved validation rules

### Examples Added

- k8s-troubleshooter.ossa.yaml
- security-scanner.ossa.yaml
- cost-optimizer.ossa.yaml
- documentation-agent.ossa.yaml
- compliance-validator.ossa.yaml

---

## [0.1.8] - 2024-XX-XX

### Added

- Initial stable release
- Basic agent manifest format
- JSON Schema validation (spec/ossa-1.0.schema.json)
- CLI tools (validate, generate, init, migrate)
- Basic examples
- README documentation
- Apache 2.0 license

### Features

- Declarative agent definitions in YAML/JSON
- Framework-agnostic specification
- Extensible via `extensions` field
- Semantic versioning support
- LLM configuration (provider, model, temperature)
- Tool integration support (MCP servers)

---

## Version History Summary

| Version   | Status     | Release Date | Key Features                                     |
| --------- | ---------- | ------------ | ------------------------------------------------ |
| **1.0.0** | 🔮 Planned | TBD          | Production-ready, TypeScript, full test coverage |
| 0.3.0     | 📦 Current | 2025-XX-XX   | Enhanced CLI, kAgent automation                  |
| 0.1.9     | ⚠️ Stable  | 2024-XX-XX   | Extensions, taxonomy, observability              |
| 0.1.8     | ✅ Initial | 2024-XX-XX   | First stable release                             |

---

## Upgrade Guides

### Upgrading to v1.0.0 from v0.1.9

**Breaking Changes:**

1. `apiVersion: ossa/v0.1.9` → `ossaVersion: "1.0"`
2. `kind: Agent` → (removed, implicit)
3. `metadata:` section → fields moved to `agent:` object
4. `spec:` → `agent:` top-level object
5. `extensions:` moved from under `spec` to root

**Migration Tool:**

```bash
ossa migrate your-agent-v0.1.9.yaml --output your-agent-v1.0.yaml
```

See full guide: [docs/migration-v0.1.9-to-v1.0.md](docs/migration-v0.1.9-to-v1.0.md)

### Upgrading to v0.1.9 from v0.1.8

**New Features:**

- Add `extensions` section for platform-specific config
- Add `taxonomy` for domain classification
- Add `observability` for monitoring config
- Add `autonomy` for approval workflows
- Add `constraints` for cost/performance limits

**Backward Compatible:** v0.1.8 manifests work in v0.1.9

---

## Semantic Versioning Policy

OSSA follows [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** (x.0.0): Breaking schema changes, incompatible API changes
- **MINOR** (0.x.0): New optional fields, backward-compatible features
- **PATCH** (0.0.x): Bug fixes, clarifications, non-breaking improvements

### Backward Compatibility Promise

- **Minor versions** (1.x.0): Fully backward compatible
- **Patch versions** (1.0.x): Fully backward compatible
- **Major versions** (2.0.0): May break compatibility, but migration path provided

---

## Links

- **GitLab Repository**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard
- **Issue Tracker**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/issues
- **Specification**: [spec/v0.2.2/OSSA-SPECIFICATION-v0.2.2.md](spec/v0.2.2/OSSA-SPECIFICATION-v0.2.2.md)
- **Examples**: [examples/](examples/)
- **npm Package**: [@bluefly/open-standards-scalable-agents](https://www.npmjs.com/package/@bluefly/open-standards-scalable-agents)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Reporting bugs
- Suggesting enhancements
- Submitting pull requests
- Creating extensions
- Writing documentation

---

[Unreleased]: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/compare/v0.2.2...development
[1.0.0]: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/compare/v0.1.9...v1.0.0
[0.3.0]: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/compare/v0.1.9...v0.3.0
[0.1.9]: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/compare/v0.1.8...v0.1.9
[0.1.8]: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/tags/v0.1.8
