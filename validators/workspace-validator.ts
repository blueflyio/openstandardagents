/**
 * OSSA v0.1.8 Workspace Configuration Validator
 * Standalone validator for OSSA-compliant workspace configurations
 */

import { readFileSync, existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

interface WorkspaceValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: ValidationMetadata;
  structure: StructureValidation;
}

interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
  component?: string;
}

interface ValidationWarning {
  path: string;
  message: string;
  recommendation: string;
  code: string;
  component?: string;
}

interface ValidationMetadata {
  schemaVersion: string;
  validatedAt: string;
  validator: string;
  workspaceName?: string;
  workspacePath: string;
}

interface StructureValidation {
  requiredDirectories: { path: string; exists: boolean; required: boolean }[];
  configFiles: { path: string; exists: boolean; valid: boolean }[];
  agentManifests: { path: string; exists: boolean; valid: boolean }[];
}

export class WorkspaceValidator {
  private ajv: Ajv;
  private workspaceSchema: any;
  private workspacePath: string;

  constructor(workspacePath: string, schemaPath?: string) {
    this.workspacePath = workspacePath;
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false
    });
    addFormats(this.ajv);
    
    // Load workspace schema
    const defaultSchemaPath = schemaPath || './v0.1.8/schemas/workspace.schema.json';
    try {
      const schemaContent = readFileSync(defaultSchemaPath, 'utf-8');
      this.workspaceSchema = JSON.parse(schemaContent);
    } catch (error) {
      throw new Error(`Failed to load workspace schema from ${defaultSchemaPath}: ${error}`);
    }
  }

  /**
   * Validate complete workspace structure and configuration
   */
  async validateWorkspace(): Promise<WorkspaceValidationResult> {
    const result: WorkspaceValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      metadata: this.createMetadata(),
      structure: {
        requiredDirectories: [],
        configFiles: [],
        agentManifests: []
      }
    };

    // Validate directory structure
    await this.validateDirectoryStructure(result);

    // Validate workspace configuration
    await this.validateWorkspaceConfiguration(result);

    // Validate agent manifests
    await this.validateAgentManifests(result);

    // Validate registry files
    await this.validateRegistryFiles(result);

    // Validate security configuration
    await this.validateSecurityConfiguration(result);

    // Validate compliance setup
    await this.validateComplianceSetup(result);

    // Performance and best practices
    await this.validateBestPractices(result);

    return result;
  }

  private async validateDirectoryStructure(result: WorkspaceValidationResult): Promise<void> {
    const requiredDirs = [
      { path: '.agents-workspace', required: true },
      { path: '.agents-workspace/config', required: true },
      { path: '.agents-workspace/agents', required: true },
      { path: '.agents-workspace/workflows', required: true },
      { path: '.agents-workspace/data', required: true },
      { path: '.agents-workspace/logs', required: true },
      { path: '.agents-workspace/metrics', required: true },
      { path: '.agents', required: true },
      { path: '.agents/manifests', required: true },
      { path: '.agents/runtime', required: true },
      { path: '.agents/cache', required: false },
      { path: '.agents/credentials', required: true },
      { path: '.agents/state', required: true }
    ];

    for (const dir of requiredDirs) {
      const fullPath = join(this.workspacePath, dir.path);
      const exists = existsSync(fullPath);
      
      result.structure.requiredDirectories.push({
        path: dir.path,
        exists,
        required: dir.required
      });

      if (dir.required && !exists) {
        result.errors.push({
          path: dir.path,
          message: `Required directory missing: ${dir.path}`,
          severity: 'error',
          code: 'MISSING_DIRECTORY',
          component: 'structure'
        });
        result.valid = false;
      }
    }
  }

  private async validateWorkspaceConfiguration(result: WorkspaceValidationResult): Promise<void> {
    const configPath = join(this.workspacePath, '.agents-workspace/config/workspace.yaml');
    
    if (!existsSync(configPath)) {
      result.errors.push({
        path: '.agents-workspace/config/workspace.yaml',
        message: 'Workspace configuration file missing',
        severity: 'error',
        code: 'MISSING_CONFIG',
        component: 'configuration'
      });
      result.valid = false;
      return;
    }

    try {
      const configContent = readFileSync(configPath, 'utf-8');
      const config = parseYaml(configContent);

      result.structure.configFiles.push({
        path: '.agents-workspace/config/workspace.yaml',
        exists: true,
        valid: true
      });

      // Validate against schema
      const validate = this.ajv.compile(this.workspaceSchema);
      const schemaValid = validate(config);

      if (!schemaValid && validate.errors) {
        for (const error of validate.errors) {
          result.errors.push({
            path: `workspace.yaml${error.instancePath}`,
            message: error.message || 'Configuration validation error',
            severity: 'error',
            code: 'CONFIG_SCHEMA_VIOLATION',
            component: 'configuration'
          });
        }
        result.valid = false;
        result.structure.configFiles[result.structure.configFiles.length - 1].valid = false;
      }

      // OSSA-specific configuration validations
      await this.validateOSSAConfiguration(config, result);

    } catch (error) {
      result.errors.push({
        path: '.agents-workspace/config/workspace.yaml',
        message: `Failed to parse configuration: ${error}`,
        severity: 'error',
        code: 'CONFIG_PARSE_ERROR',
        component: 'configuration'
      });
      result.valid = false;
      result.structure.configFiles.push({
        path: '.agents-workspace/config/workspace.yaml',
        exists: true,
        valid: false
      });
    }
  }

  private async validateOSSAConfiguration(config: any, result: WorkspaceValidationResult): Promise<void> {
    // Check API version
    if (!config.apiVersion || !config.apiVersion.startsWith('ossa.ai/')) {
      result.errors.push({
        path: 'workspace.yaml.apiVersion',
        message: 'Invalid or missing OSSA API version in workspace configuration',
        severity: 'error',
        code: 'INVALID_WORKSPACE_API_VERSION',
        component: 'configuration'
      });
      result.valid = false;
    }

    // Check kind
    if (config.kind !== 'Workspace') {
      result.errors.push({
        path: 'workspace.yaml.kind',
        message: 'Workspace configuration kind must be "Workspace"',
        severity: 'error',
        code: 'INVALID_WORKSPACE_KIND',
        component: 'configuration'
      });
      result.valid = false;
    }

    // Validate workspace name
    if (!config.metadata?.name) {
      result.errors.push({
        path: 'workspace.yaml.metadata.name',
        message: 'Workspace name is required',
        severity: 'error',
        code: 'MISSING_WORKSPACE_NAME',
        component: 'configuration'
      });
      result.valid = false;
    }

    // Validate tier
    const validTiers = ['development', 'staging', 'production', 'enterprise'];
    if (!config.spec?.tier || !validTiers.includes(config.spec.tier)) {
      result.errors.push({
        path: 'workspace.yaml.spec.tier',
        message: `Invalid workspace tier. Must be one of: ${validTiers.join(', ')}`,
        severity: 'error',
        code: 'INVALID_WORKSPACE_TIER',
        component: 'configuration'
      });
      result.valid = false;
    }

    // Validate resource limits
    if (config.spec?.resources) {
      const resources = config.spec.resources;
      if (!resources.limits) {
        result.warnings.push({
          path: 'workspace.yaml.spec.resources.limits',
          message: 'No resource limits configured',
          recommendation: 'Set resource limits to prevent resource exhaustion',
          code: 'MISSING_RESOURCE_LIMITS',
          component: 'configuration'
        });
      }

      // Check if limits are reasonable
      if (resources.limits?.maxAgents && resources.limits.maxAgents > 1000) {
        result.warnings.push({
          path: 'workspace.yaml.spec.resources.limits.maxAgents',
          message: 'Very high agent limit configured',
          recommendation: 'Consider if such a high agent limit is necessary',
          code: 'HIGH_AGENT_LIMIT',
          component: 'configuration'
        });
      }
    }
  }

  private async validateAgentManifests(result: WorkspaceValidationResult): Promise<void> {
    const manifestsPath = join(this.workspacePath, '.agents/manifests');
    
    if (!existsSync(manifestsPath)) {
      result.warnings.push({
        path: '.agents/manifests',
        message: 'No agent manifests directory found',
        recommendation: 'Create manifests directory if you plan to deploy agents',
        code: 'MISSING_MANIFESTS_DIR',
        component: 'agents'
      });
      return;
    }

    // This would typically scan for manifest files and validate each one
    // For now, we'll check the structure is correct
    result.structure.agentManifests.push({
      path: '.agents/manifests',
      exists: true,
      valid: true
    });
  }

  private async validateRegistryFiles(result: WorkspaceValidationResult): Promise<void> {
    const registryPath = join(this.workspacePath, '.agents-workspace/agents/registry.json');
    
    if (existsSync(registryPath)) {
      try {
        const registryContent = readFileSync(registryPath, 'utf-8');
        const registry = JSON.parse(registryContent);

        // Basic registry structure validation
        if (!registry.agents || !Array.isArray(registry.agents)) {
          result.warnings.push({
            path: '.agents-workspace/agents/registry.json',
            message: 'Registry file exists but has invalid structure',
            recommendation: 'Ensure registry has valid agents array',
            code: 'INVALID_REGISTRY_STRUCTURE',
            component: 'registry'
          });
        }
      } catch (error) {
        result.errors.push({
          path: '.agents-workspace/agents/registry.json',
          message: `Failed to parse registry file: ${error}`,
          severity: 'error',
          code: 'REGISTRY_PARSE_ERROR',
          component: 'registry'
        });
        result.valid = false;
      }
    }
  }

  private async validateSecurityConfiguration(result: WorkspaceValidationResult): Promise<void> {
    const securityConfigPath = join(this.workspacePath, '.agents-workspace/config/security.yaml');
    
    if (!existsSync(securityConfigPath)) {
      result.warnings.push({
        path: '.agents-workspace/config/security.yaml',
        message: 'No security configuration found',
        recommendation: 'Create security configuration for production workspaces',
        code: 'MISSING_SECURITY_CONFIG',
        component: 'security'
      });
      return;
    }

    try {
      const securityContent = readFileSync(securityConfigPath, 'utf-8');
      const security = parseYaml(securityContent);

      // Check encryption configuration
      if (!security.encryption) {
        result.warnings.push({
          path: '.agents-workspace/config/security.yaml',
          message: 'No encryption configuration',
          recommendation: 'Configure encryption for sensitive data',
          code: 'MISSING_ENCRYPTION_CONFIG',
          component: 'security'
        });
      }

      // Check authentication configuration
      if (!security.authentication) {
        result.warnings.push({
          path: '.agents-workspace/config/security.yaml',
          message: 'No authentication configuration',
          recommendation: 'Configure authentication for access control',
          code: 'MISSING_AUTH_CONFIG',
          component: 'security'
        });
      }

      // Check for weak encryption algorithms
      if (security.encryption?.algorithm && 
          !['AES-256-GCM', 'AES-256-CBC', 'ChaCha20-Poly1305'].includes(security.encryption.algorithm)) {
        result.warnings.push({
          path: '.agents-workspace/config/security.yaml',
          message: 'Weak encryption algorithm detected',
          recommendation: 'Use strong encryption algorithms like AES-256-GCM',
          code: 'WEAK_ENCRYPTION',
          component: 'security'
        });
      }

    } catch (error) {
      result.errors.push({
        path: '.agents-workspace/config/security.yaml',
        message: `Failed to parse security configuration: ${error}`,
        severity: 'error',
        code: 'SECURITY_CONFIG_PARSE_ERROR',
        component: 'security'
      });
      result.valid = false;
    }
  }

  private async validateComplianceSetup(result: WorkspaceValidationResult): Promise<void> {
    const compliancePath = join(this.workspacePath, '.agents-workspace/config/compliance.yaml');
    
    if (!existsSync(compliancePath)) {
      result.warnings.push({
        path: '.agents-workspace/config/compliance.yaml',
        message: 'No compliance configuration found',
        recommendation: 'Configure compliance settings for regulated environments',
        code: 'MISSING_COMPLIANCE_CONFIG',
        component: 'compliance'
      });
      return;
    }

    try {
      const complianceContent = readFileSync(compliancePath, 'utf-8');
      const compliance = parseYaml(complianceContent);

      // Check if compliance frameworks are properly configured
      if (!compliance.frameworks || !Array.isArray(compliance.frameworks)) {
        result.warnings.push({
          path: '.agents-workspace/config/compliance.yaml',
          message: 'No compliance frameworks configured',
          recommendation: 'Specify applicable compliance frameworks',
          code: 'MISSING_COMPLIANCE_FRAMEWORKS',
          component: 'compliance'
        });
      }

      // Check audit logging
      if (!compliance.auditLogging?.enabled) {
        result.warnings.push({
          path: '.agents-workspace/config/compliance.yaml',
          message: 'Audit logging not enabled',
          recommendation: 'Enable audit logging for compliance requirements',
          code: 'AUDIT_LOGGING_DISABLED',
          component: 'compliance'
        });
      }

    } catch (error) {
      result.warnings.push({
        path: '.agents-workspace/config/compliance.yaml',
        message: `Failed to parse compliance configuration: ${error}`,
        recommendation: 'Fix compliance configuration syntax',
        code: 'COMPLIANCE_CONFIG_PARSE_ERROR',
        component: 'compliance'
      });
    }
  }

  private async validateBestPractices(result: WorkspaceValidationResult): Promise<void> {
    // Check for README
    const readmePath = join(this.workspacePath, 'README.md');
    if (!existsSync(readmePath)) {
      result.warnings.push({
        path: 'README.md',
        message: 'No README file found',
        recommendation: 'Add README with workspace documentation',
        code: 'MISSING_README',
        component: 'documentation'
      });
    }

    // Check for .gitignore
    const gitignorePath = join(this.workspacePath, '.gitignore');
    if (!existsSync(gitignorePath)) {
      result.warnings.push({
        path: '.gitignore',
        message: 'No .gitignore file found',
        recommendation: 'Add .gitignore to exclude sensitive files from version control',
        code: 'MISSING_GITIGNORE',
        component: 'version-control'
      });
    }

    // Check for logs directory size (if it exists)
    const logsPath = join(this.workspacePath, '.agents-workspace/logs');
    if (existsSync(logsPath)) {
      // This would typically check log sizes and rotation
      result.warnings.push({
        path: '.agents-workspace/logs',
        message: 'Consider implementing log rotation',
        recommendation: 'Configure log rotation to prevent disk space issues',
        code: 'LOG_ROTATION_RECOMMENDATION',
        component: 'observability'
      });
    }
  }

  private createMetadata(): ValidationMetadata {
    return {
      schemaVersion: '0.1.8',
      validatedAt: new Date().toISOString(),
      validator: 'OSSA Workspace Validator v0.1.8',
      workspacePath: this.workspacePath
    };
  }

  /**
   * Get detailed validation report
   */
  getValidationReport(result: WorkspaceValidationResult): string {
    const { errors, warnings, structure } = result;
    const errorCount = errors.length;
    const warningCount = warnings.length;

    let report = `OSSA Workspace Validation Report\n`;
    report += `=================================\n\n`;
    report += `Workspace Path: ${this.workspacePath}\n`;
    report += `Validation Status: ${result.valid ? 'PASSED' : 'FAILED'}\n`;
    report += `Errors: ${errorCount}, Warnings: ${warningCount}\n\n`;

    // Structure summary
    report += `Directory Structure:\n`;
    structure.requiredDirectories.forEach(dir => {
      const status = dir.exists ? '✓' : (dir.required ? '✗' : '○');
      report += `  ${status} ${dir.path} ${dir.required ? '(required)' : '(optional)'}\n`;
    });
    report += '\n';

    // Configuration files
    if (structure.configFiles.length > 0) {
      report += `Configuration Files:\n`;
      structure.configFiles.forEach(file => {
        const status = file.exists ? (file.valid ? '✓' : '⚠') : '✗';
        report += `  ${status} ${file.path}\n`;
      });
      report += '\n';
    }

    // Errors by component
    if (errorCount > 0) {
      report += `Errors by Component:\n`;
      const errorsByComponent = this.groupByComponent(errors);
      for (const [component, componentErrors] of Object.entries(errorsByComponent)) {
        report += `  ${component}:\n`;
        componentErrors.forEach(error => {
          report += `    - ${error.path}: ${error.message} (${error.code})\n`;
        });
      }
      report += '\n';
    }

    // Warnings by component
    if (warningCount > 0) {
      report += `Warnings and Recommendations:\n`;
      const warningsByComponent = this.groupByComponent(warnings);
      for (const [component, componentWarnings] of Object.entries(warningsByComponent)) {
        report += `  ${component}:\n`;
        componentWarnings.forEach(warning => {
          report += `    - ${warning.path}: ${warning.message}\n`;
          report += `      Recommendation: ${warning.recommendation}\n`;
        });
      }
      report += '\n';
    }

    report += `Validation completed at: ${result.metadata.validatedAt}\n`;
    return report;
  }

  private groupByComponent(items: (ValidationError | ValidationWarning)[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    items.forEach(item => {
      const component = item.component || 'general';
      if (!grouped[component]) {
        grouped[component] = [];
      }
      grouped[component].push(item);
    });
    return grouped;
  }
}

// CLI interface
if (require.main === module) {
  const workspacePath = process.argv[2] || '.';
  const validator = new WorkspaceValidator(workspacePath);

  validator.validateWorkspace()
    .then(result => {
      console.log(validator.getValidationReport(result));
      process.exit(result.valid ? 0 : 1);
    })
    .catch(error => {
      console.error('Workspace validation failed:', error.message);
      process.exit(1);
    });
}

export default WorkspaceValidator;