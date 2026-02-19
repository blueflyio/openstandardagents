/**
 * Perfect Agent Utilities
 *
 * Utility functions for generating "perfect agent" export bundles.
 * Provides skill file generation, eval stubs, governance config, and
 * observability setup reusable across all platform adapters.
 *
 * SOLID: Single Responsibility - Perfect agent utilities only
 * DRY: Reusable across all adapters
 */

import type { OssaAgent } from '../../types/index.js';
import type { ExportFile } from './adapter.interface.js';

// ──────────────────────────────────────────────────────────────────
// Skill Content Generation
// ──────────────────────────────────────────────────────────────────

/**
 * Generate SKILL.md content from an OSSA manifest
 */
export function generateSkillContent(manifest: OssaAgent): string {
  const name = manifest.metadata?.name || 'agent';
  const description = manifest.metadata?.description || '';
  const role = manifest.spec?.role || '';
  const tools = manifest.spec?.tools || [];

  const sections: string[] = [];

  sections.push(`---`);
  sections.push(`name: ${name}`);
  sections.push(`description: ${description}`);
  if (manifest.metadata?.version) {
    sections.push(`version: ${manifest.metadata.version}`);
  }
  sections.push(`---\n`);

  if (role) {
    sections.push(`# System Prompt\n\n${role}\n`);
  }

  if (tools.length > 0) {
    sections.push(`# Tools\n`);
    for (const tool of tools) {
      sections.push(
        `- **${tool.name || tool.type}**: ${tool.description || 'No description'}`
      );
    }
    sections.push('');
  }

  return sections.join('\n');
}

// ──────────────────────────────────────────────────────────────────
// CLEAR Framework Eval Stubs
// ──────────────────────────────────────────────────────────────────

/**
 * Generate CLEAR framework evaluation stubs
 */
export function generateEvalStubs(manifest: OssaAgent): ExportFile {
  const name = manifest.metadata?.name || 'agent';

  const content = `/**
 * ${name} - CLEAR Framework Evaluation Stubs
 * Generated from OSSA manifest
 *
 * CLEAR = Correctness, Latency, Efficiency, Accuracy, Robustness
 *
 * Implement these evaluation functions for your agent.
 */

export interface EvalResult {
  metric: string;
  score: number;
  threshold: number;
  passed: boolean;
  details?: string;
}

export interface EvalSuite {
  name: string;
  run(): Promise<EvalResult[]>;
}

/**
 * Correctness: Does the agent produce correct outputs?
 */
export async function evalCorrectness(): Promise<EvalResult> {
  // TODO: Implement correctness evaluation
  return {
    metric: 'correctness',
    score: 0,
    threshold: 0.9,
    passed: false,
    details: 'Not implemented - add test cases',
  };
}

/**
 * Latency: Does the agent respond within time constraints?
 */
export async function evalLatency(): Promise<EvalResult> {
  const timeout = ${manifest.spec?.constraints?.performance?.timeoutSeconds || 30};
  // TODO: Implement latency evaluation
  return {
    metric: 'latency',
    score: 0,
    threshold: timeout,
    passed: false,
    details: \`Target: <\${timeout}s\`,
  };
}

/**
 * Efficiency: Does the agent use resources efficiently?
 */
export async function evalEfficiency(): Promise<EvalResult> {
  const maxTokens = ${manifest.spec?.constraints?.cost?.maxTokensPerRequest || 4096};
  // TODO: Implement efficiency evaluation
  return {
    metric: 'efficiency',
    score: 0,
    threshold: maxTokens,
    passed: false,
    details: \`Max tokens per request: \${maxTokens}\`,
  };
}

/**
 * Accuracy: Does the agent maintain factual accuracy?
 */
export async function evalAccuracy(): Promise<EvalResult> {
  // TODO: Implement accuracy evaluation
  return {
    metric: 'accuracy',
    score: 0,
    threshold: 0.95,
    passed: false,
    details: 'Not implemented - add golden dataset',
  };
}

/**
 * Robustness: Does the agent handle edge cases?
 */
export async function evalRobustness(): Promise<EvalResult> {
  // TODO: Implement robustness evaluation
  return {
    metric: 'robustness',
    score: 0,
    threshold: 0.85,
    passed: false,
    details: 'Not implemented - add adversarial tests',
  };
}

/**
 * Run full CLEAR evaluation suite
 */
export async function runClearEvals(): Promise<EvalResult[]> {
  return Promise.all([
    evalCorrectness(),
    evalLatency(),
    evalEfficiency(),
    evalAccuracy(),
    evalRobustness(),
  ]);
}
`;

  return {
    path: 'evals/clear-evals.ts',
    content,
    type: 'test',
    language: 'typescript',
  };
}

// ──────────────────────────────────────────────────────────────────
// Governance Configuration
// ──────────────────────────────────────────────────────────────────

/**
 * Generate governance/compliance configuration
 */
export function generateGovernanceConfig(manifest: OssaAgent): ExportFile {
  const name = manifest.metadata?.name || 'agent';
  const autonomy = manifest.spec?.autonomy;
  const policies = manifest.spec?.policies || [];

  const config = {
    agent: name,
    version: manifest.metadata?.version || '1.0.0',
    autonomy: {
      level: autonomy?.level || 'supervised',
      approvalRequired: autonomy?.approval_required ?? true,
      allowedActions: autonomy?.allowed_actions || [],
      blockedActions: autonomy?.blocked_actions || [],
    },
    policies: policies.map((p) => ({
      name: p.name,
      type: p.type,
      rulesCount: Array.isArray(p.rules) ? p.rules.length : 0,
    })),
    compliance: {
      dataRetention: '30d',
      auditLog: true,
      humanInLoop: autonomy?.approval_required ?? true,
    },
  };

  return {
    path: 'governance/policy.json',
    content: JSON.stringify(config, null, 2),
    type: 'config',
    language: 'json',
  };
}

// ──────────────────────────────────────────────────────────────────
// Observability Setup
// ──────────────────────────────────────────────────────────────────

/**
 * Generate observability configuration (OTel traces/metrics)
 */
export function generateObservabilityConfig(manifest: OssaAgent): ExportFile {
  const name = manifest.metadata?.name || 'agent';
  const obs = manifest.spec?.observability;

  const config = {
    serviceName: name,
    tracing: {
      enabled: obs?.tracing?.enabled ?? true,
      exporter: obs?.tracing?.exporter || 'otlp',
      endpoint: obs?.tracing?.endpoint || 'http://localhost:4318/v1/traces',
    },
    metrics: {
      enabled: obs?.metrics?.enabled ?? true,
      exporter: obs?.metrics?.exporter || 'otlp',
      endpoint: obs?.metrics?.endpoint || 'http://localhost:4318/v1/metrics',
    },
    logging: {
      level: obs?.logging?.level || 'info',
      format: obs?.logging?.format || 'json',
    },
  };

  return {
    path: 'observability/otel-config.json',
    content: JSON.stringify(config, null, 2),
    type: 'config',
    language: 'json',
  };
}
