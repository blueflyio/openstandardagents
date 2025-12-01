# Changelog

All notable changes to OSSA (Open Standard for Scalable AI Agents) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.8] - 2025-11-30

### Fixed
- Version synchronization across all project files
- Corrected `.version.json` to match package version
- Schema export paths in package.json

### Changed
- Updated latest_stable reference to 0.2.5-RC (skipping burned 0.2.6/0.2.7)

## [0.2.6] - 2025-11-26

### Added
- **ossa-dev**: Development server with hot reload
- **ossa-generate**: Scaffold agents and adapters
- **ossa-health**: Health check utility
- Brand positioning and value proposition framework
- Visual identity system specification
- Competitive comparison matrix
- GitHub mirroring deployment guide
- Spec v0.2.6-dev development structure

### Fixed
- Version synchronization across project files
- Website deployment configuration
- Missing spec directories (v0.2.4, v0.2.5)

### Documentation
- CLI utilities guide
- Brand guide framework
- Comparison with LangChain, AutoGen, MCP, Semantic Kernel
- Migration paths from alternatives

## [v0.2.5-RC] - 2025-11-26

### Added

- **ossa run command**: New CLI command to execute agents using the OpenAI adapter
  - Interactive REPL mode for ongoing conversations
  - Single message mode with `-m, --message` flag
  - Verbose output with `-v, --verbose` flag for debugging
  - Configurable max turns with `--max-turns` option
  - Runtime selection with `-r, --runtime` flag (currently supports OpenAI)
  - Validation toggle with `--no-validate` flag
  - Comprehensive error handling and user-friendly messages

- **OpenAI Adapter**: Complete runtime adapter for OpenAI API integration
  - OpenAI function calling API support
  - Tool registration and execution with custom handlers
  - Conversation history management
  - Model selection from manifest or OpenAI extensions
  - System prompt configuration
  - Tool mapping from OSSA capabilities to OpenAI functions
  - Temperature and max tokens configuration
  - Max turns limit to prevent infinite loops

- **Documentation**:
  - Complete CLI reference for `ossa run` command
  - Comprehensive OpenAI adapter guide
  - Enhanced running agents guide with troubleshooting
  - README.md updated with run command examples

- **Examples**:
  - Basic OpenAI agent example (`examples/openai/basic-agent.ossa.yaml`)
  - Advanced multi-tool agent example (`examples/openai/multi-tool-agent.ossa.json`)

- **Tests**:
  - Unit tests for run command
  - Unit tests for OpenAI adapter
  - Integration tests for CLI execution

### Changed

- Enhanced getting started documentation with detailed option descriptions
- Updated README.md with running agents section

## [0.2.4](https://github.com/blueflyio/openstandardagents/compare/v0.2.3...v0.2.4) (2025-11-19)

### Package Rename

- **IMPORTANT**: Package renamed from `@bluefly/open-standards-scalable-agents` to `@bluefly/openstandardagents`
- The old package `@bluefly/open-standards-scalable-agents` has been deprecated
- Update your dependencies: `npm install @bluefly/openstandardagents`

### Website Fixes

- Fixed 100+ broken links (gitlab.com → github.com/blueflyio/openstandardagents)
- Fixed npm registry auth in CI pipeline
- Standardized all package references across documentation
- Fixed broken internal links (/docs/deployment, /research, CLI-Reference)
- Updated all schema version references to v0.2.3
- Fixed RSS feed base URL to openstandardagents.org

## [0.2.3](https://github.com/blueflyio/openstandardagents/compare/v0.2.2...v0.2.3) (2025-11-12)

### Documentation

- **spec**: Created versioned release structure in spec/v0.2.3/ with schema, README, CHANGELOG, and migration guide
- **examples**: Enhanced inline documentation for kAgent and integration pattern examples
- **migrations**: Added comprehensive migration guide from v0.2.2 to v0.2.3 (no breaking changes)
- **compatibility**: Documented backward compatibility with v0.2.2

### Features

- **schema**: Added v0.2.3 schema support with backward compatibility for v0.2.2
- **types**: Extended SchemaVersion type to include '0.2.3'
- **repository**: Updated SchemaRepository to load v0.2.3 schema files
- **validation**: Set v0.2.3 as default version for validation service

### Bug Fixes

- **git**: Cleaned up diverged branches (merged main → development)
- **tags**: Removed erroneous v0.3.0 tag from repository
- **versions**: Reset all version references to 0.2.3 (removed v2.0.0 confusion)

### BREAKING CHANGES

**None** - This is a fully backward-compatible patch release. All v0.2.2 manifests work without modification.

## [2.0.0](https://github.com/blueflyio/openstandardagents/compare/v1.0.0...v2.0.0) (2025-11-05)

### Bug Fixes

- add v0.2.2 schema JSON files to git ([7ad617a](https://github.com/blueflyio/openstandardagents/commit/7ad617a5bcdb2304e4aaa9424562fa1654d90fb4))
- add v0.2.2 schema support and set as default ([da22d4d](https://github.com/blueflyio/openstandardagents/commit/da22d4d47d4e9cc732c33290f971c670647d3318))
- all tests pass with v0.2.2 format ([ee00098](https://github.com/blueflyio/openstandardagents/commit/ee00098772bbb9b6c128b483dce0366ce983329c))
- change releases to manual triggers on main branch only ([7d48895](https://github.com/blueflyio/openstandardagents/commit/7d4889515c85107c9ca56cb624ebe70846af6041))
- complete ESM module support with proper .js extensions ([b9754f3](https://github.com/blueflyio/openstandardagents/commit/b9754f384cde11640860ceb3370b8180c290c2b8))
- convert ES module syntax in convert-to-kagent.js ([dba2b37](https://github.com/blueflyio/openstandardagents/commit/dba2b37c3992545b0230e6ae0458a0c215c54852))
- convert ES module syntax in convert-to-kagent.js ([9b00af6](https://github.com/blueflyio/openstandardagents/commit/9b00af64966ea0a2a2183ecbcd4b2837767968f0))
- convert release.config.js to ES module syntax ([b9cacbf](https://github.com/blueflyio/openstandardagents/commit/b9cacbfda385234034f6afb19925c6884bacb3cc))
- correct version from 1.0.0 to 0.3.0 ([1786934](https://github.com/blueflyio/openstandardagents/commit/178693428cf72d8bdc216ddfd65d111ec41f811f))
- correct version to 0.2.1 (patch bump) ([4227258](https://github.com/blueflyio/openstandardagents/commit/42272581065db0fc3bf30b3f4fd65a27af0dfd93))
- disable promote-to-main job - use merge requests for main branch ([76e4e0b](https://github.com/blueflyio/openstandardagents/commit/76e4e0b6284ca346dd9768e827bbb5c083226a5c))
- **ci:** make promote-to-main fast-forward-only; auto-create MR on conflicts via API ([a414db0](https://github.com/blueflyio/openstandardagents/commit/a414db0d5fda70d499ef9e55162f499a39d029a8))
- **ci:** make promote-to-main script a single multiline string to satisfy YAML parsing ([c1563ea](https://github.com/blueflyio/openstandardagents/commit/c1563eae6a90365db699f5e3c63e9268ec79e1dd))
- **ci:** promote-to-main handles shallow clones and unrelated histories; add auth remote ([7a66d60](https://github.com/blueflyio/openstandardagents/commit/7a66d60142541505d0a65d0d5413adc34c24a235))
- **ci:** remove colon from commit message to fix YAML parsing ([260270a](https://github.com/blueflyio/openstandardagents/commit/260270a24ce59752aef963a293b62b26e2c996c0))
- **ci:** remove invalid need on promote-to-main (cannot need later-stage job) ([211dbf7](https://github.com/blueflyio/openstandardagents/commit/211dbf7cd38e3ffc4dac3ced00cf320754f815f1))
- **ci:** remove stray text and update development branch git config ([eb895b5](https://github.com/blueflyio/openstandardagents/commit/eb895b580ab27cf84bc005340eeff43ce6c2bb6c))
- **ci:** rename job to avoid YAML colon parsing issue ([f641574](https://github.com/blueflyio/openstandardagents/commit/f6415745b4423636d332915e9061e948142a3959))
- replace all gitlab.com references with new instance ([89496c7](https://github.com/blueflyio/openstandardagents/commit/89496c7fa1e723491482f4c804fd9addf0da65f8))
- update GitLab instance references ([b8480a6](https://github.com/blueflyio/openstandardagents/commit/b8480a6d089c790f1d4f17359f9c79951239824e))
- revert to version 0.2.2 and fix schema validation ([5789f6d](https://github.com/blueflyio/openstandardagents/commit/5789f6d7bfa0cc8638307902701ac967579097b0))
- schema formatting ([3dd018b](https://github.com/blueflyio/openstandardagents/commit/3dd018b56756da1821658a4a7ee8986e55c4b632))
- update all tests for v0.2.2 format ([34bb695](https://github.com/blueflyio/openstandardagents/commit/34bb695bd2376b9d93d47d6867bf8b1f4a4e4b73))
- update CHANGELOG version to 0.3.0 ([b10b9f4](https://github.com/blueflyio/openstandardagents/commit/b10b9f4c38ece7455995ccd96a28d4cfedf4df36))
- **ci:** update Node.js version to 22 for semantic-release compatibility ([eef4b89](https://github.com/blueflyio/openstandardagents/commit/eef4b89de9e4ef4cf3361a9e95d30ee81e706e78))
- update version to 0.2.2 and reorganize spec directory ([5f9a8a0](https://github.com/blueflyio/openstandardagents/commit/5f9a8a0f3d7fa6386d88e07da70c5fd775812bc8))
- **aiflow:** URGENT - Reduce CPU requests from 500m to 50m ([846c8fd](https://github.com/blueflyio/openstandardagents/commit/846c8fda3861120d6324ce957bf33b03fa484826))
- **ci:** use PRIVATE-TOKEN with CI_JOB_TOKEN for MR API; reuse existing MR if present ([afd8c25](https://github.com/blueflyio/openstandardagents/commit/afd8c258b635c519bd0698adb8972e1c09e6efe4))
- validate command supports both v0.2.2 and v1.0 formats ([4d777d0](https://github.com/blueflyio/openstandardagents/commit/4d777d08ab49267ad8670acaf8d0fdfb3617cfb9))

### chore

- clean up OSSA for npm publication ([f6d2c27](https://github.com/blueflyio/openstandardagents/commit/f6d2c27b3ac972cf065bfe4d67cf1d9e51f47b51))

### Features

- add CryptoSage AIFlow social agent example ([9c03a6b](https://github.com/blueflyio/openstandardagents/commit/9c03a6b94f0741a56e1aaaefebd71d387f428235))
- add CryptoSage AIFlow social agent example ([36a1a21](https://github.com/blueflyio/openstandardagents/commit/36a1a219d546bf29185c4df7218a844e5891a70c))
- add ecosystem tasks orchestrator agent ([276b868](https://github.com/blueflyio/openstandardagents/commit/276b868722d46ed1198f3a7ffc1f37e815d82d3b))
- add ecosystem tasks orchestrator agent ([b9ac082](https://github.com/blueflyio/openstandardagents/commit/b9ac082f2746107de11ebddba26fcc0e5c065ea0))
- add kagent.dev and AIFlow-Agent bridge support to OSSA 1.0 ([c83f462](https://github.com/blueflyio/openstandardagents/commit/c83f46270cf7264dbe6b7a3936373a6568f6015e))
- add kagent.dev and AIFlow-Agent bridge support to OSSA 1.0 ([2a98c1e](https://github.com/blueflyio/openstandardagents/commit/2a98c1ebd09eb7d34992dee44074073f070f89bf))
- **ci:** add manual merge-to-main button after successful pipeline ([d3fb40c](https://github.com/blueflyio/openstandardagents/commit/d3fb40c5d1aef7bda5cac15d0c2215cfc3f77a37))
- **ci:** add manual promotion and release buttons ([c57fb66](https://github.com/blueflyio/openstandardagents/commit/c57fb66e3f258a0ae87c51db9d6f2c1d7d9cdff2))
- **ossa:** add OpenAI Agents SDK bridge extension ([3cf4c9f](https://github.com/blueflyio/openstandardagents/commit/3cf4c9fd5ae6c042a96c5ec328d514bacd8936c9))
- add OpenAPI/Swagger specification extensions for AI agents ([bfe5025](https://github.com/blueflyio/openstandardagents/commit/bfe5025a83d06449648cd3e92588568bc42217c8))
- **compliance:** Add OSSA reasoning compliance extension schema for chain-of-thought auditing ([9bb60ec](https://github.com/blueflyio/openstandardagents/commit/9bb60ecc20b56df65f0e3d5e8562104386b773d7))
- **automation:** Add resource validation to prevent cluster exhaustion ([3910b66](https://github.com/blueflyio/openstandardagents/commit/3910b662905661504e57969bc4d76b6c87282dbc))
- add semantic-release for automated versioning ([589d530](https://github.com/blueflyio/openstandardagents/commit/589d5304c8e1b5a59d3ba0b15a809a961acc4e7e))
- complete OSSA ecosystem automation suite ([cbef539](https://github.com/blueflyio/openstandardagents/commit/cbef539551430f7710cf689f50ea0aad4c8d3bb2))
- complete OSSA ecosystem automation suite ([abc485f](https://github.com/blueflyio/openstandardagents/commit/abc485fc00344a3fe405739b734d8807cdf9adc2))
- complete OSSA v0.2.2 agent migration with framework integration ([b0ab662](https://github.com/blueflyio/openstandardagents/commit/b0ab662f31faafed8de01e2ffb4a5a8c948eb634))
- Complete OSSA v1.0 TypeScript implementation with Drupal integration ([be27188](https://github.com/blueflyio/openstandardagents/commit/be271880728e4dc6f164b4c85af432daf3d66858))
- **aiflow:** Complete Phases 2 & 3 - Production-ready AIFlow integration ([0f81e9d](https://github.com/blueflyio/openstandardagents/commit/0f81e9d0c77586241caf94e593ad738481c0f68d)), closes [#1876](https://github.com/blueflyio/openstandardagents/issues/1876) [#1877](https://github.com/blueflyio/openstandardagents/issues/1877) [#1878](https://github.com/blueflyio/openstandardagents/issues/1878)
- Complete platform integration - OpenAPI + Helm for all projects ([d7140aa](https://github.com/blueflyio/openstandardagents/commit/d7140aac1e780d6094ef5aa20cf31c9adf3072d6))
- Enhanced OSSA CLI with audit, inspect, and schema commands ([ca21cc2](https://github.com/blueflyio/openstandardagents/commit/ca21cc271161f592dd39a9e4bd7d7f3fd97a0004)), closes [#178](https://github.com/blueflyio/openstandardagents/issues/178)
- integrate v1.0 to v0.2.2 migration into OSSA CLI ([349c4dd](https://github.com/blueflyio/openstandardagents/commit/349c4ddda10066a628447fff6a62edc09615e3be))
- **kagent:** intelligent agent deployment + ecosystem tooling ([b602d25](https://github.com/blueflyio/openstandardagents/commit/b602d25e9b200e01ff07be1fdf95a09da5938cb6))
- intelligent agent deployment with resource optimization ([e9fba1e](https://github.com/blueflyio/openstandardagents/commit/e9fba1eedab9dcc6c5e0674a192bdf5315152984))
- mass cleanup and standardization - ZERO ERRORS ([79cb19d](https://github.com/blueflyio/openstandardagents/commit/79cb19d1e8b7b0454a25abf9a8e18d765aae5fd8))
- mass cleanup and standardization - ZERO ERRORS ([cd6f1cc](https://github.com/blueflyio/openstandardagents/commit/cd6f1cc5278c74bde5b1ad63e71d8665e0bb26a4))
- mass cleanup and standardization - ZERO ERRORS ([3452f4f](https://github.com/blueflyio/openstandardagents/commit/3452f4f3c2b0a9d9ac72ac2c6917a4bda5ac050c))
- **spec:** organize OSSA spec with clean v1.0 versioning ([08468e3](https://github.com/blueflyio/openstandardagents/commit/08468e3831fa8dc8e83bc2bbfdae352ab3f33e10))
- OSSA v0.1.9 with kAgent extension support ([1d4c0b5](https://github.com/blueflyio/openstandardagents/commit/1d4c0b50cdcb5d4bf2fcc3f648968688f3139517))
- **aiflow:** Phase 2 - BuildKit registration, Phoenix tracing, integration tests ([ee7279d](https://github.com/blueflyio/openstandardagents/commit/ee7279db63cee7afe4be2a2b044d87b40778f0f4)), closes [#1876](https://github.com/blueflyio/openstandardagents/issues/1876)
- **aiflow:** Phase 3 - K8s deployment, load testing, CI/CD, monitoring ([f5b9f46](https://github.com/blueflyio/openstandardagents/commit/f5b9f46ddea9fc90910a773093d620813a5945b1)), closes [#1877](https://github.com/blueflyio/openstandardagents/issues/1877)
- **aiflow:** Phase 3 - Production deployment, load testing, monitoring ([6066100](https://github.com/blueflyio/openstandardagents/commit/60661001e698edf269c4b4d2a450dc36090c0935)), closes [#1877](https://github.com/blueflyio/openstandardagents/issues/1877)
- **aiflow:** Phase 4 - SLO/SLA, incident response, chaos engineering ([3fb78f1](https://github.com/blueflyio/openstandardagents/commit/3fb78f15a25e9cf700e8e61bf68c088652afc066)), closes [#1878](https://github.com/blueflyio/openstandardagents/issues/1878)
- update k6 load testing scenarios ([e0bfc15](https://github.com/blueflyio/openstandardagents/commit/e0bfc1550962e8357fd446f23babdec7ff7634ef))

### BREAKING CHANGES

- None - this is additive functionality
- Manual version management replaced with semantic-release
- Cleaned up project structure for v1.0.0 release
- - Removed old Jest config and legacy tests

* Removed helm charts (moved to agent-buildkit)
* CLI now uses TypeScript compiled output

Test Results: 68/68 passing, 97.85% coverage
Status: Production Ready

- - CLI now requires OSSA 1.0 manifest format

* Production example updated to OSSA 1.0 spec

New Features:

- audit command: Score agents 0-100 on completeness, best practices, security, performance
- inspect command: Detailed agent information with --json output
- schema command: Query schema attributes (roles, protocols, compliance, bridges)
- Fixed ES module conflicts in CLI

Improvements:

- Production example validates with 80/100 audit score
- All required fields properly enforced
- Comprehensive validation output
