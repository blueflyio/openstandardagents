/**
 * Perfect Agent Utils - Unit tests for skill, CLEAR evals, governance, observability generation
 */

import { describe, it, expect } from '@jest/globals';
import {
  generateSkillContent,
  generateEvalStubs,
  generateGovernanceConfig,
  generateObservabilityConfig,
} from '../../../../src/adapters/base/perfect-agent-utils.js';
import type { OssaAgent } from '../../../../src/types/index.js';
import { API_VERSION } from '../../../../src/version.js';

const minimalManifest: OssaAgent = {
  apiVersion: API_VERSION,
  kind: 'Agent',
  metadata: { name: 'test-agent', version: '1.0.0' },
  spec: {
    role: 'You are a test assistant.',
    llm: { provider: 'openai', model: 'gpt-4' },
  },
};

describe('generateSkillContent', () => {
  it('includes name, description, version, and role', () => {
    const out = generateSkillContent(minimalManifest);
    expect(out).toContain('name: test-agent');
    expect(out).toContain('version: 1.0.0');
    expect(out).toContain('# System Prompt');
    expect(out).toContain('You are a test assistant.');
  });

  it('includes tools section when spec.tools present', () => {
    const manifest: OssaAgent = {
      ...minimalManifest,
      spec: {
        ...minimalManifest.spec!,
        tools: [
          { name: 'search', description: 'Search the web', type: 'function' },
        ],
      },
    };
    const out = generateSkillContent(manifest);
    expect(out).toContain('# Tools');
    expect(out).toContain('**search**');
    expect(out).toContain('Search the web');
  });

  it('uses agent as default name when metadata.name missing', () => {
    const manifest = { ...minimalManifest, metadata: {} } as OssaAgent;
    const out = generateSkillContent(manifest);
    expect(out).toContain('name: agent');
  });
});

describe('generateEvalStubs', () => {
  it('returns ExportFile with path evals/clear-evals.ts and TypeScript content', () => {
    const file = generateEvalStubs(minimalManifest);
    expect(file.path).toBe('evals/clear-evals.ts');
    expect(file.type).toBe('test');
    expect(file.language).toBe('typescript');
    expect(file.content).toContain('CLEAR');
    expect(file.content).toContain('evalCorrectness');
    expect(file.content).toContain('evalLatency');
    expect(file.content).toContain('evalEfficiency');
    expect(file.content).toContain('evalAccuracy');
    expect(file.content).toContain('evalRobustness');
    expect(file.content).toContain('runClearEvals');
    expect(file.content).toContain('test-agent');
  });

  it('injects timeout from manifest constraints', () => {
    const manifest: OssaAgent = {
      ...minimalManifest,
      spec: {
        ...minimalManifest.spec!,
        constraints: {
          performance: { timeoutSeconds: 60 },
          cost: { maxTokensPerRequest: 8192 },
        },
      },
    };
    const file = generateEvalStubs(manifest);
    expect(file.content).toContain('60000');
    expect(file.content).toContain('8192');
  });
});

describe('generateGovernanceConfig', () => {
  it('returns governance/policy.json with agent name and autonomy', () => {
    const file = generateGovernanceConfig(minimalManifest);
    expect(file.path).toBe('governance/policy.json');
    expect(file.language).toBe('json');
    const config = JSON.parse(file.content);
    expect(config.agent).toBe('test-agent');
    expect(config.version).toBe('1.0.0');
    expect(config.autonomy.level).toBe('supervised');
    expect(config.autonomy.approvalRequired).toBe(true);
    expect(config.compliance.auditLog).toBe(true);
  });

  it('includes policies array from manifest', () => {
    const manifest: OssaAgent = {
      ...minimalManifest,
      spec: {
        ...minimalManifest.spec!,
        policies: [{ name: 'p1', type: 'guardrail', rules: [] }],
      },
    };
    const file = generateGovernanceConfig(manifest);
    const config = JSON.parse(file.content);
    expect(config.policies).toHaveLength(1);
    expect(config.policies[0].name).toBe('p1');
    expect(config.policies[0].type).toBe('guardrail');
  });
});

describe('generateObservabilityConfig', () => {
  it('returns observability/otel-config.json with defaults', () => {
    const file = generateObservabilityConfig(minimalManifest);
    expect(file.path).toBe('observability/otel-config.json');
    const config = JSON.parse(file.content);
    expect(config.serviceName).toBe('test-agent');
    expect(config.tracing.enabled).toBe(true);
    expect(config.tracing.exporter).toBe('otlp');
    expect(config.metrics.enabled).toBe(true);
    expect(config.logging.level).toBe('info');
  });

  it('uses manifest observability overrides', () => {
    const manifest: OssaAgent = {
      ...minimalManifest,
      spec: {
        ...minimalManifest.spec!,
        observability: {
          tracing: { enabled: false, endpoint: 'http://custom:4318' },
          metrics: { enabled: false },
          logging: { level: 'debug', format: 'text' },
        },
      },
    };
    const file = generateObservabilityConfig(manifest);
    const config = JSON.parse(file.content);
    expect(config.tracing.enabled).toBe(false);
    expect(config.tracing.endpoint).toContain('custom');
    expect(config.metrics.enabled).toBe(false);
    expect(config.logging.level).toBe('debug');
    expect(config.logging.format).toBe('text');
  });
});
