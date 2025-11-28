# Requirements Document

## Introduction

This document outlines the requirements for migrating the `/scripts` directory into `/src` following API-first, DRY (Don't Repeat Yourself), CRUD, Zod validation, and OpenAPI principles. The current scripts directory contains 30+ utility scripts with duplicated logic, inconsistent error handling, and no formal API contracts. This migration will transform these scripts into a well-architected, type-safe, API-first service layer with proper separation of concerns.

## Glossary

- **Script**: A standalone executable file in the `/scripts` directory that performs automation tasks
- **Service**: A class-based module in `/src/services` that encapsulates business logic with dependency injection
- **Repository**: A data access layer class that handles CRUD operations for a specific domain entity
- **API Contract**: An OpenAPI specification defining the interface for a service or endpoint
- **Zod Schema**: A TypeScript-first schema validation library used for runtime type checking
- **DRY Principle**: Don't Repeat Yourself - eliminating code duplication through abstraction
- **CRUD Operations**: Create, Read, Update, Delete - standard data manipulation operations
- **CLI Command**: A command-line interface entry point that delegates to services
- **Validation Service**: The existing service at `src/services/validation.service.ts`
- **Generation Service**: The existing service at `src/services/generation.service.ts`
- **Migration Service**: The existing service at `src/services/migration.service.ts`

## Requirements

### Requirement 1

**User Story:** As a developer, I want all script functionality exposed through well-defined service APIs, so that I can reuse logic programmatically without duplicating code.

#### Acceptance Criteria

1. WHEN analyzing the scripts directory THEN the system SHALL identify all unique functional domains (version management, documentation generation, GitLab operations, schema operations, validation)
2. WHEN creating services THEN the system SHALL define OpenAPI specifications for each service before implementation
3. WHEN implementing services THEN the system SHALL use dependency injection with the existing DI container at `src/di-container.ts`
4. WHEN exposing service methods THEN the system SHALL validate all inputs using Zod schemas
5. WHERE a service performs data persistence THEN the system SHALL implement a repository pattern with CRUD operations

### Requirement 2

**User Story:** As a developer, I want version management operations centralized in a service, so that version bumping, syncing, and validation follow consistent patterns.

#### Acceptance Criteria

1. WHEN the VersionService is created THEN the system SHALL consolidate logic from `bump-version.ts`, `sync-version.ts`, `sync-versions.ts`, and `enhanced-version-manager.ts`
2. WHEN performing version operations THEN the system SHALL validate version strings using Zod schemas matching semver format
3. WHEN reading version data THEN the system SHALL use a VersionRepository implementing CRUD operations for `.version.json` and `package.json`
4. WHEN bumping versions THEN the system SHALL support major, minor, patch, and RC bump types
5. WHEN syncing versions THEN the system SHALL update all version references across package.json, .version.json, and spec directories

### Requirement 3

**User Story:** As a developer, I want documentation generation operations centralized in a service, so that generating API docs, CLI docs, schema docs, and other documentation follows a unified pattern.

#### Acceptance Criteria

1. WHEN the DocumentationService is created THEN the system SHALL consolidate logic from all `generate-*-docs.ts` scripts (8 scripts total)
2. WHEN generating documentation THEN the system SHALL validate input specifications using Zod schemas
3. WHEN processing OpenAPI specs THEN the system SHALL use a shared OpenAPI parser with type-safe interfaces
4. WHEN generating markdown THEN the system SHALL use a MarkdownBuilder utility class for consistent formatting
5. WHEN writing documentation files THEN the system SHALL use a DocumentationRepository implementing CRUD operations

### Requirement 4

**User Story:** As a developer, I want GitLab operations centralized in a service, so that merge request management, branch protection, and issue creation follow consistent patterns.

#### Acceptance Criteria

1. WHEN the GitLabService is created THEN the system SHALL consolidate logic from `auto-rebase-mrs.ts`, `configure-gitlab-branch-protection.ts`, `create-issue-helper.ts`, `create-milestone-issue.ts`, and `manage-milestone-mrs.ts`
2. WHEN making GitLab API calls THEN the system SHALL use the existing `@gitbeaker/node` client with proper error handling
3. WHEN validating GitLab inputs THEN the system SHALL use Zod schemas for project IDs, merge request IDs, and issue data
4. WHEN performing GitLab operations THEN the system SHALL implement retry logic with exponential backoff for rate limiting
5. WHERE GitLab operations require authentication THEN the system SHALL validate API tokens using environment variable validation

### Requirement 5

**User Story:** As a developer, I want schema operations centralized in a service, so that schema validation, generation, and fixing follow consistent patterns.

#### Acceptance Criteria

1. WHEN the SchemaService is created THEN the system SHALL consolidate logic from `validate-schema.ts`, `fix-schema-formats.js`, `gen-types.ts`, and `gen-zod.ts`
2. WHEN validating schemas THEN the system SHALL use the existing SchemaRepository at `src/repositories/schema.repository.ts`
3. WHEN generating TypeScript types THEN the system SHALL use `json-schema-to-typescript` with consistent compiler options
4. WHEN generating Zod schemas THEN the system SHALL use `json-schema-to-zod` with proper type mappings
5. WHEN fixing schema formats THEN the system SHALL remove unsupported format constraints while preserving schema semantics

### Requirement 6

**User Story:** As a developer, I want all services to follow CRUD repository patterns, so that data access is consistent and testable.

#### Acceptance Criteria

1. WHEN creating repositories THEN the system SHALL implement a base Repository interface with create, read, update, delete, and list methods
2. WHEN implementing repositories THEN the system SHALL use Zod schemas to validate data before persistence
3. WHEN reading data THEN the system SHALL return typed domain objects, not raw JSON
4. WHEN handling errors THEN the system SHALL throw typed domain errors, not generic Error objects
5. WHERE repositories access the filesystem THEN the system SHALL use the existing file-ops utilities with proper error handling

### Requirement 7

**User Story:** As a developer, I want all service inputs and outputs validated with Zod, so that runtime type safety matches compile-time types.

#### Acceptance Criteria

1. WHEN defining service methods THEN the system SHALL create Zod schemas for all input parameters
2. WHEN service methods return data THEN the system SHALL validate output data against Zod schemas
3. WHEN validation fails THEN the system SHALL throw ZodError with detailed error messages
4. WHERE complex validation logic exists THEN the system SHALL use Zod refinements and transforms
5. WHEN schemas are reused THEN the system SHALL export them from a central `schemas` directory

### Requirement 8

**User Story:** As a developer, I want OpenAPI specifications for all services, so that service contracts are documented and can be validated.

#### Acceptance Criteria

1. WHEN creating a service THEN the system SHALL define an OpenAPI 3.1 specification in `openapi/services/` before implementation
2. WHEN defining operations THEN the system SHALL use OpenAPI operation objects with complete parameter and response definitions
3. WHEN services have shared types THEN the system SHALL use OpenAPI components and $ref for reusability
4. WHEN OpenAPI specs are created THEN the system SHALL validate them using Redocly CLI
5. WHERE services expose HTTP endpoints THEN the system SHALL generate API documentation from OpenAPI specs

### Requirement 9

**User Story:** As a developer, I want CLI commands to delegate to services, so that business logic is not embedded in CLI code.

#### Acceptance Criteria

1. WHEN creating CLI commands THEN the system SHALL use the existing Commander.js setup in `src/cli/`
2. WHEN CLI commands execute THEN the system SHALL resolve services from the DI container
3. WHEN CLI commands receive arguments THEN the system SHALL validate them using Zod before passing to services
4. WHEN services throw errors THEN the system SHALL catch them in CLI commands and format user-friendly error messages
5. WHERE CLI commands need progress indication THEN the system SHALL use consistent spinner/progress bar patterns

### Requirement 10

**User Story:** As a developer, I want comprehensive test coverage for all services, so that refactoring is safe and regressions are caught early.

#### Acceptance Criteria

1. WHEN implementing services THEN the system SHALL achieve minimum 80% code coverage
2. WHEN writing unit tests THEN the system SHALL mock repository dependencies using Jest
3. WHEN writing property-based tests THEN the system SHALL use fast-check with minimum 100 iterations
4. WHEN testing error conditions THEN the system SHALL verify proper error types and messages are thrown
5. WHERE services have complex business logic THEN the system SHALL write integration tests with real file system operations

### Requirement 11

**User Story:** As a developer, I want the migration to be incremental, so that the system remains functional throughout the transition.

#### Acceptance Criteria

1. WHEN migrating scripts THEN the system SHALL maintain backward compatibility by keeping original scripts as thin wrappers
2. WHEN services are implemented THEN the system SHALL update one functional domain at a time
3. WHEN testing migration THEN the system SHALL verify original script behavior matches new service behavior
4. WHERE scripts are deprecated THEN the system SHALL add deprecation warnings with migration instructions
5. WHEN migration is complete THEN the system SHALL remove deprecated scripts and update all documentation

### Requirement 12

**User Story:** As a developer, I want shared utilities properly organized, so that common functionality is easily discoverable and reusable.

#### Acceptance Criteria

1. WHEN organizing utilities THEN the system SHALL move `scripts/lib/*` to `src/utils/` with proper exports
2. WHEN creating new utilities THEN the system SHALL follow single responsibility principle with focused modules
3. WHEN utilities are used THEN the system SHALL import from path aliases (`@utils/*`) not relative paths
4. WHERE utilities have configuration THEN the system SHALL use Zod schemas for configuration validation
5. WHEN utilities throw errors THEN the system SHALL use typed domain errors with proper error codes
