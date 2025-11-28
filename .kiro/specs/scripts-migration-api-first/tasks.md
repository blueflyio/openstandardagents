# Implementation Plan

- [ ] 1. Set up foundation and shared infrastructure
  - Create base repository interface and error hierarchy
  - Move utilities from scripts/lib to src/utils
  - Set up Zod schema directory structure
  - Create OpenAPI spec templates
  - _Requirements: 1.3, 6.1, 12.1_

- [ ] 1.1 Create base repository interface
  - Define IRepository<T, ID> interface with CRUD methods
  - Define IFileRepository<T> interface extending IRepository
  - Add TypeScript types for repository operations
  - _Requirements: 6.1_

- [ ] 1.2 Create error hierarchy
  - Implement DomainError base class with code and details
  - Implement ValidationError, NotFoundError, GitLabError, SchemaError
  - Add error code constants
  - _Requirements: 6.4, 12.5_

- [ ]* 1.3 Write property test for error types
  - **Property 14: Repository Error Types**
  - **Validates: Requirements 6.4**

- [ ]* 1.4 Write property test for utility error types
  - **Property 24: Utility Error Types**
  - **Validates: Requirements 12.5**

- [ ] 1.5 Move scripts/lib utilities to src/utils
  - Move file-ops.ts to src/utils/file-ops.ts
  - Move exec.ts to src/utils/exec.ts
  - Move version.ts to src/utils/version.ts
  - Update imports to use @utils/\* path aliases
  - _Requirements: 12.1, 12.3_

- [ ]* 1.6 Write unit tests for file-ops utility
  - Test readFile, writeFile, fileExists, requireFile
  - Test error handling for missing files
  - _Requirements: 12.1_

- [ ]* 1.7 Write unit tests for exec utility
  - Test execCommand with valid commands
  - Test error handling for failed commands
  - _Requirements: 12.1_

- [ ] 1.8 Create Zod schema directory structure
  - Create src/schemas/ directory
  - Create placeholder files for version, documentation, gitlab, schema schemas
  - Add index.ts for schema exports
  - _Requirements: 7.5_

- [ ] 1.9 Create OpenAPI spec templates
  - Create openapi/services/ directory
  - Create template structure for service specs
  - Add Redocly configuration for validation
  - _Requirements: 8.1_

- [ ] 2. Implement Version Service and Repository
  - Define OpenAPI spec for VersionService
  - Implement VersionRepository with CRUD operations
  - Implement VersionService with version management logic
  - Create CLI commands for version operations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2.1 Define OpenAPI spec for VersionService
  - Create openapi/services/version-service.openapi.yaml
  - Define operations: getCurrentVersion, bumpVersion, syncVersions, validateVersion
  - Define schemas for VersionInfo, BumpType, SyncResult
  - _Requirements: 8.1, 8.2_

- [ ] 2.2 Validate OpenAPI spec with Redocly
  - Run Redocly CLI validation on version-service spec
  - Fix any validation errors
  - _Requirements: 8.4_

- [ ]* 2.3 Write property test for OpenAPI spec validity
  - **Property 17: OpenAPI Specification Validity**
  - **Validates: Requirements 8.4**

- [ ] 2.4 Create version domain types and schemas
  - Create src/types/version.types.ts with VersionConfig, PackageJson, VersionBump interfaces
  - Create src/schemas/version.schemas.ts with Zod schemas
  - Add semver validation regex pattern
  - _Requirements: 2.2, 7.1_

- [ ]* 2.5 Write property test for version string validation
  - **Property 2: Version String Validation**
  - **Validates: Requirements 2.2**

- [ ] 2.6 Implement VersionRepository
  - Create src/repositories/version.repository.ts
  - Implement CRUD operations for .version.json
  - Implement read/write for package.json version field
  - Add Zod validation for all data operations
  - _Requirements: 2.3, 6.2, 6.3, 6.5_

- [ ]* 2.7 Write property test for repository data validation
  - **Property 12: Repository Data Validation**
  - **Validates: Requirements 6.2**

- [ ]* 2.8 Write property test for repository type safety
  - **Property 13: Repository Type Safety**
  - **Validates: Requirements 6.3**

- [ ]* 2.9 Write unit tests for VersionRepository
  - Test create, read, update, delete, list operations
  - Test error handling for missing files
  - Mock file system operations
  - _Requirements: 2.3, 6.1_

- [ ] 2.10 Implement VersionService
  - Create src/services/version.service.ts
  - Implement getCurrentVersion, bumpVersion, syncVersions, validateVersion methods
  - Add input validation with Zod schemas
  - Add output validation with Zod schemas
  - Register service in DI container
  - _Requirements: 2.1, 2.4, 2.5, 1.4, 7.2_

- [ ]* 2.11 Write property test for version bump correctness
  - **Property 3: Version Bump Correctness**
  - **Validates: Requirements 2.4**

- [ ]* 2.12 Write property test for version sync consistency
  - **Property 4: Version Sync Consistency**
  - **Validates: Requirements 2.5**

- [ ]* 2.13 Write property test for input validation
  - **Property 1: Input Validation Universality**
  - **Validates: Requirements 1.4, 7.1, 7.3**

- [ ]* 2.14 Write property test for output validation
  - **Property 15: Service Output Validation**
  - **Validates: Requirements 7.2**

- [ ]* 2.15 Write unit tests for VersionService
  - Test getCurrentVersion with mocked repository
  - Test bumpVersion for all bump types (major, minor, patch, rc, release)
  - Test syncVersions with multiple files
  - Test validateVersion with valid and invalid versions
  - Test error handling
  - _Requirements: 2.1, 2.4, 2.5_

- [ ] 2.16 Create CLI commands for version operations
  - Create src/cli/commands/version.command.ts
  - Implement bump, sync, current, validate subcommands
  - Add argument validation with Zod
  - Add service resolution from DI container
  - Add error formatting
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]* 2.17 Write property test for CLI service resolution
  - **Property 18: CLI Service Resolution**
  - **Validates: Requirements 9.2**

- [ ]* 2.18 Write property test for CLI argument validation
  - **Property 19: CLI Argument Validation**
  - **Validates: Requirements 9.3**

- [ ]* 2.19 Write property test for CLI error formatting
  - **Property 20: CLI Error Formatting**
  - **Validates: Requirements 9.4**

- [ ]* 2.20 Write integration tests for version CLI commands
  - Test bump command end-to-end with temp directory
  - Test sync command with multiple files
  - Test error scenarios
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 2.21 Create deprecated wrapper scripts
  - Create scripts/bump-version.ts wrapper with deprecation warning
  - Create scripts/sync-version.ts wrapper with deprecation warning
  - Create scripts/sync-versions.ts wrapper with deprecation warning
  - Create scripts/enhanced-version-manager.ts wrapper with deprecation warning
  - _Requirements: 11.1, 11.4_

- [ ]* 2.22 Write property test for migration backward compatibility
  - **Property 21: Migration Backward Compatibility**
  - **Validates: Requirements 11.1**

- [ ]* 2.23 Write property test for deprecation warnings
  - **Property 22: Deprecation Warning Presence**
  - **Validates: Requirements 11.4**

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Documentation Service and Repository
  - Define OpenAPI spec for DocumentationService
  - Implement DocumentationRepository
  - Implement MarkdownBuilder and OpenAPIParser utilities
  - Implement DocumentationService
  - Create CLI commands for documentation operations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4.1 Define OpenAPI spec for DocumentationService
  - Create openapi/services/documentation-service.openapi.yaml
  - Define operations: generateApiDocs, generateCliDocs, generateSchemaDocs, generateExamplesDocs, generateAllDocs
  - Define schemas for ApiDocsOptions, GenerationResult
  - _Requirements: 8.1, 8.2_

- [ ] 4.2 Validate OpenAPI spec with Redocly
  - Run Redocly CLI validation on documentation-service spec
  - Fix any validation errors
  - _Requirements: 8.4_

- [ ] 4.3 Create documentation domain types and schemas
  - Create src/types/documentation.types.ts with OpenAPISpec, DocumentationMetadata, MarkdownSection interfaces
  - Create src/schemas/documentation.schemas.ts with Zod schemas
  - _Requirements: 3.2, 7.1_

- [ ]* 4.4 Write property test for documentation input validation
  - **Property 5: Documentation Input Validation**
  - **Validates: Requirements 3.2**

- [ ] 4.5 Implement MarkdownBuilder utility
  - Create src/utils/markdown-builder.ts
  - Implement methods for headings, code blocks, lists, tables, links
  - Add fluent API for chaining operations
  - _Requirements: 3.4_

- [ ]* 4.6 Write unit tests for MarkdownBuilder
  - Test heading generation at different levels
  - Test code block generation with language hints
  - Test list and table generation
  - Test link generation
  - _Requirements: 3.4_

- [ ] 4.7 Implement OpenAPIParser utility
  - Create src/utils/openapi-parser.ts
  - Implement parsing of OpenAPI YAML/JSON specs
  - Add type-safe interfaces for OpenAPI objects
  - Add validation for required fields
  - _Requirements: 3.3_

- [ ]* 4.8 Write unit tests for OpenAPIParser
  - Test parsing valid OpenAPI specs
  - Test error handling for invalid specs
  - Test extraction of paths, operations, schemas
  - _Requirements: 3.3_

- [ ] 4.9 Implement DocumentationRepository
  - Create src/repositories/documentation.repository.ts
  - Implement CRUD operations for markdown files
  - Add directory creation and management
  - Add Zod validation for documentation metadata
  - _Requirements: 3.5, 6.1, 6.2_

- [ ]* 4.10 Write unit tests for DocumentationRepository
  - Test create, read, update, delete operations for markdown files
  - Test directory creation
  - Test error handling
  - _Requirements: 3.5, 6.1_

- [ ] 4.11 Implement DocumentationService
  - Create src/services/documentation.service.ts
  - Implement generateApiDocs, generateCliDocs, generateSchemaDocs, generateExamplesDocs methods
  - Implement generateAllDocs orchestration method
  - Add input validation with Zod schemas
  - Add output validation with Zod schemas
  - Register service in DI container
  - _Requirements: 3.1, 3.2, 1.4, 7.2_

- [ ]* 4.12 Write property test for validation error detail
  - **Property 16: Validation Error Detail**
  - **Validates: Requirements 7.3**

- [ ]* 4.13 Write unit tests for DocumentationService
  - Test generateApiDocs with mocked repository and parser
  - Test generateCliDocs with mocked dependencies
  - Test generateSchemaDocs with mocked dependencies
  - Test generateAllDocs orchestration
  - Test error handling
  - _Requirements: 3.1, 3.2_

- [ ] 4.14 Create CLI commands for documentation operations
  - Create src/cli/commands/docs.command.ts
  - Implement api, cli, schema, examples, all subcommands
  - Add argument validation with Zod
  - Add service resolution from DI container
  - Add progress indicators
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [ ]* 4.15 Write integration tests for documentation CLI commands
  - Test api docs generation end-to-end
  - Test all docs generation with multiple specs
  - Test error scenarios
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 4.16 Create deprecated wrapper scripts
  - Create wrappers for all generate-\*-docs.ts scripts (8 total)
  - Add deprecation warnings to each wrapper
  - Delegate to DocumentationService methods
  - _Requirements: 11.1, 11.4_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement GitLab Service
  - Define OpenAPI spec for GitLabService
  - Implement retry utility with exponential backoff
  - Implement GitLabService with GitLab operations
  - Create CLI commands for GitLab operations
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6.1 Define OpenAPI spec for GitLabService
  - Create openapi/services/gitlab-service.openapi.yaml
  - Define operations: rebaseMergeRequests, configureBranchProtection, createIssue, createMilestoneIssue, manageMilestoneMRs
  - Define schemas for RebaseOptions, RebaseResult, BranchProtectionConfig, IssueData, MilestoneData
  - _Requirements: 8.1, 8.2_

- [ ] 6.2 Validate OpenAPI spec with Redocly
  - Run Redocly CLI validation on gitlab-service spec
  - Fix any validation errors
  - _Requirements: 8.4_

- [ ] 6.3 Create GitLab domain types and schemas
  - Create src/types/gitlab.types.ts with MergeRequest, Issue, Milestone interfaces
  - Create src/schemas/gitlab.schemas.ts with Zod schemas
  - Add validation for project IDs, MR IDs, issue data
  - _Requirements: 4.3, 7.1_

- [ ]* 6.4 Write property test for GitLab input validation
  - **Property 6: GitLab Input Validation**
  - **Validates: Requirements 4.3**

- [ ] 6.5 Implement retry utility
  - Create src/utils/retry.ts
  - Implement exponential backoff algorithm
  - Add configurable max retries and base delay
  - Add retry condition predicate
  - _Requirements: 4.4_

- [ ]* 6.6 Write property test for GitLab retry behavior
  - **Property 7: GitLab Retry Behavior**
  - **Validates: Requirements 4.4**

- [ ]* 6.7 Write unit tests for retry utility
  - Test successful retry after failures
  - Test exponential backoff timing
  - Test max retries limit
  - Test retry condition predicate
  - _Requirements: 4.4_

- [ ] 6.8 Implement GitLabService
  - Create src/services/gitlab.service.ts
  - Implement rebaseMergeRequests, configureBranchProtection, createIssue, createMilestoneIssue, manageMilestoneMRs methods
  - Add input validation with Zod schemas
  - Add retry logic for rate limiting
  - Add authentication token validation
  - Register service in DI container
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 1.4_

- [ ]* 6.9 Write property test for GitLab authentication validation
  - **Property 8: GitLab Authentication Validation**
  - **Validates: Requirements 4.5**

- [ ]* 6.10 Write unit tests for GitLabService
  - Test rebaseMergeRequests with mocked GitLab client
  - Test configureBranchProtection with mocked client
  - Test createIssue and createMilestoneIssue
  - Test manageMilestoneMRs
  - Test retry logic with rate limit errors
  - Test authentication validation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6.11 Create CLI commands for GitLab operations
  - Create src/cli/commands/gitlab.command.ts
  - Implement rebase, protect, issue, milestone subcommands
  - Add argument validation with Zod
  - Add service resolution from DI container
  - _Requirements: 9.1, 9.2, 9.3_

- [ ]* 6.12 Write integration tests for GitLab CLI commands
  - Test rebase command with mocked GitLab API
  - Test branch protection command
  - Test issue creation command
  - Test error scenarios
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 6.13 Create deprecated wrapper scripts
  - Create wrappers for auto-rebase-mrs.ts, configure-gitlab-branch-protection.ts, create-issue-helper.ts, create-milestone-issue.ts, manage-milestone-mrs.ts
  - Add deprecation warnings to each wrapper
  - Delegate to GitLabService methods
  - _Requirements: 11.1, 11.4_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Schema Service
  - Define OpenAPI spec for SchemaService
  - Extend existing SchemaRepository
  - Implement SchemaService extending existing validation service
  - Create CLI commands for schema operations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8.1 Define OpenAPI spec for SchemaService
  - Create openapi/services/schema-service.openapi.yaml
  - Define operations: validateSchema, fixSchemaFormats, generateTypes, generateZodSchemas
  - Define schemas for ValidationOptions, FixResult, GenerationResult
  - _Requirements: 8.1, 8.2_

- [ ] 8.2 Validate OpenAPI spec with Redocly
  - Run Redocly CLI validation on schema-service spec
  - Fix any validation errors
  - _Requirements: 8.4_

- [ ] 8.3 Create schema operation types and schemas
  - Create src/schemas/schema.schemas.ts with Zod schemas for schema operations
  - Add validation for schema paths, options, formats
  - _Requirements: 7.1_

- [ ] 8.4 Extend SchemaRepository
  - Update src/repositories/schema.repository.ts
  - Add methods for schema format fixing
  - Add methods for type generation output
  - _Requirements: 5.2, 6.1_

- [ ]* 8.5 Write unit tests for extended SchemaRepository
  - Test new methods for format fixing
  - Test type generation output handling
  - _Requirements: 5.2, 6.1_

- [ ] 8.6 Implement SchemaService
  - Create src/services/schema.service.ts extending existing validation service
  - Implement validateSchema, fixSchemaFormats, generateTypes, generateZodSchemas methods
  - Add input validation with Zod schemas
  - Use json-schema-to-typescript for type generation
  - Use json-schema-to-zod for Zod schema generation
  - Register service in DI container
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 1.4_

- [ ]* 8.7 Write property test for TypeScript generation validity
  - **Property 9: TypeScript Generation Validity**
  - **Validates: Requirements 5.3**

- [ ]* 8.8 Write property test for Zod schema generation validity
  - **Property 10: Zod Schema Generation Validity**
  - **Validates: Requirements 5.4**

- [ ]* 8.9 Write property test for schema format fix preservation
  - **Property 11: Schema Format Fix Preservation**
  - **Validates: Requirements 5.5**

- [ ]* 8.10 Write unit tests for SchemaService
  - Test validateSchema with valid and invalid schemas
  - Test fixSchemaFormats with unsupported formats
  - Test generateTypes with various JSON schemas
  - Test generateZodSchemas with various JSON schemas
  - Test error handling
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8.11 Create CLI commands for schema operations
  - Create src/cli/commands/schema.command.ts
  - Implement validate, fix, gen-types, gen-zod subcommands
  - Add argument validation with Zod
  - Add service resolution from DI container
  - _Requirements: 9.1, 9.2, 9.3_

- [ ]* 8.12 Write integration tests for schema CLI commands
  - Test validate command with real schemas
  - Test fix command with schemas containing unsupported formats
  - Test gen-types command end-to-end
  - Test gen-zod command end-to-end
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 8.13 Create deprecated wrapper scripts
  - Create wrappers for validate-schema.ts, fix-schema-formats.js, gen-types.ts, gen-zod.ts
  - Add deprecation warnings to each wrapper
  - Delegate to SchemaService methods
  - _Requirements: 11.1, 11.4_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement utility configuration validation
  - Add configuration schemas for all utilities
  - Add validation for utility configurations
  - _Requirements: 12.4_

- [ ] 10.1 Create configuration schemas
  - Add Zod schemas for file-ops configuration
  - Add Zod schemas for exec configuration
  - Add Zod schemas for retry configuration
  - _Requirements: 12.4_

- [ ]* 10.2 Write property test for utility configuration validation
  - **Property 23: Utility Configuration Validation**
  - **Validates: Requirements 12.4**

- [ ]* 10.3 Write unit tests for configuration validation
  - Test valid configurations pass validation
  - Test invalid configurations are rejected
  - _Requirements: 12.4_

- [ ] 11. Final integration and cleanup
  - Verify all wrapper scripts work correctly
  - Update all documentation
  - Run full test suite
  - Verify code coverage meets 80% threshold
  - _Requirements: 11.1, 11.4, 11.5_

- [ ] 11.1 Verify wrapper script compatibility
  - Run each wrapper script with test inputs
  - Compare output with original script behavior
  - Fix any discrepancies
  - _Requirements: 11.1_

- [ ]* 11.2 Write integration tests for all wrapper scripts
  - Test each wrapper produces same output as original
  - Test deprecation warnings appear
  - Test error handling matches original
  - _Requirements: 11.1, 11.4_

- [ ] 11.3 Update documentation
  - Update README.md with new service architecture
  - Create migration guide for users
  - Update CLI documentation
  - Update API documentation
  - Add architecture diagrams
  - _Requirements: 11.5_

- [ ] 11.4 Run full test suite and verify coverage
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Generate coverage report
  - Verify 80%+ coverage for all services
  - _Requirements: 10.1_

- [ ] 11.5 Create migration guide
  - Document migration process for users
  - Provide examples of old vs new usage
  - Document breaking changes (if any)
  - Add troubleshooting section
  - _Requirements: 11.4, 11.5_

- [ ] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
