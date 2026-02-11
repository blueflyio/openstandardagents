/**
 * OSSA Agent Audit Service
 *
 * Scans directories for OSSA agent manifests and validates their health.
 * Implements the OSSA Audit API specification.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import Ajv, { type ValidateFunction, type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { SCHEMA_PATH, API_VERSION } from '../version.js';

export interface AuditOptions {
  path: string;
  recursive?: boolean;
  validationLevel?: 'basic' | 'full' | 'strict';
  specVersion?: string;
  includeExamples?: boolean;
}

export interface AgentHealth {
  id: string;
  name?: string;
  path: string;
  manifestExists: boolean;
  manifestPath?: string;
  manifestFormat?: 'yaml' | 'json';
  manifestValid: boolean;
  capabilitiesCount: number;
  toolsCount: number;
  triggersCount: number;
  status: 'healthy' | 'warning' | 'error';
  healthScore: number;
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    code: string;
    message: string;
    field?: string;
  }>;
  validationErrors: Array<{
    path: string;
    message: string;
  }>;
}

export interface AuditReport {
  summary: {
    total: number;
    healthy: number;
    warning: number;
    error: number;
    healthPercentage: number;
  };
  agents: AgentHealth[];
  timestamp: string;
  scanPath: string;
  validationLevel: string;
}

export class AgentAuditService {
  private ajv: Ajv;
  private ossaSchema: object;
  private validate: ValidateFunction;

  constructor() {
    // Initialize Ajv validator with formats support
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true,
    });
    addFormats(this.ajv);

    // Load OSSA v0.4 schema
    const schemaPath = path.resolve(process.cwd(), SCHEMA_PATH);

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`OSSA schema not found at ${schemaPath}`);
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    this.ossaSchema = JSON.parse(schemaContent);

    // Compile schema and store validator
    this.validate = this.ajv.compile(this.ossaSchema);
  }

  /**
   * Scan directory and audit all agents
   */
  async scanAndAudit(options: AuditOptions): Promise<AuditReport> {
    const {
      path: scanPath,
      recursive = true,
      validationLevel = 'full',
      specVersion = '0.4.5',
      includeExamples = false,
    } = options;

    // Find all agent directories
    const agentDirs = this.findAgentDirectories(scanPath, recursive);

    // Audit each agent
    const agents: AgentHealth[] = [];
    for (const agentDir of agentDirs) {
      const health = await this.auditAgent(agentDir, validationLevel);

      // Skip examples unless requested
      if (!includeExamples && health.path.includes('/examples/')) {
        continue;
      }

      agents.push(health);
    }

    // Calculate summary
    const summary = this.calculateSummary(agents);

    return {
      summary,
      agents,
      timestamp: new Date().toISOString(),
      scanPath,
      validationLevel,
    };
  }

  /**
   * Audit a single agent
   */
  async auditAgent(
    agentPath: string,
    validationLevel: string = 'full'
  ): Promise<AgentHealth> {
    const agentId = path.basename(agentPath);
    const health: AgentHealth = {
      id: agentId,
      path: agentPath,
      manifestExists: false,
      manifestValid: false,
      capabilitiesCount: 0,
      toolsCount: 0,
      triggersCount: 0,
      status: 'error',
      healthScore: 0,
      issues: [],
      validationErrors: [],
    };

    // Check for manifest file
    const yamlPath = path.join(agentPath, 'manifest.ossa.yaml');
    const jsonPath = path.join(agentPath, 'manifest.ossa.json');

    let manifestPath: string | null = null;
    let manifestFormat: 'yaml' | 'json' | null = null;

    if (fs.existsSync(yamlPath)) {
      manifestPath = yamlPath;
      manifestFormat = 'yaml';
    } else if (fs.existsSync(jsonPath)) {
      manifestPath = jsonPath;
      manifestFormat = 'json';
    }

    if (!manifestPath) {
      health.issues.push({
        severity: 'error',
        code: 'MANIFEST_MISSING',
        message:
          'No manifest file found (manifest.ossa.yaml or manifest.ossa.json)',
      });
      return health;
    }

    health.manifestExists = true;
    health.manifestPath = manifestPath;
    health.manifestFormat = manifestFormat!;

    // Load and parse manifest
    let manifest: any;
    try {
      const content = fs.readFileSync(manifestPath, 'utf-8');
      manifest =
        manifestFormat === 'yaml' ? yaml.parse(content) : JSON.parse(content);
    } catch (error: any) {
      health.issues.push({
        severity: 'error',
        code: 'MANIFEST_PARSE_ERROR',
        message: `Failed to parse manifest: ${error.message}`,
      });
      return health;
    }

    // Extract basic info
    health.name = manifest.metadata?.name || manifest.name;

    // Validate against OSSA schema
    let manifestValid = false;
    if (validationLevel === 'full' || validationLevel === 'strict') {
      const validationResult = this.validateManifest(manifest);
      manifestValid = validationResult.valid;
      health.manifestValid = validationResult.valid;
      health.validationErrors = validationResult.errors;

      if (!validationResult.valid) {
        health.issues.push({
          severity: 'error',
          code: 'SCHEMA_VALIDATION_FAILED',
          message: `Manifest does not conform to OSSA spec: ${validationResult.errors.length} errors`,
        });
      }

      // Check schema version if valid
      if (manifestValid) {
        const versionIssue = this.checkSchemaVersion(manifest);
        if (versionIssue) {
          health.issues.push(versionIssue);
        }
      }
    } else {
      health.manifestValid = true; // Skip validation in basic mode
      manifestValid = true;
    }

    // Count capabilities, tools, triggers (capabilities are legacy/workflow-specific)
    health.capabilitiesCount =
      manifest.spec?.capabilities?.length || manifest.capabilities?.length || 0;
    health.toolsCount =
      manifest.spec?.tools?.length || manifest.tools?.length || 0;
    health.triggersCount =
      manifest.spec?.triggers?.length || manifest.triggers?.length || 0;

    // Check for missing tools (optional warning, not required for v0.4)
    if (health.toolsCount === 0 && manifest.kind === 'Agent') {
      health.issues.push({
        severity: 'info',
        code: 'NO_TOOLS',
        message: 'Agent has no tools defined (optional)',
        field: 'spec.tools',
      });
    }

    // Calculate health score
    health.healthScore = this.calculateHealthScore(health);

    // Determine status
    if (health.healthScore >= 80 && health.manifestValid) {
      health.status = 'healthy';
    } else if (health.healthScore >= 50 || health.manifestValid) {
      health.status = 'warning';
    } else {
      health.status = 'error';
    }

    return health;
  }

  /**
   * Find all agent directories in path
   */
  private findAgentDirectories(scanPath: string, recursive: boolean): string[] {
    const dirs: string[] = [];

    if (!fs.existsSync(scanPath)) {
      return dirs;
    }

    const entries = fs.readdirSync(scanPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const fullPath = path.join(scanPath, entry.name);

      // Check if this directory contains an agent manifest
      const hasManifest =
        fs.existsSync(path.join(fullPath, 'manifest.ossa.yaml')) ||
        fs.existsSync(path.join(fullPath, 'manifest.ossa.json'));

      if (hasManifest) {
        dirs.push(fullPath);
      } else if (recursive) {
        // Recursively scan subdirectories
        dirs.push(...this.findAgentDirectories(fullPath, recursive));
      }
    }

    return dirs;
  }

  /**
   * Validate manifest against OSSA schema using Ajv
   */
  private validateManifest(manifest: any): { valid: boolean; errors: any[] } {
    const valid = this.validate(manifest);

    if (!valid && this.validate.errors) {
      const errors = this.validate.errors.map((err) => ({
        path: err.instancePath || '/',
        message: err.message || 'Validation error',
      }));
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Check schema version and warn if outdated
   */
  private checkSchemaVersion(
    manifest: any
  ): AgentHealth['issues'][0] | null {
    const apiVersion = manifest.apiVersion;

    if (!apiVersion) {
      return {
        severity: 'error',
        code: 'MISSING_API_VERSION',
        message: 'Manifest missing apiVersion field',
        field: 'apiVersion',
      };
    }

    // Compare with current API version
    if (apiVersion !== API_VERSION) {
      return {
        severity: 'warning',
        code: 'VERSION_MISMATCH',
        message: `Manifest uses ${apiVersion}, current is ${API_VERSION}`,
        field: 'apiVersion',
      };
    }

    return null;
  }

  /**
   * Calculate health score (0-100)
   * v0.4 schema no longer requires capabilities, so scoring is adjusted
   */
  private calculateHealthScore(health: AgentHealth): number {
    let score = 0;

    // Manifest exists: 30 points
    if (health.manifestExists) score += 30;

    // Manifest valid: 50 points (increased importance in v0.4)
    if (health.manifestValid) score += 50;

    // Has tools: 10 points
    if (health.toolsCount > 0) score += 10;

    // Has triggers: 10 points
    if (health.triggersCount > 0) score += 10;

    return Math.min(100, score);
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(agents: AgentHealth[]): AuditReport['summary'] {
    const total = agents.length;
    const healthy = agents.filter((a) => a.status === 'healthy').length;
    const warning = agents.filter((a) => a.status === 'warning').length;
    const error = agents.filter((a) => a.status === 'error').length;
    const healthPercentage =
      total > 0 ? Math.round((healthy / total) * 100) : 0;

    return {
      total,
      healthy,
      warning,
      error,
      healthPercentage,
    };
  }
}
