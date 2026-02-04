/**
 * Optimization Pattern Detection
 * Based on token-efficiency research from platform-agents
 */

import type { OssaAgent } from '../../types/index.js';

export interface OptimizationPattern {
  name: string;
  detected: boolean;
  tokenReduction: number; // Multiplication factor (e.g., 20 = 20x reduction)
  description: string;
  savings: string;
}

export interface OptimizationReport {
  patterns: OptimizationPattern[];
  totalReductionFactor: number;
  estimatedSavings: string;
}

/**
 * Detect optimization patterns in agent manifest
 * Based on real-world benchmarks from platform-agents/examples/token-efficiency
 */
export function detectOptimizations(agent: OssaAgent): OptimizationReport {
  const patterns: OptimizationPattern[] = [];

  // 1. Knowledge Graph References (20x reduction)
  const hasKnowledgeRefs = detectKnowledgeGraphRefs(agent);
  patterns.push({
    name: 'Knowledge Graph References',
    detected: hasKnowledgeRefs,
    tokenReduction: 20,
    description:
      'Shares context via URN references instead of duplicating data',
    savings: 'Real-world: 40k tokens → 2k tokens (20x reduction)',
  });

  // 2. Template Compression (5x reduction)
  const hasTemplateCompression = detectTemplateCompression(agent);
  patterns.push({
    name: 'Template Compression',
    detected: hasTemplateCompression,
    tokenReduction: 5,
    description: 'Uses compressed templates expanded at runtime',
    savings: 'Real-world: 150 tokens → 30 tokens (5x reduction)',
  });

  // 3. Cascade Composition (9x cost reduction)
  const hasCascade = detectCascadeComposition(agent);
  patterns.push({
    name: 'Cascade Composition',
    detected: hasCascade,
    tokenReduction: 9,
    description: 'Routes to appropriate model based on complexity',
    savings: 'Real-world: 300k opus → 80k mixed (9x cost reduction)',
  });

  // 4. Semantic Compression (5x reduction)
  const hasSemanticCompression = detectSemanticCompression(agent);
  patterns.push({
    name: 'Semantic Compression (LLMLingua)',
    detected: hasSemanticCompression,
    tokenReduction: 5,
    description: 'Semantic-aware token pruning with 95% info retention',
    savings: 'Real-world: 5x reduction with minimal information loss',
  });

  // 5. Hierarchical Context Loading (60-80% reduction)
  const hasHierarchicalLoading = detectHierarchicalLoading(agent);
  patterns.push({
    name: 'Hierarchical Context Loading',
    detected: hasHierarchicalLoading,
    tokenReduction: 3, // Conservative estimate (60% = ~2.5x, using 3x)
    description: 'Loads context in tiers: essential → conditional → deep',
    savings: 'Real-world: 60-80% token reduction on average',
  });

  // 6. Checkpoint-Based Retry (62% failure cost reduction)
  const hasCheckpoints = detectCheckpoints(agent);
  patterns.push({
    name: 'Checkpoint-Based Retry',
    detected: hasCheckpoints,
    tokenReduction: 2.6, // 62% reduction = 2.6x savings
    description: 'Resume from checkpoint on failure instead of full retry',
    savings: 'Real-world: 100k retry → 5k resume (62% cost reduction)',
  });

  // Calculate total reduction factor
  const detectedPatterns = patterns.filter((p) => p.detected);
  const totalReductionFactor =
    detectedPatterns.length > 0
      ? detectedPatterns.reduce((acc, p) => acc * p.tokenReduction, 1) /
        Math.pow(detectedPatterns.length, detectedPatterns.length - 1) // Geometric mean
      : 1;

  return {
    patterns,
    totalReductionFactor,
    estimatedSavings: formatSavings(totalReductionFactor),
  };
}

/**
 * Detect knowledge graph references
 */
function detectKnowledgeGraphRefs(agent: OssaAgent): boolean {
  const manifestStr = JSON.stringify(agent);
  return (
    manifestStr.includes('urn:kg:') ||
    manifestStr.includes('knowledge_refs') ||
    manifestStr.includes('knowledgeRefs') ||
    (agent.spec?.tools?.some(
      (t) => t.type === 'knowledge-graph' || t.name?.includes('knowledge')
    ) ??
      false)
  );
}

/**
 * Detect template compression
 */
function detectTemplateCompression(agent: OssaAgent): boolean {
  const manifestStr = JSON.stringify(agent);
  return (
    manifestStr.includes('template_compression') ||
    manifestStr.includes('templateCompression') ||
    manifestStr.includes('compressed_prompt') ||
    manifestStr.includes('prompt_template')
  );
}

/**
 * Detect cascade composition (model routing)
 */
function detectCascadeComposition(agent: OssaAgent): boolean {
  const manifestStr = JSON.stringify(agent);
  return (
    manifestStr.includes('cascade') ||
    manifestStr.includes('model_routing') ||
    manifestStr.includes('complexity_routing') ||
    (agent.spec?.llm && 'routing' in agent.spec.llm) ||
    // Check for multiple model references
    (manifestStr.match(/haiku|sonnet|opus/gi) || []).length >= 2
  );
}

/**
 * Detect semantic compression
 */
function detectSemanticCompression(agent: OssaAgent): boolean {
  const manifestStr = JSON.stringify(agent);
  return (
    manifestStr.includes('llmlingua') ||
    manifestStr.includes('semantic_compression') ||
    manifestStr.includes('token_pruning')
  );
}

/**
 * Detect hierarchical context loading
 */
function detectHierarchicalLoading(agent: OssaAgent): boolean {
  const manifestStr = JSON.stringify(agent);
  return (
    manifestStr.includes('hierarchical') ||
    manifestStr.includes('lazy_load') ||
    manifestStr.includes('conditional_load') ||
    manifestStr.includes('tiered_context')
  );
}

/**
 * Detect checkpoint-based retry
 */
function detectCheckpoints(agent: OssaAgent): boolean {
  const manifestStr = JSON.stringify(agent);
  return (
    manifestStr.includes('checkpoint') ||
    manifestStr.includes('resume') ||
    manifestStr.includes('incremental_retry')
  );
}

/**
 * Format savings percentage
 */
function formatSavings(factor: number): string {
  if (factor <= 1) return '0%';
  const percentage = ((1 - 1 / factor) * 100).toFixed(0);
  return `${percentage}% (${factor.toFixed(1)}x reduction)`;
}
