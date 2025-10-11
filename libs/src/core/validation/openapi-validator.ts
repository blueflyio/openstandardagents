#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: {
    specVersion: string;
    agentCompliance: string;
    ossaVersion: string;
  };
}

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

export interface OSSAValidationConfig {
  enableOSSACompliance: boolean;
  requireAgentMetadata: boolean;
  enforceSecuritySchemes: boolean;
  validateExamples: boolean;
  ossaVersion: string;
}

export class OSSAOpenAPIValidator {
  private ajv: Ajv;
  private config: OSSAValidationConfig;

  constructor(config: Partial<OSSAValidationConfig> = {}) {
    this.config = {
      enableOSSACompliance: true,
      requireAgentMetadata: true,
      enforceSecuritySchemes: true,
      validateExamples: true,
      ossaVersion: '0.1.9',
      ...config
    };

    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false
    });
    addFormats(this.ajv);
  }

  /**
   * Validate OpenAPI specification for OSSA compliance
   */
  async validateSpec(specPath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      metadata: {
        specVersion: '',
        agentCompliance: 'unknown',
        ossaVersion: this.config.ossaVersion
      }
    };

    try {
      // Load and parse the specification
      const specContent = fs.readFileSync(specPath, 'utf8');
      const spec = this.parseSpec(specContent, specPath);

      // Basic OpenAPI 3.1 validation
      await this.validateOpenAPI31(spec, result);

      // OSSA-specific validations
      if (this.config.enableOSSACompliance) {
        this.validateOSSACompliance(spec, result);
      }

      // Agent-specific validations
      if (this.config.requireAgentMetadata) {
        this.validateAgentMetadata(spec, result);
      }

      // Security validations
      if (this.config.enforceSecuritySchemes) {
        this.validateSecuritySchemes(spec, result);
      }

      // Examples validation
      if (this.config.validateExamples) {
        this.validateExamples(spec, result);
      }

      // Set final validation status
      result.valid = result.errors.filter((e) => e.severity === 'error').length === 0;

      return result;
    } catch (error) {
      result.valid = false;
      result.errors.push({
        path: specPath,
        message: `Failed to parse specification: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
        code: 'PARSE_ERROR'
      });
      return result;
    }
  }

  /**
   * Parse YAML/JSON specification
   */
  private parseSpec(content: string, filePath: string): any {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.yaml' || ext === '.yml') {
      return yaml.load(content);
    } else if (ext === '.json') {
      return JSON.parse(content);
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  /**
   * Validate basic OpenAPI 3.1 compliance
   */
  private async validateOpenAPI31(spec: any, result: ValidationResult): Promise<void> {
    // Check OpenAPI version
    if (!spec.openapi) {
      result.errors.push({
        path: '/openapi',
        message: 'Missing required openapi field',
        severity: 'error',
        code: 'MISSING_OPENAPI_VERSION'
      });
      return;
    }

    result.metadata.specVersion = spec.openapi;

    if (!spec.openapi.startsWith('3.1')) {
      result.warnings.push({
        path: '/openapi',
        message: `OpenAPI version ${spec.openapi} detected. OSSA recommends OpenAPI 3.1.x`,
        suggestion: 'Upgrade to OpenAPI 3.1.0 for better JSON Schema support'
      });
    }

    // Validate required top-level fields
    const requiredFields = ['info', 'paths'];
    for (const field of requiredFields) {
      if (!spec[field]) {
        result.errors.push({
          path: `/${field}`,
          message: `Missing required field: ${field}`,
          severity: 'error',
          code: 'MISSING_REQUIRED_FIELD'
        });
      }
    }

    // Validate info object
    if (spec.info) {
      const requiredInfoFields = ['title', 'version'];
      for (const field of requiredInfoFields) {
        if (!spec.info[field]) {
          result.errors.push({
            path: `/info/${field}`,
            message: `Missing required info field: ${field}`,
            severity: 'error',
            code: 'MISSING_INFO_FIELD'
          });
        }
      }
    }
  }

  /**
   * Validate OSSA-specific compliance requirements
   */
  private validateOSSACompliance(spec: any, result: ValidationResult): void {
    // Check for OSSA extension fields
    if (!spec['x-ossa']) {
      result.warnings.push({
        path: '/x-ossa',
        message: 'OSSA extension not found. Add x-ossa field for full compliance',
        suggestion: 'Add x-ossa field with version, conformance_tier, and protocols'
      });
    } else {
      const ossaExt = spec['x-ossa'];

      // Validate OSSA version
      if (!ossaExt.version) {
        result.errors.push({
          path: '/x-ossa/version',
          message: 'OSSA version is required in x-ossa extension',
          severity: 'error',
          code: 'MISSING_OSSA_VERSION'
        });
      } else if (ossaExt.version !== this.config.ossaVersion) {
        result.warnings.push({
          path: '/x-ossa/version',
          message: `OSSA version mismatch. Expected: ${this.config.ossaVersion}, Found: ${ossaExt.version}`,
          suggestion: `Update x-ossa.version to ${this.config.ossaVersion}`
        });
      }

      // Validate conformance tier
      const validTiers = ['core', 'governed', 'advanced', 'enterprise'];
      if (!ossaExt.conformance_tier || !validTiers.includes(ossaExt.conformance_tier)) {
        result.errors.push({
          path: '/x-ossa/conformance_tier',
          message: `Invalid or missing conformance_tier. Must be one of: ${validTiers.join(', ')}`,
          severity: 'error',
          code: 'INVALID_CONFORMANCE_TIER'
        });
      } else {
        result.metadata.agentCompliance = ossaExt.conformance_tier;
      }

      // Validate protocols
      if (!ossaExt.protocols || !Array.isArray(ossaExt.protocols)) {
        result.warnings.push({
          path: '/x-ossa/protocols',
          message: 'OSSA protocols not specified',
          suggestion: 'Add supported protocols array (e.g., ["mcp", "ossa", "rest"])'
        });
      }
    }

    // Validate OSSA-compliant paths
    this.validateOSSAAgentPaths(spec, result);
  }

  /**
   * Validate OSSA agent-specific paths and operations
   */
  private validateOSSAAgentPaths(spec: any, result: ValidationResult): void {
    if (!spec.paths) return;

    const requiredAgentPaths = ['/agent/health', '/agent/info', '/agent/capabilities'];

    const recommendedPaths = ['/agent/execute', '/agent/config', '/agent/metrics'];

    // Check required paths
    for (const path of requiredAgentPaths) {
      if (!spec.paths[path]) {
        result.errors.push({
          path: `/paths${path}`,
          message: `Missing required OSSA agent path: ${path}`,
          severity: 'error',
          code: 'MISSING_AGENT_PATH'
        });
      }
    }

    // Check recommended paths
    for (const path of recommendedPaths) {
      if (!spec.paths[path]) {
        result.warnings.push({
          path: `/paths${path}`,
          message: `Recommended OSSA agent path not found: ${path}`,
          suggestion: `Consider implementing ${path} for better agent compliance`
        });
      }
    }

    // Validate health endpoint specifically
    if (spec.paths['/agent/health']) {
      const healthPath = spec.paths['/agent/health'];
      if (!healthPath.get) {
        result.errors.push({
          path: '/paths/agent/health',
          message: 'Health endpoint must support GET method',
          severity: 'error',
          code: 'MISSING_HEALTH_GET'
        });
      }
    }
  }

  /**
   * Validate agent metadata in info section
   */
  private validateAgentMetadata(spec: any, result: ValidationResult): void {
    if (!spec.info) return;

    const requiredMetadata = ['title', 'version', 'description'];
    const recommendedMetadata = ['contact', 'license'];

    // Check required metadata
    for (const field of requiredMetadata) {
      if (!spec.info[field]) {
        result.errors.push({
          path: `/info/${field}`,
          message: `Missing required agent metadata: ${field}`,
          severity: 'error',
          code: 'MISSING_AGENT_METADATA'
        });
      }
    }

    // Check recommended metadata
    for (const field of recommendedMetadata) {
      if (!spec.info[field]) {
        result.warnings.push({
          path: `/info/${field}`,
          message: `Recommended agent metadata not found: ${field}`,
          suggestion: `Add ${field} to improve agent discoverability`
        });
      }
    }

    // Validate version format (should be semantic versioning)
    if (spec.info.version && !/^\d+\.\d+\.\d+/.test(spec.info.version)) {
      result.warnings.push({
        path: '/info/version',
        message: 'Agent version should follow semantic versioning (e.g., 1.0.0)',
        suggestion: 'Use semantic versioning format: MAJOR.MINOR.PATCH'
      });
    }
  }

  /**
   * Validate security schemes for OSSA compliance
   */
  private validateSecuritySchemes(spec: any, result: ValidationResult): void {
    if (!spec.components?.securitySchemes) {
      result.warnings.push({
        path: '/components/securitySchemes',
        message: 'No security schemes defined',
        suggestion: 'Consider adding authentication for production agents'
      });
      return;
    }

    const securitySchemes = spec.components.securitySchemes;
    const ossaRecommendedSchemes = ['ApiKey', 'BearerAuth', 'OAuth2'];

    let hasRecommendedScheme = false;
    for (const scheme of ossaRecommendedSchemes) {
      if (securitySchemes[scheme]) {
        hasRecommendedScheme = true;
        break;
      }
    }

    if (!hasRecommendedScheme) {
      result.warnings.push({
        path: '/components/securitySchemes',
        message: 'No OSSA-recommended security schemes found',
        suggestion: `Consider implementing one of: ${ossaRecommendedSchemes.join(', ')}`
      });
    }

    // Validate individual security schemes
    for (const [name, scheme] of Object.entries(securitySchemes)) {
      this.validateSecurityScheme(name, scheme as any, result);
    }
  }

  /**
   * Validate individual security scheme
   */
  private validateSecurityScheme(name: string, scheme: any, result: ValidationResult): void {
    if (!scheme.type) {
      result.errors.push({
        path: `/components/securitySchemes/${name}/type`,
        message: 'Security scheme type is required',
        severity: 'error',
        code: 'MISSING_SECURITY_TYPE'
      });
    }

    // Validate specific scheme types
    if (scheme.type === 'apiKey') {
      if (!scheme.in || !scheme.name) {
        result.errors.push({
          path: `/components/securitySchemes/${name}`,
          message: 'API Key security scheme requires "in" and "name" properties',
          severity: 'error',
          code: 'INVALID_APIKEY_SCHEME'
        });
      }
    }

    if (scheme.type === 'oauth2') {
      if (!scheme.flows) {
        result.errors.push({
          path: `/components/securitySchemes/${name}`,
          message: 'OAuth2 security scheme requires "flows" property',
          severity: 'error',
          code: 'INVALID_OAUTH2_SCHEME'
        });
      }
    }
  }

  /**
   * Validate examples in the specification
   */
  private validateExamples(spec: any, result: ValidationResult): void {
    // This is a simplified example validation
    // In practice, you'd want to validate examples against their schemas

    if (!spec.paths) return;

    let exampleCount = 0;
    for (const [pathName, pathObj] of Object.entries(spec.paths as any)) {
      for (const [method, operation] of Object.entries(pathObj as any)) {
        if (typeof operation === 'object' && operation && 'requestBody' in operation) {
          const requestBody = (operation as any).requestBody;
          if (requestBody && requestBody.content) {
            for (const [mediaType, mediaTypeObj] of Object.entries(requestBody.content as any)) {
              if ((mediaTypeObj as any).examples || (mediaTypeObj as any).example) {
                exampleCount++;
              }
            }
          }
        }
      }
    }

    if (exampleCount === 0) {
      result.warnings.push({
        path: '/paths',
        message: 'No examples found in specification',
        suggestion: 'Add examples to improve API documentation and testing'
      });
    }
  }

  /**
   * Generate validation report
   */
  generateReport(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push('# OSSA OpenAPI Validation Report');
    lines.push('');
    lines.push(`**Status:** ${result.valid ? '✅ VALID' : '❌ INVALID'}`);
    lines.push(`**OpenAPI Version:** ${result.metadata.specVersion}`);
    lines.push(`**OSSA Compliance:** ${result.metadata.agentCompliance}`);
    lines.push(`**OSSA Version:** ${result.metadata.ossaVersion}`);
    lines.push('');

    if (result.errors.length > 0) {
      lines.push('## Errors');
      for (const error of result.errors) {
        lines.push(`- **${error.path}**: ${error.message} (${error.code})`);
      }
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('## Warnings');
      for (const warning of result.warnings) {
        lines.push(`- **${warning.path}**: ${warning.message}`);
        if (warning.suggestion) {
          lines.push(`  - *Suggestion: ${warning.suggestion}*`);
        }
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('*Generated by OSSA OpenAPI Validator*');

    return lines.join('\n');
  }
}

// CLI interface
export async function validateOpenAPISpec(specPath: string, options: any = {}): Promise<void> {
  const validator = new OSSAOpenAPIValidator({
    enableOSSACompliance: options.ossa !== false,
    requireAgentMetadata: options.agentMetadata !== false,
    enforceSecuritySchemes: options.security !== false,
    validateExamples: options.examples !== false,
    ossaVersion: options.ossaVersion || '0.1.9'
  });

  console.log(`🔍 Validating OpenAPI specification: ${specPath}`);

  const result = await validator.validateSpec(specPath);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(validator.generateReport(result));
  }

  // Exit with error code if validation failed
  if (!result.valid) {
    process.exit(1);
  }
}

// Export for use in other modules
export default OSSAOpenAPIValidator;
