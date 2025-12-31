/**
 * Data Layer - Next.js Server Components Compatible
 *
 * Architecture:
 * - Zod schemas for runtime validation
 * - Repository pattern for data access (CRUD)
 * - Service layer for business logic
 * - Functional error handling (Result type)
 *
 * SOLID Principles:
 * - Single Responsibility: Each module handles one concern
 * - Open/Closed: Extensible via interfaces
 * - Liskov Substitution: Repositories are interchangeable
 * - Interface Segregation: Small, focused interfaces
 * - Dependency Inversion: Depend on abstractions
 *
 * Usage:
 *   // Server Components
 *   import { fetchExamples, fetchVersions } from '@/lib/data';
 *
 *   // CLI
 *   npm run sync           # Sync all data
 *   npm run sync:examples  # Sync examples only
 *   npm run sync:versions  # Sync versions only
 */

// Configuration
export { DATA_SOURCES, SYNC_FILES, getExampleCategory } from './sources';

// Schemas (Zod)
export {
  // Example schemas
  ExampleSchema,
  ExamplesArraySchema,
  ExampleCategorySchema,
  type Example,
  type ExampleCategory,

  // Version schemas
  VersionsSchema,
  VersionInfoSchema,
  VersionTypeSchema,
  type Versions,
  type VersionInfo,
  type VersionType,

  // API schemas
  GitLabTreeItemSchema,
  GitLabTagSchema,
  NpmPackageSchema,
  type GitLabTreeItem,
  type GitLabTag,
  type NpmPackage,

  // Release highlights
  ReleaseHighlightsSchema,
  type ReleaseHighlights,
} from './schemas';

// HTTP Client
export {
  GitLabClient,
  NpmClient,
  getGitLabClient,
  getNpmClient,
  DataFetchError,
  ValidationError,
  type Result,
  ok,
  err,
} from './client';

// Examples Repository & Service
export {
  GitLabExamplesRepository,
  ExamplesService,
  fetchExamples,
  saveExamples,
  type IExamplesRepository,
} from './fetch-examples';

// Versions Repository & Service
export {
  MultiSourceVersionsRepository,
  VersionsService,
  fetchVersions,
  saveVersions,
  generateVersionTs,
  type IVersionsRepository,
} from './fetch-versions';
