# Design Document

## Overview

This design document outlines the architecture for migrating the `/scripts` directory into `/src` following API-first, DRY, CRUD, Zod validation, and OpenAPI principles. The migration transforms 30+ standalone scripts into a cohesive service-oriented architecture with proper separation of concerns, comprehensive validation, and formal API contracts.

### Goals

- **API-First**: Define OpenAPI specifications before implementation
- **DRY**: Eliminate code duplication through shared services and utilities
- **CRUD**: Implement repository pattern for all data access
- **Type Safety**: Use Zod for runtime validation matching TypeScript types
- **Testability**: Achieve 80%+ code coverage with unit and property-based tests
- **Incremental Migration**: Maintain backward compatibility throughout transition

### Non-Goals

- Changing the functionality of existing scripts
- Adding new features beyond consolidation
- Migrating CLI commands to HTTP APIs (remains CLI-focused)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                             │
│  (src/cli/commands/) - Commander.js commands                 │
│  - Argument validation with Zod                              │
│  - Service resolution from DI container                      │
│  - Error formatting and user feedback                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  (src/services/) - Business logic and orchestration          │
│  - VersionService: Version management operations             │
│  - DocumentationService: Doc generation operations           │
│  - GitLabService: GitLab API operations                      │
│  - SchemaService: Schema validation and generation           │
│  - Input/output validation with Zod                          │
│  - Dependency injection                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Repository Layer                          │
│  (src/repositories/) - Data access with CRUD operations      │
│  - VersionRepository: .version.json, package.json            │
│  - DocumentationRepository: Markdown files                   │
│  - SchemaRepository: JSON schemas (existing)                 │
│  - ManifestRepository: OSSA manifests (existing)             │
│  - Data validation with Zod                                  │
│  - Typed domain objects                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Utility Layer                           │
│  (src/utils/) - Shared utilities                             │
│  - file-ops: File system operations                          │
│  - exec: Command execution                                   │
│  - markdown-builder: Markdown generation                     │
│  - openapi-parser: OpenAPI spec parsing                      │
│  - retry: Retry logic with backoff                           │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── cli/
│   └── commands/
│       ├── version.command.ts       # Version management commands
│       ├── docs.command.ts          # Documentation generation commands
│       ├── gitlab.command.ts        # GitLab operations commands
│       └── schema.command.ts        # Schema operations commands
├── services/
│   ├── version.service.ts           # Version management service
│   ├── documentation.service.ts     # Documentation generation service
│   ├── gitlab.service.ts            # GitLab operations service
│   ├── schema.service.ts            # Schema operations service (extends existing)
│   ├── validation.service.ts        # Existing validation service
│   ├── generation.service.ts        # Existing generation service
│   └── migration.service.ts         # Existing migration service
├── repositories/
│   ├── base.repository.ts           # Base repository interface
│   ├── version.repository.ts        # Version data repository
│   ├── documentation.repository.ts  # Documentation file repository
│   ├── schema.repository.ts         # Existing schema repository
│   └── manifest.repository.ts       # Existing manifest repository
├── utils/
│   ├── file-ops.ts                  # File system operations (from scripts/lib)
│   ├── exec.ts                      # Command execution (from scripts/lib)
│   ├── markdown-builder.ts          # Markdown generation utility
│   ├── openapi-parser.ts            # OpenAPI spec parser
│   ├── retry.ts                     # Retry logic with exponential backoff
│   └── errors.ts                    # Typed domain errors
├── schemas/
│   ├── version.schemas.ts           # Version-related Zod schemas
│   ├── documentation.schemas.ts     # Documentation-related Zod schemas
│   ├── gitlab.schemas.ts            # GitLab-related Zod schemas
│   └── schema.schemas.ts            # Schema operation Zod schemas
└── types/
    ├── version.types.ts             # Version domain types
    ├── documentation.types.ts       # Documentation domain types
    └── gitlab.types.ts              # GitLab domain types

openapi/
└── services/
    ├── version-service.openapi.yaml       # Version service API contract
    ├── documentation-service.openapi.yaml # Documentation service API contract
    ├── gitlab-service.openapi.yaml        # GitLab service API contract
    └── schema-service.openapi.yaml        # Schema service API contract

scripts/
└── (deprecated wrappers that delegate to services)
```

## Components and Interfaces

### Base Repository Interface

```typescript
// src/repositories/base.repository.ts
export interface IRepository<T, ID = string> {
  create(data: T): Promise<T>;
  read(id: ID): Promise<T | null>;
  update(id: ID, data: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
  list(): Promise<T[]>;
}

export interface IFileRepository<T> extends IRepository<T, string> {
  exists(path: string): Promise<boolean>;
  readRaw(path: string): Promise<string>;
  writeRaw(path: string, content: string): Promise<void>;
}
```

### Version Service

```typescript
// src/services/version.service.ts
export interface IVersionService {
  getCurrentVersion(): Promise<VersionInfo>;
  bumpVersion(type: BumpType): Promise<VersionInfo>;
  syncVersions(): Promise<SyncResult>;
  validateVersion(version: string): boolean;
  getSchemaPath(version: string): string;
}

export type BumpType = 'major' | 'minor' | 'patch' | 'rc' | 'release';

export interface VersionInfo {
  current: string;
  latest_stable: string;
  previous: string[];
}

export interface SyncResult {
  updated: string[];
  skipped: string[];
  errors: Array<{ file: string; error: string }>;
}
```

### Documentation Service

```typescript
// src/services/documentation.service.ts
export interface IDocumentationService {
  generateApiDocs(options: ApiDocsOptions): Promise<GenerationResult>;
  generateCliDocs(options: CliDocsOptions): Promise<GenerationResult>;
  generateSchemaDocs(options: SchemaDocsOptions): Promise<GenerationResult>;
  generateExamplesDocs(options: ExamplesDocsOptions): Promise<GenerationResult>;
  generateAllDocs(): Promise<GenerationResult[]>;
}

export interface ApiDocsOptions {
  specPath: string;
  outputPath: string;
  format?: 'markdown' | 'html';
}

export interface GenerationResult {
  success: boolean;
  filesGenerated: string[];
  errors: string[];
}
```

### GitLab Service

```typescript
// src/services/gitlab.service.ts
export interface IGitLabService {
  rebaseMergeRequests(projectId: number, options: RebaseOptions): Promise<RebaseResult>;
  configureBranchProtection(projectId: number, config: BranchProtectionConfig): Promise<void>;
  createIssue(projectId: number, issue: IssueData): Promise<Issue>;
  createMilestoneIssue(projectId: number, milestone: MilestoneData): Promise<Issue>;
  manageMilestoneM Rs(projectId: number, milestoneId: number, action: MRAction): Promise<MRResult>;
}

export interface RebaseOptions {
  targetBranch?: string;
  dryRun?: boolean;
  maxRetries?: number;
}

export interface RebaseResult {
  rebased: number[];
  failed: Array<{ mrId: number; error: string }>;
  skipped: number[];
}
```

### Schema Service

```typescript
// src/services/schema.service.ts
export interface ISchemaService {
  validateSchema(
    schemaPath: string,
    options?: ValidationOptions
  ): Promise<ValidationResult>;
  fixSchemaFormats(schemaPath: string): Promise<FixResult>;
  generateTypes(
    schemaPath: string,
    outputPath: string
  ): Promise<GenerationResult>;
  generateZodSchemas(
    schemaPath: string,
    outputPath: string
  ): Promise<GenerationResult>;
}

export interface ValidationOptions {
  strict?: boolean;
  formats?: string[];
}

export interface FixResult {
  fixed: boolean;
  removedFormats: string[];
  outputPath: string;
}
```

## Data Models

### Version Domain Models

```typescript
// src/types/version.types.ts
export interface VersionConfig {
  current: string;
  latest_stable: string;
  previous: string[];
  deprecated?: string[];
}

export interface PackageJson {
  name: string;
  version: string;
  [key: string]: any;
}

export interface VersionBump {
  from: string;
  to: string;
  type: BumpType;
  timestamp: Date;
}
```

### Documentation Domain Models

```typescript
// src/types/documentation.types.ts
export interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  servers?: OpenAPIServer[];
  paths: Record<string, PathItem>;
  components?: Components;
}

export interface DocumentationMetadata {
  title: string;
  version: string;
  generatedAt: Date;
  sourceFile: string;
}

export interface MarkdownSection {
  heading: string;
  level: number;
  content: string;
  subsections?: MarkdownSection[];
}
```

### GitLab Domain Models

```typescript
// src/types/gitlab.types.ts
export interface MergeRequest {
  id: number;
  iid: number;
  title: string;
  source_branch: string;
  target_branch: string;
  state: MRState;
}

export type MRState = 'opened' | 'closed' | 'merged' | 'locked';

export interface Issue {
  id: number;
  iid: number;
  title: string;
  description: string;
  labels: string[];
  milestone?: Milestone;
}

export interface Milestone {
  id: number;
  title: string;
  description: string;
  due_date?: string;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Input Validation Universality

_For any_ service method that accepts input parameters, when invalid data is provided, the system should reject the input with a ZodError before executing business logic.

**Validates: Requirements 1.4, 7.1, 7.3**

### Property 2: Version String Validation

_For any_ string that does not match semver format (major.minor.patch or major.minor.patch-RC), the VersionService should reject it with a validation error.

**Validates: Requirements 2.2**

### Property 3: Version Bump Correctness

_For any_ valid semver version and bump type (major, minor, patch, rc), the resulting version should follow semver rules: major increments reset minor and patch to 0, minor increments reset patch to 0, patch increments only patch, rc appends -RC suffix.

**Validates: Requirements 2.4**

### Property 4: Version Sync Consistency

_For any_ version sync operation, after completion, the version in package.json, .version.json current field, and the latest spec directory name should all match.

**Validates: Requirements 2.5**

### Property 5: Documentation Input Validation

_For any_ documentation generation operation with invalid input specifications (malformed OpenAPI, missing required fields), the DocumentationService should reject the input with a validation error before attempting generation.

**Validates: Requirements 3.2**

### Property 6: GitLab Input Validation

_For any_ GitLab operation with invalid inputs (negative project IDs, invalid MR IDs, malformed issue data), the GitLabService should reject the input with a validation error before making API calls.

**Validates: Requirements 4.3**

### Property 7: GitLab Retry Behavior

_For any_ GitLab API operation that receives a rate limit error (429 status), the system should retry the operation with exponential backoff, waiting progressively longer between attempts (e.g., 1s, 2s, 4s, 8s).

**Validates: Requirements 4.4**

### Property 8: GitLab Authentication Validation

_For any_ GitLab operation requiring authentication, when an invalid or missing API token is provided, the system should reject the operation with an authentication error before making API calls.

**Validates: Requirements 4.5**

### Property 9: TypeScript Generation Validity

_For any_ valid JSON schema, the generated TypeScript types should compile without errors when checked with the TypeScript compiler.

**Validates: Requirements 5.3**

### Property 10: Zod Schema Generation Validity

_For any_ valid JSON schema, the generated Zod schema should successfully validate data that conforms to the original JSON schema.

**Validates: Requirements 5.4**

### Property 11: Schema Format Fix Preservation

_For any_ JSON schema with unsupported format constraints, after fixing, the modified schema should validate the same set of valid inputs as the original schema (semantic equivalence).

**Validates: Requirements 5.5**

### Property 12: Repository Data Validation

_For any_ repository write operation (create, update), when invalid data is provided, the repository should reject the operation with a validation error before persisting to storage.

**Validates: Requirements 6.2**

### Property 13: Repository Type Safety

_For any_ repository read operation, the returned value should be either null (if not found) or a properly typed domain object that passes Zod schema validation.

**Validates: Requirements 6.3**

### Property 14: Repository Error Types

_For any_ repository operation that encounters an error (file not found, permission denied, invalid data), the thrown error should be a typed domain error (not generic Error) with an appropriate error code.

**Validates: Requirements 6.4**

### Property 15: Service Output Validation

_For any_ service method that returns data, the output should pass Zod schema validation before being returned to the caller.

**Validates: Requirements 7.2**

### Property 16: Validation Error Detail

_For any_ validation failure, the thrown ZodError should contain detailed error messages indicating which fields failed validation and why.

**Validates: Requirements 7.3**

### Property 17: OpenAPI Specification Validity

_For any_ OpenAPI specification created for a service, the spec should pass Redocly CLI validation without errors.

**Validates: Requirements 8.4**

### Property 18: CLI Service Resolution

_For any_ CLI command execution, services should be successfully resolved from the DI container before business logic executes.

**Validates: Requirements 9.2**

### Property 19: CLI Argument Validation

_For any_ CLI command with arguments, invalid arguments should be rejected with a validation error and user-friendly message before the command executes.

**Validates: Requirements 9.3**

### Property 20: CLI Error Formatting

_For any_ service error thrown during CLI command execution, the CLI should catch the error and format it as a user-friendly message (not a stack trace) before exiting.

**Validates: Requirements 9.4**

### Property 21: Migration Backward Compatibility

_For any_ migrated script, when executed with the same inputs, the wrapper script should produce the same output and exit code as the original script behavior.

**Validates: Requirements 11.1**

### Property 22: Deprecation Warning Presence

_For any_ deprecated script wrapper, when executed, a deprecation warning with migration instructions should be displayed to the user before delegating to the service.

**Validates: Requirements 11.4**

### Property 23: Utility Configuration Validation

_For any_ utility that accepts configuration, invalid configuration should be rejected with a validation error before the utility executes.

**Validates: Requirements 12.4**

### Property 24: Utility Error Types

_For any_ utility operation that encounters an error, the thrown error should be a typed domain error with an appropriate error code (not generic Error).

**Validates: Requirements 12.5**

## Error Handling

### Error Hierarchy

```typescript
// src/utils/errors.ts
export class DomainError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', { resource, id });
  }
}

export class GitLabError extends DomainError {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message, 'GITLAB_ERROR', { statusCode });
  }
}

export class SchemaError extends DomainError {
  constructor(
    message: string,
    public schemaPath?: string
  ) {
    super(message, 'SCHEMA_ERROR', { schemaPath });
  }
}
```

### Error Handling Patterns

1. **Service Layer**: Catch repository errors, add context, rethrow as domain errors
2. **Repository Layer**: Catch file system errors, validate data, throw typed errors
3. **CLI Layer**: Catch all errors, format user-friendly messages, exit with appropriate codes
4. **Utility Layer**: Throw typed errors with detailed context

### Error Response Format

```typescript
interface ErrorResponse {
  error: string; // Error code
  message: string; // Human-readable message
  details?: Record<string, any>; // Additional context
  stack?: string; // Stack trace (development only)
}
```

## Testing Strategy

### Unit Testing

**Framework**: Jest with TypeScript support

**Coverage Target**: Minimum 80% code coverage

**Approach**:

- Mock repository dependencies using Jest mocks
- Test each service method in isolation
- Test error conditions and edge cases
- Test validation logic with invalid inputs

**Example**:

```typescript
describe('VersionService', () => {
  let service: VersionService;
  let mockRepository: jest.Mocked<IVersionRepository>;

  beforeEach(() => {
    mockRepository = {
      read: jest.fn(),
      update: jest.fn(),
      // ... other methods
    } as any;
    service = new VersionService(mockRepository);
  });

  it('should bump patch version correctly', async () => {
    mockRepository.read.mockResolvedValue({
      current: '1.2.3',
      latest_stable: '1.2.3',
      previous: [],
    });

    const result = await service.bumpVersion('patch');

    expect(result.current).toBe('1.2.4');
    expect(mockRepository.update).toHaveBeenCalled();
  });
});
```

### Property-Based Testing

**Framework**: fast-check

**Configuration**: Minimum 100 iterations per property

**Approach**:

- Generate random valid and invalid inputs
- Verify universal properties hold across all inputs
- Test invariants and round-trip properties
- Focus on validation, transformation, and consistency properties

**Example**:

```typescript
import * as fc from 'fast-check';

/**
 * Feature: scripts-migration-api-first, Property 3: Version Bump Correctness
 * Validates: Requirements 2.4
 */
describe('Property: Version Bump Correctness', () => {
  it('should follow semver rules for all bump types', () => {
    fc.assert(
      fc.property(
        fc.record({
          major: fc.nat(100),
          minor: fc.nat(100),
          patch: fc.nat(100),
        }),
        fc.constantFrom('major', 'minor', 'patch'),
        (version, bumpType) => {
          const versionString = `${version.major}.${version.minor}.${version.patch}`;
          const service = new VersionService(mockRepository);
          const result = service.bumpVersionString(versionString, bumpType);

          const [newMajor, newMinor, newPatch] = result.split('.').map(Number);

          if (bumpType === 'major') {
            return (
              newMajor === version.major + 1 && newMinor === 0 && newPatch === 0
            );
          } else if (bumpType === 'minor') {
            return (
              newMajor === version.major &&
              newMinor === version.minor + 1 &&
              newPatch === 0
            );
          } else {
            return (
              newMajor === version.major &&
              newMinor === version.minor &&
              newPatch === version.patch + 1
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Approach**:

- Test service + repository integration with real file system
- Use temporary directories for file operations
- Test CLI commands end-to-end
- Verify OpenAPI spec generation and validation

**Example**:

```typescript
describe('VersionService Integration', () => {
  let tempDir: string;
  let service: VersionService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'version-test-'));
    const repository = new VersionRepository(tempDir);
    service = new VersionService(repository);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true });
  });

  it('should sync versions across all files', async () => {
    // Create test files
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ version: '1.0.0' })
    );
    await fs.writeFile(
      path.join(tempDir, '.version.json'),
      JSON.stringify({ current: '1.0.0' })
    );

    await service.syncVersions();

    // Verify all files updated
    const pkg = JSON.parse(
      await fs.readFile(path.join(tempDir, 'package.json'), 'utf8')
    );
    const ver = JSON.parse(
      await fs.readFile(path.join(tempDir, '.version.json'), 'utf8')
    );

    expect(pkg.version).toBe(ver.current);
  });
});
```

### Test Organization

```
tests/
├── unit/
│   ├── services/
│   │   ├── version.service.test.ts
│   │   ├── documentation.service.test.ts
│   │   ├── gitlab.service.test.ts
│   │   └── schema.service.test.ts
│   ├── repositories/
│   │   ├── version.repository.test.ts
│   │   └── documentation.repository.test.ts
│   └── utils/
│       ├── markdown-builder.test.ts
│       └── retry.test.ts
├── properties/
│   ├── version-properties.test.ts
│   ├── validation-properties.test.ts
│   └── repository-properties.test.ts
├── integration/
│   ├── version-integration.test.ts
│   ├── documentation-integration.test.ts
│   └── cli-integration.test.ts
└── fixtures/
    ├── openapi-specs/
    ├── json-schemas/
    └── version-configs/
```

## Migration Strategy

### Phase 1: Foundation (Week 1)

1. Create base repository interface and utilities
2. Move `scripts/lib/*` to `src/utils/`
3. Create error hierarchy
4. Set up Zod schema directory structure
5. Create OpenAPI spec templates

### Phase 2: Version Service (Week 2)

1. Define OpenAPI spec for VersionService
2. Implement VersionRepository with CRUD operations
3. Implement VersionService with all version operations
4. Create CLI commands for version operations
5. Write unit and property-based tests
6. Create wrapper scripts that delegate to service

### Phase 3: Documentation Service (Week 3)

1. Define OpenAPI spec for DocumentationService
2. Implement DocumentationRepository
3. Implement MarkdownBuilder utility
4. Implement OpenAPIParser utility
5. Implement DocumentationService
6. Create CLI commands for documentation operations
7. Write unit and property-based tests
8. Create wrapper scripts

### Phase 4: GitLab Service (Week 4)

1. Define OpenAPI spec for GitLabService
2. Implement retry utility with exponential backoff
3. Implement GitLabService with all GitLab operations
4. Create CLI commands for GitLab operations
5. Write unit and property-based tests
6. Create wrapper scripts

### Phase 5: Schema Service (Week 5)

1. Define OpenAPI spec for SchemaService
2. Extend existing SchemaRepository
3. Implement SchemaService extending existing validation service
4. Create CLI commands for schema operations
5. Write unit and property-based tests
6. Create wrapper scripts

### Phase 6: Cleanup and Documentation (Week 6)

1. Verify all wrapper scripts work correctly
2. Add deprecation warnings to wrapper scripts
3. Update all documentation
4. Run full test suite
5. Verify 80%+ code coverage
6. Create migration guide for users

### Backward Compatibility Strategy

Each migrated script will be replaced with a thin wrapper that:

1. Displays a deprecation warning
2. Resolves the appropriate service from DI container
3. Validates arguments using Zod
4. Delegates to the service method
5. Formats output to match original script behavior
6. Exits with the same exit codes

Example wrapper:

```typescript
#!/usr/bin/env tsx
// scripts/bump-version.ts (deprecated wrapper)

import { container } from '../src/di-container.js';
import { IVersionService } from '../src/services/version.service.js';
import chalk from 'chalk';

console.warn(
  chalk.yellow('⚠️  This script is deprecated. Use: ossa version bump <type>')
);
console.warn(
  chalk.yellow('   Migration guide: https://docs.ossa.dev/migration/scripts\n')
);

const service = container.get<IVersionService>('VersionService');
const bumpType = process.argv[2] || 'patch';

try {
  const result = await service.bumpVersion(bumpType as any);
  console.log(`✅ Bumped version to ${result.current}`);
  process.exit(0);
} catch (error) {
  console.error(chalk.red('❌ Error:'), error.message);
  process.exit(1);
}
```

## Dependencies

### New Dependencies

- `fast-check`: Property-based testing framework
- None (all other dependencies already exist in package.json)

### Existing Dependencies

- `zod`: Runtime validation (already installed)
- `commander`: CLI framework (already installed)
- `inversify`: Dependency injection (already installed)
- `@gitbeaker/node`: GitLab API client (already installed)
- `json-schema-to-typescript`: Type generation (already installed)
- `json-schema-to-zod`: Zod schema generation (already installed)
- `yaml`: YAML parsing (already installed)
- `jest`: Testing framework (already installed)

## Performance Considerations

1. **Lazy Loading**: Services should be lazily instantiated from DI container
2. **Caching**: Version information should be cached to avoid repeated file reads
3. **Parallel Operations**: Documentation generation should process multiple specs in parallel
4. **Streaming**: Large file operations should use streams when possible
5. **Retry Limits**: GitLab operations should have configurable retry limits to prevent infinite loops

## Security Considerations

1. **API Token Storage**: GitLab tokens should be read from environment variables, never hardcoded
2. **Path Validation**: All file paths should be validated to prevent directory traversal
3. **Command Injection**: Command execution should use parameterized commands, not string concatenation
4. **Schema Validation**: All external inputs should be validated before processing
5. **Error Messages**: Error messages should not leak sensitive information (paths, tokens)

## Monitoring and Observability

1. **Logging**: Use structured logging with log levels (debug, info, warn, error)
2. **Metrics**: Track operation counts, durations, and error rates
3. **Tracing**: Add correlation IDs for tracking operations across services
4. **Health Checks**: Implement health check endpoints for service status
5. **Audit Trail**: Log all version bumps and GitLab operations for audit purposes
