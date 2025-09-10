/**
 * OSSA v0.1.8 Agent Manifest Validator
 * Standalone validator for OSSA-compliant agent specifications
 */

import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: ValidationMetadata;
}

interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
}

interface ValidationWarning {
  path: string;
  message: string;
  recommendation: string;
  code: string;
}

interface ValidationMetadata {
  schemaVersion: string;
  validatedAt: string;
  validator: string;
  agentVersion?: string;
  agentName?: string;
}

export class AgentValidator {
  private ajv: Ajv;
  private schema: any;

  constructor(schemaPath?: string) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false
    });
    addFormats(this.ajv);
    
    // Load schema
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const defaultSchemaPath = schemaPath || join(__dirname, '../../api/schemas/agent.json');
    try {
      const schemaContent = readFileSync(defaultSchemaPath, 'utf-8');
      this.schema = JSON.parse(schemaContent);
    } catch (error) {
      throw new Error(`Failed to load agent schema from ${defaultSchemaPath}: ${error}`);
    }
  }

  /**
   * Validate an agent manifest file
   */
  async validateFile(manifestPath: string): Promise<ValidationResult> {
    try {
      const content = readFileSync(manifestPath, 'utf-8');
      const manifest = manifestPath.endsWith('.yaml') || manifestPath.endsWith('.yml') 
        ? parseYaml(content)
        : JSON.parse(content);
      
      return await this.validate(manifest);
    } catch (error) {
      return {
        valid: false,
        errors: [{
          path: 'file',
          message: `Failed to read or parse manifest file: ${error}`,
          severity: 'error',
          code: 'FILE_ERROR'
        }],
        warnings: [],
        metadata: this.createMetadata()
      };
    }
  }

  /**
   * Validate an agent manifest object
   */
  async validate(manifest: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      metadata: this.createMetadata(manifest)
    };

    // Basic JSON Schema validation
    const validate = this.ajv.compile(this.schema);
    const schemaValid = validate(manifest);

    if (!schemaValid && validate.errors) {
      for (const error of validate.errors) {
        result.errors.push({
          path: error.instancePath || 'root',
          message: error.message || 'Validation error',
          severity: 'error',
          code: 'SCHEMA_VIOLATION'
        });
      }
      result.valid = false;
    }

    // OSSA-specific validations
    await this.performOSSAValidations(manifest, result);

    // Security validations
    await this.performSecurityValidations(manifest, result);

    // Best practices validations
    await this.performBestPracticesValidations(manifest, result);

    // Compliance validations
    await this.performComplianceValidations(manifest, result);

    return result;
  }

  private async performOSSAValidations(manifest: any, result: ValidationResult): Promise<void> {
    // Check API version
    if (!manifest.apiVersion || !manifest.apiVersion.startsWith('ossa.ai/')) {
      result.errors.push({
        path: 'apiVersion',
        message: 'Invalid or missing OSSA API version',
        severity: 'error',
        code: 'INVALID_API_VERSION'
      });
      result.valid = false;
    }

    // Check kind
    if (manifest.kind !== 'Agent') {
      result.errors.push({
        path: 'kind',
        message: 'Manifest kind must be "Agent"',
        severity: 'error',
        code: 'INVALID_KIND'
      });
      result.valid = false;
    }

    // Validate metadata
    if (!manifest.metadata?.name) {
      result.errors.push({
        path: 'metadata.name',
        message: 'Agent name is required',
        severity: 'error',
        code: 'MISSING_NAME'
      });
      result.valid = false;
    }

    // Validate naming conventions
    if (manifest.metadata?.name && !/^[a-z0-9-]+$/.test(manifest.metadata.name)) {
      result.errors.push({
        path: 'metadata.name',
        message: 'Agent name must use kebab-case (lowercase letters, numbers, and hyphens only)',
        severity: 'error',
        code: 'INVALID_NAME_FORMAT'
      });
      result.valid = false;
    }

    // Version validation
    if (!manifest.metadata?.version) {
      result.errors.push({
        path: 'metadata.version',
        message: 'Agent version is required',
        severity: 'error',
        code: 'MISSING_VERSION'
      });
      result.valid = false;
    } else if (!/^\d+\.\d+\.\d+/.test(manifest.metadata.version)) {
      result.warnings.push({
        path: 'metadata.version',
        message: 'Version should follow semantic versioning (x.y.z)',
        recommendation: 'Use semantic versioning format like "1.0.0"',
        code: 'VERSION_FORMAT'
      });
    }

    // Capabilities validation
    if (!manifest.spec?.capabilities || !Array.isArray(manifest.spec.capabilities)) {
      result.errors.push({
        path: 'spec.capabilities',
        message: 'Agent must declare at least one capability',
        severity: 'error',
        code: 'MISSING_CAPABILITIES'
      });
      result.valid = false;
    } else {
      for (let i = 0; i < manifest.spec.capabilities.length; i++) {
        const capability = manifest.spec.capabilities[i];
        if (!capability.id || !capability.version) {
          result.errors.push({
            path: `spec.capabilities[${i}]`,
            message: 'Capability must have id and version',
            severity: 'error',
            code: 'INVALID_CAPABILITY'
          });
          result.valid = false;
        }
      }
    }

    // Runtime validation
    if (!manifest.spec?.runtime?.container) {
      result.errors.push({
        path: 'spec.runtime.container',
        message: 'Runtime container specification is required',
        severity: 'error',
        code: 'MISSING_RUNTIME'
      });
      result.valid = false;
    }
  }

  private async performSecurityValidations(manifest: any, result: ValidationResult): Promise<void> {
    // Check for hardcoded secrets
    const manifestStr = JSON.stringify(manifest);
    const secretPatterns = [
      /password\s*[:=]\s*["']([^"']+)["']/i,
      /secret\s*[:=]\s*["']([^"']+)["']/i,
      /key\s*[:=]\s*["']([^"']+)["']/i,
      /token\s*[:=]\s*["']([^"']+)["']/i
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(manifestStr)) {
        result.errors.push({
          path: 'manifest',
          message: 'Hardcoded secrets detected in manifest',
          severity: 'error',
          code: 'HARDCODED_SECRETS'
        });
        result.valid = false;
        break;
      }
    }

    // Check for privileged execution
    if (manifest.spec?.runtime?.privileged === true) {
      result.warnings.push({
        path: 'spec.runtime.privileged',
        message: 'Agent requests privileged execution',
        recommendation: 'Avoid privileged execution unless absolutely necessary',
        code: 'PRIVILEGED_EXECUTION'
      });
    }

    // Check for host networking
    if (manifest.spec?.runtime?.hostNetwork === true) {
      result.warnings.push({
        path: 'spec.runtime.hostNetwork',
        message: 'Agent requests host networking',
        recommendation: 'Use isolated networking when possible',
        code: 'HOST_NETWORKING'
      });
    }

    // Validate resource limits
    if (!manifest.spec?.resources?.limits) {
      result.warnings.push({
        path: 'spec.resources.limits',
        message: 'No resource limits specified',
        recommendation: 'Set resource limits to prevent resource exhaustion',
        code: 'MISSING_RESOURCE_LIMITS'
      });
    }
  }

  private async performBestPracticesValidations(manifest: any, result: ValidationResult): Promise<void> {
    // Check for description
    if (!manifest.metadata?.description) {
      result.warnings.push({
        path: 'metadata.description',
        message: 'Agent description is missing',
        recommendation: 'Add a clear description of agent functionality',
        code: 'MISSING_DESCRIPTION'
      });
    }

    // Check for health check configuration
    if (!manifest.spec?.health) {
      result.warnings.push({
        path: 'spec.health',
        message: 'No health check configuration',
        recommendation: 'Configure health checks for better monitoring',
        code: 'MISSING_HEALTH_CHECK'
      });
    }

    // Check for proper tagging
    if (!manifest.metadata?.tags || manifest.metadata.tags.length === 0) {
      result.warnings.push({
        path: 'metadata.tags',
        message: 'No tags specified',
        recommendation: 'Add relevant tags for better discoverability',
        code: 'MISSING_TAGS'
      });
    }

    // Check for license
    if (!manifest.metadata?.license) {
      result.warnings.push({
        path: 'metadata.license',
        message: 'No license specified',
        recommendation: 'Specify license for legal clarity',
        code: 'MISSING_LICENSE'
      });
    }

    // Check for maintainer information
    if (!manifest.metadata?.maintainers) {
      result.warnings.push({
        path: 'metadata.maintainers',
        message: 'No maintainer information',
        recommendation: 'Specify maintainer contact information',
        code: 'MISSING_MAINTAINERS'
      });
    }
  }

  private async performComplianceValidations(manifest: any, result: ValidationResult): Promise<void> {
    // Check for compliance declarations
    if (manifest.spec?.compliance) {
      const supportedFrameworks = ['FedRAMP', 'NIST-800-53', 'ISO-42001', 'EU-AI-ACT', 'GDPR', 'SOX'];
      
      for (const compliance of manifest.spec.compliance) {
        if (!supportedFrameworks.includes(compliance.framework)) {
          result.warnings.push({
            path: 'spec.compliance',
            message: `Unsupported compliance framework: ${compliance.framework}`,
            recommendation: `Use supported frameworks: ${supportedFrameworks.join(', ')}`,
            code: 'UNSUPPORTED_COMPLIANCE_FRAMEWORK'
          });
        }
      }
    }

    // Check for audit logging
    if (!manifest.spec?.observability?.logging?.audit) {
      result.warnings.push({
        path: 'spec.observability.logging.audit',
        message: 'Audit logging not configured',
        recommendation: 'Enable audit logging for compliance requirements',
        code: 'MISSING_AUDIT_LOGGING'
      });
    }

    // Check for encryption at rest
    if (!manifest.spec?.storage?.encryption) {
      result.warnings.push({
        path: 'spec.storage.encryption',
        message: 'Data encryption not configured',
        recommendation: 'Configure encryption for sensitive data',
        code: 'MISSING_ENCRYPTION'
      });
    }
  }

  private createMetadata(manifest?: any): ValidationMetadata {
    return {
      schemaVersion: '0.1.8',
      validatedAt: new Date().toISOString(),
      validator: 'OSSA Agent Validator v0.1.8',
      agentVersion: manifest?.metadata?.version,
      agentName: manifest?.metadata?.name
    };
  }

  /**
   * Get validation summary
   */
  getValidationSummary(result: ValidationResult): string {
    const { errors, warnings } = result;
    const errorCount = errors.length;
    const warningCount = warnings.length;

    let summary = `Validation ${result.valid ? 'PASSED' : 'FAILED'}\n`;
    summary += `Errors: ${errorCount}, Warnings: ${warningCount}\n`;

    if (errorCount > 0) {
      summary += '\nErrors:\n';
      errors.forEach(error => {
        summary += `  - ${error.path}: ${error.message} (${error.code})\n`;
      });
    }

    if (warningCount > 0) {
      summary += '\nWarnings:\n';
      warnings.forEach(warning => {
        summary += `  - ${warning.path}: ${warning.message} (${warning.code})\n`;
        summary += `    Recommendation: ${warning.recommendation}\n`;
      });
    }

    return summary;
  }
}

// CLI interface
if (require.main === module) {
  const validator = new AgentValidator();
  const manifestPath = process.argv[2];

  if (!manifestPath) {
    console.error('Usage: node agent-validator.ts <manifest-path>');
    process.exit(1);
  }

  validator.validateFile(manifestPath)
    .then(result => {
      console.log(validator.getValidationSummary(result));
      process.exit(result.valid ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed:', error.message);
      process.exit(1);
    });
}

export default AgentValidator;