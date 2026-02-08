/**
 * OSSA Knowledge Graph Service
 *
 * Pattern matching engine that stores past fixes in GitLab Wiki as structured YAML.
 * Learns from healing results and suggests proactive fixes before failures occur.
 *
 * Features:
 * - Store failure patterns and fixes in GitLab Wiki (YAML format)
 * - Match new failures against known patterns
 * - Update success rates based on healing results
 * - Suggest proactive fixes based on patterns
 * - Prune low-success patterns periodically
 *
 * Storage:
 * - GitLab Wiki page at {wiki_path}/failure-patterns.md
 * - YAML format for structured data
 * - Version controlled via Git
 *
 * Issue: Part of Self-Healing Pipeline Component (gitlab_components)
 */

import { HealingAgentId, HealingResult } from './self-healing.service.js';

/**
 * Failure pattern stored in knowledge graph
 */
export interface FailurePattern {
  id: string; // Unique pattern ID
  category: 'lint' | 'test' | 'dependency' | 'config' | 'security' | 'other';
  signature: string; // Short identifier (e.g., "phpcs-drupal-standards")
  description: string; // Human-readable description

  // Matching criteria
  job_name_pattern?: string; // Regex pattern for job name
  error_message_pattern?: string; // Regex pattern for error message
  error_type?: string; // Error type from failure signature

  // Fix information
  fix_type: 'automated' | 'semi-automated' | 'manual';
  healing_agent: HealingAgentId;
  fix_command?: string;
  fix_description?: string;

  // Performance metrics
  success_rate: number; // 0-1
  avg_fix_time_ms: number;
  times_applied: number;
  times_successful: number;
  times_failed: number;

  // Metadata
  created_at: string;
  updated_at: string;
  last_applied_at?: string;
  created_by?: string; // User or agent that created pattern
}

/**
 * Knowledge graph structure
 */
export interface KnowledgeGraph {
  version: string; // Schema version
  updated_at: string;
  failure_patterns: FailurePattern[];
  metadata: {
    total_patterns: number;
    total_applications: number;
    overall_success_rate: number;
  };
}

/**
 * Knowledge graph configuration
 */
export interface KnowledgeGraphConfig {
  gitlabUrl: string;
  gitlabToken: string;
  projectId: string;
  wikiPath: string; // Path in Wiki (e.g., "self-healing/failure-patterns")
  minSuccessRate: number; // Minimum success rate to keep pattern
  pruneThreshold: number; // Remove patterns with <N applications and low success
}

/**
 * Knowledge Graph Service
 */
export class KnowledgeGraphService {
  private config: KnowledgeGraphConfig;
  private graph: KnowledgeGraph | null = null;

  constructor(config: KnowledgeGraphConfig) {
    this.config = config;
  }

  /**
   * Load knowledge graph from GitLab Wiki
   */
  async load(): Promise<KnowledgeGraph> {
    try {
      // Fetch Wiki page
      const wikiSlug = this.config.wikiPath.replace(/\//g, '-');
      const endpoint = `${this.config.gitlabUrl}/api/v4/projects/${this.config.projectId}/wikis/${wikiSlug}`;

      const response = await fetch(endpoint, {
        headers: {
          'PRIVATE-TOKEN': this.config.gitlabToken,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Wiki page doesn't exist, create empty graph
          return this.createEmptyGraph();
        }
        throw new Error(`Failed to fetch Wiki page: ${response.statusText}`);
      }

      const wikiPage = await response.json();
      const content = wikiPage.content || '';

      // Parse YAML from code block
      const yamlMatch = content.match(/```yaml\n([\s\S]*?)\n```/);
      if (!yamlMatch) {
        console.warn('No YAML content found in Wiki page, using empty graph');
        return this.createEmptyGraph();
      }

      const yamlContent = yamlMatch[1];
      this.graph = this.parseYaml(yamlContent);

      return this.graph;
    } catch (error) {
      console.error('Failed to load knowledge graph:', error);
      return this.createEmptyGraph();
    }
  }

  /**
   * Save knowledge graph to GitLab Wiki
   */
  async save(graph: KnowledgeGraph): Promise<void> {
    try {
      // Generate Wiki page content
      const content = this.generateWikiContent(graph);

      // Update Wiki page
      const wikiSlug = this.config.wikiPath.replace(/\//g, '-');
      const endpoint = `${this.config.gitlabUrl}/api/v4/projects/${this.config.projectId}/wikis/${wikiSlug}`;

      // Check if page exists
      const getResponse = await fetch(endpoint, {
        headers: {
          'PRIVATE-TOKEN': this.config.gitlabToken,
        },
      });

      const method = getResponse.ok ? 'PUT' : 'POST';
      const url = method === 'POST'
        ? `${this.config.gitlabUrl}/api/v4/projects/${this.config.projectId}/wikis`
        : endpoint;

      const body = method === 'POST'
        ? { title: this.config.wikiPath, content }
        : { content };

      const response = await fetch(url, {
        method,
        headers: {
          'PRIVATE-TOKEN': this.config.gitlabToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to save Wiki page: ${response.statusText}`);
      }

      this.graph = graph;
      console.log(`✅ Knowledge graph saved to Wiki: ${this.config.wikiPath}`);
    } catch (error) {
      console.error('Failed to save knowledge graph:', error);
      throw error;
    }
  }

  /**
   * Update knowledge graph with healing results
   */
  async updateFromResults(results: HealingResult[]): Promise<void> {
    // Load current graph
    let graph = await this.load();

    for (const result of results) {
      // Find or create pattern
      let pattern = this.findPatternBySignature(graph, result.failure.error_pattern || '');

      if (!pattern) {
        // Create new pattern
        pattern = this.createPatternFromResult(result);
        graph.failure_patterns.push(pattern);
      } else {
        // Update existing pattern
        pattern = this.updatePatternFromResult(pattern, result);

        // Replace in graph
        const index = graph.failure_patterns.findIndex((p) => p.id === pattern!.id);
        if (index !== -1) {
          graph.failure_patterns[index] = pattern;
        }
      }
    }

    // Update metadata
    graph.updated_at = new Date().toISOString();
    graph.metadata = this.calculateMetadata(graph);

    // Prune low-success patterns
    graph = this.prunePatterns(graph);

    // Save updated graph
    await this.save(graph);
  }

  /**
   * Find pattern by signature
   */
  private findPatternBySignature(graph: KnowledgeGraph, signature: string): FailurePattern | null {
    return graph.failure_patterns.find((p) => p.signature === signature) || null;
  }

  /**
   * Create new pattern from healing result
   */
  private createPatternFromResult(result: HealingResult): FailurePattern {
    const category = this.inferCategory(result.agent);
    const signature = result.failure.error_pattern || `${result.agent}-${Date.now()}`;

    return {
      id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category,
      signature,
      description: result.failure.error_message || `${result.agent} failure`,
      job_name_pattern: `^${result.failure.job_name}$`,
      error_message_pattern: result.failure.error_message
        ? this.escapeRegex(result.failure.error_message.substring(0, 100))
        : undefined,
      error_type: result.failure.error_type,
      fix_type: result.fix_command ? 'automated' : 'manual',
      healing_agent: result.agent,
      fix_command: result.fix_command,
      fix_description: `Fix ${signature}`,
      success_rate: result.success ? 1.0 : 0.0,
      avg_fix_time_ms: result.duration_seconds * 1000,
      times_applied: 1,
      times_successful: result.success ? 1 : 0,
      times_failed: result.success ? 0 : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_applied_at: result.applied_at,
      created_by: 'self-healing-service',
    };
  }

  /**
   * Update pattern from healing result
   */
  private updatePatternFromResult(pattern: FailurePattern, result: HealingResult): FailurePattern {
    // Update counts
    pattern.times_applied++;
    if (result.success) {
      pattern.times_successful++;
    } else {
      pattern.times_failed++;
    }

    // Recalculate success rate
    pattern.success_rate = pattern.times_successful / pattern.times_applied;

    // Update average fix time (rolling average)
    const newDuration = result.duration_seconds * 1000;
    pattern.avg_fix_time_ms =
      (pattern.avg_fix_time_ms * (pattern.times_applied - 1) + newDuration) /
      pattern.times_applied;

    // Update timestamps
    pattern.updated_at = new Date().toISOString();
    pattern.last_applied_at = result.applied_at;

    return pattern;
  }

  /**
   * Infer category from healing agent
   */
  private inferCategory(agent: HealingAgentId): FailurePattern['category'] {
    switch (agent) {
      case 'drupal-standards':
      case 'ts-local':
        return 'lint';
      case 'test-fixer':
        return 'test';
      case 'dependency-fixer':
        return 'dependency';
      case 'config-fixer':
        return 'config';
      case 'security-fixer':
        return 'security';
      default:
        return 'other';
    }
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Calculate metadata
   */
  private calculateMetadata(graph: KnowledgeGraph): KnowledgeGraph['metadata'] {
    const totalPatterns = graph.failure_patterns.length;
    const totalApplications = graph.failure_patterns.reduce(
      (sum, p) => sum + p.times_applied,
      0
    );
    const totalSuccesses = graph.failure_patterns.reduce(
      (sum, p) => sum + p.times_successful,
      0
    );

    return {
      total_patterns: totalPatterns,
      total_applications: totalApplications,
      overall_success_rate: totalApplications > 0 ? totalSuccesses / totalApplications : 0,
    };
  }

  /**
   * Prune patterns with low success rates
   */
  private prunePatterns(graph: KnowledgeGraph): KnowledgeGraph {
    const pruneThreshold = this.config.pruneThreshold || 5;

    graph.failure_patterns = graph.failure_patterns.filter((pattern) => {
      // Keep if high success rate
      if (pattern.success_rate >= this.config.minSuccessRate) {
        return true;
      }

      // Keep if not enough data yet
      if (pattern.times_applied < pruneThreshold) {
        return true;
      }

      // Remove low-success patterns with enough data
      console.log(`Pruning pattern ${pattern.signature} (success rate: ${pattern.success_rate})`);
      return false;
    });

    return graph;
  }

  /**
   * Create empty knowledge graph
   */
  private createEmptyGraph(): KnowledgeGraph {
    return {
      version: '1.0',
      updated_at: new Date().toISOString(),
      failure_patterns: [],
      metadata: {
        total_patterns: 0,
        total_applications: 0,
        overall_success_rate: 0,
      },
    };
  }

  /**
   * Generate Wiki page content
   */
  private generateWikiContent(graph: KnowledgeGraph): string {
    const yaml = this.serializeToYaml(graph);

    return `# Self-Healing Knowledge Graph

This page contains the knowledge graph for self-healing pipeline patterns.
It is automatically maintained by the self-healing service.

**Last Updated:** ${graph.updated_at}
**Total Patterns:** ${graph.metadata.total_patterns}
**Overall Success Rate:** ${(graph.metadata.overall_success_rate * 100).toFixed(1)}%

## Failure Patterns

\`\`\`yaml
${yaml}
\`\`\`

## Usage

This knowledge graph is used by the self-healing pipeline component to:
- Match new failures against known patterns
- Route failures to appropriate healing agents
- Learn from healing results
- Suggest proactive fixes

Patterns with success rates below ${(this.config.minSuccessRate * 100).toFixed(0)}% are automatically pruned after ${this.config.pruneThreshold} applications.
`;
  }

  /**
   * Simple YAML parser (basic implementation)
   */
  private parseYaml(yaml: string): KnowledgeGraph {
    // This is a simplified parser. In production, use a proper YAML library like 'js-yaml'
    try {
      // For now, use JSON.parse since YAML is a superset of JSON
      // In production, replace with: import yaml from 'js-yaml'; return yaml.load(yamlContent);
      const json = yaml.replace(/^(\s*)(\w+):/gm, '$1"$2":');
      return JSON.parse(json);
    } catch (error) {
      console.error('Failed to parse YAML:', error);
      return this.createEmptyGraph();
    }
  }

  /**
   * Serialize to YAML (basic implementation)
   */
  private serializeToYaml(graph: KnowledgeGraph): string {
    // This is a simplified serializer. In production, use a proper YAML library
    // For now, use pretty JSON as it's readable and valid YAML
    return JSON.stringify(graph, null, 2);
  }

  /**
   * Get high-confidence patterns
   */
  getHighConfidencePatterns(): FailurePattern[] {
    if (!this.graph) {
      return [];
    }

    return this.graph.failure_patterns.filter(
      (p) => p.success_rate >= this.config.minSuccessRate && p.times_applied >= 3
    );
  }

  /**
   * Get statistics
   */
  getStatistics() {
    if (!this.graph) {
      return null;
    }

    return {
      total_patterns: this.graph.failure_patterns.length,
      total_applications: this.graph.metadata.total_applications,
      overall_success_rate: this.graph.metadata.overall_success_rate,
      high_confidence_patterns: this.getHighConfidencePatterns().length,
      patterns_by_category: this.getPatternsByCategory(),
      patterns_by_agent: this.getPatternsByAgent(),
    };
  }

  /**
   * Get patterns by category
   */
  private getPatternsByCategory(): Record<string, number> {
    if (!this.graph) {
      return {};
    }

    const counts: Record<string, number> = {};
    for (const pattern of this.graph.failure_patterns) {
      counts[pattern.category] = (counts[pattern.category] || 0) + 1;
    }
    return counts;
  }

  /**
   * Get patterns by agent
   */
  private getPatternsByAgent(): Record<string, number> {
    if (!this.graph) {
      return {};
    }

    const counts: Record<string, number> = {};
    for (const pattern of this.graph.failure_patterns) {
      counts[pattern.healing_agent] = (counts[pattern.healing_agent] || 0) + 1;
    }
    return counts;
  }
}
