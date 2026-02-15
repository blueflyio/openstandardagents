/**
 * SafetyBuilder - Fluent API for building safety and guardrails configuration
 *
 * @example
 * ```typescript
 * const safety = SafetyBuilder.create()
 *   .contentFiltering(['hate_speech', 'violence'])
 *   .piiDetection(['email', 'phone', 'ssn'])
 *   .maxActionsPerMinute(10)
 *   .requireApprovalFor(['deploy', 'delete'])
 *   .blockActions(['force_push'])
 *   .costThreshold(100)
 *   .build();
 * ```
 */

import type { Safety, Guardrails } from '../types.js';
import type { ContentFilteringType, PIIDetectionType } from '../constants.js';

export class SafetyBuilder {
  private safety: Safety;
  private guardrails: Guardrails;

  private constructor() {
    this.safety = {};
    this.guardrails = {};
  }

  // ============================================================================
  // Static Factory Method
  // ============================================================================

  /**
   * Create a new SafetyBuilder
   */
  static create(): SafetyBuilder {
    return new SafetyBuilder();
  }

  // ============================================================================
  // Guardrails Methods
  // ============================================================================

  /**
   * Set maximum actions per minute rate limit
   */
  maxActionsPerMinute(limit: number): this {
    if (limit < 1) {
      throw new Error('maxActionsPerMinute must be positive');
    }
    this.guardrails.max_actions_per_minute = limit;
    return this;
  }

  /**
   * Set actions that require human approval
   */
  requireApprovalFor(actions: string[]): this {
    this.guardrails.require_human_approval_for = actions;
    return this;
  }

  /**
   * Add an action that requires approval
   */
  requireApproval(action: string): this {
    if (!this.guardrails.require_human_approval_for) {
      this.guardrails.require_human_approval_for = [];
    }
    this.guardrails.require_human_approval_for.push(action);
    return this;
  }

  /**
   * Set blocked actions
   */
  blockActions(actions: string[]): this {
    this.guardrails.blocked_actions = actions;
    return this;
  }

  /**
   * Add a blocked action
   */
  blockAction(action: string): this {
    if (!this.guardrails.blocked_actions) {
      this.guardrails.blocked_actions = [];
    }
    this.guardrails.blocked_actions.push(action);
    return this;
  }

  /**
   * Enable audit logging for all actions
   */
  auditAllActions(enabled: boolean = true): this {
    this.guardrails.audit_all_actions = enabled;
    return this;
  }

  /**
   * Set cost threshold in USD
   */
  costThreshold(threshold: number): this {
    if (threshold < 0) {
      throw new Error('costThreshold must be non-negative');
    }
    this.guardrails.cost_threshold_usd = threshold;
    return this;
  }

  // ============================================================================
  // Safety Methods
  // ============================================================================

  /**
   * Set content filtering types
   * (Note: This is a conceptual method - actual filtering configuration
   * may vary by implementation)
   */
  contentFiltering(types: ContentFilteringType[] | string[]): this {
    // We'll extend guardrails to support this
    (this.guardrails as Record<string, unknown>)['content_filtering'] = types;
    return this;
  }

  /**
   * Set PII detection types
   * (Note: This is a conceptual method - actual PII handling configuration
   * may vary by implementation)
   */
  piiDetection(types: PIIDetectionType[] | string[]): this {
    // We'll extend guardrails to support this
    (this.guardrails as Record<string, unknown>)['pii_detection'] = types;
    return this;
  }

  /**
   * Set PII handling policy
   */
  piiHandling(policy: string): this {
    this.safety.pii_handling = policy;
    return this;
  }

  /**
   * Set data classification level
   */
  dataClassification(classification: string): this {
    this.safety.data_classification = classification;
    return this;
  }

  // ============================================================================
  // Build Method
  // ============================================================================

  /**
   * Build the safety configuration object
   */
  build(): Safety {
    // Only add guardrails if we have any configured
    if (Object.keys(this.guardrails).length > 0) {
      this.safety.guardrails = this.guardrails;
    }

    return this.safety;
  }
}
