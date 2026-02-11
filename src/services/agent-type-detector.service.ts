/**
 * Agent Type Detector Service
 * Auto-detects agent type from OSSA manifest using dynamic contextual analysis
 */

import { injectable } from 'inversify';
import type { OssaAgent } from '../types/index.js';
import type { Tool } from '../types/tool.js';
import {
  type AgentTypeContext,
  type DynamicAgentType,
  type CapabilityValidationResult,
  determineAgentType,
  suggestCapabilities,
  validateTypeCapabilities,
  extractContextFromManifest,
  TYPE_DETECTION_RULES,
  TYPE_CHARACTERISTICS,
} from '../types/dynamic-agent-types.js';

export interface TypeDetectionResult {
  /** Detected agent type */
  type: DynamicAgentType;

  /** Confidence level (0-1) */
  confidence: number;

  /** Context used for detection */
  context: AgentTypeContext;

  /** Alternative types that also matched */
  alternatives: Array<{
    type: DynamicAgentType;
    confidence: number;
    reason: string;
  }>;

  /** Recommendations for improving type fit */
  recommendations: string[];
}

@injectable()
export class AgentTypeDetectorService {
  /**
   * Detect agent type from manifest
   */
  detectType(manifest: OssaAgent): TypeDetectionResult {
    // Extract context from manifest
    const context = extractContextFromManifest(manifest as unknown as Record<string, unknown>);

    if (!context) {
      // Fallback if context extraction fails
      return {
        type: 'adaptive-hybrid',
        confidence: 0.5,
        context: this.getDefaultContext(),
        alternatives: [],
        recommendations: ['Unable to extract context from manifest. Using adaptive-hybrid type.'],
      };
    }

    // Determine primary type
    const type = determineAgentType(context);

    // Calculate confidence based on how well capabilities match
    const validation = validateTypeCapabilities(type, context.capabilities);
    const confidence = this.calculateConfidence(validation, context);

    // Find alternative types
    const alternatives = this.findAlternatives(context, type);

    // Generate recommendations
    const recommendations = this.generateRecommendations(type, validation, context);

    return {
      type,
      confidence,
      context,
      alternatives,
      recommendations,
    };
  }

  /**
   * Suggest capabilities for a given agent type
   */
  suggestCapabilitiesForType(type: DynamicAgentType): string[] {
    return suggestCapabilities(type);
  }

  /**
   * Validate if tools are compatible with detected type
   */
  validateToolCompatibility(type: DynamicAgentType, tools: Tool[]): CapabilityValidationResult {
    // Extract capability names from tools
    const capabilities = tools.map(t => t.type || 'unknown');

    return validateTypeCapabilities(type, capabilities);
  }

  /**
   * Get detailed type information
   */
  getTypeInfo(type: DynamicAgentType) {
    return {
      type,
      characteristics: TYPE_CHARACTERISTICS[type],
      recommendedCapabilities: suggestCapabilities(type),
      detectionRules: TYPE_DETECTION_RULES.filter(r => r.type === type),
    };
  }

  /**
   * Analyze manifest and provide type suggestions
   */
  analyzeManifest(manifest: OssaAgent): {
    currentType: DynamicAgentType;
    suggestedType: DynamicAgentType;
    shouldChange: boolean;
    reasons: string[];
  } {
    const detection = this.detectType(manifest);

    // Get current type from metadata (if set)
    const currentTypeAnnotation = manifest.metadata?.annotations?.['ossa.io/agent-type'];
    const currentType = (currentTypeAnnotation as DynamicAgentType) || 'adaptive-hybrid';

    const suggestedType = detection.type;
    const shouldChange = currentType !== suggestedType && detection.confidence > 0.7;

    const reasons: string[] = [];

    if (shouldChange) {
      reasons.push(
        `Context analysis suggests ${suggestedType} instead of ${currentType}`,
        `Confidence: ${(detection.confidence * 100).toFixed(1)}%`
      );

      if (detection.recommendations.length > 0) {
        reasons.push(...detection.recommendations);
      }
    } else if (currentType === suggestedType) {
      reasons.push(`Current type ${currentType} matches contextual analysis`);
    } else {
      reasons.push(
        `Current type ${currentType} is acceptable (confidence: ${(detection.confidence * 100).toFixed(1)}%)`
      );
    }

    return {
      currentType,
      suggestedType,
      shouldChange,
      reasons,
    };
  }

  /**
   * Calculate confidence score based on validation and context
   */
  private calculateConfidence(
    validation: CapabilityValidationResult,
    context: AgentTypeContext
  ): number {
    let confidence = 1.0;

    // Reduce confidence for missing capabilities
    if (validation.missing.length > 0) {
      confidence -= validation.missing.length * 0.1;
    }

    // Slight reduction for extra capabilities (indicates possible hybrid)
    if (validation.extra.length > 3) {
      confidence -= 0.1;
    }

    // Increase confidence if resources match expectations
    const type = determineAgentType(context);
    const characteristics = TYPE_CHARACTERISTICS[type];

    if (characteristics.statePersistence && context.dataFlow === 'stateful') {
      confidence += 0.05;
    }

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Find alternative agent types that could also fit
   */
  private findAlternatives(
    context: AgentTypeContext,
    primaryType: DynamicAgentType
  ): Array<{ type: DynamicAgentType; confidence: number; reason: string }> {
    const alternatives: Array<{ type: DynamicAgentType; confidence: number; reason: string }> = [];

    // Test each detection rule
    for (const rule of TYPE_DETECTION_RULES) {
      if (rule.type === primaryType) continue;

      // Create a modified context to test this rule
      const testContext = { ...context };

      // Try to match the rule
      const tempType = determineAgentType(testContext);

      if (tempType !== primaryType) {
        const validation = validateTypeCapabilities(tempType, context.capabilities);
        const confidence = this.calculateConfidence(validation, context);

        if (confidence > 0.5) {
          alternatives.push({
            type: tempType,
            confidence,
            reason: rule.description,
          });
        }
      }
    }

    // Sort by confidence
    return alternatives.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * Generate recommendations for improving type fit
   */
  private generateRecommendations(
    type: DynamicAgentType,
    validation: CapabilityValidationResult,
    context: AgentTypeContext
  ): string[] {
    const recommendations: string[] = [];

    if (validation.missing.length > 0) {
      recommendations.push(
        `Consider adding capabilities: ${validation.missing.join(', ')}`
      );
    }

    if (validation.extra.length > 5) {
      recommendations.push(
        `Many capabilities detected. Consider splitting into multiple agents or using 'adaptive-hybrid' type.`
      );
    }

    // Resource recommendations
    const characteristics = TYPE_CHARACTERISTICS[type];

    if (characteristics.requiresHuman && context.autonomy === 'autonomous') {
      recommendations.push(
        `Type ${type} typically requires human interaction. Consider changing autonomy to 'supervised'.`
      );
    }

    if (characteristics.statePersistence && context.dataFlow === 'stateless') {
      recommendations.push(
        `Type ${type} typically needs state persistence. Consider changing dataFlow to 'stateful'.`
      );
    }

    if (characteristics.costProfile === 'high' && !context.resources.gpu) {
      recommendations.push(
        `Type ${type} has high cost profile. Consider allocating GPU resources for better performance.`
      );
    }

    return recommendations;
  }

  /**
   * Get default context for fallback
   */
  private getDefaultContext(): AgentTypeContext {
    return {
      environment: 'development',
      trigger: 'manual',
      dataFlow: 'stateless',
      collaboration: 'solo',
      autonomy: 'semi-autonomous',
      capabilities: [],
      resources: {},
    };
  }
}
