/**
 * Shared Adapter Utilities
 *
 * Central barrel export for all shared adapter libraries.
 * Import from here instead of individual files.
 *
 * @example
 * ```ts
 * import {
 *   generatePackageJson,
 *   generateReadme,
 *   validate,
 *   render,
 * } from '../base/index.js';
 * ```
 */

// Base adapter interface and types
export {
  BaseAdapter,
  type PlatformAdapter,
  type ExportResult,
  type ExportFile,
  type ExportOptions,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type OssaAgent,
} from './adapter.interface.js';

// Base exporter with common orchestration (DRY export pattern)
export { BaseExporter } from './base-exporter.js';

// Common file generators
export {
  generatePackageJson,
  generateTsConfig,
  generateGitIgnore,
  generateDockerIgnore,
  generateReadme,
  generateLicense,
  generateChangelog,
  sanitizePackageName,
  extractMetadata,
  generateTeamFilesForExport,
  generateAgentsMdFile,
  generatePerfectAgentBundle,
  type Platform,
  type PackageJsonOptions,
  type TsConfigOptions,
  type ReadmeSections,
} from './common-file-generator.js';

// Manifest validation
export {
  validate as validateManifest,
  validateWorkflow,
  validateLLM,
  validateTools,
  isValidSemver,
  isValidNpmName,
  mergeResults,
  type ManifestValidationResult,
} from './manifest-validator.js';

// Perfect agent utilities
export {
  generateSkillContent,
  generateEvalStubs,
  generateGovernanceConfig,
  generateObservabilityConfig,
} from './perfect-agent-utils.js';

// Template engine
export {
  render,
  renderConditional,
  README_TEMPLATE,
  INSTALL_TEMPLATE,
  type TemplateData,
} from './template-engine.js';
