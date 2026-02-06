/**
 * OSSA v0.4.4 Validation Context
 *
 * Tracks validation history and common patterns to improve future validations.
 * Foundation for future agent-brain integration (learning system).
 */

import type { OssaAgent } from '../types/index.js';
import type { ValidationScore } from './progressive-scorer.js';

/**
 * Validation history entry
 */
export interface ValidationHistoryEntry {
  timestamp: number;
  manifestFingerprint: string;
  score: ValidationScore;
  fixesApplied: string[];
  improvedScore?: number;
}

/**
 * Common validation pattern
 */
export interface ValidationPattern {
  pattern: string;
  frequency: number;
  avgImpact: number;
  recommendedFixes: string[];
}

/**
 * Validation Context
 *
 * Stores validation history per manifest fingerprint.
 * Tracks common patterns and successful fixes.
 *
 * **Future**: Integrate with agent-brain for learning
 */
export class ValidationContext {
  private history: Map<string, ValidationHistoryEntry[]> = new Map();
  private patterns: Map<string, ValidationPattern> = new Map();

  /**
   * Record a validation result
   */
  recordValidation(
    manifest: OssaAgent,
    score: ValidationScore,
    fixesApplied: string[] = []
  ): void {
    const fingerprint = this.generateFingerprint(manifest);

    const entry: ValidationHistoryEntry = {
      timestamp: Date.now(),
      manifestFingerprint: fingerprint,
      score,
      fixesApplied,
    };

    // Store in history
    if (!this.history.has(fingerprint)) {
      this.history.set(fingerprint, []);
    }
    this.history.get(fingerprint)!.push(entry);

    // Update patterns
    this.updatePatterns(manifest, score);
  }

  /**
   * Get validation history for a manifest
   */
  getHistory(manifest: OssaAgent): ValidationHistoryEntry[] {
    const fingerprint = this.generateFingerprint(manifest);
    return this.history.get(fingerprint) || [];
  }

  /**
   * Get common patterns
   */
  getPatterns(): ValidationPattern[] {
    return Array.from(this.patterns.values()).sort(
      (a, b) => b.frequency - a.frequency
    );
  }

  /**
   * Get improvement suggestions based on history
   */
  getSuggestionsFromHistory(manifest: OssaAgent): string[] {
    const history = this.getHistory(manifest);

    if (history.length === 0) {
      return [];
    }

    // Find successful fixes (those that improved scores)
    const successfulFixes: string[] = [];

    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const current = history[i];

      if (current.score.overall > prev.score.overall) {
        successfulFixes.push(...current.fixesApplied);
      }
    }

    return [...new Set(successfulFixes)]; // Unique fixes
  }

  /**
   * Generate manifest fingerprint
   *
   * Uses agentType + agentKind + pattern for identity
   */
  private generateFingerprint(manifest: OssaAgent): string {
    const agentType = manifest.metadata?.agentType || 'unknown';
    const agentKind = manifest.metadata?.agentKind || 'unknown';
    const pattern =
      manifest.metadata?.agentArchitecture?.pattern || 'unknown';

    return `${agentType}:${agentKind}:${pattern}`;
  }

  /**
   * Update pattern tracking
   */
  private updatePatterns(manifest: OssaAgent, score: ValidationScore): void {
    const fingerprint = this.generateFingerprint(manifest);

    if (!this.patterns.has(fingerprint)) {
      this.patterns.set(fingerprint, {
        pattern: fingerprint,
        frequency: 0,
        avgImpact: 0,
        recommendedFixes: [],
      });
    }

    const pattern = this.patterns.get(fingerprint)!;
    pattern.frequency++;

    // Update average impact
    pattern.avgImpact =
      (pattern.avgImpact * (pattern.frequency - 1) + score.overall) /
      pattern.frequency;
  }

  /**
   * Clear history (useful for testing)
   */
  clear(): void {
    this.history.clear();
    this.patterns.clear();
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalValidations: number;
    uniqueManifests: number;
    commonPatterns: number;
  } {
    const totalValidations = Array.from(this.history.values()).reduce(
      (sum, entries) => sum + entries.length,
      0
    );

    return {
      totalValidations,
      uniqueManifests: this.history.size,
      commonPatterns: this.patterns.size,
    };
  }
}

/**
 * Singleton instance
 */
let contextInstance: ValidationContext | null = null;

/**
 * Get the global validation context
 */
export function getValidationContext(): ValidationContext {
  if (!contextInstance) {
    contextInstance = new ValidationContext();
  }
  return contextInstance;
}

/**
 * Reset context (for testing)
 */
export function resetValidationContext(): void {
  contextInstance = null;
}
