/**
 * OSSA Self-Healing Service
 *
 * Automated failure detection, intelligent routing to healing agents, and fix application.
 * Integrates with knowledge graph for pattern matching and circuit breaker for safety.
 *
 * Features:
 * - Automated failure detection from pipeline jobs
 * - Extract failure signatures for pattern matching
 * - Route to specialized healing agents based on failure type
 * - Apply fixes automatically (with max attempts and timeout)
 * - Update knowledge graph with results
 *
 * Issue: Part of Self-Healing Pipeline Component (gitlab_components)
 */

import { randomUUID } from 'crypto';

/**
 * Failure signature extracted from failed pipeline job
 */
export interface FailureSignature {
  job_name: string;
  job_id: string;
  stage: string;
  failure_reason?: string;
  exit_code?: number;
  error_message?: string;
  error_type?: string;
  error_pattern?: string; // Regex pattern for matching
  failure_time: string;
  retry_count?: number;
}

/**
 * Healing agent identifier
 */
export type HealingAgentId =
  | 'drupal-standards' // PHPCS Drupal standards fixer
  | 'ts-local' // TypeScript linter fixer
  | 'test-fixer' // Test failure resolver
  | 'dependency-fixer' // Dependency installation fixer
  | 'config-fixer' // Configuration error fixer
  | 'security-fixer' // Security issue fixer
  | 'generic-fixer'; // Fallback generic fixer

/**
 * Healing plan for a specific failure
 */
export interface HealingPlan {
  failure: FailureSignature;
  agent: HealingAgentId;
  confidence: number; // 0-1 confidence score
  strategy: 'knowledge-graph' | 'rule-based' | 'fallback';
  fix_command?: string;
  fix_description?: string;
  estimated_duration_seconds?: number;
  requires_manual_approval?: boolean;
}

/**
 * Healing result after fix application
 */
export interface HealingResult {
  failure: FailureSignature;
  agent: HealingAgentId;
  success: boolean;
  applied_at: string;
  duration_seconds: number;
  attempts: number;
  fix_command?: string;
  output?: string;
  error?: string;
  retry_recommended?: boolean;
}

/**
 * Healing configuration
 */
export interface SelfHealingConfig {
  maxAttempts: number;
  timeoutSeconds: number;
  enableKnowledgeGraph: boolean;
  knowledgeGraphMinSuccessRate: number;
  gitlabUrl: string;
  gitlabToken: string;
  projectId: string;
}

/**
 * Self-Healing Service
 */
export class SelfHealingService {
  private config: SelfHealingConfig;

  constructor(config: SelfHealingConfig) {
    this.config = config;
  }

  /**
   * Extract failure signatures from failed pipeline jobs
   */
  extractFailureSignatures(failedJobs: any[]): FailureSignature[] {
    const signatures: FailureSignature[] = [];

    for (const job of failedJobs) {
      const signature = this.extractSignature(job);
      signatures.push(signature);
    }

    return signatures;
  }

  /**
   * Extract failure signature from a single job
   */
  private extractSignature(job: any): FailureSignature {
    // Parse failure reason to extract error type and pattern
    const failureReason = job.failure_reason || '';
    const errorMessage = this.extractErrorMessage(job);

    // Detect error type
    let errorType = 'unknown';
    let errorPattern = '';

    if (failureReason.includes('script_failure')) {
      errorType = 'script_failure';

      // Extract specific error patterns
      if (errorMessage.includes('phpcs') || errorMessage.includes('Drupal.Commenting')) {
        errorPattern = 'phpcs-drupal-standards';
      } else if (errorMessage.includes('ESLint') || errorMessage.includes('typescript')) {
        errorPattern = 'eslint-typescript';
      } else if (errorMessage.includes('test') || errorMessage.includes('FAIL')) {
        errorPattern = 'test-failure';
      } else if (errorMessage.includes('npm install') || errorMessage.includes('composer install')) {
        errorPattern = 'dependency-install';
      } else if (errorMessage.includes('configuration') || errorMessage.includes('config')) {
        errorPattern = 'configuration-error';
      } else if (errorMessage.includes('security') || errorMessage.includes('vulnerability')) {
        errorPattern = 'security-issue';
      }
    } else if (failureReason.includes('runner_system_failure')) {
      errorType = 'runner_system_failure';
    } else if (failureReason.includes('stuck_or_timeout_failure')) {
      errorType = 'timeout';
    }

    return {
      job_name: job.name,
      job_id: job.id?.toString(),
      stage: job.stage,
      failure_reason: failureReason,
      error_message: errorMessage,
      error_type: errorType,
      error_pattern: errorPattern,
      failure_time: new Date().toISOString(),
      retry_count: job.retry_count || 0,
    };
  }

  /**
   * Extract error message from job (would fetch job trace in real implementation)
   */
  private extractErrorMessage(job: any): string {
    // In production, this would fetch the job trace via GitLab API
    // For now, use failure_reason as fallback
    return job.failure_reason || '';
  }

  /**
   * Route failures to healing agents using intelligent strategy
   */
  async routeToHealingAgents(
    failures: FailureSignature[],
    knowledgeGraph: any,
    strategy: 'intelligent' | 'sequential' | 'parallel'
  ): Promise<HealingPlan[]> {
    const plans: HealingPlan[] = [];

    for (const failure of failures) {
      let plan: HealingPlan;

      if (strategy === 'intelligent' && this.config.enableKnowledgeGraph) {
        // Try knowledge graph first
        plan = await this.matchKnowledgeGraph(failure, knowledgeGraph);
      } else {
        // Fall back to rule-based routing
        plan = this.routeByRules(failure);
      }

      plans.push(plan);
    }

    return plans;
  }

  /**
   * Match failure against knowledge graph patterns
   */
  private async matchKnowledgeGraph(
    failure: FailureSignature,
    knowledgeGraph: any
  ): Promise<HealingPlan> {
    const patterns = knowledgeGraph.failure_patterns || [];

    // Find matching pattern with high success rate
    for (const pattern of patterns) {
      if (this.matchesPattern(failure, pattern)) {
        if (pattern.success_rate >= this.config.knowledgeGraphMinSuccessRate) {
          return {
            failure,
            agent: pattern.healing_agent as HealingAgentId,
            confidence: pattern.success_rate,
            strategy: 'knowledge-graph',
            fix_command: pattern.fix_command,
            fix_description: pattern.fix_description,
            estimated_duration_seconds: Math.floor(pattern.avg_fix_time_ms / 1000),
            requires_manual_approval: false,
          };
        }
      }
    }

    // No high-confidence match, fall back to rules
    return this.routeByRules(failure);
  }

  /**
   * Check if failure matches a knowledge graph pattern
   */
  private matchesPattern(failure: FailureSignature, pattern: any): boolean {
    // Match by error pattern
    if (pattern.signature && failure.error_pattern === pattern.signature) {
      return true;
    }

    // Match by job name pattern
    if (pattern.job_name_pattern) {
      const regex = new RegExp(pattern.job_name_pattern);
      if (regex.test(failure.job_name)) {
        return true;
      }
    }

    // Match by error message pattern
    if (pattern.error_message_pattern && failure.error_message) {
      const regex = new RegExp(pattern.error_message_pattern);
      if (regex.test(failure.error_message)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Route failure using rule-based logic
   */
  private routeByRules(failure: FailureSignature): HealingPlan {
    let agent: HealingAgentId = 'generic-fixer';
    let confidence = 0.5;
    let fix_command = '';
    let fix_description = '';

    // PHPCS Drupal standards
    if (failure.error_pattern === 'phpcs-drupal-standards') {
      agent = 'drupal-standards';
      confidence = 0.9;
      fix_command = 'phpcbf --standard=Drupal,DrupalPractice';
      fix_description = 'Auto-fix Drupal coding standards violations';
    }
    // ESLint TypeScript
    else if (failure.error_pattern === 'eslint-typescript') {
      agent = 'ts-local';
      confidence = 0.85;
      fix_command = 'eslint --fix';
      fix_description = 'Auto-fix ESLint and TypeScript linting errors';
    }
    // Test failures
    else if (failure.error_pattern === 'test-failure') {
      agent = 'test-fixer';
      confidence = 0.6;
      fix_description = 'Analyze and suggest test fixes';
    }
    // Dependency install failures
    else if (failure.error_pattern === 'dependency-install') {
      agent = 'dependency-fixer';
      confidence = 0.8;
      fix_command = 'rm -rf node_modules package-lock.json && npm install';
      fix_description = 'Clean reinstall dependencies';
    }
    // Configuration errors
    else if (failure.error_pattern === 'configuration-error') {
      agent = 'config-fixer';
      confidence = 0.7;
      fix_description = 'Validate and fix configuration files';
    }
    // Security issues
    else if (failure.error_pattern === 'security-issue') {
      agent = 'security-fixer';
      confidence = 0.75;
      fix_command = 'npm audit fix';
      fix_description = 'Auto-fix security vulnerabilities';
    }

    return {
      failure,
      agent,
      confidence,
      strategy: 'rule-based',
      fix_command,
      fix_description,
      estimated_duration_seconds: 60,
      requires_manual_approval: confidence < 0.7,
    };
  }

  /**
   * Apply healing fixes according to plan
   */
  async applyHealingFixes(plans: HealingPlan[]): Promise<HealingResult[]> {
    const results: HealingResult[] = [];

    for (const plan of plans) {
      const result = await this.applyFix(plan);
      results.push(result);
    }

    return results;
  }

  /**
   * Apply a single healing fix
   */
  private async applyFix(plan: HealingPlan): Promise<HealingResult> {
    const startTime = Date.now();
    let attempts = 0;
    let success = false;
    let output = '';
    let error = '';

    // Skip if manual approval required and not given
    if (plan.requires_manual_approval) {
      return {
        failure: plan.failure,
        agent: plan.agent,
        success: false,
        applied_at: new Date().toISOString(),
        duration_seconds: 0,
        attempts: 0,
        error: 'Manual approval required - skipping automatic fix',
        retry_recommended: false,
      };
    }

    // Attempt fix up to max attempts
    while (attempts < this.config.maxAttempts && !success) {
      attempts++;

      try {
        // Execute fix command
        if (plan.fix_command) {
          output = await this.executeFixCommand(plan.fix_command);
          success = true;
        } else {
          // No command provided, mark as not applicable
          error = 'No fix command available for this failure type';
          break;
        }
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);

        // Check if timeout exceeded
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= this.config.timeoutSeconds) {
          error += ' (timeout exceeded)';
          break;
        }
      }
    }

    const duration_seconds = Math.floor((Date.now() - startTime) / 1000);

    return {
      failure: plan.failure,
      agent: plan.agent,
      success,
      applied_at: new Date().toISOString(),
      duration_seconds,
      attempts,
      fix_command: plan.fix_command,
      output,
      error: success ? undefined : error,
      retry_recommended: !success && attempts < this.config.maxAttempts,
    };
  }

  /**
   * Execute fix command (placeholder - would use child_process in production)
   */
  private async executeFixCommand(command: string): Promise<string> {
    // In production, this would execute the command using child_process.exec
    // For now, simulate execution
    console.log(`Executing fix command: ${command}`);

    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return `Command executed: ${command}`;
  }

  /**
   * Generate healing report
   */
  generateReport(results: HealingResult[]): string {
    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;
    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

    let report = `# Self-Healing Pipeline Report\n\n`;
    report += `**Timestamp:** ${new Date().toISOString()}\n`;
    report += `**Success Rate:** ${successRate.toFixed(1)}% (${successCount}/${totalCount})\n\n`;

    report += `## Results\n\n`;

    for (const result of results) {
      const icon = result.success ? '✅' : '❌';
      report += `${icon} **${result.failure.job_name}** (${result.agent})\n`;
      report += `   - Duration: ${result.duration_seconds}s\n`;
      report += `   - Attempts: ${result.attempts}\n`;

      if (result.success && result.fix_command) {
        report += `   - Fix: \`${result.fix_command}\`\n`;
      }

      if (!result.success && result.error) {
        report += `   - Error: ${result.error}\n`;
      }

      if (result.retry_recommended) {
        report += `   - ⚠️  Retry recommended\n`;
      }

      report += `\n`;
    }

    return report;
  }
}
