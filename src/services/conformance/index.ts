/**
 * Conformance Services
 * Export all conformance-related services and types
 */

export { ConformanceService } from './conformance.service.js';
export { ConformanceProfileLoader } from './profile-loader.service.js';
export { FeatureDetector } from './feature-detector.service.js';
export { ConformanceScoreCalculator } from './score-calculator.service.js';

export type {
  ConformanceProfile,
  ConformanceConstraint,
  FeatureDetectionResult,
  ConformanceResult,
  ConformanceViolation,
  ConformanceReport,
} from './types.js';
