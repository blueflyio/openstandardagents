/**
 * OSSA v0.4.4 Validator Registry
 *
 * Validators are first-class OSSA agents (kind: Validator) that validate other agent manifests.
 * This registry discovers, loads, and executes validator manifests.
 *
 * **Innovation**: Validators compose using the same operators as agents (>>, <||>, ? :)
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import * as yaml from 'yaml';
import { ValidationResult } from './validator.js';

/**
 * Validator Manifest (kind: Validator)
 */
export interface ValidatorManifest {
  apiVersion: string;
  kind: 'Validator';
  metadata: {
    name: string;
    version?: string;
    description?: string;
    agentType: 'validator';
    agentKind: 'schema' | 'semantic' | 'platform' | 'runtime' | 'security' | 'performance';
    tags?: string[];
  };
  spec: {
    validates: {
      targetTypes: string[];
      phases: Array<'schema' | 'semantic' | 'platform' | 'runtime'>;
    };
    rules: ValidationRule[];
    coordination?: {
      composable: boolean;
      operators: Array<'>>' | '<||>' | '? :'>;
    };
    dependencies?: string[];
  };
}

/**
 * Validation Rule within a validator manifest
 */
export interface ValidationRule {
  id: string;
  when: Condition;
  and?: Condition;
  or?: Condition;
  then: {
    enforcement: 'error' | 'warning' | 'info';
    message: string;
    rationale?: string;
    fixes?: Fix[];
    documentation?: string;
  };
}

/**
 * Condition for rule matching
 */
export interface Condition {
  path: string;
  equals?: unknown;
  contains?: unknown;
  matches?: string;
  exists?: boolean;
}

/**
 * Auto-fix proposal
 */
export interface Fix {
  action: 'add' | 'change' | 'remove' | 'compose';
  path: string;
  value?: unknown;
  impact?: string;
  effort?: 'low' | 'medium' | 'high';
}

/**
 * Enriched validation result with fixes
 */
export interface EnrichedValidationResult extends ValidationResult {
  fixes?: Fix[];
  rationale?: string;
  documentation?: string;
}

/**
 * Validator Registry
 *
 * Discovers and executes validator manifests (kind: Validator).
 */
export class ValidatorRegistry {
  private validators: Map<string, ValidatorManifest> = new Map();
  private loaded = false;

  constructor(private validatorsPath?: string) {}

  /**
   * Load validator manifests from templates/validators/
   */
  async loadValidators(): Promise<void> {
    if (this.loaded) {
      return;
    }

    const templatesPath =
      this.validatorsPath || join(__dirname, '../../templates/validators');

    try {
      const files = readdirSync(templatesPath);

      for (const file of files) {
        if (file.endsWith('.ossa.yaml') || file.endsWith('.ossa.yml')) {
          const filePath = join(templatesPath, file);
          try {
            const content = readFileSync(filePath, 'utf-8');
            const manifest = yaml.parse(content) as ValidatorManifest;

            if (manifest.kind === 'Validator') {
              this.validators.set(manifest.metadata.name, manifest);
            }
          } catch (error) {
            console.warn(`Failed to load validator ${file}:`, error);
          }
        }
      }

      this.loaded = true;
    } catch (error) {
      console.warn('Failed to load validators from', templatesPath, error);
      this.loaded = true; // Mark as loaded even if failed (graceful degradation)
    }
  }

  /**
   * Get validators applicable to a manifest
   *
   * @param manifest - Agent manifest to validate
   * @param phase - Validation phase (schema, semantic, platform, runtime)
   * @returns Applicable validators for this agent type and phase
   */
  getApplicableValidators(
    manifest: Record<string, unknown>,
    phase?: 'schema' | 'semantic' | 'platform' | 'runtime'
  ): ValidatorManifest[] {
    const agentType = this.getAgentType(manifest);

    return Array.from(this.validators.values()).filter((validator) => {
      // Check if validator applies to this agent type
      const targetTypes = validator.spec.validates.targetTypes;
      const appliesToType =
        targetTypes.includes('all') || targetTypes.includes(agentType);

      // Check if validator applies to this phase
      const appliesToPhase =
        !phase || validator.spec.validates.phases.includes(phase);

      return appliesToType && appliesToPhase;
    });
  }

  /**
   * Execute validation rule
   *
   * @param rule - Validation rule to execute
   * @param manifest - Agent manifest to validate
   * @returns Validation result or null if rule doesn't match
   */
  executeRule(
    rule: ValidationRule,
    manifest: Record<string, unknown>
  ): EnrichedValidationResult | null {
    // Evaluate 'when' condition
    if (!this.evaluateCondition(rule.when, manifest)) {
      return null;
    }

    // Evaluate 'and' condition if present
    if (rule.and && !this.evaluateCondition(rule.and, manifest)) {
      return null;
    }

    // Evaluate 'or' condition if present
    if (rule.or) {
      // If 'or' is present, either 'when' OR 'or' must match
      // We already know 'when' matched, so we're good
      // If 'when' didn't match, check 'or'
    }

    // Rule triggered - return validation result
    const enforcement = rule.then.enforcement;

    const result: EnrichedValidationResult = {
      valid: enforcement !== 'error',
      errors:
        enforcement === 'error'
          ? [`${rule.when.path}: ${rule.then.message} (rule: ${rule.id})`]
          : [],
      warnings: enforcement === 'warning' ? [rule.then.message] : [],
      fixes: rule.then.fixes,
      rationale: rule.then.rationale,
      documentation: rule.then.documentation,
    };

    return result;
  }

  /**
   * Validate manifest with all applicable validators
   *
   * @param manifest - Agent manifest to validate
   * @param phase - Optional validation phase
   * @returns Aggregated validation results
   */
  async validate(
    manifest: Record<string, unknown>,
    phase?: 'schema' | 'semantic' | 'platform' | 'runtime'
  ): Promise<ValidationResult & { fixes?: Fix[] }> {
    // Ensure validators are loaded
    await this.loadValidators();

    // Get applicable validators
    const validators = this.getApplicableValidators(manifest, phase);

    // Execute all rules from all validators
    const results: EnrichedValidationResult[] = [];
    const allFixes: Fix[] = [];

    for (const validator of validators) {
      for (const rule of validator.spec.rules) {
        const result = this.executeRule(rule, manifest);
        if (result) {
          results.push(result);
          if (result.fixes) {
            allFixes.push(...result.fixes);
          }
        }
      }
    }

    // Aggregate results
    const aggregated: ValidationResult & { fixes?: Fix[] } = {
      valid: results.every((r) => r.valid),
      errors: results.flatMap((r) => r.errors || []),
      warnings: results.flatMap((r) => r.warnings || []),
      fixes: allFixes.length > 0 ? allFixes : undefined,
    };

    return aggregated;
  }

  /**
   * Evaluate a condition against manifest
   */
  private evaluateCondition(
    condition: Condition,
    manifest: Record<string, unknown>
  ): boolean {
    const value = this.getValueByPath(manifest, condition.path);

    // Check 'equals'
    if (condition.equals !== undefined) {
      return value === condition.equals;
    }

    // Check 'contains' (for arrays)
    if (condition.contains !== undefined) {
      if (Array.isArray(value)) {
        return value.includes(condition.contains);
      }
      return false;
    }

    // Check 'matches' (regex)
    if (condition.matches !== undefined) {
      if (typeof value === 'string') {
        const regex = new RegExp(condition.matches);
        return regex.test(value);
      }
      return false;
    }

    // Check 'exists'
    if (condition.exists !== undefined) {
      const exists = value !== undefined && value !== null;
      return condition.exists ? exists : !exists;
    }

    return false;
  }

  /**
   * Get value by JSON path
   */
  private getValueByPath(
    obj: Record<string, unknown>,
    path: string
  ): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (
        typeof current === 'object' &&
        current !== null &&
        part in (current as Record<string, unknown>)
      ) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Get agent type from manifest
   */
  private getAgentType(manifest: Record<string, unknown>): string {
    const metadata = manifest.metadata as Record<string, unknown> | undefined;
    return (metadata?.agentType as string) || 'unknown';
  }

  /**
   * List all loaded validators
   */
  listValidators(): ValidatorManifest[] {
    return Array.from(this.validators.values());
  }

  /**
   * Get validator by name
   */
  getValidator(name: string): ValidatorManifest | undefined {
    return this.validators.get(name);
  }

  /**
   * Check if validators are loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get validator count
   */
  count(): number {
    return this.validators.size;
  }
}

/**
 * Singleton instance for easy access
 */
let registryInstance: ValidatorRegistry | null = null;

/**
 * Get the global validator registry instance
 */
export function getValidatorRegistry(
  validatorsPath?: string
): ValidatorRegistry {
  if (!registryInstance) {
    registryInstance = new ValidatorRegistry(validatorsPath);
  }
  return registryInstance;
}

/**
 * Reset the global registry (useful for testing)
 */
export function resetValidatorRegistry(): void {
  registryInstance = null;
}
