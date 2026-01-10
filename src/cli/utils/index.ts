/**
 * CLI Utilities Index
 *
 * Central export point for all CLI utilities.
 * Follows Interface Segregation - import only what you need.
 */

// Output utilities
export {
  type CLIResult,
  type OutputFormat,
  type OutputOptions,
  type OutputFormatter,
  outputSuccess,
  outputError,
  success,
  error,
  withWarnings,
  printHeader,
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printKeyValue,
  printListItem,
  outputJSON,
  isJSONOutput,
  textOnly,
  jsonOnly,
  printTable,
  printStep,
  printSummary,
} from './output.js';

// Error formatting
export { formatValidationErrors, formatErrorCompact } from './error-formatter.js';

// GitLab configuration
export {
  type GitLabConfig,
  type GitLabProjectRef,
  GitLabConfigSchema,
  GitLabProjectRefSchema,
  getGitLabToken,
  getGitLabProjectId,
  getGitLabApiUrl,
  loadGitLabConfig,
  tryLoadGitLabConfig,
  isGitLabConfigured,
  isInGitLabCI,
  GitLabConfigError,
  GitLabAPIError,
  buildGitLabUrl,
  getGitLabHeaders,
  encodeProjectPath,
  parseGitLabUrl,
} from './gitlab-config.js';
