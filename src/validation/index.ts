/**
 * OSSA Validation - Main Export
 *
 * Comprehensive validation toolkit for OSSA manifests including:
 * - Schema validation (Ajv)
 * - Linting (best practices)
 * - Error codes and catalog
 * - Error formatting (text, JSON, Markdown, HTML)
 * - Enhanced validation with error codes
 */

// Core validators
export { OSSAValidator, ValidationResult } from './validator';
export { OSSALinter, LintRule, LintResult } from './linter';

// Error codes
export {
  OSSAErrorCode,
  ErrorDetails,
  ErrorExample,
  ERROR_CATALOG,
  getErrorDetails,
  searchErrorsByTag,
  searchErrorsBySeverity,
  getAllErrorCodes,
  getErrorCountBySeverity,
} from './error-codes';

// Error formatting
export {
  FormattedError,
  ErrorReport,
  formatError,
  formatAjvErrors,
  createErrorReport,
  formatErrorReport,
  formatErrorReportJSON,
  formatErrorReportMarkdown,
  formatErrorReportHTML,
  mapAjvErrorToOSSACode,
  mapLinterErrorToOSSACode,
} from './error-formatter';

// Enhanced validator
export {
  EnhancedOSSAValidator,
  EnhancedValidationResult,
} from './enhanced-validator';
