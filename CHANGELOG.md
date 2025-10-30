# Changelog

All notable changes to OSSA (Open Standard for Scalable Agents) will be documented in this file.

The format is租金 based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **OpenAPI/Swagger Specification Extensions** - Complete documentation and implementation for OSSA extensions to OpenAPI 3.1 specifications
  - Root-level extensions: `x-ossa-metadata`, `x-ossa`, `x-agent` for agent metadata and compliance
  - Operation-level extensions: `x-ossa-capability`, `x-ossa-autonomy`, `x-ossa-constraints`, `x-ossa-tools`, `x-ossa-llm`
  - Parameter extensions: `x-ossa-agent-id`, `x-ossa-version` for standard headers
  - Schema extensions: `x-ossa-capability-schema` for capability schemas
- **OpenAPI Extension Validation** - New `validateOpenAPIExtensions()` method in ValidationService
- **CLI OpenAPI Support** - Added `--openapi` flag to `validate` command: `ossa validate <path> --openapi`
- **JSON Schema for Extensions** - Complete schema at `docs/schemas/openapi-extensions.schema.json`
- **TypeScript Types** - Full type definitions exported from `src/types/openapi-extensions.ts`
- **Example OpenAPI Specs** - Three complete examples demonstrating extensions:
  - `examples/openapi-extensions/minimal-agent-api.openapi.yml` - Basic usage
  - `examples/openapi-extensions/worker-agent-api.openapi.yml` - Full worker agent
  - `examples/openapi-extensions/orchestrator-agent-api.openapi.yml` - Multi-agent orchestration
- **GitLab Wiki Content** - Ready-to-publish wiki pages in `docs/wiki/` directory
- **Comprehensive Documentation** - Full guide at `docs/openapi-extensions.md` following Apidog documentation style

### Changed

- Enhanced `validate` CLI command to support both agent manifests and OpenAPI specifications
- Validation service now includes OpenAPI extension validation with detailed error reporting
- Fixed import.meta usage in validation service for better test compatibility

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

## [0.2.2] - 2024-01-15

### Added

- Reasoning compliance schema
- Production examples for common agent types
- Migration guide from v0.1.9

### Changed

- Simplified schema structure
- Enhanced extension support

---

## [0.2.1] - 2024-01-10

### Fixed

- Schema validation issues with nested objects
- Extension loading for kAgent

---

## [0.2.0] - 2024-01-05

### Added

- Taxonomy system for agent classification
- Observability hooks
- Enhanced extension system

### Changed

- Restructured specification format
- Improved validation error messages

---

## [0.1.9] - 2023-12-20

### Added

- Initial OSSA specification
- JSON Schema validation
- Basic CLI tooling
- kAgent extension
- Drupal extension

---

**Note**: For detailed version history before v0.2.0, see [spec/versions/v0.1.9/](spec/versions/v0.1.9/)
