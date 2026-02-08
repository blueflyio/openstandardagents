#!/usr/bin/env tsx
/**
 * Agent Coordinator - Orchestrates all triage agents
 *
 * Capabilities:
 * - Coordinates agent execution
 * - Manages agent dependencies
 * - Prevents conflicts
 * - Aggregates results
 * - Learns from patterns
 *
 * Automation Level: Fully autonomous (orchestration only)
 */

import { z } from 'zod';
import { TriageAgent, type TriageConfig } from './triage-agent.js';
import { EpicAgent, type EpicConfig } from './epic-agent.js';
import { SprintAgent, type SprintConfig } from './sprint-agent.js';
import { CleanupAgent, type CleanupConfig } from './cleanup-agent.js';
import { LinkAgent, type LinkConfig } from './link-agent.js';
import { MentorAgent, type MentorConfig } from './mentor-agent.js';

const CoordinatorConfigSchema = z.object({
  gitlabUrl: z.string().url(),
  token: z.string(),
  projectPath: z.string(),
  groupPath: z.string().optional(),
  username: z.string().optional(),
  dryRun: z.boolean().default(true),
  enabledAgents: z.array(
    z.enum(['triage', 'epic', 'sprint', 'cleanup', 'link', 'mentor'])
  ).default(['triage', 'epic', 'sprint', 'cleanup', 'link']),
});

export type CoordinatorConfig = z.infer<typeof CoordinatorConfigSchema>;

export interface ExecutionPlan {
  sequence: Array<{
    agent: string;
    depends: string[];
    priority: number;
  }>;
}

export interface CoordinationResult {
  timestamp: string;
  agentResults: Record<string, any>;
  conflicts: string[];
  recommendations: string[];
  summary: {
    issuesAnalyzed: number;
    changesApplied: number;
    agentsRun: number;
    duration: number;
  };
}

export class AgentCoordinator {
  private config: CoordinatorConfig;
  private agents: Map<string, any> = new Map();

  constructor(config: CoordinatorConfig) {
    this.config = CoordinatorConfigSchema.parse(config);
    this.initializeAgents();
  }

  /**
   * Initialize all enabled agents
   */
  private initializeAgents(): void {
    const baseConfig = {
      gitlabUrl: this.config.gitlabUrl,
      token: this.config.token,
      projectPath: this.config.projectPath,
      dryRun: this.config.dryRun,
    };

    if (this.config.enabledAgents.includes('triage')) {
      const config: TriageConfig = {
        ...baseConfig,
        aiProvider: 'anthropic',
        autoApply: false,
      };
      this.agents.set('triage', new TriageAgent(config));
    }

    if (this.config.enabledAgents.includes('epic') && this.config.groupPath) {
      const config: EpicConfig = {
        ...baseConfig,
        groupPath: this.config.groupPath,
        minIssuesForEpic: 3,
        autoCreate: false,
      };
      this.agents.set('epic', new EpicAgent(config));
    }

    if (this.config.enabledAgents.includes('sprint')) {
      const config: SprintConfig = {
        ...baseConfig,
        sprintDurationDays: 14,
        teamCapacityPoints: 100,
        autoAssign: false,
      };
      this.agents.set('sprint', new SprintAgent(config));
    }

    if (this.config.enabledAgents.includes('cleanup')) {
      const config: CleanupConfig = {
        ...baseConfig,
        staleDays: 90,
        autoClose: false,
      };
      this.agents.set('cleanup', new CleanupAgent(config));
    }

    if (this.config.enabledAgents.includes('link')) {
      const config: LinkConfig = {
        ...baseConfig,
        minSimilarity: 0.6,
        autoLink: false,
      };
      this.agents.set('link', new LinkAgent(config));
    }

    if (this.config.enabledAgents.includes('mentor') && this.config.username) {
      const config: MentorConfig = {
        ...baseConfig,
        username: this.config.username,
        maxDailyIssues: 3,
      };
      this.agents.set('mentor', new MentorAgent(config));
    }
  }

  /**
   * Execute all agents in coordinated sequence
   */
  async executeAll(): Promise<CoordinationResult> {
    const startTime = Date.now();
    const agentResults: Record<string, any> = {};
    const conflicts: string[] = [];

    // Define execution order with dependencies
    const executionPlan = this.createExecutionPlan();

    console.log('Starting agent coordination...');

    // Execute agents in order
    for (const step of executionPlan.sequence) {
      const agent = this.agents.get(step.agent);
      if (!agent) continue;

      console.log(`\nExecuting ${step.agent} agent...`);

      try {
        let result;
        switch (step.agent) {
          case 'triage':
            result = await agent.triageNewIssues();
            agentResults[step.agent] = {
              analyzed: result.length,
              applied: result.filter((r: any) => r.applied).length,
            };
            break;

          case 'epic':
            result = await agent.analyzeIssues();
            agentResults[step.agent] = {
              suggestedEpics: result.suggestedEpics.length,
              orphanedIssues: result.orphanedIssues.length,
            };
            break;

          case 'sprint':
            result = await agent.analyzeSprints();
            agentResults[step.agent] = {
              unassignedIssues: result.unassignedIssues,
              plannedSprints: result.nextSprints.length,
            };
            break;

          case 'cleanup':
            result = await agent.runCleanup();
            agentResults[step.agent] = {
              duplicates: result.duplicatesFound.length,
              stale: result.staleIssues.length,
              closed: result.issuesClosed,
            };
            break;

          case 'link':
            result = await agent.analyzeLinks();
            agentResults[step.agent] = {
              suggestedLinks: result.suggestedLinks.length,
              linksCreated: result.linksCreated,
            };
            break;

          case 'mentor':
            result = await agent.generateDailyPlan();
            agentResults[step.agent] = {
              focusItems: result.focusItems.length,
              blockers: result.blockers.length,
            };
            break;
        }

        console.log(`${step.agent} completed:`, agentResults[step.agent]);
      } catch (error) {
        console.error(`${step.agent} failed:`, error);
        agentResults[step.agent] = { error: String(error) };
      }
    }

    // Detect conflicts
    conflicts.push(...this.detectConflicts(agentResults));

    // Generate recommendations
    const recommendations = this.generateRecommendations(agentResults);

    const duration = Date.now() - startTime;

    return {
      timestamp: new Date().toISOString(),
      agentResults,
      conflicts,
      recommendations,
      summary: {
        issuesAnalyzed: this.countIssuesAnalyzed(agentResults),
        changesApplied: this.countChangesApplied(agentResults),
        agentsRun: Object.keys(agentResults).length,
        duration,
      },
    };
  }

  /**
   * Create execution plan with dependencies
   */
  private createExecutionPlan(): ExecutionPlan {
    return {
      sequence: [
        { agent: 'triage', depends: [], priority: 1 },
        { agent: 'link', depends: ['triage'], priority: 2 },
        { agent: 'epic', depends: ['triage', 'link'], priority: 3 },
        { agent: 'sprint', depends: ['triage', 'epic'], priority: 4 },
        { agent: 'cleanup', depends: ['sprint'], priority: 5 },
        { agent: 'mentor', depends: ['sprint'], priority: 6 },
      ].filter(step => this.agents.has(step.agent)),
    };
  }

  /**
   * Detect conflicts between agent actions
   */
  private detectConflicts(results: Record<string, any>): string[] {
    const conflicts: string[] = [];

    // Check if cleanup would close issues that sprint wants to assign
    if (results.cleanup?.stale > 0 && results.sprint?.unassignedIssues > 0) {
      conflicts.push(
        'Cleanup agent found stale issues that Sprint agent may want to assign'
      );
    }

    // Check if epic grouping conflicts with existing milestones
    if (results.epic?.suggestedEpics > 0 && results.sprint?.plannedSprints > 0) {
      conflicts.push(
        'Epic suggestions may affect sprint planning. Review epic-to-sprint alignment.'
      );
    }

    return conflicts;
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(results: Record<string, any>): string[] {
    const recommendations: string[] = [];

    if (results.triage?.analyzed > 20) {
      recommendations.push(
        'High volume of new issues. Consider increasing triage frequency.'
      );
    }

    if (results.cleanup?.duplicates > 5) {
      recommendations.push(
        'Multiple duplicates found. Review issue creation process.'
      );
    }

    if (results.link?.suggestedLinks > 30) {
      recommendations.push(
        'Many related issues found. Consider creating epics to group them.'
      );
    }

    if (results.sprint?.unassignedIssues > 50) {
      recommendations.push(
        'Large backlog of unassigned issues. Review and prioritize.'
      );
    }

    if (results.mentor?.blockers > 5) {
      recommendations.push(
        'Multiple blocked items. Focus on unblocking before new work.'
      );
    }

    return recommendations;
  }

  /**
   * Count total issues analyzed
   */
  private countIssuesAnalyzed(results: Record<string, any>): number {
    let count = 0;
    if (results.triage?.analyzed) count += results.triage.analyzed;
    return count;
  }

  /**
   * Count total changes applied
   */
  private countChangesApplied(results: Record<string, any>): number {
    let count = 0;
    if (results.triage?.applied) count += results.triage.applied;
    if (results.cleanup?.closed) count += results.cleanup.closed;
    if (results.link?.linksCreated) count += results.link.linksCreated;
    return count;
  }

  /**
   * Generate consolidated report
   */
  generateReport(result: CoordinationResult): string {
    return `
# Agent Coordination Report

**Date:** ${result.timestamp}
**Dry Run:** ${this.config.dryRun}
**Duration:** ${(result.summary.duration / 1000).toFixed(2)}s

## Summary

- **Agents Run:** ${result.summary.agentsRun}
- **Issues Analyzed:** ${result.summary.issuesAnalyzed}
- **Changes Applied:** ${result.summary.changesApplied}

## Agent Results

${Object.entries(result.agentResults).map(([agent, data]) => `
### ${agent.charAt(0).toUpperCase() + agent.slice(1)} Agent
${Object.entries(data).map(([key, value]) => `- **${key}:** ${value}`).join('\n')}
`).join('\n')}

## Conflicts Detected

${result.conflicts.length > 0
  ? result.conflicts.map(c => `- ${c}`).join('\n')
  : 'No conflicts detected'
}

## Recommendations

${result.recommendations.map(r => `- ${r}`).join('\n')}

---
_Generated by Agent Coordinator_
    `.trim();
  }

  /**
   * Run specific agent
   */
  async runAgent(agentName: string): Promise<any> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    switch (agentName) {
      case 'triage':
        return await agent.triageNewIssues();
      case 'epic':
        return await agent.analyzeIssues();
      case 'sprint':
        return await agent.analyzeSprints();
      case 'cleanup':
        return await agent.runCleanup();
      case 'link':
        return await agent.analyzeLinks();
      case 'mentor':
        return await agent.generateDailyPlan();
      default:
        throw new Error(`Unknown agent: ${agentName}`);
    }
  }

  /**
   * Route failure to appropriate healing agent
   * Extends agent coordination with intelligent routing for self-healing
   */
  routeToHealingAgent(failureSignature: {
    job_name: string;
    error_pattern?: string;
    error_type?: string;
  }): {
    agent: string;
    confidence: number;
    reasoning: string;
  } {
    // Healing agent routing logic based on failure patterns
    const { job_name, error_pattern, error_type } = failureSignature;

    // High-confidence routing based on error patterns
    if (error_pattern === 'phpcs-drupal-standards') {
      return {
        agent: 'drupal-standards',
        confidence: 0.95,
        reasoning: 'PHPCS Drupal standards error detected, routing to specialized fixer',
      };
    }

    if (error_pattern === 'eslint-typescript') {
      return {
        agent: 'ts-local',
        confidence: 0.9,
        reasoning: 'ESLint/TypeScript error detected, routing to linter fixer',
      };
    }

    if (error_pattern === 'test-failure') {
      return {
        agent: 'test-fixer',
        confidence: 0.7,
        reasoning: 'Test failure detected, routing to test analyzer',
      };
    }

    if (error_pattern === 'dependency-install') {
      return {
        agent: 'dependency-fixer',
        confidence: 0.85,
        reasoning: 'Dependency installation failure, routing to dependency resolver',
      };
    }

    if (error_pattern === 'configuration-error') {
      return {
        agent: 'config-fixer',
        confidence: 0.75,
        reasoning: 'Configuration error detected, routing to config validator',
      };
    }

    if (error_pattern === 'security-issue') {
      return {
        agent: 'security-fixer',
        confidence: 0.8,
        reasoning: 'Security issue detected, routing to security patcher',
      };
    }

    // Medium-confidence routing based on job name patterns
    if (job_name.includes('phpcs') || job_name.includes('drupal')) {
      return {
        agent: 'drupal-standards',
        confidence: 0.7,
        reasoning: 'Job name suggests Drupal/PHP standards check',
      };
    }

    if (job_name.includes('eslint') || job_name.includes('typescript') || job_name.includes('lint')) {
      return {
        agent: 'ts-local',
        confidence: 0.7,
        reasoning: 'Job name suggests linting/TypeScript check',
      };
    }

    if (job_name.includes('test') || job_name.includes('spec')) {
      return {
        agent: 'test-fixer',
        confidence: 0.6,
        reasoning: 'Job name suggests test execution',
      };
    }

    if (job_name.includes('install') || job_name.includes('dependencies')) {
      return {
        agent: 'dependency-fixer',
        confidence: 0.7,
        reasoning: 'Job name suggests dependency installation',
      };
    }

    // Low-confidence fallback
    return {
      agent: 'generic-fixer',
      confidence: 0.5,
      reasoning: 'No specific pattern matched, using generic fixer',
    };
  }

  /**
   * Route multiple failures to healing agents
   * Returns prioritized list of healing tasks
   */
  routeMultipleFailures(
    failures: Array<{
      job_name: string;
      error_pattern?: string;
      error_type?: string;
      priority?: number;
    }>
  ): Array<{
    failure: typeof failures[0];
    agent: string;
    confidence: number;
    reasoning: string;
    priority: number;
  }> {
    const routes = failures.map((failure) => {
      const route = this.routeToHealingAgent(failure);
      return {
        failure,
        agent: route.agent,
        confidence: route.confidence,
        reasoning: route.reasoning,
        priority: failure.priority || route.confidence,
      };
    });

    // Sort by priority (descending) and confidence (descending)
    routes.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return b.confidence - a.confidence;
    });

    return routes;
  }

  /**
   * Suggest healing agents for a failure without committing
   * Used for knowledge graph building and analysis
   */
  suggestHealingAgents(failureSignature: {
    job_name: string;
    error_pattern?: string;
    error_type?: string;
  }): Array<{
    agent: string;
    confidence: number;
    reasoning: string;
  }> {
    const suggestions: Array<{ agent: string; confidence: number; reasoning: string }> = [];

    // Primary suggestion
    const primary = this.routeToHealingAgent(failureSignature);
    suggestions.push(primary);

    // Secondary suggestions (lower confidence alternatives)
    if (primary.agent !== 'generic-fixer' && primary.confidence < 0.9) {
      suggestions.push({
        agent: 'generic-fixer',
        confidence: 0.4,
        reasoning: 'Generic fallback if primary agent fails',
      });
    }

    return suggestions;
  }
}
