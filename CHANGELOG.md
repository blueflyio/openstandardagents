# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3] - 2025-11-02

### Fixed
- Added missing `bin/ossa` CLI entry point to fix E2E tests
- Fixed Jest configuration to use CommonJS for tests (resolved ts-jest ESM parsing errors)
- Added `isolatedModules: true` to `tsconfig.test.json` to suppress ts-jest warnings
- Created missing `examples/kagent/README.md` documentation file

### Changed
- Updated `jest.config.ts` to disable ESM mode for better test compatibility
- Updated `tsconfig.test.json` to use CommonJS module system for tests

### Testing
- All 67 tests now passing (9 test suites)
- Build successfully compiles with TypeScript
- E2E workflow tests validated

## [0.2.2] - 2025-10-30

### Added
- Initial version with OSSA specification v0.2.2
- CLI commands: validate, generate, migrate
- Full test suite with unit, integration, and E2E tests
- TypeScript types and Zod validation schemas

### Features
- Agent manifest validation against JSON schemas
- Agent generation from templates (chat, workflow, compliance)
- Migration from v1.0 to v0.2.2 format
- Support for multiple runtimes (docker, k8s, serverless)
- kAgent extension examples for Kubernetes deployment
