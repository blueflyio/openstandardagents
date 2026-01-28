/**
 * OSSA v0.3.6 Manifest Validator
 *
 * JSON Schema validator for OSSA agent manifests using Ajv
 * Validates revolutionary features: identity, genetics, lifecycle, economics, taxonomy
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export class OSSAValidator {
  private ajv: Ajv;
  private schema: Record<string, unknown>;

  constructor(schemaPath?: string) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false, // Allow additional properties for extensibility
    });
    addFormats(this.ajv);

    // Load schema
    const defaultSchemaPath = join(
      __dirname,
      '../spec/v0.3/ossa-0.3.6.schema.json'
    );
    const resolvedPath = schemaPath || defaultSchemaPath;

    try {
      const schemaContent = readFileSync(resolvedPath, 'utf-8');
      this.schema = JSON.parse(schemaContent);
    } catch (error) {
      throw new Error(`Failed to load schema from ${resolvedPath}: ${error}`);
    }
  }

  /**
   * Get Ajv instance for internal use
   */
  get ajvInstance(): Ajv {
    return this.ajv;
  }

  /**
   * Validate an OSSA manifest
   */
  validate(manifest: Record<string, unknown>): ValidationResult {
    const valid = this.ajv.validate(this.schema, manifest);

    if (valid) {
      return { valid: true, warnings: this.generateWarnings(manifest) };
    }

    const errors =
      this.ajv.errors?.map((err) => {
        const path = err.instancePath || '/';
        const message = err.message || 'Unknown error';
        return `${path}: ${message}`;
      }) || [];

    return {
      valid: false,
      errors,
      warnings: this.generateWarnings(manifest),
    };
  }

  /**
   * Validate from file path
   */
  validateFile(filePath: string): ValidationResult {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const manifest = JSON.parse(content);
      return this.validate(manifest);
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to read or parse file: ${error}`],
      };
    }
  }

  /**
   * Generate validation warnings (non-breaking issues)
   */
  private generateWarnings(manifest: Record<string, unknown>): string[] {
    const warnings: string[] = [];

    // Check for revolutionary features usage
    const metadata = (manifest.metadata as Record<string, unknown>) || {};

    // Warn if DID-based identity is used without credentials
    if (metadata.decentralized_identity) {
      const identity = metadata.decentralized_identity as Record<
        string,
        unknown
      >;
      if (
        identity.did &&
        (!identity.credentials ||
          (Array.isArray(identity.credentials) &&
            identity.credentials.length === 0))
      ) {
        warnings.push(
          'decentralized_identity.did is set but no credentials provided'
        );
      }
      if (identity.reputation) {
        const reputation = identity.reputation as Record<string, unknown>;
        if (reputation.credit_score === undefined) {
          warnings.push(
            'decentralized_identity.reputation exists but credit_score is not set'
          );
        }
      }
    }

    // Warn if genetics is used without fitness scoring
    if (metadata.genetics) {
      const genetics = metadata.genetics as Record<string, unknown>;
      if (
        typeof genetics.generation === 'number' &&
        genetics.generation > 0 &&
        (!genetics.parent_dids ||
          (Array.isArray(genetics.parent_dids) &&
            genetics.parent_dids.length === 0))
      ) {
        warnings.push('genetics.generation > 0 but no parent_dids specified');
      }
      if (!genetics.fitness) {
        warnings.push(
          'genetics defined but fitness.score not set - breeding eligibility cannot be determined'
        );
      } else {
        const fitness = genetics.fitness as Record<string, unknown>;
        if (fitness.score === undefined) {
          warnings.push(
            'genetics defined but fitness.score not set - breeding eligibility cannot be determined'
          );
        }
      }
    }

    // Warn if lifecycle_stages retirement is eligible but no legacy defined
    if (metadata.lifecycle_stages) {
      const lifecycle = metadata.lifecycle_stages as Record<string, unknown>;
      if (lifecycle.retirement) {
        const retirement = lifecycle.retirement as Record<string, unknown>;
        if (retirement.eligible && !retirement.legacy) {
          warnings.push(
            'lifecycle_stages.retirement.eligible is true but no legacy defined'
          );
        }
      }
      if (lifecycle.current_stage === 'retired') {
        const retirement = lifecycle.retirement as
          | Record<string, unknown>
          | undefined;
        if (!retirement?.retired_at) {
          warnings.push(
            'lifecycle_stages.current_stage is "retired" but retirement.retired_at timestamp missing'
          );
        }
      }
    }

    // Warn if economics marketplace has offerings but no wallet
    if (metadata.economics) {
      const economics = metadata.economics as Record<string, unknown>;
      if (economics.marketplace) {
        const marketplace = economics.marketplace as Record<string, unknown>;
        if (
          marketplace.offerings &&
          Array.isArray(marketplace.offerings) &&
          marketplace.offerings.length > 0 &&
          !economics.wallet
        ) {
          warnings.push(
            'economics.marketplace.offerings exist but no wallet defined to receive payments'
          );
        }
      }
    }

    // Warn if team_membership exists but lifecycle_stages missing
    if (metadata.team_membership && !metadata.lifecycle_stages) {
      warnings.push(
        'team_membership defined but lifecycle_stages missing - consider tracking agent growth'
      );
    }

    // Warn if taxonomy domain doesn't match typical agent type
    if (metadata.taxonomy && manifest.spec) {
      const taxonomy = metadata.taxonomy as Record<string, unknown>;
      const spec = manifest.spec as Record<string, unknown>;
      const domain = taxonomy.domain as string;
      const agentType = spec.type as string;

      // Security domain should typically use analyzer/specialist types
      if (
        domain === 'security' &&
        !['analyzer', 'specialist', 'worker'].includes(agentType)
      ) {
        warnings.push(
          `taxonomy.domain is "security" but spec.type is "${agentType}" - consider using analyzer or specialist type`
        );
      }

      // Agents domain should use orchestrator/supervisor types
      if (
        domain === 'agents' &&
        !['orchestrator', 'supervisor'].includes(agentType)
      ) {
        warnings.push(
          `taxonomy.domain is "agents" but spec.type is "${agentType}" - consider using orchestrator or supervisor type`
        );
      }
    }

    return warnings;
  }

  /**
   * Validate revolutionary features specifically
   */
  validateRevolutionaryFeatures(
    manifest: Record<string, unknown>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata = (manifest.metadata as Record<string, unknown>) || {};

    // Validate decentralized_identity
    if (metadata.decentralized_identity) {
      const identity = metadata.decentralized_identity as Record<
        string,
        unknown
      >;
      if (
        identity.did &&
        typeof identity.did === 'string' &&
        !/^did:ossa:[a-z0-9]{32,64}$/.test(identity.did)
      ) {
        errors.push(
          'decentralized_identity.did must match pattern: did:ossa:[a-z0-9]{32,64}'
        );
      }
    }

    // Validate genetics
    if (metadata.genetics) {
      const genetics = metadata.genetics as Record<string, unknown>;
      if (typeof genetics.generation === 'number' && genetics.generation < 0) {
        errors.push('genetics.generation must be >= 0');
      }
      if (genetics.fitness) {
        const fitness = genetics.fitness as Record<string, unknown>;
        if (
          typeof fitness.score === 'number' &&
          (fitness.score < 0 || fitness.score > 1)
        ) {
          errors.push('genetics.fitness.score must be between 0.0 and 1.0');
        }
      }
    }

    // Validate lifecycle_stages
    if (metadata.lifecycle_stages) {
      const lifecycle = metadata.lifecycle_stages as Record<string, unknown>;
      const validStages = [
        'embryonic',
        'juvenile',
        'mature',
        'senior',
        'retired',
      ];
      if (
        typeof lifecycle.current_stage === 'string' &&
        !validStages.includes(lifecycle.current_stage)
      ) {
        errors.push(
          `lifecycle_stages.current_stage must be one of: ${validStages.join(', ')}`
        );
      }
    }

    // Validate economics
    if (metadata.economics) {
      const economics = metadata.economics as Record<string, unknown>;
      if (economics.wallet) {
        const wallet = economics.wallet as Record<string, unknown>;
        if (typeof wallet.balance === 'number' && wallet.balance < 0) {
          errors.push('economics.wallet.balance cannot be negative');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: ts-node validator.ts <manifest.json> [schema.json]');
    process.exit(1);
  }

  const manifestPath = args[0];
  const schemaPath = args[1];

  const validator = new OSSAValidator(schemaPath);
  const result = validator.validateFile(manifestPath);

  if (result.valid) {
    console.log('✅ Valid OSSA manifest');
    if (result.warnings && result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach((w) => console.log(`   - ${w}`));
    }
    process.exit(0);
  } else {
    console.log('❌ Invalid OSSA manifest');
    if (result.errors) {
      console.log('\nErrors:');
      result.errors.forEach((e) => console.log(`   - ${e}`));
    }
    if (result.warnings && result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach((w) => console.log(`   - ${w}`));
    }
    process.exit(1);
  }
}
