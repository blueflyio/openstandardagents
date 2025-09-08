/**
 * Judge Agents - OSSA v0.1.8 Compliant
 * 
 * Exports for judge agent implementations with pairwise decision making,
 * evidence trails, and 45% faster resolution capabilities.
 */

// Core types and interfaces
export * from './types';

// Base judge implementation
export { BaseJudgeAgent } from './base-judge-agent';

// Specialized judge implementations
export { QualityJudge } from './quality-judge';
export { ComplianceJudge } from './compliance-judge';
export { PerformanceJudge } from './performance-judge';

// Supporting systems
export { PairwiseEngine } from './pairwise-engine';
export { EvidenceTrailManager } from './evidence-trail';
export { FastResolutionEngine } from './fast-resolution-engine';

// Coordination and integration
export { JudgeCoordinator } from './judge-coordinator';

// Re-export commonly used types
export type {
  JudgeDecisionRequest,
  JudgeDecision,
  PairwiseComparison,
  Evidence,
  EvidenceTrail,
  JudgePerformanceMetrics,
  JudgeConfiguration
} from './types';

/**
 * Quick start guide for judge agents:
 * 
 * 1. Create a judge coordinator:
 *    ```typescript
 *    const coordinator = new JudgeCoordinator();
 *    ```
 * 
 * 2. Create specialized judges:
 *    ```typescript
 *    const qualityJudge = JudgeCoordinator.createQualityJudge();
 *    const complianceJudge = JudgeCoordinator.createComplianceJudge();
 *    const performanceJudge = JudgeCoordinator.createPerformanceJudge();
 *    ```
 * 
 * 3. Register judges:
 *    ```typescript
 *    coordinator.registerJudge(qualityJudge);
 *    coordinator.registerJudge(complianceJudge);
 *    coordinator.registerJudge(performanceJudge);
 *    ```
 * 
 * 4. Make decisions:
 *    ```typescript
 *    const decision = await coordinator.makeDecision(decisionRequest);
 *    ```
 * 
 * Features:
 * - Pairwise comparison with evidence-based reasoning
 * - 45% faster resolution through optimized algorithms
 * - Immutable evidence trails with cryptographic integrity
 * - Specialized judges for quality, compliance, and performance
 * - Integration with OSSA coordination system
 * - Multi-judge consensus capabilities
 * - Comprehensive audit and appeal support
 */