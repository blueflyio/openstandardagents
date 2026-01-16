/**
 * Conformance Testing Types
 * Types for conformance profiles, results, and scoring
 */

/**
 * Conformance profile definition
 */
export interface ConformanceProfile {
  $schema?: string;
  id: string;
  name: string;
  version: string;
  description: string;
  extends?: string;
  required: {
    features: string[];
    weight: number;
  };
  optional: {
    features: string[];
    weight: number;
  };
  constraints?: Record<string, ConformanceConstraint>;
  scoring: {
    pass_threshold: number;
    warn_threshold: number;
  };
}

/**
 * Conformance constraint definition
 */
export interface ConformanceConstraint {
  type?: string;
  pattern?: string;
  enum?: unknown[];
  const?: unknown;
  minimum?: number;
  maximum?: number;
  required?: string[];
  description: string;
}

/**
 * Feature detection result
 */
export interface FeatureDetectionResult {
  feature: string;
  present: boolean;
  value?: unknown;
  path?: string;
}

/**
 * Conformance test result
 */
export interface ConformanceResult {
  profile: string;
  profileName: string;
  version: string;
  passed: boolean;
  score: number;
  details: {
    required: {
      total: number;
      present: number;
      missing: string[];
      score: number;
    };
    optional: {
      total: number;
      present: number;
      missing: string[];
      score: number;
    };
  };
  features: FeatureDetectionResult[];
  constraintViolations: ConformanceViolation[];
  recommendations: string[];
  timestamp: string;
}

/**
 * Conformance constraint violation
 */
export interface ConformanceViolation {
  feature: string;
  constraint: string;
  expected: unknown;
  actual: unknown;
  message: string;
}

/**
 * Conformance report
 */
export interface ConformanceReport {
  summary: {
    profile: string;
    passed: boolean;
    score: number;
    threshold: number;
    timestamp: string;
  };
  manifest: {
    apiVersion?: string;
    kind?: string;
    name?: string;
  };
  results: ConformanceResult;
}
