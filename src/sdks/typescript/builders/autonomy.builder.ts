/**
 * AutonomyBuilder - Fluent API for building autonomy/access tier configuration
 *
 * In OSSA v0.3+, autonomy is defined by access tiers which control what
 * permissions and capabilities an agent has.
 *
 * @example
 * ```typescript
 * // Supervised agent (tier_1_read)
 * const supervised = AutonomyBuilder.supervised()
 *   .approvalRequired(['deploy', 'delete'])
 *   .maxCost(100)
 *   .build();
 *
 * // Semi-autonomous agent (tier_2_write_limited)
 * const semiAuto = AutonomyBuilder.semiAutonomous()
 *   .approvalRequired(['deploy'])
 *   .build();
 *
 * // Fully autonomous agent (tier_3_write_elevated)
 * const fullyAuto = AutonomyBuilder.autonomous()
 *   .build();
 *
 * // Policy agent (tier_4_policy)
 * const policy = AutonomyBuilder.policy()
 *   .build();
 * ```
 */

import type { AccessTier } from '../types.js';
import type { AccessTierType } from '../constants.js';

export interface AutonomyConfig {
  accessTier: AccessTier;
  approvalRequired?: string[];
  maxCost?: number;
  auditLevel?: 'standard' | 'detailed' | 'comprehensive';
  isolation?: 'none' | 'standard' | 'strict';
}

export class AutonomyBuilder {
  private config: Partial<AutonomyConfig>;

  private constructor(accessTier: AccessTierType) {
    this.config = {
      accessTier,
    };
  }

  // ============================================================================
  // Static Factory Methods
  // ============================================================================

  /**
   * Create a supervised agent (tier_1_read / read-only)
   * - Can read code, configs, metrics, logs
   * - Cannot write or modify anything
   * - Typically used for analyzers, scanners, auditors
   */
  static supervised(): AutonomyBuilder {
    return new AutonomyBuilder('tier_1_read');
  }

  /**
   * Alias for supervised (read-only access)
   */
  static readOnly(): AutonomyBuilder {
    return new AutonomyBuilder('tier_1_read');
  }

  /**
   * Create a semi-autonomous agent (tier_2_write_limited)
   * - Can write docs, tests, scaffolds
   * - Can create issues and draft MRs
   * - Cannot merge or deploy
   * - Typically used for generators, documenters, reviewers
   */
  static semiAutonomous(): AutonomyBuilder {
    return new AutonomyBuilder('tier_2_write_limited');
  }

  /**
   * Alias for semiAutonomous (limited write access)
   */
  static limitedWrite(): AutonomyBuilder {
    return new AutonomyBuilder('tier_2_write_limited');
  }

  /**
   * Create a fully autonomous agent (tier_3_write_elevated)
   * - Can write production code
   * - Can merge MRs
   * - Can execute deployments
   * - Typically used for deployers, operators, maintainers
   */
  static autonomous(): AutonomyBuilder {
    return new AutonomyBuilder('tier_3_write_elevated');
  }

  /**
   * Alias for autonomous (elevated write access)
   */
  static elevatedWrite(): AutonomyBuilder {
    return new AutonomyBuilder('tier_3_write_elevated');
  }

  /**
   * Create a policy agent (tier_4_policy)
   * - Can define and publish policies
   * - Can audit compliance
   * - Cannot execute or deploy
   * - Typically used for governors, compliance officers
   */
  static policy(): AutonomyBuilder {
    return new AutonomyBuilder('tier_4_policy');
  }

  /**
   * Create with custom access tier
   */
  static custom(accessTier: AccessTierType): AutonomyBuilder {
    return new AutonomyBuilder(accessTier);
  }

  // ============================================================================
  // Builder Methods
  // ============================================================================

  /**
   * Set actions that require approval
   */
  approvalRequired(actions: string[]): this {
    this.config.approvalRequired = actions;
    return this;
  }

  /**
   * Add an action that requires approval
   */
  requireApproval(action: string): this {
    if (!this.config.approvalRequired) {
      this.config.approvalRequired = [];
    }
    this.config.approvalRequired.push(action);
    return this;
  }

  /**
   * Set maximum cost threshold in USD
   */
  maxCost(threshold: number): this {
    if (threshold < 0) {
      throw new Error('maxCost must be non-negative');
    }
    this.config.maxCost = threshold;
    return this;
  }

  /**
   * Set audit level
   * - standard: 30 days retention
   * - detailed: 90 days retention
   * - comprehensive: 365 days retention
   */
  auditLevel(level: 'standard' | 'detailed' | 'comprehensive'): this {
    this.config.auditLevel = level;
    return this;
  }

  /**
   * Set isolation level
   * - none: No restrictions (default)
   * - standard: Limited delegation
   * - strict: No execution, policy only
   */
  isolation(level: 'none' | 'standard' | 'strict'): this {
    this.config.isolation = level;
    return this;
  }

  // ============================================================================
  // Build Method
  // ============================================================================

  /**
   * Build the autonomy configuration object
   */
  build(): AutonomyConfig {
    if (!this.config.accessTier) {
      throw new Error('Access tier is required');
    }

    return this.config as AutonomyConfig;
  }
}
