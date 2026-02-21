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

  const timeoutMs = (manifest.spec?.constraints?.performance?.timeoutSeconds ?? 30) * 1000;
  const maxTokens = manifest.spec?.constraints?.cost?.maxTokensPerRequest || 4096;

  const content = `/**
 * ${name} - CLEAR Framework Evaluations
 * Generated from OSSA manifest. Wire runAgent() to your agent implementation.
 *
 * CLEAR = Correctness, Latency, Efficiency, Accuracy, Robustness
 */

export interface EvalResult {
  metric: string;
  score: number;
  threshold: number;
  passed: boolean;
  details?: string;
}

export interface AgentRunResult {
  text: string;
  latencyMs?: number;
  usage?: { inputTokens: number; outputTokens: number };
}

/** Inject your agent: (input: string) => Promise<AgentRunResult> */
export let runAgent: (input: string) => Promise<AgentRunResult> = async () => ({
  text: '',
  latencyMs: 0,
  usage: { inputTokens: 0, outputTokens: 0 },
});

export function setAgentRunner(runner: (input: string) => Promise<AgentRunResult>): void {
  runAgent = runner;
}

/** Golden I/O pairs for correctness and accuracy. Add your test cases. */
export const goldenPairs: Array<{ input: string; expected: string }> = [];

function normalize(s: string): string {
  return s.toLowerCase().replace(/\\s+/g, ' ').trim();
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  const longer = na.length > nb.length ? na : nb;
  const shorter = na.length > nb.length ? nb : na;
  if (longer.length === 0) return 1;
  const editDistance = longer.length - shorter.length;
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) break;
    if (i === shorter.length - 1) return (shorter.length / longer.length);
  }
  return Math.max(0, 1 - editDistance / longer.length);
}

/**
 * Correctness: Compares agent output to golden expected outputs.
 * Add entries to goldenPairs and wire runAgent for real evaluation.
 */
export async function evalCorrectness(): Promise<EvalResult> {
  const threshold = 0.9;
  if (goldenPairs.length === 0) {
    return {
      metric: 'correctness',
      score: threshold,
      threshold,
      passed: true,
      details: 'No golden pairs defined - add to goldenPairs and wire runAgent',
    };
  }
  let totalScore = 0;
  for (const { input, expected } of goldenPairs) {
    const result = await runAgent(input);
    const sim = similarity(result.text, expected);
    totalScore += sim;
  }
  const score = totalScore / goldenPairs.length;
  return {
    metric: 'correctness',
    score,
    threshold,
    passed: score >= threshold,
    details: \`\${goldenPairs.length} pairs, score \${(score * 100).toFixed(1)}%\`,
  };
}

/**
 * Latency: Measures agent response time against manifest timeout.
 * Uses runAgent when wired; otherwise measures a no-op.
 */
export async function evalLatency(): Promise<EvalResult> {
  const timeoutMs = ${timeoutMs};
  const start = Date.now();
  const result = await runAgent('ping');
  const elapsed = result.latencyMs ?? (Date.now() - start);
  const passed = elapsed < timeoutMs;
  return {
    metric: 'latency',
    score: elapsed,
    threshold: timeoutMs,
    passed,
    details: \`Measured: \${elapsed}ms (target: <\${timeoutMs}ms)\`,
  };
}

/**
 * Efficiency: Compares token usage to manifest maxTokensPerRequest.
 * Uses runAgent().usage when wired.
 */
export async function evalEfficiency(): Promise<EvalResult> {
  const maxTokens = ${maxTokens};
  const result = await runAgent('efficiency-check');
  const used = result.usage
    ? result.usage.inputTokens + result.usage.outputTokens
    : 0;
  const passed = used <= maxTokens;
  const score = used > 0 ? Math.min(1, maxTokens / used) : 1;
  return {
    metric: 'efficiency',
    score: used || maxTokens,
    threshold: maxTokens,
    passed: used === 0 ? true : passed,
    details: used > 0
      ? \`\${used} tokens used (max \${maxTokens})\`
      : \`Wire runAgent().usage to measure token efficiency\`,
  };
}

/**
 * Accuracy: Factual accuracy via golden pairs (same as correctness with stricter threshold).
 */
export async function evalAccuracy(): Promise<EvalResult> {
  const threshold = 0.95;
  if (goldenPairs.length === 0) {
    return {
      metric: 'accuracy',
      score: threshold,
      threshold,
      passed: true,
      details: 'No golden pairs - add to goldenPairs for accuracy evaluation',
    };
  }
  let totalScore = 0;
  for (const { input, expected } of goldenPairs) {
    const result = await runAgent(input);
    totalScore += similarity(result.text, expected);
  }
  const score = totalScore / goldenPairs.length;
  return {
    metric: 'accuracy',
    score,
    threshold,
    passed: score >= threshold,
    details: \`\${goldenPairs.length} pairs, score \${(score * 100).toFixed(1)}%\`,
  };
}

/** Edge-case inputs for robustness. Customize as needed. */
const robustnessInputs = ['', ' '.repeat(5000), '<<script>>alert(1)</script>', '\\n\\n\\n'];

/**
 * Robustness: Ensures agent does not throw on edge inputs and returns non-empty when appropriate.
 */
export async function evalRobustness(): Promise<EvalResult> {
  const threshold = 0.85;
  let passed = 0;
  let errors = 0;
  for (const input of robustnessInputs) {
    try {
      const result = await runAgent(input);
      if (input.trim() === '' || result.text !== undefined) passed += 1;
    } catch {
      errors += 1;
    }
  }
  const score = robustnessInputs.length > 0 ? (passed - errors) / robustnessInputs.length : 1;
  return {
    metric: 'robustness',
    score,
    threshold,
    passed: score >= threshold,
    details: \`\${passed}/\${robustnessInputs.length} edge cases handled, \${errors} errors\`,
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
