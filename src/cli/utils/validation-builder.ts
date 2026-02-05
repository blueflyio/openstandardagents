/**
 * ValidationBuilder Utility
 * Centralized validation logic for CLI wizard and commands
 *
 * SOLID: Single Responsibility - Validation logic only
 * DRY: Eliminates duplicate validation code across wizard steps
 *
 * Usage:
 * ```typescript
 * import { ValidationBuilder } from '../utils/validation-builder.js';
 *
 * const nameValidator = ValidationBuilder.dns1123('agent name');
 * const versionValidator = ValidationBuilder.semver('version');
 * const portValidator = ValidationBuilder.numberRange(1, 65535, 'port');
 * ```
 */

/**
 * Validation function type for inquirer
 * Returns true if valid, or error message string if invalid
 */
export type ValidatorFn = (input: any) => boolean | string;

/**
 * Centralized validation builder
 * All validators return inquirer-compatible validation functions
 */
export class ValidationBuilder {
  /**
   * DNS-1123 subdomain name validation
   * - Lowercase alphanumeric + hyphens
   * - Must start/end with alphanumeric
   * - Max 253 characters
   *
   * Examples: "my-agent", "data-processor-v2"
   */
  static dns1123(fieldName: string): ValidatorFn {
    return (input: string): boolean | string => {
      if (!input || typeof input !== 'string') {
        return `${fieldName} is required`;
      }

      const dns1123Pattern = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

      if (!dns1123Pattern.test(input)) {
        return `${fieldName} must be DNS-1123 compliant (lowercase alphanumeric with hyphens, e.g., "my-agent")`;
      }

      if (input.length > 253) {
        return `${fieldName} must be 253 characters or less`;
      }

      return true;
    };
  }

  /**
   * Semantic version validation (semver)
   * Format: MAJOR.MINOR.PATCH[-PRERELEASE]
   *
   * Examples: "1.0.0", "2.3.1-beta", "0.1.0-alpha.1"
   */
  static semver(fieldName: string): ValidatorFn {
    return (input: string): boolean | string => {
      if (!input || typeof input !== 'string') {
        return `${fieldName} is required`;
      }

      const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$/;

      if (!semverPattern.test(input)) {
        return `${fieldName} must be semver format (e.g., 1.0.0, 2.1.0-beta)`;
      }

      return true;
    };
  }

  /**
   * URL validation
   * Validates HTTP/HTTPS URLs
   */
  static url(fieldName: string, required = true): ValidatorFn {
    return (input: string): boolean | string => {
      if (!input) {
        return required ? `${fieldName} is required` : true;
      }

      try {
        const url = new URL(input);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return `${fieldName} must be HTTP or HTTPS URL`;
        }
        return true;
      } catch {
        return `${fieldName} must be a valid URL`;
      }
    };
  }

  /**
   * Email validation
   * Basic email format validation
   */
  static email(fieldName: string, required = true): ValidatorFn {
    return (input: string): boolean | string => {
      if (!input) {
        return required ? `${fieldName} is required` : true;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(input)) {
        return `${fieldName} must be a valid email address`;
      }

      return true;
    };
  }

  /**
   * Number range validation
   * Validates number is within min/max range (inclusive)
   */
  static numberRange(min: number, max: number, fieldName: string): ValidatorFn {
    return (input: number): boolean | string => {
      const num = typeof input === 'string' ? parseFloat(input) : input;

      if (isNaN(num)) {
        return `${fieldName} must be a number`;
      }

      if (num < min || num > max) {
        return `${fieldName} must be between ${min} and ${max}`;
      }

      return true;
    };
  }

  /**
   * Port number validation (1-65535)
   */
  static port(fieldName: string): ValidatorFn {
    return ValidationBuilder.numberRange(1, 65535, fieldName);
  }

  /**
   * Required field validation
   * Ensures field is not empty
   */
  static required(fieldName: string): ValidatorFn {
    return (input: any): boolean | string => {
      if (!input || (typeof input === 'string' && input.trim() === '')) {
        return `${fieldName} is required`;
      }
      return true;
    };
  }

  /**
   * Minimum length validation
   */
  static minLength(min: number, fieldName: string): ValidatorFn {
    return (input: string): boolean | string => {
      if (!input || input.length < min) {
        return `${fieldName} must be at least ${min} characters`;
      }
      return true;
    };
  }

  /**
   * Maximum length validation
   */
  static maxLength(max: number, fieldName: string): ValidatorFn {
    return (input: string): boolean | string => {
      if (input && input.length > max) {
        return `${fieldName} must be ${max} characters or less`;
      }
      return true;
    };
  }

  /**
   * JSON validation
   * Validates string is valid JSON
   */
  static json(fieldName: string, required = true): ValidatorFn {
    return (input: string): boolean | string => {
      if (!input) {
        return required ? `${fieldName} is required` : true;
      }

      try {
        JSON.parse(input);
        return true;
      } catch (error) {
        return `${fieldName} must be valid JSON`;
      }
    };
  }

  /**
   * RegEx pattern validation
   * Custom pattern matching
   */
  static pattern(
    pattern: RegExp,
    fieldName: string,
    errorMessage?: string
  ): ValidatorFn {
    return (input: string): boolean | string => {
      if (!input || !pattern.test(input)) {
        return errorMessage || `${fieldName} does not match required pattern`;
      }
      return true;
    };
  }

  /**
   * Enum validation
   * Validates input is one of allowed values
   */
  static oneOf<T>(allowedValues: T[], fieldName: string): ValidatorFn {
    return (input: T): boolean | string => {
      if (!allowedValues.includes(input)) {
        return `${fieldName} must be one of: ${allowedValues.join(', ')}`;
      }
      return true;
    };
  }

  /**
   * Composite validator
   * Combines multiple validators (all must pass)
   */
  static combine(...validators: ValidatorFn[]): ValidatorFn {
    return (input: any): boolean | string => {
      for (const validator of validators) {
        const result = validator(input);
        if (result !== true) {
          return result;
        }
      }
      return true;
    };
  }

  /**
   * File path validation
   * Validates basic file path format
   */
  static filePath(fieldName: string, required = true): ValidatorFn {
    return (input: string): boolean | string => {
      if (!input) {
        return required ? `${fieldName} is required` : true;
      }

      // Basic path validation (no null bytes, reasonable length)
      if (input.includes('\0')) {
        return `${fieldName} contains invalid characters`;
      }

      if (input.length > 4096) {
        return `${fieldName} path too long (max 4096 characters)`;
      }

      return true;
    };
  }

  /**
   * Kubernetes label validation
   * Validates Kubernetes label key or value
   */
  static k8sLabel(fieldName: string, isKey = false): ValidatorFn {
    return (input: string): boolean | string => {
      if (!input) {
        return `${fieldName} is required`;
      }

      if (isKey) {
        // Label key: optional prefix + name
        const labelKeyPattern =
          /^([a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*\/)?[a-zA-Z0-9]([-._a-zA-Z0-9]*[a-zA-Z0-9])?$/;

        if (!labelKeyPattern.test(input) || input.length > 253) {
          return `${fieldName} must be valid Kubernetes label key (max 253 chars)`;
        }
      } else {
        // Label value: alphanumeric + dash/underscore/dot
        const labelValuePattern = /^[a-zA-Z0-9]([-._a-zA-Z0-9]*[a-zA-Z0-9])?$/;

        if (input && (!labelValuePattern.test(input) || input.length > 63)) {
          return `${fieldName} must be valid Kubernetes label value (max 63 chars)`;
        }
      }

      return true;
    };
  }

  /**
   * Namespace validation
   * Similar to DNS-1123 but with stricter rules
   */
  static namespace(fieldName: string): ValidatorFn {
    return (input: string): boolean | string => {
      if (!input) {
        return `${fieldName} is required`;
      }

      const namespacePattern = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

      if (!namespacePattern.test(input)) {
        return `${fieldName} must be lowercase alphanumeric with hyphens`;
      }

      if (input.length > 63) {
        return `${fieldName} must be 63 characters or less`;
      }

      // Reserved namespaces
      const reserved = [
        'kube-system',
        'kube-public',
        'kube-node-lease',
        'default',
      ];
      if (reserved.includes(input)) {
        return `${fieldName} cannot be a reserved namespace: ${reserved.join(', ')}`;
      }

      return true;
    };
  }
}

/**
 * Backward compatibility exports
 * Maintains compatibility with existing code using direct functions
 */
export function validateDNS1123(name: string): boolean {
  const validator = ValidationBuilder.dns1123('name');
  const result = validator(name);
  return result === true;
}

export function validateSemver(version: string): boolean {
  const validator = ValidationBuilder.semver('version');
  const result = validator(version);
  return result === true;
}

export function validateURL(url: string): boolean {
  const validator = ValidationBuilder.url('URL', false);
  const result = validator(url);
  return result === true;
}

export function validateEmail(email: string): boolean {
  const validator = ValidationBuilder.email('email', false);
  const result = validator(email);
  return result === true;
}

export function validatePort(port: number): boolean {
  const validator = ValidationBuilder.port('port');
  const result = validator(port);
  return result === true;
}

export function validateJSONSchema(schema: string): boolean {
  const validator = ValidationBuilder.json('schema', false);
  const result = validator(schema);
  return result === true;
}
