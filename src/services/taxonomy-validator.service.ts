import { OssaAgent } from '../types/index.js';
import { TaxonomyService } from './taxonomy.service.js';
import { container } from '../di-container.js';

export interface TaxonomyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: TaxonomyConflict[];
}

export interface TaxonomyConflict {
  field: string;
  value: string;
  reason: string;
  suggestion?: string;
}

export class TaxonomyValidatorService {
  private taxonomyService: TaxonomyService;

  constructor() {
    this.taxonomyService = container.get<TaxonomyService>(TaxonomyService);
  }

  async validate(manifest: OssaAgent): Promise<TaxonomyValidationResult> {
    const result: TaxonomyValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      conflicts: [],
    };

    const taxonomy = (manifest.spec as Record<string, unknown>)?.taxonomy as
      | Record<string, unknown>
      | undefined;
    if (!taxonomy) {
      result.warnings.push('No taxonomy specified in manifest');
      return result;
    }

    const taxonomySpec = await this.taxonomyService.loadTaxonomy();

    // Validate maturity level
    if (taxonomy.maturity) {
      const maturity = taxonomy.maturity as string;
      if (!taxonomySpec.maturity_levels?.[maturity]) {
        result.errors.push(`Invalid maturity level: ${maturity}`);
        result.valid = false;
      }
    }

    // Validate deployment pattern
    if (taxonomy.deployment_pattern) {
      const deployment = taxonomy.deployment_pattern as string;
      if (!taxonomySpec.deployment_patterns?.[deployment]) {
        result.errors.push(`Invalid deployment pattern: ${deployment}`);
        result.valid = false;
      }
    }

    // Validate integration pattern
    if (taxonomy.integration_pattern) {
      const integration = taxonomy.integration_pattern as string;
      if (!taxonomySpec.integration_patterns?.[integration]) {
        result.errors.push(`Invalid integration pattern: ${integration}`);
        result.valid = false;
      }
    }

    // Validate cost profile
    if (taxonomy.cost_profile) {
      const cost = taxonomy.cost_profile as string;
      if (!taxonomySpec.cost_profiles?.[cost]) {
        result.errors.push(`Invalid cost profile: ${cost}`);
        result.valid = false;
      }
    }

    // Validate performance tier
    if (taxonomy.performance_tier) {
      const performance = taxonomy.performance_tier as string;
      if (!taxonomySpec.performance_tiers?.[performance]) {
        result.errors.push(`Invalid performance tier: ${performance}`);
        result.valid = false;
      }
    }

    // Check for conflicts
    const conflicts = this.checkConflicts(taxonomy, manifest);
    result.conflicts = conflicts;
    if (conflicts.length > 0) {
      result.warnings.push(`${conflicts.length} taxonomy conflict(s) detected`);
    }

    // Check consistency
    const consistencyIssues = this.checkConsistency(taxonomy, manifest);
    result.warnings.push(...consistencyIssues);

    return result;
  }

  private checkConflicts(
    taxonomy: Record<string, unknown>,
    manifest: OssaAgent
  ): TaxonomyConflict[] {
    const conflicts: TaxonomyConflict[] = [];

    // Check maturity vs deployment pattern conflicts
    if (
      taxonomy.maturity === 'prototype' &&
      taxonomy.deployment_pattern === 'serverless'
    ) {
      conflicts.push({
        field: 'deployment_pattern',
        value: taxonomy.deployment_pattern as string,
        reason:
          'Prototype agents typically use container deployment for easier debugging',
        suggestion: 'container',
      });
    }

    // Check cost profile vs performance tier conflicts
    if (
      taxonomy.cost_profile === 'low' &&
      taxonomy.performance_tier === 'real-time'
    ) {
      conflicts.push({
        field: 'performance_tier',
        value: taxonomy.performance_tier as string,
        reason:
          'Real-time performance typically requires higher cost infrastructure',
        suggestion: 'near-real-time',
      });
    }

    // Check integration pattern vs deployment pattern conflicts
    if (
      taxonomy.integration_pattern === 'streaming' &&
      taxonomy.deployment_pattern === 'serverless'
    ) {
      conflicts.push({
        field: 'deployment_pattern',
        value: taxonomy.deployment_pattern as string,
        reason:
          'Streaming integration typically requires container or edge deployment',
        suggestion: 'container',
      });
    }

    return conflicts;
  }

  private checkConsistency(
    taxonomy: Record<string, unknown>,
    manifest: OssaAgent
  ): string[] {
    const issues: string[] = [];

    // Check domain consistency
    const domain = taxonomy.domain as string | undefined;
    const labels = manifest.metadata?.labels || {};
    const labelDomain = labels['ossa.ai/domain'] as string | undefined;

    if (domain && labelDomain && domain !== labelDomain) {
      issues.push(
        `Taxonomy domain (${domain}) differs from label domain (${labelDomain})`
      );
    }

    // Check agent type consistency
    const agentType = taxonomy.agent_type as string | undefined;
    const labelType = labels['ossa.ai/type'] as string | undefined;

    if (agentType && labelType && agentType !== labelType) {
      issues.push(
        `Taxonomy agent type (${agentType}) differs from label type (${labelType})`
      );
    }

    return issues;
  }

  async validateAgainstSpec(
    taxonomy: Record<string, unknown>
  ): Promise<{ valid: boolean; errors: string[] }> {
    const taxonomySpec = await this.taxonomyService.loadTaxonomy();
    const errors: string[] = [];

    // Validate all taxonomy fields against spec
    const fields = [
      'maturity',
      'deployment_pattern',
      'integration_pattern',
      'cost_profile',
      'performance_tier',
    ];

    for (const field of fields) {
      const value = taxonomy[field] as string | undefined;
      if (!value) continue;

      const specSection = taxonomySpec[
        `${field}s` as keyof typeof taxonomySpec
      ] as Record<string, unknown> | undefined;
      if (!specSection || !specSection[value]) {
        errors.push(`Invalid ${field}: ${value}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
