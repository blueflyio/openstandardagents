/**
 * Feature Detector Service
 * Detects presence and validity of features in agent manifests
 */

import { injectable } from 'inversify';
import type { OssaAgent } from '../../types/index.js';
import type { FeatureDetectionResult } from './types.js';

@injectable()
export class FeatureDetector {
  /**
   * Detect features in manifest
   * @param manifest - Agent manifest to analyze
   * @param features - List of feature paths to check
   * @returns Array of feature detection results
   */
  detectFeatures(
    manifest: OssaAgent,
    features: string[]
  ): FeatureDetectionResult[] {
    return features.map((feature) => this.detectFeature(manifest, feature));
  }

  /**
   * Detect single feature in manifest
   * @param manifest - Agent manifest to analyze
   * @param feature - Feature path to check (e.g., 'spec.llm.provider')
   * @returns Feature detection result
   */
  private detectFeature(
    manifest: OssaAgent,
    feature: string
  ): FeatureDetectionResult {
    const path = feature.split('.');
    const value = this.getNestedValue(manifest, path);
    const present = value !== undefined && value !== null;

    return {
      feature,
      present,
      value: present ? value : undefined,
      path: feature,
    };
  }

  /**
   * Get nested value from object using path
   * @param obj - Object to traverse
   * @param path - Path segments
   * @returns Value at path or undefined
   */
  private getNestedValue(obj: unknown, path: string[]): unknown {
    let current = obj;

    for (const segment of path) {
      if (current === null || current === undefined) {
        return undefined;
      }

      if (typeof current !== 'object') {
        return undefined;
      }

      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }

  /**
   * Check if feature value is non-empty
   * @param value - Value to check
   * @returns True if value is considered present and non-empty
   */
  private isNonEmpty(value: unknown): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }

    return true;
  }

  /**
   * Count present features
   * @param results - Feature detection results
   * @returns Number of present features
   */
  countPresent(results: FeatureDetectionResult[]): number {
    return results.filter((r) => r.present).length;
  }

  /**
   * Get missing features
   * @param results - Feature detection results
   * @returns Array of missing feature names
   */
  getMissing(results: FeatureDetectionResult[]): string[] {
    return results.filter((r) => !r.present).map((r) => r.feature);
  }

  /**
   * Get present features
   * @param results - Feature detection results
   * @returns Array of present feature names
   */
  getPresent(results: FeatureDetectionResult[]): string[] {
    return results.filter((r) => r.present).map((r) => r.feature);
  }

  /**
   * Detect all standard OSSA features
   * @param manifest - Agent manifest to analyze
   * @returns Comprehensive feature detection results
   */
  detectAllFeatures(manifest: OssaAgent): {
    core: FeatureDetectionResult[];
    capabilities: FeatureDetectionResult[];
    configuration: FeatureDetectionResult[];
    operational: FeatureDetectionResult[];
    extensions: FeatureDetectionResult[];
  } {
    // Core required features
    const coreFeatures = [
      'apiVersion',
      'kind',
      'metadata.name',
      'spec.type',
      'spec.identity.id',
    ];

    // Capability features
    const capabilityFeatures = [
      'spec.capabilities',
      'spec.tools',
      'spec.instructions',
    ];

    // Configuration features
    const configurationFeatures = [
      'spec.llm.provider',
      'spec.llm.model',
      'spec.llm.temperature',
      'spec.llm.max_tokens',
    ];

    // Operational features
    const operationalFeatures = [
      'spec.autonomy.level',
      'spec.autonomy.approval_required',
      'spec.constraints.cost',
      'spec.constraints.performance',
      'spec.observability.tracing',
      'spec.observability.metrics',
      'spec.observability.logging',
      'spec.security.authentication',
      'spec.security.authorization',
    ];

    // Extension features
    const extensionFeatures = [
      'extensions.kagent',
      'extensions.cursor',
      'extensions.langchain',
      'extensions.crewai',
    ];

    return {
      core: this.detectFeatures(manifest, coreFeatures),
      capabilities: this.detectFeatures(manifest, capabilityFeatures),
      configuration: this.detectFeatures(manifest, configurationFeatures),
      operational: this.detectFeatures(manifest, operationalFeatures),
      extensions: this.detectFeatures(manifest, extensionFeatures),
    };
  }
}
