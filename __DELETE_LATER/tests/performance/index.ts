/**
 * OSSA Performance Tests - Export Index
 * 
 * Provides easy access to all performance test classes and utilities
 * for integration with other testing frameworks or custom test runners.
 */

export { runOSSAPerformanceValidation } from './performance-suite.test';

// Individual test classes (these would need to be extracted from their test files)
// For now, we'll provide the main suite runner as the primary export

/**
 * Quick performance validation runner
 * 
 * @example
 * ```typescript
 * import { runOSSAPerformanceValidation } from './tests/performance';
 * 
 * const results = await runOSSAPerformanceValidation();
 * console.log(`All claims met: ${results.summary.meetsAllClaims}`);
 * ```
 */
export async function validateAllMetrics() {
  return await runOSSAPerformanceValidation();
}

/**
 * Performance test configuration
 */
export const PERFORMANCE_TARGETS = {
  ORCHESTRATION_OVERHEAD_REDUCTION: 34, // 34% minimum reduction
  CROSS_FRAMEWORK_IMPROVEMENT: 104, // 104% minimum improvement
  TOKEN_REDUCTION_MIN: 68, // 68% minimum reduction
  TOKEN_REDUCTION_MAX: 82, // 82% maximum reduction
  AGENT_DISCOVERY_P95_MS: 100, // Sub-100ms P95 response time
  SEMANTIC_FIDELITY_MIN: 0.90, // 90% minimum semantic fidelity
} as const;

/**
 * Test timeouts in milliseconds
 */
export const TEST_TIMEOUTS = {
  INDIVIDUAL_TEST: 300_000, // 5 minutes
  COMPLETE_SUITE: 600_000, // 10 minutes
  EXTENDED_SUITE: 900_000, // 15 minutes
} as const;

export default {
  validateAllMetrics,
  runOSSAPerformanceValidation,
  PERFORMANCE_TARGETS,
  TEST_TIMEOUTS,
};