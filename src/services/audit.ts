/**
 * OSSA Agent Audit Service
 *
 * Scans directories for OSSA agent manifests and validates their health.
 * Implements the OSSA Audit API specification.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import Ajv from 'ajv';

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
  private ossaSchema: any;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    // Load OSSA schema (would load from schema directory)
    this.ossaSchema = null; // TODO: Load actual schema
  }

  /**
   * Scan directory and audit all agents
   */
  async scanAndAudit(options: AuditOptions): Promise<AuditReport> {
    const {
      path: scanPath,
      recursive = true,
      validationLevel = 'full',
      specVersion = '0.3.5',
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
  async auditAgent(agentPath: string, validationLevel: string = 'full'): Promise<AgentHealth> {
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
        message: 'No manifest file found (manifest.ossa.yaml or manifest.ossa.json)',
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
      manifest = manifestFormat === 'yaml' ? yaml.parse(content) : JSON.parse(content);
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
    if (validationLevel === 'full' || validationLevel === 'strict') {
      const validationResult = this.validateManifest(manifest);
      health.manifestValid = validationResult.valid;
      health.validationErrors = validationResult.errors;

      if (!validationResult.valid) {
        health.issues.push({
          severity: 'error',
          code: 'SCHEMA_VALIDATION_FAILED',
          message: `Manifest does not conform to OSSA spec: ${validationResult.errors.length} errors`,
        });
      }
    } else {
      health.manifestValid = true; // Skip validation in basic mode
    }

    // Count capabilities, tools, triggers
    health.capabilitiesCount = manifest.spec?.capabilities?.length || manifest.capabilities?.length || 0;
    health.toolsCount = manifest.spec?.tools?.length || manifest.tools?.length || 0;
    health.triggersCount = manifest.spec?.triggers?.length || manifest.triggers?.length || 0;

    // Check for missing sections
    if (health.capabilitiesCount === 0) {
      health.issues.push({
        severity: 'warning',
        code: 'NO_CAPABILITIES',
        message: 'Agent has no capabilities defined',
        field: 'spec.capabilities',
      });
    }

    if (health.toolsCount === 0) {
      health.issues.push({
        severity: 'warning',
        code: 'NO_TOOLS',
        message: 'Agent has no tools defined',
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
   * Validate manifest against OSSA schema
   */
  private validateManifest(manifest: any): { valid: boolean; errors: any[] } {
    // TODO: Implement actual schema validation using ajv
    // For now, do basic checks
    const errors: any[] = [];

    if (!manifest.metadata && !manifest.name) {
      errors.push({
        path: '/metadata/name',
        message: 'Agent name is required',
      });
    }

    if (!manifest.spec && !manifest.capabilities) {
      errors.push({
        path: '/spec',
        message: 'Agent spec is required',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate health score (0-100)
   */
  private calculateHealthScore(health: AgentHealth): number {
    let score = 0;

    // Manifest exists: 30 points
    if (health.manifestExists) score += 30;

    // Manifest valid: 30 points
    if (health.manifestValid) score += 30;

    // Has capabilities: 20 points
    if (health.capabilitiesCount > 0) score += 20;

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
    const healthy = agents.filter(a => a.status === 'healthy').length;
    const warning = agents.filter(a => a.status === 'warning').length;
    const error = agents.filter(a => a.status === 'error').length;
    const healthPercentage = total > 0 ? Math.round((healthy / total) * 100) : 0;

    return {
      total,
      healthy,
      warning,
      error,
      healthPercentage,
    };
  }
}
