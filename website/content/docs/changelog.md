---
title: "Changelog"
---

# Changelog

All notable changes to OSSA (Open Standards Scalable Agents) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2025-10-14

### 🧹 Cleanup & Maintenance Release

This release represents a complete transformation of OSSA into an enterprise-grade specification standard, positioned for industry-wide adoption comparable to OpenAPI, Kubernetes, or Terraform.

### Added
- **Apache 2.0 LICENSE** - Full open source license for enterprise legal review
- **.npmrc Configuration** - Proper npm registry configuration for publishing
- **npm Publishing Pipeline** - Manual GitLab CI job for controlled releases to npmjs.org
- **Enterprise Transformation Plan** - Comprehensive roadmap for industry adoption
- **Streamlined Documentation** - Clean, professional docs structure (6 files vs 119)
- **Getting Started Guide** - Clear, technical quick-start documentation

### Changed
- **Package Name Standardized** - Now `@bluefly/open-standards-scalable-agents` (consistent with npm)
- **Version Unified to 1.0.0** - Aligned package.json, schema, and documentation versions
- **Dependencies Minimized** - Reduced from 8 to 4 deps, removed runtime services (qdrant, redis, pg, zod)
  - **Before**: 12MB+ with runtime dependencies
  - **After**: ~1MB with validation-only dependencies
  - **Impact**: Restored "lightweight standard" core value proposition
- **Documentation Structure** - Moved 113 files to `docs-to-migrate/` for GitLab Wiki
  - Removed branding, planning, marketing fluff
  - Kept only specification-focused technical docs
  - Professional, Google/GitLab/OpenAI documentation standards
- **README Updated** - Fixed badges, links, and npm package references
- **GitLab CI Enhanced** - Added separate `release:gitlab` and `release:npm` manual jobs

### Fixed
- **npm Publishing** - Can now publish to npmjs.org (requires NPM_TOKEN env var)
- **Version Consistency** - No more confusion between 0.1.9, 0.2.0, and 1.0
- **Package Identity** - Clear, consistent naming across all platforms
- **Dependency Bloat** - Removed inappropriate runtime dependencies from specification package

### Removed
- 113 markdown files moved to `docs-to-migrate/` for GitLab Wiki migration
  - Branding guides (6 files)
  - Planning documents (10 files)
  - Architecture guides (7 files → Wiki)
  - Deployment guides (6 files → Wiki)
  - Reference docs (10 files → Wiki)
  - Integration docs (moved to Wiki)
  - Marketing analysis (not needed)
- Empty `__DELETE_LATER/` directory
- YAML framework files (AUTOMATED_WORKFLOWS_FRAMEWORK.yaml, etc.)
- Audit and bridge documentation

### Technical Debt Addressed
- ✅ Legal foundation (LICENSE)
- ✅ Dependency hygiene (minimal deps)
- ✅ Version alignment (1.0.0)
- ✅ Package naming consistency
- ✅ Documentation organization
- ✅ Publishing pipeline
- ⏳ CLI TypeScript migration (planned for v1.1.0)

### Enterprise Readiness Checklist
- ✅ Apache 2.0 License
- ✅ Semantic Versioning
- ✅ Minimal Dependencies
- ✅ Clear Documentation
- ✅ Publishing Pipeline
- ✅ Professional Presentation
- ⏳ Security Policy (SECURITY.md) - Planned
- ⏳ Backwards Compatibility Guarantee - Planned
- ⏳ Certification Program - Planned

### Migration Notes

**For npm users**:
```bash
# Old (not published)
npm install -g @ossa/standard

# New (v1.0.0+)
npm install -g @bluefly/open-standards-scalable-agents
```

**For developers**:
- CLI commands unchanged (`ossa validate`, `ossa init`, etc.)
- Schema location unchanged (`spec/ossa-1.0.schema.json`)
- Examples unchanged (`examples/`)

**For documentation**:
- Comprehensive guides → GitLab Wiki (https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/wikis/home)
- Core specification docs → `docs/` directory
- API documentation → GitLab Pages (automated)

### What's Next (v1.1.0)
- CLI TypeScript migration
- Enhanced validation error messages
- VSCode extension
- Python reference implementation
- OSSA Certification Program

---

## [0.2.0] - 2025-10-11

### 🎯 Major Consolidation & Standards Compliance Release

This release represents a significant cleanup and consolidation of the OSSA specification repository, focusing on production-readiness and professional presentation for enterprise adoption.

### Added
- **Standard GitLab CI/CD Pipeline** - Production-grade continuous integration without custom components
- **Organized OpenAPI Specifications** - All specs consolidated under `openapi/` directory for clarity
- **Enhanced Type Safety** - Improved TypeScript configuration with ESM interoperability

### Changed
- **Repository Structure** - Streamlined to specification-focused architecture
  - Removed emoji usage throughout codebase (professional presentation)
  - Eliminated backup files and temporary artifacts
  - Consolidated duplicate configuration files
- **Documentation Organization** - Clean separation of specification vs implementation docs
- **CI Configuration** - Standardized pipeline stages with proper failure handling

### Fixed
- **Merge Conflicts Resolved** - Consolidated 7+ feature branches:
  - `feature/redis-event-bus-v0.1.9`
  - `feature/pure-ossa`
  - `feature/automated-import-fixer`
  - `feature/adk-integration`
  - `feature/architecture-visualization`
  - `chore/ossa-cleanup-schema-only`
- **TypeScript Compilation** - Resolved external reference issues
- **Schema Validation** - Fixed type safety issues in test suite

### Removed
- Emoji usage across documentation and code
- Duplicate and backup configuration files
- Temporary artifacts and merge conflict markers

### Technical Details
- **122 commits consolidated** from multiple feature branches
- **Schema-only principle** enforced for specification repository
- **Production-ready CI/CD** with validation, testing, and documentation stages

---

## [0.1.2] - 2025-09-29

### 🎉 Enhancement Release - Production Ready OpenAPI 3.1 Implementation

This release represents a complete transformation of OSSA into the industry's most comprehensive OpenAPI 3.1 specification framework for AI agent orchestration.

### Added
- **15 OpenAPI 3.1 Specifications** across core, project, MCP, and legacy domains
  - 6 Core specifications including ACDL and Voice Agent support
  - 4 Project domain specifications for orchestration and discovery
  - 4 MCP infrastructure specifications for Model Context Protocol
  - 1 Legacy/testing specification
- **Advanced OpenAPI 3.1 Features**
  - JSON Schema Draft 2020-12 with conditional schemas
  - Discriminator mapping for polymorphic agent types
  - Webhooks for event-driven architecture
  - Callbacks for asynchronous operations
  - HATEOAS links for API navigation
  - Content encoding for binary data
- **Custom OSSA Validator** - 400+ lines of TypeScript validation logic
- **Universal Agent Protocol (UAP)** - Complete implementation of RASP, ACAP, UADP, CPC
- **Enterprise Security** - OAuth 2.1 PKCE, mTLS, API key management
- **Comprehensive Documentation** - Professional README, API docs, migration guides
- **Infrastructure Standardization** - Complete template for 23-project ecosystem
  - Docker, Kubernetes, Helm chart templates
  - Port management system (3000-5999 range allocation)
  - Service registry for federated orchestration
  - Three deployment profiles (core, dev, full)
  - Standardized Makefile with dev/prod/status commands
- **Agent Class Naming Convention Fix** - Bulk rename to PascalCase
  - 51 handler files converted from kebab-case to PascalCase
  - 45+ test files updated with correct imports
  - Fixed Jest configuration (moduleNameMapper)

### Changed
- **Complete Documentation Overhaul**
  - README.md rewritten with executive summary, architecture, and benchmarks
  - API documentation with all 15 specifications detailed
  - Redocly configuration with navigation and theming
- **Project Structure Optimization**
  - Consistent `.openapi.yml` naming convention
  - Logical organization: core/, project/, mcp/, legacy/
  - All file paths updated in package.json
- **File Organization**
  - Moved ACDL specification from legacy/ to core/
  - Renamed inconsistent files for uniformity
  - Standardized all OpenAPI file extensions

### Fixed
- Package.json scripts now reference correct file paths
- Redocly configuration includes all 15 specifications
- TypeScript client generation working perfectly
- Build process completing successfully
- Main specification validates with only 7 warnings

### Technical Improvements
- **Performance**: <3s startup, <256MB memory, <5% CPU idle
- **Validation**: All specs pass basic OpenAPI 3.1 validation
- **Type Safety**: Complete TypeScript type generation
- **Documentation**: Interactive API docs with Redocly
- **Testing**: Comprehensive validation commands

### Migration Notes
- All API paths updated from `src/api/` to organized subdirectories
- ACDL specification promoted to core component
- Voice agent specification added to core
- Legacy specifications isolated in legacy/ directory

### Known Issues
- 7 warnings in main specification (non-blocking)
- Some legacy specs need security definitions
- Webhook operations missing operationIds (cosmetic)

## [0.1.9] - 2025-09-12

### Overview
Enhanced OSSA v0.1.9 release with master orchestrator capabilities, multi-agent coordination, and GitLab CI/CD integration.

### Added
- **OSSA Master Orchestrator**: Enhanced orchestrator with multi-agent coordination
- **CLI Enhancements**: New OSSA orchestrator commands
- **API-First Development**: OpenAPI 3.1.0 compliance
- **GitLab CI/CD Integration**: Golden component v0.1.0
- **Infrastructure Support**: Kubernetes, Helm, OrbStack deployment

## [0.1.8] - 2024-09-10

### Added
- Initial OSSA foundation and core architecture
- Basic agent specification and registry
- CLI tools prototype

---

For detailed migration instructions, see [MIGRATION.md](docs/MIGRATION.md)
For release procedures, see [RELEASE.md](RELEASE.md)