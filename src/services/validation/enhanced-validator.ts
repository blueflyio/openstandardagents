/**
 * Enhanced Validator
 * Comprehensive validation service with cost estimation, security checks, and best practices
 *
 * SOLID: Composition - delegates to specialized validators
 * DRY: Single entry point for all validation concerns
 * API-First: Integrates with existing ValidationService
 */

import { inject, injectable } from 'inversify';
import type { OssaAgent, SchemaVersion, ValidationResult } from '../../types/index.js';
import { ValidationService } from '../validation.service.js';
import { CostEstimator, type CostEstimate } from './cost-estimator.js';
import {
  SecurityValidator,
  type SecurityValidationResult,
} from './security-validator.js';
import {
  BestPracticesValidator,
  type BestPracticesResult,
} from './best-practices-validator.js';

/**
 * Comprehensive validation report
 */
export interface EnhancedValidationReport {
  // Schema validation (from existing ValidationService)
  schemaValid: boolean;
  schemaErrors: ValidationResult['errors'];
  schemaWarnings: ValidationResult['warnings'];

  // Best practices validation
  bestPractices: BestPracticesResult;

  // Security validation
  security: SecurityValidationResult;

  // Cost estimation
  cost: CostEstimate;

  // Overall status
  passed: boolean; // true if schema valid AND security passed AND best practices passed
  manifest?: OssaAgent;
}

/**
 * Enhanced Validator Service
 * Integrates schema validation, cost estimation, security, and best practices
 */
@injectable()
export class EnhancedValidator {
  private costEstimator: CostEstimator;
  private securityValidator: SecurityValidator;
  private bestPracticesValidator: BestPracticesValidator;

  constructor(
    @inject(ValidationService) private validationService: ValidationService
  ) {
    this.costEstimator = new CostEstimator();
    this.securityValidator = new SecurityValidator();
    this.bestPracticesValidator = new BestPracticesValidator();
  }

  /**
   * Perform comprehensive validation
   */
  async validate(
    manifest: unknown,
    version?: SchemaVersion
  ): Promise<EnhancedValidationReport> {
    // 1. Schema validation (existing service)
    const schemaResult = await this.validationService.validate(manifest, version);

    // 2. Even if schema is invalid, try to run other validators on the manifest structure
    //    This allows cost estimation and security checks to work even with schema issues
    const manifestToValidate = (schemaResult.manifest || manifest) as OssaAgent;

    // 3. Run all validators in parallel
    const [bestPractices, security, cost] = await Promise.all([
      Promise.resolve(this.bestPracticesValidator.validate(manifestToValidate)),
      Promise.resolve(this.securityValidator.validate(manifestToValidate)),
      Promise.resolve(this.costEstimator.estimate(manifestToValidate)),
    ]);

    // 4. Determine overall pass/fail
    const passed = schemaResult.valid && security.passed && bestPractices.passed;

    return {
      schemaValid: schemaResult.valid,
      schemaErrors: schemaResult.errors,
      schemaWarnings: schemaResult.warnings,
      bestPractices,
      security,
      cost,
      passed,
      manifest: schemaResult.manifest,
    };
  }

  /**
   * Validate multiple manifests
   */
  async validateMany(
    manifests: unknown[],
    version?: SchemaVersion
  ): Promise<EnhancedValidationReport[]> {
    return Promise.all(
      manifests.map((manifest) => this.validate(manifest, version))
    );
  }

  /**
   * Get validation summary
   */
  getSummary(report: EnhancedValidationReport): ValidationSummary {
    return {
      passed: report.passed,
      schemaValid: report.schemaValid,
      securityScore: report.security.score,
      bestPracticesScore: report.bestPractices.score,
      estimatedDailyCost: report.cost.estimatedDailyCost,
      criticalIssues: this.getCriticalIssueCount(report),
      warnings: this.getWarningCount(report),
    };
  }

  /**
   * Get critical issues count
   */
  private getCriticalIssueCount(report: EnhancedValidationReport): number {
    let count = 0;

    // Schema errors
    count += report.schemaErrors.length;

    // Critical security vulnerabilities
    count += report.security.vulnerabilities.filter(
      (v) => v.severity === 'critical'
    ).length;

    // Best practices errors
    count += report.bestPractices.issues.filter((i) => i.severity === 'error')
      .length;

    return count;
  }

  /**
   * Get warnings count
   */
  private getWarningCount(report: EnhancedValidationReport): number {
    let count = 0;

    // Schema warnings
    count += report.schemaWarnings.length;

    // Security warnings (high/medium severity)
    count += report.security.vulnerabilities.filter(
      (v) => v.severity === 'high' || v.severity === 'medium'
    ).length;

    // Best practices warnings
    count += report.bestPractices.issues.filter((i) => i.severity === 'warning')
      .length;

    return count;
  }

  /**
   * Generate human-readable report
   */
  generateTextReport(report: EnhancedValidationReport): string {
    const lines: string[] = [];

    lines.push('=== Enhanced Validation Report ===\n');

    // Overall status
    lines.push(`Status: ${report.passed ? 'PASSED ✓' : 'FAILED ✗'}`);
    lines.push('');

    // Schema validation
    lines.push('--- Schema Validation ---');
    lines.push(`Valid: ${report.schemaValid ? 'Yes' : 'No'}`);
    if (report.schemaErrors.length > 0) {
      lines.push(`Errors: ${report.schemaErrors.length}`);
      for (const error of report.schemaErrors.slice(0, 5)) {
        lines.push(`  • ${error.instancePath}: ${error.message}`);
      }
      if (report.schemaErrors.length > 5) {
        lines.push(`  ... and ${report.schemaErrors.length - 5} more`);
      }
    }
    if (report.schemaWarnings.length > 0) {
      lines.push(`Warnings: ${report.schemaWarnings.length}`);
    }
    lines.push('');

    // Security
    lines.push('--- Security ---');
    lines.push(`Score: ${report.security.score}/100`);
    lines.push(`Status: ${report.security.passed ? 'PASSED' : 'FAILED'}`);
    if (report.security.vulnerabilities.length > 0) {
      lines.push(`Vulnerabilities: ${report.security.vulnerabilities.length}`);
      const critical = report.security.vulnerabilities.filter(
        (v) => v.severity === 'critical'
      );
      const high = report.security.vulnerabilities.filter(
        (v) => v.severity === 'high'
      );
      if (critical.length > 0) {
        lines.push(`  Critical: ${critical.length}`);
        for (const vuln of critical) {
          lines.push(`    • ${vuln.message}`);
          lines.push(`      → ${vuln.recommendation}`);
        }
      }
      if (high.length > 0) {
        lines.push(`  High: ${high.length}`);
        for (const vuln of high.slice(0, 3)) {
          lines.push(`    • ${vuln.message}`);
        }
      }
    }
    lines.push('');

    // Best Practices
    lines.push('--- Best Practices ---');
    lines.push(`Score: ${report.bestPractices.score}/100`);
    lines.push(`Status: ${report.bestPractices.passed ? 'PASSED' : 'FAILED'}`);
    if (report.bestPractices.issues.length > 0) {
      lines.push(`Issues: ${report.bestPractices.issues.length}`);
      const errors = report.bestPractices.issues.filter(
        (i) => i.severity === 'error'
      );
      const warnings = report.bestPractices.issues.filter(
        (i) => i.severity === 'warning'
      );
      if (errors.length > 0) {
        lines.push(`  Errors: ${errors.length}`);
        for (const issue of errors.slice(0, 3)) {
          lines.push(`    • ${issue.message}`);
          lines.push(`      → ${issue.recommendation}`);
        }
      }
      if (warnings.length > 0) {
        lines.push(`  Warnings: ${warnings.length}`);
      }
    }
    lines.push('');

    // Cost Estimation
    lines.push('--- Cost Estimation ---');
    lines.push(
      `Provider: ${report.cost.provider} | Model: ${report.cost.model}`
    );
    lines.push(
      `Estimated Daily Cost: $${report.cost.estimatedDailyCost.toFixed(4)}`
    );
    lines.push(
      `Estimated Monthly Cost: $${report.cost.estimatedMonthlyCost.toFixed(2)}`
    );
    if (report.cost.recommendations.length > 0) {
      lines.push('Recommendations:');
      for (const rec of report.cost.recommendations) {
        lines.push(`  • ${rec}`);
      }
    }
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate JSON report
   */
  generateJsonReport(report: EnhancedValidationReport): string {
    return JSON.stringify(report, null, 2);
  }
}

/**
 * Validation summary
 */
export interface ValidationSummary {
  passed: boolean;
  schemaValid: boolean;
  securityScore: number;
  bestPracticesScore: number;
  estimatedDailyCost: number;
  criticalIssues: number;
  warnings: number;
}
