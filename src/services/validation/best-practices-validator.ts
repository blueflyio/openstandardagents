/**
 * Best Practices Validator
 * Checks OSSA manifests against best practices and recommendations
 *
 * SOLID: Single Responsibility - Only handles best practices validation
 * DRY: Centralized best practices rules
 */

import type { OssaAgent } from '../../types/index.js';

/**
 * Issue severity levels
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * Best practice issue
 */
export interface BestPracticeIssue {
  severity: IssueSeverity;
  category: string;
  message: string;
  path: string;
  recommendation: string;
}

/**
 * Best practices validation result
 */
export interface BestPracticesResult {
  score: number; // 0-100
  issues: BestPracticeIssue[];
  passed: boolean; // true if score >= 80
}

/**
 * Best Practices Validator Service
 */
export class BestPracticesValidator {
  /**
   * Validate best practices for an agent manifest
   */
  validate(manifest: OssaAgent): BestPracticesResult {
    const issues: BestPracticeIssue[] = [];

    // Metadata checks
    issues.push(...this.checkMetadata(manifest));

    // LLM configuration checks
    issues.push(...this.checkLLMConfig(manifest));

    // Tools and capabilities checks
    issues.push(...this.checkTools(manifest));

    // Autonomy checks
    issues.push(...this.checkAutonomy(manifest));

    // Constraints checks
    issues.push(...this.checkConstraints(manifest));

    // Observability checks
    issues.push(...this.checkObservability(manifest));

    // Runtime checks
    issues.push(...this.checkRuntime(manifest));

    // Messaging checks (v0.3.0+)
    issues.push(...this.checkMessaging(manifest));

    // Calculate score
    const score = this.calculateScore(issues);

    return {
      score,
      issues,
      passed: score >= 80,
    };
  }

  /**
   * Check metadata completeness
   */
  private checkMetadata(manifest: OssaAgent): BestPracticeIssue[] {
    const issues: BestPracticeIssue[] = [];
    const metadata = manifest.metadata;

    if (!metadata) {
      issues.push({
        severity: 'error',
        category: 'metadata',
        message: 'Missing metadata section',
        path: 'metadata',
        recommendation: 'Add metadata with name, version, and description.',
      });
      return issues;
    }

    // Check description
    if (
      !metadata.description ||
      (typeof metadata.description === 'string' &&
        metadata.description.trim().length === 0)
    ) {
      issues.push({
        severity: 'warning',
        category: 'metadata',
        message: 'Missing or empty description',
        path: 'metadata.description',
        recommendation:
          'Add a clear description explaining the agent purpose and capabilities.',
      });
    } else if (
      typeof metadata.description === 'string' &&
      metadata.description.length < 20
    ) {
      issues.push({
        severity: 'info',
        category: 'metadata',
        message: 'Description is too short',
        path: 'metadata.description',
        recommendation:
          'Provide a detailed description (at least 20 characters) for better documentation.',
      });
    }

    // Check version
    if (!metadata.version) {
      issues.push({
        severity: 'warning',
        category: 'metadata',
        message: 'Missing version',
        path: 'metadata.version',
        recommendation:
          'Add version following semantic versioning (e.g., "1.0.0").',
      });
    }

    // Check author
    if (!metadata.author) {
      issues.push({
        severity: 'info',
        category: 'metadata',
        message: 'Missing author information',
        path: 'metadata.author',
        recommendation: 'Add author for better maintainability.',
      });
    }

    // Check tags
    if (!metadata.tags || metadata.tags.length === 0) {
      issues.push({
        severity: 'info',
        category: 'metadata',
        message: 'No tags defined',
        path: 'metadata.tags',
        recommendation:
          'Add tags for better discoverability (e.g., ["chatbot", "customer-service"]).',
      });
    }

    return issues;
  }

  /**
   * Check LLM configuration
   */
  private checkLLMConfig(manifest: OssaAgent): BestPracticeIssue[] {
    const issues: BestPracticeIssue[] = [];
    const llm = manifest.spec?.llm || manifest.agent?.llm;

    if (!llm) {
      issues.push({
        severity: 'error',
        category: 'llm',
        message: 'Missing LLM configuration',
        path: 'spec.llm',
        recommendation:
          'Specify LLM provider, model, and parameters for predictable behavior.',
      });
      return issues;
    }

    // Check provider and model
    if (!llm.provider) {
      issues.push({
        severity: 'error',
        category: 'llm',
        message: 'Missing LLM provider',
        path: 'spec.llm.provider',
        recommendation:
          'Specify provider (e.g., "openai", "anthropic", "google").',
      });
    }

    if (!llm.model) {
      issues.push({
        severity: 'error',
        category: 'llm',
        message: 'Missing LLM model',
        path: 'spec.llm.model',
        recommendation:
          'Specify model (e.g., "gpt-4o-mini", "claude-sonnet-4").',
      });
    }

    // Check temperature
    if (llm.temperature === undefined) {
      issues.push({
        severity: 'warning',
        category: 'llm',
        message: 'Temperature not set',
        path: 'spec.llm.temperature',
        recommendation:
          'Set temperature (0.0-1.0) for consistent behavior. Use 0.1 for deterministic, 0.7 for creative.',
      });
    } else if (llm.temperature < 0 || llm.temperature > 1) {
      issues.push({
        severity: 'error',
        category: 'llm',
        message: 'Temperature out of range',
        path: 'spec.llm.temperature',
        recommendation: 'Temperature must be between 0.0 and 1.0.',
      });
    }

    // Check maxTokens
    if (!llm.maxTokens) {
      issues.push({
        severity: 'warning',
        category: 'llm',
        message: 'maxTokens not set',
        path: 'spec.llm.maxTokens',
        recommendation:
          'Set maxTokens to control response length and costs (e.g., 1000-4000).',
      });
    } else if (llm.maxTokens > 8000) {
      issues.push({
        severity: 'info',
        category: 'llm',
        message: 'maxTokens is very high',
        path: 'spec.llm.maxTokens',
        recommendation:
          'Consider reducing maxTokens to optimize costs and latency.',
      });
    }

    return issues;
  }

  /**
   * Check tools configuration
   */
  private checkTools(manifest: OssaAgent): BestPracticeIssue[] {
    const issues: BestPracticeIssue[] = [];
    const tools = manifest.spec?.tools || manifest.agent?.tools || [];

    if (tools.length === 0) {
      issues.push({
        severity: 'warning',
        category: 'tools',
        message: 'No tools defined',
        path: 'spec.tools',
        recommendation:
          'Define tools/capabilities for the agent to use (e.g., MCP servers, APIs).',
      });
      return issues;
    }

    // Check each tool
    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      const basePath = `spec.tools[${i}]`;

      // Check name
      if (!tool.name) {
        issues.push({
          severity: 'warning',
          category: 'tools',
          message: `Tool at index ${i} has no name`,
          path: `${basePath}.name`,
          recommendation: 'Add descriptive name for each tool.',
        });
      }

      // Check description
      if (!tool.description) {
        issues.push({
          severity: 'info',
          category: 'tools',
          message: `Tool "${tool.name || i}" has no description`,
          path: `${basePath}.description`,
          recommendation:
            'Add description explaining what the tool does and when to use it.',
        });
      }

      // Check schema definitions
      if (tool.type === 'mcp' || tool.type === 'api') {
        if (!tool.inputSchema && !tool.outputSchema) {
          issues.push({
            severity: 'info',
            category: 'tools',
            message: `Tool "${tool.name || i}" has no input/output schemas`,
            path: basePath,
            recommendation:
              'Define inputSchema and outputSchema for better type safety.',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check autonomy configuration
   */
  private checkAutonomy(manifest: OssaAgent): BestPracticeIssue[] {
    const issues: BestPracticeIssue[] = [];
    const autonomy = manifest.spec?.autonomy;

    if (!autonomy) {
      issues.push({
        severity: 'warning',
        category: 'autonomy',
        message: 'No autonomy configuration',
        path: 'spec.autonomy',
        recommendation:
          'Define autonomy level and approval requirements for safety.',
      });
      return issues;
    }

    // Check level
    if (!autonomy.level) {
      issues.push({
        severity: 'warning',
        category: 'autonomy',
        message: 'Autonomy level not specified',
        path: 'spec.autonomy.level',
        recommendation:
          'Set level: "supervised", "semi-autonomous", or "autonomous".',
      });
    }

    // Check approval requirements for high autonomy
    if (
      (autonomy.level === 'autonomous' || autonomy.level === 'high') &&
      !autonomy.approval_required
    ) {
      issues.push({
        severity: 'warning',
        category: 'autonomy',
        message: 'High autonomy without approval requirement',
        path: 'spec.autonomy',
        recommendation:
          'Enable approval_required for autonomous agents to prevent unwanted actions.',
      });
    }

    // Check allowed/blocked actions
    if (
      (!autonomy.allowed_actions || autonomy.allowed_actions.length === 0) &&
      (!autonomy.blocked_actions || autonomy.blocked_actions.length === 0)
    ) {
      issues.push({
        severity: 'info',
        category: 'autonomy',
        message: 'No action restrictions defined',
        path: 'spec.autonomy',
        recommendation:
          'Define allowed_actions or blocked_actions for better control.',
      });
    }

    return issues;
  }

  /**
   * Check constraints configuration
   */
  private checkConstraints(manifest: OssaAgent): BestPracticeIssue[] {
    const issues: BestPracticeIssue[] = [];
    const constraints = manifest.spec?.constraints;

    if (!constraints) {
      issues.push({
        severity: 'warning',
        category: 'constraints',
        message: 'No constraints configured',
        path: 'spec.constraints',
        recommendation:
          'Add cost and performance constraints to prevent resource abuse.',
      });
      return issues;
    }

    // Check cost constraints
    if (!constraints.cost) {
      issues.push({
        severity: 'info',
        category: 'constraints',
        message: 'No cost constraints',
        path: 'spec.constraints.cost',
        recommendation:
          'Set maxTokensPerDay and maxCostPerDay to control spending.',
      });
    } else {
      const cost = constraints.cost;
      if (!cost.maxTokensPerDay && !cost.maxCostPerDay) {
        issues.push({
          severity: 'info',
          category: 'constraints',
          message: 'Cost constraints have no limits',
          path: 'spec.constraints.cost',
          recommendation: 'Set at least maxTokensPerDay or maxCostPerDay.',
        });
      }
    }

    // Check performance constraints
    if (!constraints.performance) {
      issues.push({
        severity: 'info',
        category: 'constraints',
        message: 'No performance constraints',
        path: 'spec.constraints.performance',
        recommendation:
          'Set maxLatencySeconds and timeoutSeconds for better reliability.',
      });
    }

    return issues;
  }

  /**
   * Check observability configuration
   */
  private checkObservability(manifest: OssaAgent): BestPracticeIssue[] {
    const issues: BestPracticeIssue[] = [];
    const observability = manifest.spec?.observability;

    if (!observability) {
      issues.push({
        severity: 'info',
        category: 'observability',
        message: 'No observability configured',
        path: 'spec.observability',
        recommendation:
          'Enable tracing, metrics, and logging for production monitoring.',
      });
      return issues;
    }

    // Check tracing
    if (!observability.tracing?.enabled) {
      issues.push({
        severity: 'info',
        category: 'observability',
        message: 'Tracing not enabled',
        path: 'spec.observability.tracing',
        recommendation:
          'Enable tracing for debugging and performance analysis.',
      });
    }

    // Check metrics
    if (!observability.metrics?.enabled) {
      issues.push({
        severity: 'info',
        category: 'observability',
        message: 'Metrics not enabled',
        path: 'spec.observability.metrics',
        recommendation:
          'Enable metrics for monitoring agent performance and health.',
      });
    }

    // Check logging
    if (!observability.logging?.level) {
      issues.push({
        severity: 'info',
        category: 'observability',
        message: 'Logging level not set',
        path: 'spec.observability.logging.level',
        recommendation:
          'Set logging level (debug, info, warn, error) for better diagnostics.',
      });
    }

    return issues;
  }

  /**
   * Check runtime configuration
   */
  private checkRuntime(manifest: OssaAgent): BestPracticeIssue[] {
    const issues: BestPracticeIssue[] = [];
    const runtime = manifest.agent?.runtime;

    if (!runtime) {
      return issues;
    }

    // Check resource limits
    const resources = manifest.spec?.constraints?.resources;
    if (!resources) {
      issues.push({
        severity: 'info',
        category: 'runtime',
        message: 'No resource limits configured',
        path: 'spec.constraints.resources',
        recommendation:
          'Set CPU and memory limits for containerized deployments.',
      });
    }

    return issues;
  }

  /**
   * Check messaging configuration (v0.3.0+)
   */
  private checkMessaging(manifest: OssaAgent): BestPracticeIssue[] {
    const issues: BestPracticeIssue[] = [];
    const messaging = manifest.spec?.messaging;

    if (!messaging) {
      return issues;
    }

    // Check publishes channels
    const publishes = messaging.publishes || [];
    for (let i = 0; i < publishes.length; i++) {
      const channel = publishes[i];
      const basePath = `spec.messaging.publishes[${i}]`;

      if (!channel.description) {
        issues.push({
          severity: 'info',
          category: 'messaging',
          message: `Published channel "${channel.channel}" has no description`,
          path: `${basePath}.description`,
          recommendation: 'Add description for better documentation.',
        });
      }

      if (!channel.examples || channel.examples.length === 0) {
        issues.push({
          severity: 'info',
          category: 'messaging',
          message: `Published channel "${channel.channel}" has no examples`,
          path: `${basePath}.examples`,
          recommendation: 'Add examples showing message format.',
        });
      }
    }

    // Check subscribes channels
    const subscribes = messaging.subscribes || [];
    for (let i = 0; i < subscribes.length; i++) {
      const sub = subscribes[i];
      const basePath = `spec.messaging.subscribes[${i}]`;

      if (!sub.handler) {
        issues.push({
          severity: 'warning',
          category: 'messaging',
          message: `Subscription to "${sub.channel}" has no handler`,
          path: `${basePath}.handler`,
          recommendation:
            'Specify handler function to process incoming messages.',
        });
      }
    }

    // Check reliability
    if (!messaging.reliability) {
      issues.push({
        severity: 'info',
        category: 'messaging',
        message: 'No messaging reliability configuration',
        path: 'spec.messaging.reliability',
        recommendation:
          'Configure delivery guarantees and retry policy for production.',
      });
    }

    return issues;
  }

  /**
   * Calculate score based on issues
   */
  private calculateScore(issues: BestPracticeIssue[]): number {
    let score = 100;

    const severityPenalties: Record<IssueSeverity, number> = {
      error: 15,
      warning: 8,
      info: 3,
    };

    for (const issue of issues) {
      score -= severityPenalties[issue.severity];
    }

    return Math.max(0, score);
  }

  /**
   * Get issues by severity
   */
  getBySeverity(
    issues: BestPracticeIssue[],
    severity: IssueSeverity
  ): BestPracticeIssue[] {
    return issues.filter((i) => i.severity === severity);
  }

  /**
   * Get issues by category
   */
  getByCategory(
    issues: BestPracticeIssue[],
    category: string
  ): BestPracticeIssue[] {
    return issues.filter((i) => i.category === category);
  }
}
